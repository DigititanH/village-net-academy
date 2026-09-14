<?php

class AuthController
{
    public static function register(): void
    {
        $body = Request::jsonBody();
        $name = $body['name'] ?? '';
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';
        $role = $body['role'] ?? '';
        $academy = $body['academy'] ?? '';
        // Mobile sends reseller_kind; website may send affiliation.
        $resellerKind = strtolower(trim((string) ($body['reseller_kind'] ?? $body['resellerKind'] ?? '')));
        $affiliation = strtolower(trim((string) ($body['affiliation'] ?? '')));
        $client = strtolower(trim((string) ($body['client'] ?? '')));
        $isMobile = $client === 'mobile'
            || strcasecmp((string) ($_SERVER['HTTP_X_VNA_CLIENT'] ?? ''), 'mobile') === 0;

        if (!$name || !$email || !$password) {
            Response::error('Name, email and password are required', 400);
        }

        $userRole = match ($role) {
            'reseller' => 'reseller',
            'academy' => 'academy',
            default => 'customer',
        };

        if (User::emailExists($email)) {
            Response::error('Email already registered', 409);
        }

        if ($userRole === 'reseller') {
            if ($resellerKind === '' && $affiliation !== '') {
                $resellerKind = $affiliation === 'affiliated' ? 'affiliated' : 'independent';
            }
            if ($resellerKind === '') {
                // Website: empty affiliation + centre name ⇒ affiliated.
                $resellerKind = ($affiliation === '' && trim((string) $academy) !== '')
                    ? 'affiliated'
                    : 'independent';
            }
            if (!in_array($resellerKind, ['independent', 'affiliated', 'centre'], true)) {
                $resellerKind = 'independent';
            }
        }

        $academyName = Commission::normalizeCentreName((string) $academy);

        if ($userRole === 'academy' && $academyName === '') {
            Response::error('Centre name is required when registering as a centre', 400);
        }

        if ($userRole === 'reseller') {
            // Independent: auto-support Digititan Programme. Affiliated/centre: name required.
            if ($resellerKind === 'independent') {
                $academyName = Commission::PROGRAMME_CENTRE;
            } elseif ($academyName === '') {
                Response::error(
                    $resellerKind === 'centre'
                        ? 'Centre / academy organisation name is required'
                        : 'Please enter the centre name you are affiliated with',
                    400
                );
            }
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $approvalStatus = 'approved';
        $verificationToken = Request::uuid();

        // Shared hosting often misses ALTERs from newer releases — patch before insert.
        SchemaEnsure::registrations();

        try {
            $result = Database::queryRun(
                'INSERT INTO registrations (name, role, is_verified, is_approved, academy_name, verification_token, verification_token_expires) VALUES (?, ?, 0, ?, ?, ?, ?)',
                [$name, $userRole, $approvalStatus, $userRole === 'academy' ? $academyName : null, $verificationToken, date('Y-m-d H:i:s', time() + 86400)]
            );
        } catch (Throwable $e) {
            // Fallback for DBs that still lack new columns after ensure failed (no ALTER privilege)
            error_log('[register] full insert failed: ' . $e->getMessage());
            try {
                $result = Database::queryRun(
                    'INSERT INTO registrations (name, role, is_verified, is_approved, academy_name, verification_token) VALUES (?, ?, 0, ?, ?, ?)',
                    [$name, $userRole, $approvalStatus, $userRole === 'academy' ? $academyName : null, $verificationToken]
                );
            } catch (Throwable $e1b) {
                try {
                    $result = Database::queryRun(
                        'INSERT INTO registrations (name, role, is_verified, is_approved, verification_token) VALUES (?, ?, 0, ?, ?)',
                        [$name, $userRole, $approvalStatus, $verificationToken]
                    );
                } catch (Throwable $e2) {
                    error_log('[register] verification_token insert failed: ' . $e2->getMessage());
                    try {
                        $result = Database::queryRun(
                            'INSERT INTO registrations (name, role, is_verified, is_approved) VALUES (?, ?, 0, ?)',
                            [$name, $userRole, $approvalStatus]
                        );
                        $verificationToken = null;
                    } catch (Throwable $e3) {
                        // Role enum may reject "academy"
                        if ($userRole === 'academy') {
                            $result = Database::queryRun(
                                'INSERT INTO registrations (name, role, is_verified, is_approved) VALUES (?, ?, 0, ?)',
                                [$name, 'customer', $approvalStatus]
                            );
                            $userRole = 'customer';
                            $verificationToken = null;
                        } else {
                            throw $e3;
                        }
                    }
                }
            }
        }
        $userId = $result['lastInsertRowid'];
        if ($userId < 1) {
            Response::error('Registration failed — could not create account. Please try again or contact support.', 500);
        }

        // Remember app vs website signup (approval mail is mobile-only).
        try {
            Database::queryRun(
                'UPDATE registrations SET signup_client = ? WHERE id = ?',
                [$isMobile ? 'mobile' : 'web', $userId]
            );
        } catch (Throwable $e) {
            error_log('[register] signup_client: ' . $e->getMessage());
        }

        Database::queryRun(
            'INSERT INTO logins (registration_id, email, password) VALUES (?, ?, ?)',
            [$userId, strtolower(trim($email)), $hash]
        );

        if ($userRole === 'reseller') {
            $prefix = $resellerKind === 'centre' ? 'VNA-C-' : 'VNA-B-';
            $referralCode = $prefix . strtoupper(substr(str_replace('-', '', Request::uuid()), 0, 8));
            $commissionRate = $resellerKind === 'centre'
                ? Commission::ACADEMY_RATE
                : Commission::RESELLER_RATE;
            $approvalStatusReseller = 'pending';
            try {
                Database::queryRun(
                    "UPDATE registrations SET is_approved = 'pending' WHERE id = ?",
                    [$userId]
                );
            } catch (Throwable $e) {
                error_log('[register] pending approve flag: ' . $e->getMessage());
            }
            Database::queryRun(
                'INSERT INTO reseller_profiles (user_id, referral_code, academy, commission_rate, status) VALUES (?, ?, ?, ?, ?)',
                [$userId, $referralCode, $academyName, $commissionRate, $approvalStatusReseller]
            );
            $kindLabel = match ($resellerKind) {
                'centre' => 'Centre (VNA-C · 26%)',
                'affiliated' => 'Affiliated with a centre (VNA-B · 53/26/21)',
                default => 'Independent — Digititan Programme (VNA-B · 53%)',
            };
            try {
                if (class_exists('AdminNotify') && method_exists('AdminNotify', 'resellerApplied')) {
                    AdminNotify::resellerApplied(
                        (string) $name,
                        (string) $email,
                        $kindLabel,
                        $academyName,
                        $referralCode,
                        $commissionRate
                    );
                } else {
                    Mailer::send([
                        'to' => Site::email(),
                        'replyTo' => $email,
                        'subject' => "New reseller registration: $name",
                        'html' => "<p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
                        <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
                        <p><strong>Affiliation:</strong> " . htmlspecialchars($kindLabel) . "</p>
                        <p><strong>Centre:</strong> " . htmlspecialchars($academyName) . "</p>
                        <p><strong>Reseller commission:</strong> " . number_format($commissionRate, 0) . "%</p>
                        <p><strong>Centre share:</strong> " . number_format(Commission::ACADEMY_RATE, 0) . "%</p>
                        <p><strong>Referral code:</strong> $referralCode</p>",
                    ]);
                }
            } catch (Throwable $e) {
                error_log('[register] reseller notify mail: ' . $e->getMessage());
            }

            // Must send confirmation before the pending early-return — otherwise
            // the account is created unverified and never gets a verify email
            // until the website "resend" path is used.
            $emailSent = false;
            if ($verificationToken) {
                $emailSent = self::sendVerificationEmail($email, $name, $verificationToken, $isMobile);
                if (!$emailSent) {
                    error_log('[register] reseller verify mail failed: ' . (Mailer::$lastError ?? 'unknown'));
                }
            }

            // App shows the pending screen when JWT is not issued yet.
            Response::json([
                'pending' => true,
                'email_sent' => $emailSent,
                'message' => $emailSent
                    ? 'Reseller account created. Confirm your email, then wait for Digititan / Ops to approve before you can sign in.'
                    : 'Reseller account created. An admin must approve it before you can sign in. Confirmation email could not be sent — use Resend on the sign-in screen after approval.',
                'user' => [
                    'id' => (int) $userId,
                    'name' => $name,
                    'email' => strtolower(trim((string) $email)),
                    'role' => 'reseller',
                    'academy_name' => $academyName,
                    'is_approved' => 'pending',
                    'is_verified' => false,
                ],
            ], 201);
        }

        if ($userRole === 'academy') {
            try {
                Mailer::send([
                    'to' => Site::email(),
                    'replyTo' => $email,
                    'subject' => "New academy affiliate registration: $name",
                    'html' => "<p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
                    <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
                    <p><strong>Academy:</strong> " . htmlspecialchars($academyName) . "</p>
                    <p><strong>Centre share of linked reseller sales:</strong> " . number_format(Commission::ACADEMY_RATE, 0) . "%</p>",
                ]);
            } catch (Throwable $e) {
                error_log('[register] academy notify mail: ' . $e->getMessage());
            }
        }

        // Mobile app: skip email-link gate and issue JWT (SMTP often unset on shared host).
        // Website register still requires confirmation link.
        if ($isMobile && $userRole !== 'reseller') {
            try {
                Database::queryRun(
                    'UPDATE registrations SET is_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
                    [$userId]
                );
            } catch (Throwable $e) {
                try {
                    Database::queryRun(
                        'UPDATE registrations SET is_verified = 1, verification_token = NULL WHERE id = ?',
                        [$userId]
                    );
                } catch (Throwable $e2) {
                    Database::queryRun(
                        'UPDATE registrations SET is_verified = 1 WHERE id = ?',
                        [$userId]
                    );
                }
            }

            Response::json([
                'token' => Jwt::sign((int) $userId),
                'pending_verification' => false,
                'email_sent' => false,
                'message' => 'Account created. You are signed in.',
                'user' => [
                    'id' => (int) $userId,
                    'name' => $name,
                    'email' => strtolower(trim((string) $email)),
                    'role' => $userRole,
                    'academy_name' => $userRole === 'academy' ? $academyName : null,
                    'is_approved' => $approvalStatus,
                    'is_verified' => true,
                ],
            ], 201);
        }

        if ($verificationToken) {
            $emailSent = self::sendVerificationEmail($email, $name, $verificationToken, $isMobile);

            $message = $emailSent
                ? 'Account created. Please check your email and click the confirmation link before signing in.'
                : 'Account created, but the confirmation email could not be sent. You can request another link from the confirmation page. Also ask the admin to set SMTP_PASS in backend-php/.env.';

            Response::json([
                'pending_verification' => true,
                'email_sent' => $emailSent,
                'message' => $message,
                'user' => [
                    'id' => (int) $userId,
                    'name' => $name,
                    'email' => $email,
                    'role' => $userRole,
                    'academy_name' => $userRole === 'academy' ? $academyName : null,
                    'is_approved' => $approvalStatus,
                    'is_verified' => false,
                ],
            ], 201);
        }

        Response::json([
            'pending_verification' => false,
            'email_sent' => false,
            'message' => 'Account created. You can sign in now.',
            'user' => [
                'id' => (int) $userId,
                'name' => $name,
                'email' => $email,
                'role' => $userRole,
                'academy_name' => $userRole === 'academy' ? $academyName : null,
                'is_approved' => $approvalStatus,
                'is_verified' => true,
            ],
        ], 201);
    }

    public static function login(): void
    {
        $body = Request::jsonBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = $body['password'] ?? '';

        if (!$email || !$password) {
            Response::error('Email and password are required', 400);
        }

        $user = User::findByEmailForAuth($email);
        if (!$user || !password_verify($password, $user['password'])) {
            Response::error('Invalid credentials', 401);
        }

        if (($user['is_approved'] ?? '') === 'pending') {
            // Resellers stay pending until Ops Admin approves (meeting model).
            if (($user['role'] ?? '') === 'reseller') {
                Response::json([
                    'message' => 'Your reseller account is awaiting admin approval. You will be able to sign in once Digititan / Ops approves it.',
                    'pending' => true,
                    'email' => $email,
                ], 403);
            }
            Database::queryRun("UPDATE registrations SET is_approved = 'approved' WHERE id = ?", [$user['id']]);
            $user['is_approved'] = 'approved';
        }

        $mustChange = false;
        if (class_exists('AccountSecurity')) {
            $flags = AccountSecurity::loginFlags((int) $user['id']);
            $mustChange = (bool) $flags['must_change_password'];
            $exp = $flags['temp_password_expires'] ?? null;
            if ($mustChange && $exp && strtotime((string) $exp) < time()) {
                Response::error('Temporary password expired. Ask an admin to send a new invite.', 403);
            }
        }

        if (
            !$mustChange
            && ($user['role'] ?? '') !== 'admin'
            && ($user['role'] ?? '') !== 'super_admin'
            && empty($user['is_verified'])
        ) {
            Response::json([
                'message' => 'Please confirm your email before signing in. Check your inbox, or request a new confirmation link.',
                'needs_verification' => true,
                'email' => $email,
            ], 403);
        }

        try {
            Database::queryRun('UPDATE logins SET last_login_at = NOW() WHERE registration_id = ?', [$user['id']]);
        } catch (Throwable $e) {
            // Non-fatal if last_login_at column is missing on older DBs
        }

        if (class_exists('AccountSecurity')) {
            $when = method_exists('AccountSecurity', 'formatSast')
                ? AccountSecurity::formatSast()
                : (date('Y-m-d H:i') . ' SAST');
            AccountSecurity::loginAlert((int) $user['id'], (string) $user['name'], (string) $user['email'], $when);
        }

        Response::json([
            'token' => Jwt::sign((int) $user['id']),
            'must_change_password' => $mustChange,
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar' => $user['avatar'],
                'is_approved' => $user['is_approved'],
                'is_verified' => (bool) $user['is_verified'],
                'academy_name' => $user['academy_name'] ?? null,
                'must_change_password' => $mustChange,
            ],
        ]);
    }

    public static function changePassword(): void
    {
        Auth::authenticate();
        $body = Request::jsonBody();
        $current = (string) ($body['current_password'] ?? '');
        $new = (string) ($body['new_password'] ?? $body['password'] ?? '');
        if (strlen($new) < 8) {
            Response::error('New password must be at least 8 characters', 400);
        }

        $userId = (int) Auth::$user['id'];
        $login = Database::queryGet(
            'SELECT password FROM logins WHERE registration_id = ?',
            [$userId]
        );
        if (!$login) {
            Response::error('Account not found', 404);
        }

        $must = false;
        if (class_exists('AccountSecurity')) {
            $flags = AccountSecurity::loginFlags($userId);
            $must = (bool) $flags['must_change_password'];
        }
        if (!$must) {
            if ($current === '' || !password_verify($current, (string) $login['password'])) {
                Response::error('Current password is incorrect', 400);
            }
        }

        $hash = password_hash($new, PASSWORD_BCRYPT, ['cost' => 12]);
        try {
            Database::queryRun(
                'UPDATE logins SET password = ?, must_change_password = 0, temp_password_expires = NULL WHERE registration_id = ?',
                [$hash, $userId]
            );
        } catch (Throwable $e) {
            Database::queryRun(
                'UPDATE logins SET password = ? WHERE registration_id = ?',
                [$hash, $userId]
            );
        }
        Response::json(['message' => 'Password updated']);
    }

    public static function verifyEmail(): void
    {
        SchemaEnsure::registrations();
        $token = trim((string) Request::query('token'));
        if ($token === '') {
            Response::error('Missing confirmation token', 400);
        }

        $user = null;
        try {
            $user = Database::queryGet(
                'SELECT r.id, r.name, r.created_at, r.verification_token_expires, l.email
                 FROM registrations r
                 INNER JOIN logins l ON l.registration_id = r.id
                 WHERE r.verification_token = ?',
                [$token]
            );
        } catch (Throwable $e) {
            $user = Database::queryGet(
                'SELECT r.id, r.name, r.created_at, l.email
                 FROM registrations r
                 INNER JOIN logins l ON l.registration_id = r.id
                 WHERE r.verification_token = ?',
                [$token]
            );
        }
        if (!$user) {
            Response::error('Invalid or expired verification link. You can request a new confirmation email.', 400);
        }

        $expiresAt = !empty($user['verification_token_expires'])
            ? strtotime((string) $user['verification_token_expires'])
            : false;
        if ($expiresAt !== false) {
            if ($expiresAt < time()) {
                Response::error('This confirmation link has expired. Request a new link below.', 400);
            }
        } else {
            $createdAt = strtotime((string) $user['created_at']);
            if ($createdAt === false || (time() - $createdAt) > 86400) {
                Response::error('This confirmation link has expired. Request a new link below.', 400);
            }
        }

        try {
            Database::queryRun(
                'UPDATE registrations SET is_verified = 1, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
                [$user['id']]
            );
        } catch (Throwable $e) {
            Database::queryRun(
                'UPDATE registrations SET is_verified = 1, verification_token = NULL WHERE id = ?',
                [$user['id']]
            );
        }

        $forMobile = strcasecmp((string) (Request::query('client') ?? ''), 'mobile') === 0
            || strcasecmp((string) ($_SERVER['HTTP_X_VNA_CLIENT'] ?? ''), 'mobile') === 0;
        self::sendWelcomeEmail((string) $user['email'], (string) $user['name'], $forMobile);

        Response::json([
            'message' => $forMobile
                ? 'Email verified successfully. Open the Village NetAcad app and sign in.'
                : 'Email verified successfully',
            'client' => $forMobile ? 'mobile' : 'web',
        ]);
    }

    public static function resendVerification(): void
    {
        $body = Request::jsonBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        if ($email === '') {
            Response::error('Email is required', 400);
        }

        SchemaEnsure::registrations();

        $user = User::findByEmailForAuth($email);
        $emailSent = false;

        if ($user && empty($user['is_verified'])) {
            $emailSent = self::issueVerificationEmail(
                (int) $user['id'],
                $email,
                (string) $user['name'],
                self::isMobileRequest($body)
            );
            if (!$emailSent) {
                error_log('[resendVerification] mail failed: ' . (Mailer::$lastError ?? 'unknown'));
            }
        }

        Response::json([
            'message' => 'If that account needs confirmation, a new link was sent. Check your inbox and spam folder.',
            'email_sent' => $user && empty($user['is_verified']) ? $emailSent : null,
        ]);
    }

    /** Refresh token + send confirmation email. Used by resend + admin approve. */
    public static function issueVerificationEmail(
        int $userId,
        string $email,
        string $name,
        bool $forMobile = false
    ): bool {
        if ($userId < 1 || $email === '') {
            return false;
        }
        $token = Request::uuid();
        $expires = date('Y-m-d H:i:s', time() + 86400);
        try {
            Database::queryRun(
                'UPDATE registrations SET verification_token = ?, verification_token_expires = ? WHERE id = ?',
                [$token, $expires, $userId]
            );
        } catch (Throwable $e) {
            Database::queryRun(
                'UPDATE registrations SET verification_token = ? WHERE id = ?',
                [$token, $userId]
            );
        }
        return self::sendVerificationEmail($email, $name, $token, $forMobile);
    }

    private static function isMobileRequest(?array $body = null): bool
    {
        $body = $body ?? [];
        $client = strtolower(trim((string) ($body['client'] ?? '')));
        return $client === 'mobile'
            || strcasecmp((string) ($_SERVER['HTTP_X_VNA_CLIENT'] ?? ''), 'mobile') === 0;
    }

    private static function sendVerificationEmail(
        string $email,
        string $name,
        string $verificationToken,
        bool $forMobile = false
    ): bool {
        $base = rtrim((string) Client::getClientUrl(), '/');
        if ($forMobile) {
            // Lightweight page in public/ — tells user to return to the app (no website login CTA).
            $verifyUrl = $base . '/app-verify-email.html?token=' . urlencode($verificationToken);
            $subject = 'Confirm your email — Village NetAcad app';
            $html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                . '<h2 style="color:#16a34a;margin-bottom:8px">Confirm your email for the app</h2>'
                . '<p>Hi ' . htmlspecialchars($name) . ',</p>'
                . '<p>Thanks for signing up in the <strong>Village NetAcad mobile app</strong>. '
                . 'Tap the button below to confirm this email address.</p>'
                . '<p style="margin:28px 0">'
                . '<a href="' . htmlspecialchars($verifyUrl) . '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">'
                . 'Confirm my email</a></p>'
                . '<p style="font-size:14px;color:#333"><strong>Then open the Village NetAcad app</strong> on your phone and sign in with this email.</p>'
                . '<p style="font-size:14px;color:#333">This link works for 24 hours. If it expires, use <em>Resend confirmation email</em> on the app sign-in screen.</p>'
                . '<p style="font-size:13px;color:#555">If the button does not work, copy and paste this link into your browser:<br>'
                . htmlspecialchars($verifyUrl) . '</p>'
                . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                . '<p style="font-size:13px;color:#555">If you did not create this account, you can ignore this email.</p>'
                . '</div>';
        } else {
            $verifyUrl = $base . '/verify-email?token=' . urlencode($verificationToken);
            $subject = 'Confirm your email — Village NetAcad';
            $html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                . '<h2 style="color:#16a34a;margin-bottom:8px">Confirm your email address</h2>'
                . '<p>Hi ' . htmlspecialchars($name) . ',</p>'
                . '<p>Thank you for registering with <strong>Village NetAcad</strong>. Please confirm your email address to activate your account.</p>'
                . '<p style="margin:28px 0">'
                . '<a href="' . htmlspecialchars($verifyUrl) . '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">'
                . 'Confirm my email</a></p>'
                . '<p style="font-size:14px;color:#333"><strong>This confirmation link is available for 24 hours.</strong> If it expires, you can request another link from the website.</p>'
                . '<p style="font-size:13px;color:#555">If the button does not work, copy and paste this link into your browser:<br>'
                . htmlspecialchars($verifyUrl) . '</p>'
                . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                . '<p style="font-size:13px;color:#555">If you did not create this account, you can ignore this email.</p>'
                . '</div>';
        }

        try {
            return Mailer::send([
                'to' => $email,
                'subject' => $subject,
                'html' => $html,
            ]);
        } catch (Throwable $e) {
            error_log('[sendVerificationEmail] ' . $e->getMessage());
            return false;
        }
    }

    /** App signup, or legacy rows with no signup_client (pre-column mobile applicants). */
    public static function isMobileSignupClient(mixed $signupClient): bool
    {
        $v = strtolower(trim((string) ($signupClient ?? '')));
        return $v === 'mobile' || $v === '';
    }

    /**
     * Mobile-app only: Ops approved a reseller. No website Sign-in CTA.
     * Returns true if mail was accepted by SMTP.
     */
    public static function sendResellerApprovedForAppEmail(string $email, string $name, bool $emailVerified = true): bool
    {
        if ($email === '') {
            return false;
        }
        $next = $emailVerified
            ? '<p><strong>Next step:</strong> open the <strong>Village NetAcad</strong> mobile app and sign in with this email and your password.</p>'
            : '<p><strong>Next steps:</strong> confirm your email (use the confirmation link, or <em>Resend confirmation email</em> on the app Sign in screen), then open the app and sign in.</p>';
        $html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
            . '<h2 style="color:#16a34a;margin-bottom:8px">You\'re approved — sign in to the Village NetAcad app</h2>'
            . '<p>Hi ' . htmlspecialchars($name) . ',</p>'
            . '<p>Digititan / Ops has approved your <strong>reseller</strong> account.</p>'
            . $next
            . '<p style="font-size:14px;color:#333">You do not need to sign in on the website for the app — use the app Sign in screen.</p>'
            . '<p>Welcome aboard.</p>'
            . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
            . '</div>';

        try {
            return Mailer::send([
                'to' => $email,
                'subject' => 'You\'re approved — sign in to the Village NetAcad app',
                'html' => $html,
            ]);
        } catch (Throwable $e) {
            error_log('[sendResellerApprovedForAppEmail] ' . $e->getMessage());
            return false;
        }
    }

    private static function sendWelcomeEmail(string $email, string $name, bool $forMobile = false): void
    {
        if ($forMobile) {
            $html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                . '<h2 style="color:#16a34a;margin-bottom:8px">You\'re confirmed — open the app</h2>'
                . '<p>Hi ' . htmlspecialchars($name) . ',</p>'
                . '<p>Your email is confirmed. Welcome to the <strong>Village NetAcad</strong> program.</p>'
                . '<p><strong>Next step:</strong> open the <strong>Village NetAcad</strong> mobile app on your phone and sign in with this email and your password.</p>'
                . '<p style="font-size:14px;color:#333">You do not need to sign in on the website for the app — use the app Sign in screen.</p>'
                . '<p>We look forward to learning with you.</p>'
                . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                . '</div>';
            $subject = 'Email confirmed — open the Village NetAcad app';
        } else {
            $loginUrl = rtrim((string) Client::getClientUrl(), '/') . '/login';
            $html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                . '<h2 style="color:#16a34a;margin-bottom:8px">Welcome to the Village NetAcad program!</h2>'
                . '<p>Hi ' . htmlspecialchars($name) . ',</p>'
                . '<p>Your email has been confirmed. We are excited to welcome you to the <strong>Village NetAcad</strong> program — your journey into networking education starts here.</p>'
                . '<p>You can now sign in and explore your courses.</p>'
                . '<p style="margin:28px 0">'
                . '<a href="' . htmlspecialchars($loginUrl) . '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">'
                . 'Sign in to Village NetAcad</a></p>'
                . '<p>We look forward to learning with you.</p>'
                . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                . '</div>';
            $subject = 'Welcome to the Village NetAcad program';
        }

        try {
            Mailer::send([
                'to' => $email,
                'subject' => $subject,
                'html' => $html,
            ]);
        } catch (Throwable $e) {
            error_log('[sendWelcomeEmail] ' . $e->getMessage());
        }
    }

    public static function forgotPassword(): void
    {
        $body = Request::jsonBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));

        if ($email === '') {
            Response::error('Email is required', 400);
        }

        SchemaEnsure::logins();

        $user = User::findByEmailForAuth($email);
        $emailSent = false;

        if ($user) {
            // Hex-only token (no hyphens) — safer in email clients than UUID query strings
            $resetToken = bin2hex(random_bytes(32));
            try {
                Database::queryRun(
                    'UPDATE logins SET reset_token = ?, reset_token_expires = DATE_ADD(NOW(), INTERVAL 1 HOUR) WHERE registration_id = ?',
                    [$resetToken, $user['id']]
                );
            } catch (Throwable $e) {
                error_log('[forgotPassword] token save failed: ' . $e->getMessage());
                Response::error('Password reset is not available right now. Please contact support.', 500);
            }

            // Path-based link avoids query-string mangling by some mail apps
            $resetUrl = Client::getClientUrl() . '/reset-password/' . $resetToken;
            $emailSent = Mailer::send([
                'to' => $email,
                'subject' => 'Reset your Village NetAcad password',
                'html' => '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                    . '<h2 style="color:#16a34a;margin-bottom:8px">Reset your password</h2>'
                    . '<p>Hi ' . htmlspecialchars((string) $user['name']) . ',</p>'
                    . '<p>We received a request to reset the password for your <strong>Village NetAcad</strong> account.</p>'
                    . '<p style="margin:28px 0">'
                    . '<a href="' . htmlspecialchars($resetUrl) . '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">'
                    . 'Reset my password</a></p>'
                    . '<p style="font-size:14px;color:#333"><strong>This link expires in 1 hour.</strong> If you did not request a reset, you can ignore this email.</p>'
                    . '<p style="font-size:13px;color:#555">If the button does not work, copy and paste this link into your browser:<br>'
                    . htmlspecialchars($resetUrl) . '</p>'
                    . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                    . '</div>',
            ]);

            if (!$emailSent) {
                error_log('[forgotPassword] email not sent for ' . $email . ': ' . (Mailer::$lastError ?? 'unknown'));
            }
        }

        Response::json([
            'message' => 'If that email exists, a reset link was sent. Check your inbox and spam folder.',
            'email_sent' => $user ? $emailSent : null,
        ]);
    }

    public static function resetPassword(): void
    {
        $body = Request::jsonBody();
        $token = self::normalizeResetToken((string) ($body['token'] ?? ''));
        $password = (string) ($body['password'] ?? '');

        if ($token === '' || $password === '') {
            Response::error('Token and new password are required', 400);
        }
        if (strlen($password) < 6) {
            Response::error('Password must be at least 6 characters', 400);
        }

        SchemaEnsure::logins();

        $login = Database::queryGet(
            'SELECT registration_id, reset_token_expires FROM logins WHERE reset_token = ?',
            [$token]
        );
        if (!$login) {
            Response::error('Invalid or expired reset link. Please request a new one.', 400);
        }

        $expiresRaw = $login['reset_token_expires'] ?? null;
        if ($expiresRaw === null || $expiresRaw === '') {
            Response::error('Invalid or expired reset link. Please request a new one.', 400);
        }

        // Accept both MySQL DATETIME and legacy ISO strings
        $expiresTs = strtotime((string) $expiresRaw);
        if ($expiresTs === false || $expiresTs < time()) {
            Response::error('This reset link has expired. Please request a new one.', 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        Database::queryRun(
            'UPDATE logins SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE registration_id = ?',
            [$hash, $login['registration_id']]
        );
        Response::json(['message' => 'Password reset successfully. You can sign in with your new password.']);
    }

    private static function normalizeResetToken(string $token): string
    {
        $token = trim(rawurldecode($token));
        // Strip accidental wrapping quotes / spaces from email clients
        $token = trim($token, " \t\n\r\0\x0B\"'<>");
        return $token;
    }

    public static function me(): void
    {
        Auth::authenticate();
        Response::json(['user' => Auth::$user]);
    }

    public static function logout(): void
    {
        Response::json(['message' => 'Logged out successfully']);
    }
}
