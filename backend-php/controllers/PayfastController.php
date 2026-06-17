<?php

class PayfastController
{
    private static function parsePaymentId(string $mPaymentId): ?array
    {
        if (!preg_match('/^(order|donation)-(\d+)$/', $mPaymentId, $m)) {
            return null;
        }
        return ['type' => $m[1], 'id' => (int) $m[2]];
    }

    public static function status(): void
    {
        Response::json(Payfast::statusPayload());
    }

    public static function check(): void
    {
        if (Env::isProduction()) {
            Response::error('Not found', 404);
        }
        if (!Payfast::isConfigured()) {
            Response::json([
                'ok' => false,
                'message' => 'Set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY in backend-php/.env',
            ], 503);
        }

        $notifyUrl = Payfast::getNotifyUrl();
        $sample = Payfast::buildPaymentPayload([
            'amount' => 50,
            'itemName' => 'Test Payment',
            'paymentId' => 'donation-test',
            'email' => 'test@example.com',
            'name' => 'Test User',
            'returnPath' => '/payment/success?type=donation&id=1',
            'cancelPath' => '/payment/cancel?type=donation&id=1',
        ]);

        $warnings = [];
        $blockers = [];

        if (Payfast::isNotifyUrlLocal($notifyUrl)) {
            $warnings[] = 'notify_url uses localhost — payments may work, but PayFast cannot confirm them. Use ngrok: PAYFAST_NOTIFY_URL=https://YOUR-ID.ngrok-free.app/api/payfast/notify';
        }
        if (Payfast::passphrase() !== '') {
            $warnings[] = 'Passphrase is set — it must match PayFast → Settings → Security exactly, or remove PAYFAST_PASSPHRASE from .env if disabled.';
        }

        $probe = Payfast::probeCredentials();
        if (!empty($probe['invalid_merchant_id'])) {
            $blockers[] = 'Invalid merchant ID — copy Merchant ID and Merchant Key from https://sandbox.payfast.co.za (Settings → Integration).';
        }
        if (!empty($probe['signature_mismatch'])) {
            $blockers[] = 'Signature rejected — check PAYFAST_PASSPHRASE matches your PayFast security settings.';
        }
        if (!empty($probe['merchant_key_required'])) {
            $blockers[] = 'PayFast requires merchant_key in the payment form (server misconfiguration).';
        }

        Response::json([
            'ok' => count($blockers) === 0,
            'sandbox' => Payfast::isSandbox(),
            'merchant_id' => Payfast::merchantId(),
            'has_passphrase' => Payfast::passphrase() !== '',
            'notify_url' => $notifyUrl,
            'warnings' => $warnings,
            'blockers' => $blockers,
            'probe' => $probe,
            'sample_signature' => $sample['signature'],
            'tips' => [
                'Credentials in .env must be from the SAME environment as PAYFAST_SANDBOX (sandbox vs live).',
                'Restart the PHP server after any .env change.',
            ],
        ]);
    }

    public static function handlePay(): void
    {
        if (!Payfast::isConfigured()) {
            Response::error('PayFast is not configured on the server', 503);
        }

        $body = Request::jsonBody();
        $amount = $body['amount'] ?? null;
        $itemName = $body['item_name'] ?? '';
        $nameFirst = $body['name_first'] ?? '';
        $email = $body['email_address'] ?? '';
        $nameLast = $body['name_last'] ?? '';
        $paymentId = $body['m_payment_id'] ?? null;
        $returnUrl = $body['return_url'] ?? null;
        $cancelUrl = $body['cancel_url'] ?? null;

        if (!$amount || !$itemName || !$nameFirst || !$email) {
            Response::error('amount, item_name, name_first, and email_address are required', 400);
        }

        $fullName = $nameLast ? trim("$nameFirst $nameLast") : trim((string) $nameFirst);

        $fields = Payfast::buildPaymentPayload([
            'amount' => $amount,
            'itemName' => $itemName,
            'paymentId' => $paymentId,
            'email' => $email,
            'name' => $fullName,
            'returnUrl' => $returnUrl,
            'cancelUrl' => $cancelUrl,
        ]);

        Response::json(['url' => Payfast::processUrl(), 'fields' => $fields]);
    }

    public static function debugSignature(): void
    {
        if (Env::isProduction()) {
            Response::error('Not found', 404);
        }
        $sample = Payfast::buildPaymentPayload([
            'amount' => 50,
            'itemName' => 'Test',
            'paymentId' => 'donation-1',
            'email' => 'test@test.com',
            'name' => 'Test User',
            'returnPath' => '/payment/success?type=donation&id=1',
            'cancelPath' => '/payment/cancel?type=donation&id=1',
        ]);
        $hidden = $sample;
        $hidden['signature'] = '[hidden]';
        Response::json([
            'signature_string' => Payfast::buildSignatureString($sample),
            'signature' => $sample['signature'],
            'fields' => $hidden,
        ]);
    }

    public static function orderPayment(array $params): void
    {
        if (!Payfast::isConfigured()) {
            Response::error('PayFast is not configured on the server', 503);
        }
        Auth::authenticate();

        $orderId = (int) $params['orderId'];
        $order = Database::queryGet('SELECT * FROM orders WHERE id = ?', [$orderId]);
        if (!$order) {
            Response::error('Order not found', 404);
        }
        if ((int) $order['user_id'] !== (int) Auth::$user['id'] && Auth::$user['role'] !== 'admin') {
            Response::error('Access denied', 403);
        }
        if ($order['payment_status'] === 'paid') {
            Response::error('Order is already paid', 400);
        }

        $fields = Payfast::buildPaymentPayload([
            'amount' => $order['total'],
            'itemName' => "Village Netacad Order #$orderId",
            'paymentId' => "order-$orderId",
            'email' => Auth::$user['email'],
            'name' => Auth::$user['name'],
            'returnPath' => "/payment/success?type=order&id=$orderId",
            'cancelPath' => "/payment/cancel?type=order&id=$orderId",
        ]);

        Response::json(['url' => Payfast::processUrl(), 'fields' => $fields]);
    }

    public static function donationPayment(array $params): void
    {
        if (!Payfast::isConfigured()) {
            Response::error('PayFast is not configured on the server', 503);
        }

        $donationId = (int) $params['donationId'];
        $donation = Database::queryGet('SELECT * FROM donations WHERE id = ?', [$donationId]);
        if (!$donation) {
            Response::error('Donation not found', 404);
        }
        if ($donation['payment_status'] === 'completed') {
            Response::error('Donation is already completed', 400);
        }

        $fields = Payfast::buildPaymentPayload([
            'amount' => $donation['amount'],
            'itemName' => "Village Netacad Donation #$donationId",
            'paymentId' => "donation-$donationId",
            'email' => $donation['email'] ?: 'donor@villagenetacad.co.za',
            'name' => $donation['donor_name'] ?: 'Donor',
            'returnPath' => "/payment/success?type=donation&id=$donationId",
            'cancelPath' => "/payment/cancel?type=donation&id=$donationId",
        ]);

        Response::json(['url' => Payfast::processUrl(), 'fields' => $fields]);
    }

    public static function notify(): void
    {
        http_response_code(200);
        echo 'OK';

        if (function_exists('fastcgi_finish_request')) {
            fastcgi_finish_request();
        } else {
            if (ob_get_level()) {
                ob_end_flush();
            }
            flush();
        }

        try {
            $data = $_POST;
            $receivedSignature = $data['signature'] ?? '';
            $expectedSignature = Payfast::generateSignature($data);

            if (!$receivedSignature || $receivedSignature !== $expectedSignature) {
                error_log('PayFast ITN: invalid signature');
                return;
            }

            if (!Payfast::validateItnWithPayFast($data)) {
                error_log('PayFast ITN: validation failed');
                return;
            }

            $parsed = self::parsePaymentId((string) ($data['m_payment_id'] ?? ''));
            if (!$parsed) {
                error_log('PayFast ITN: unknown m_payment_id ' . ($data['m_payment_id'] ?? ''));
                return;
            }

            $pfStatus = strtoupper((string) ($data['payment_status'] ?? ''));
            if ($pfStatus !== 'COMPLETE') {
                if ($parsed['type'] === 'order') {
                    Database::queryRun(
                        "UPDATE orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ?",
                        [$parsed['id']]
                    );
                } else {
                    Database::queryRun(
                        "UPDATE donations SET payment_status = 'failed' WHERE id = ?",
                        [$parsed['id']]
                    );
                }
                return;
            }

            $pfPaymentId = $data['pf_payment_id'] ?? $data['m_payment_id'] ?? '';

            if ($parsed['type'] === 'order') {
                $order = Database::queryGet('SELECT * FROM orders WHERE id = ?', [$parsed['id']]);
                if (!$order || $order['payment_status'] === 'paid') {
                    return;
                }

                $paidAmount = (float) ($data['amount_gross'] ?? $data['amount_net'] ?? 0);
                if (abs($paidAmount - (float) $order['total']) > 0.01) {
                    error_log("PayFast ITN: amount mismatch $paidAmount vs {$order['total']}");
                    return;
                }

                Database::queryRun('UPDATE orders SET payment_intent_id = ? WHERE id = ?', [$pfPaymentId, $parsed['id']]);
                OrderFulfillment::fulfill($parsed['id']);
            } elseif ($parsed['type'] === 'donation') {
                $donation = Database::queryGet('SELECT * FROM donations WHERE id = ?', [$parsed['id']]);
                if (!$donation || $donation['payment_status'] === 'completed') {
                    return;
                }

                Database::queryRun(
                    "UPDATE donations SET payment_status = 'completed', payment_intent_id = ? WHERE id = ?",
                    [$pfPaymentId, $parsed['id']]
                );

                Mailer::send([
                    'to' => Site::email(),
                    'replyTo' => $donation['email'] ?: null,
                    'subject' => 'Donation received: R' . number_format((float) $donation['amount'], 2),
                    'html' => '<p><strong>Donation ID:</strong> ' . $parsed['id'] . '</p>
                        <p><strong>Academy:</strong> ' . htmlspecialchars($donation['academy'] ?? '—') . '</p>
                        <p><strong>Donor:</strong> ' . htmlspecialchars($donation['donor_name']) . '</p>
                        <p><strong>Amount:</strong> R' . number_format((float) $donation['amount'], 2) . '</p>
                        <p><strong>PayFast ref:</strong> ' . htmlspecialchars((string) $pfPaymentId) . '</p>',
                ]);
            }
        } catch (Throwable $e) {
            error_log('PayFast ITN error: ' . $e->getMessage());
        }
    }
}
