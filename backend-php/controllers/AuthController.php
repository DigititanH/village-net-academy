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

        $academyName = trim((string) $academy);
        if (($userRole === 'reseller' || $userRole === 'academy') && $academyName === '') {
            Response::error('Academy name is required', 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $approvalStatus = 'approved';
        $verificationToken = Request::uuid();

        $result = Database::queryRun(
            'INSERT INTO registrations (name, role, is_verified, is_approved, academy_name, verification_token) VALUES (?, ?, 0, ?, ?, ?)',
            [$name, $userRole, $approvalStatus, $userRole === 'academy' ? $academyName : null, $verificationToken]
        );
        $userId = $result['lastInsertRowid'];

        Database::queryRun(
            'INSERT INTO logins (registration_id, email, password) VALUES (?, ?, ?)',
            [$userId, strtolower(trim($email)), $hash]
        );

        if ($userRole === 'reseller') {
            $referralCode = 'VNA-' . strtoupper(substr(str_replace('-', '', Request::uuid()), 0, 8));
            Database::queryRun(
                'INSERT INTO reseller_profiles (user_id, referral_code, academy, commission_rate, status) VALUES (?, ?, ?, ?, ?)',
                [$userId, $referralCode, $academyName, 56.00, 'approved']
            );
            Mailer::send([
                'to' => Site::email(),
                'replyTo' => $email,
                'subject' => "New reseller registration: $name",
                'html' => "<p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
                    <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
                    <p><strong>Academy:</strong> " . htmlspecialchars($academyName) . "</p>
                    <p><strong>Referral code:</strong> $referralCode</p>",
            ]);
        }

        if ($userRole === 'academy') {
            Mailer::send([
                'to' => Site::email(),
                'replyTo' => $email,
                'subject' => "New academy affiliate registration: $name",
                'html' => "<p><strong>Name:</strong> " . htmlspecialchars($name) . "</p>
                    <p><strong>Email:</strong> " . htmlspecialchars($email) . "</p>
                    <p><strong>Academy:</strong> " . htmlspecialchars($academyName) . "</p>",
            ]);
        }

        $verifyUrl = Client::getClientUrl() . '/verify-email?token=' . urlencode($verificationToken);
        Mailer::send([
            'to' => $email,
            'subject' => 'Confirm your email — Village NetAcad',
            'html' => '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                . '<h2 style="color:#16a34a;margin-bottom:8px">Confirm your email address</h2>'
                . '<p>Hi ' . htmlspecialchars($name) . ',</p>'
                . '<p>Thank you for registering with <strong>Village NetAcad</strong>. Please confirm your email address to activate your account.</p>'
                . '<p style="margin:28px 0">'
                . '<a href="' . htmlspecialchars($verifyUrl) . '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">'
                . 'Confirm my email</a></p>'
                . '<p style="font-size:14px;color:#333"><strong>This confirmation link is available for 24 hours.</strong> After that, it will expire and you will need to register again or contact support.</p>'
                . '<p style="font-size:13px;color:#555">If the button does not work, copy and paste this link into your browser:<br>'
                . htmlspecialchars($verifyUrl) . '</p>'
                . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                . '<p style="font-size:13px;color:#555">If you did not create this account, you can ignore this email.</p>'
                . '</div>',
        ]);

        Response::json([
            'pending_verification' => true,
            'message' => 'Account created. Please check your email and click the confirmation link before signing in.',
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
            Database::queryRun("UPDATE registrations SET is_approved = 'approved' WHERE id = ?", [$user['id']]);
            $user['is_approved'] = 'approved';
            if (($user['role'] ?? '') === 'reseller') {
                Database::queryRun(
                    "UPDATE reseller_profiles SET status = 'approved' WHERE user_id = ? AND status = 'pending'",
                    [$user['id']]
                );
            }
        }

        if (($user['role'] ?? '') !== 'admin' && ($user['role'] ?? '') !== 'super_admin' && empty($user['is_verified'])) {
            Response::error('Please confirm your email before signing in. Check your inbox for the registration confirmation link.', 403);
        }

        try {
            Database::queryRun('UPDATE logins SET last_login_at = NOW() WHERE registration_id = ?', [$user['id']]);
        } catch (Throwable $e) {
            // Non-fatal if last_login_at column is missing on older DBs
        }

        Response::json([
            'token' => Jwt::sign((int) $user['id']),
            'user' => [
                'id' => (int) $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar' => $user['avatar'],
                'is_approved' => $user['is_approved'],
                'is_verified' => (bool) $user['is_verified'],
                'academy_name' => $user['academy_name'] ?? null,
            ],
        ]);
    }

    public static function verifyEmail(): void
    {
        $token = Request::query('token');
        $user = Database::queryGet(
            'SELECT r.id, r.name, r.created_at, l.email
             FROM registrations r
             INNER JOIN logins l ON l.registration_id = r.id
             WHERE r.verification_token = ?',
            [$token]
        );
        if (!$user) {
            Response::error('Invalid or expired verification link', 400);
        }

        $createdAt = strtotime((string) $user['created_at']);
        if ($createdAt === false || (time() - $createdAt) > 86400) {
            Response::error('This confirmation link has expired. Links are valid for 24 hours.', 400);
        }

        Database::queryRun(
            'UPDATE registrations SET is_verified = 1, verification_token = NULL WHERE id = ?',
            [$user['id']]
        );

        $loginUrl = Client::getClientUrl() . '/login';
        Mailer::send([
            'to' => $user['email'],
            'subject' => 'Welcome to the Village NetAcad program',
            'html' => '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;line-height:1.5">'
                . '<h2 style="color:#16a34a;margin-bottom:8px">Welcome to the Village NetAcad program!</h2>'
                . '<p>Hi ' . htmlspecialchars($user['name']) . ',</p>'
                . '<p>Your email has been confirmed. We are excited to welcome you to the <strong>Village NetAcad</strong> program — your journey into networking education starts here.</p>'
                . '<p>You can now sign in and explore your courses.</p>'
                . '<p style="margin:28px 0">'
                . '<a href="' . htmlspecialchars($loginUrl) . '" style="background:#16a34a;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">'
                . 'Sign in to Village NetAcad</a></p>'
                . '<p>We look forward to learning with you.</p>'
                . '<p style="margin-top:24px"><strong>The Village NetAcad Team</strong></p>'
                . '</div>',
        ]);

        Response::json(['message' => 'Email verified successfully']);
    }

    public static function forgotPassword(): void
    {
        $body = Request::jsonBody();
        $email = $body['email'] ?? '';
        $user = User::findByEmailForAuth($email);

        if ($user) {
            $resetToken = Request::uuid();
            $expires = gmdate('c', time() + 3600);
            Database::queryRun(
                'UPDATE logins SET reset_token = ?, reset_token_expires = ? WHERE registration_id = ?',
                [$resetToken, $expires, $user['id']]
            );
            $resetUrl = Client::getClientUrl() . '/reset-password?token=' . urlencode($resetToken);
            Mailer::send([
                'to' => $email,
                'subject' => 'Password Reset - Village NetAcad',
                'html' => '<h2>Hi ' . htmlspecialchars($user['name']) . '</h2>
                    <p>Click <a href="' . $resetUrl . '">here</a> to reset your password. Expires in 1 hour.</p>',
            ]);
        }

        Response::json(['message' => 'If that email exists, a reset link was sent']);
    }

    public static function resetPassword(): void
    {
        $body = Request::jsonBody();
        $token = $body['token'] ?? '';
        $password = $body['password'] ?? '';

        $login = Database::queryGet(
            "SELECT registration_id FROM logins WHERE reset_token = ? AND reset_token_expires > NOW()",
            [$token]
        );
        if (!$login) {
            Response::error('Invalid or expired reset token', 400);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        Database::queryRun(
            'UPDATE logins SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE registration_id = ?',
            [$hash, $login['registration_id']]
        );
        Response::json(['message' => 'Password reset successfully']);
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
