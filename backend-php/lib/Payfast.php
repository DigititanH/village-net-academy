<?php

class Payfast
{
    public const FIELD_ORDER = [
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'cell_number', 'm_payment_id',
        'amount', 'item_name', 'item_description',
        'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
        'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
        'email_confirmation', 'confirmation_address', 'payment_method',
    ];

    public static function isSandbox(): bool
    {
        return Env::get('PAYFAST_SANDBOX', 'true') !== 'false';
    }

    public static function merchantId(): string
    {
        return Env::get('PAYFAST_MERCHANT_ID', '') ?? '';
    }

    public static function merchantKey(): string
    {
        return Env::get('PAYFAST_MERCHANT_KEY', '') ?? '';
    }

    public static function passphrase(): string
    {
        return trim(Env::get('PAYFAST_PASSPHRASE', '') ?? '');
    }

    public static function processUrl(): string
    {
        return self::isSandbox()
            ? 'https://sandbox.payfast.co.za/eng/process'
            : 'https://www.payfast.co.za/eng/process';
    }

    public static function validateUrl(): string
    {
        return self::isSandbox()
            ? 'https://sandbox.payfast.co.za/eng/query/validate'
            : 'https://www.payfast.co.za/eng/query/validate';
    }

    public static function isConfigured(): bool
    {
        return self::merchantId() !== '' && self::merchantKey() !== '';
    }

    public static function getApiBaseUrl(): string
    {
        $api = rtrim(Env::get('API_URL', '') ?? '', '/');
        if ($api !== '' && !preg_match('/your-public-api|example\.com|placeholder/i', $api)) {
            return $api;
        }
        $port = Env::get('PORT', '5000');
        return "http://localhost:$port";
    }

    public static function getNotifyUrl(): string
    {
        $custom = trim(Env::get('PAYFAST_NOTIFY_URL', '') ?? '');
        if ($custom !== '') {
            return rtrim($custom, '/');
        }
        return self::getApiBaseUrl() . '/api/payfast/notify';
    }

    public static function isNotifyUrlLocal(string $url): bool
    {
        return (bool) preg_match('/localhost|127\.0\.0\.1|0\.0\.0\.0/i', $url);
    }

    public static function pfEncode(string $value): string
    {
        $encoded = rawurlencode(trim($value));
        $encoded = str_replace('%20', '+', $encoded);
        $encoded = str_replace(['!', "'", '(', ')', '*'], ['%21', '%27', '%28', '%29', '%2A'], $encoded);
        return $encoded;
    }

    public static function buildSignatureString(array $data, ?string $passphrase = null): string
    {
        $passphrase = $passphrase ?? self::passphrase();
        $payload = [];
        foreach ($data as $key => $val) {
            if ($key === 'signature' || $val === null) {
                continue;
            }
            $trimmed = trim((string) $val);
            if ($trimmed === '') {
                continue;
            }
            $payload[$key] = $trimmed;
        }

        $extra = array_diff(array_keys($payload), self::FIELD_ORDER);
        sort($extra);
        $orderedKeys = array_merge(
            array_values(array_filter(self::FIELD_ORDER, fn ($k) => isset($payload[$k]))),
            $extra
        );

        $parts = [];
        foreach ($orderedKeys as $key) {
            $parts[] = $key . '=' . self::pfEncode($payload[$key]);
        }
        $paramString = implode('&', $parts);
        if ($passphrase !== '') {
            $paramString .= '&passphrase=' . self::pfEncode($passphrase);
        }
        return $paramString;
    }

    public static function generateSignature(array $data, ?string $passphrase = null): string
    {
        return md5(self::buildSignatureString($data, $passphrase));
    }

    public static function formatAmount(float $amount): string
    {
        if (!is_finite($amount) || $amount < 5) {
            throw new InvalidArgumentException('PayFast requires a minimum amount of R5.00');
        }
        return number_format($amount, 2, '.', '');
    }

    public static function splitName(string $fullName = ''): array
    {
        $parts = preg_split('/\s+/', trim($fullName)) ?: [];
        return [
            'first' => $parts[0] ?? 'Customer',
            'last' => count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : null,
        ];
    }

    public static function buildPaymentPayload(array $opts): array
    {
        $names = self::splitName($opts['name'] ?? '');
        $notifyUrl = self::getNotifyUrl();
        $clientUrl = Client::getClientUrl();

        $paymentData = [
            'merchant_id' => self::merchantId(),
            'merchant_key' => self::merchantKey(),
            'return_url' => $opts['returnUrl'] ?? ($clientUrl . ($opts['returnPath'] ?? '/payment/success')),
            'cancel_url' => $opts['cancelUrl'] ?? ($clientUrl . ($opts['cancelPath'] ?? '/payment/cancel')),
            'notify_url' => $notifyUrl,
            'name_first' => $names['first'],
            'email_address' => trim((string) ($opts['email'] ?? '')),
            'm_payment_id' => $opts['paymentId'] ?? ('pay-' . time()),
            'amount' => self::formatAmount((float) $opts['amount']),
            'item_name' => substr(str_replace('#', '', (string) $opts['itemName']), 0, 100),
        ];

        if ($names['last']) {
            $paymentData['name_last'] = $names['last'];
        }

        $paymentData['signature'] = self::generateSignature($paymentData);
        return $paymentData;
    }

    public static function validateItnWithPayFast(array $body): bool
    {
        $params = [];
        foreach ($body as $key => $value) {
            if ($key !== 'signature' && $value !== null && $value !== '') {
                $params[] = urlencode($key) . '=' . urlencode((string) $value);
            }
        }
        $postData = implode('&', $params);

        $ch = curl_init(self::validateUrl());
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT => 30,
        ]);
        $text = curl_exec($ch);
        curl_close($ch);
        return trim((string) $text) === 'VALID';
    }

    public static function statusPayload(): array
    {
        return [
            'configured' => self::isConfigured(),
            'sandbox' => self::isSandbox(),
            'process_url' => self::processUrl(),
            'notify_url' => self::getApiBaseUrl() . '/api/payfast/notify',
            'has_passphrase' => self::passphrase() !== '',
        ];
    }

    /** Dev diagnostic: POST probe to PayFast process URL */
    public static function probeCredentials(): array
    {
        if (!function_exists('curl_init')) {
            return ['error' => 'curl extension required for PayFast probe'];
        }

        $fields = self::buildPaymentPayload([
            'amount' => 50,
            'itemName' => 'Credential probe',
            'paymentId' => 'probe-' . time(),
            'email' => 'probe@test.com',
            'name' => 'Probe',
            'returnPath' => '/payment/success',
            'cancelPath' => '/payment/cancel',
        ]);

        $body = http_build_query(array_map('strval', $fields));
        $ch = curl_init(self::processUrl());
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_TIMEOUT => 30,
        ]);
        $data = (string) curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $plain = trim(preg_replace('/<[^>]+>/', ' ', $data));
        $plain = preg_replace('/\s+/', ' ', $plain);

        return [
            'http_status' => $status,
            'credentials_valid' => ($status >= 300 && $status < 400)
                || (!preg_match('/invalid merchant id/i', $plain)
                    && !preg_match('/merchant key.*required/i', $plain)
                    && !preg_match('/signature/i', $plain)
                    && $status !== 400),
            'payfast_message' => substr($plain, 0, 280) ?: null,
            'invalid_merchant_id' => (bool) preg_match('/invalid merchant id/i', $plain),
            'merchant_key_required' => (bool) preg_match('/merchant key.*required/i', $plain),
            'signature_mismatch' => (bool) preg_match('/signature/i', $plain),
        ];
    }
}
