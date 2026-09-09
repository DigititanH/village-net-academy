<?php

class Payfast
{
    /** PayFast form attribute order — do NOT sort alphabetically (that is for the API only). */
    public const FIELD_ORDER = [
        'cmd', 'receiver',
        'merchant_id', 'merchant_key', 'return_url', 'cancel_url', 'notify_url',
        'name_first', 'name_last', 'email_address', 'cell_number',
        'm_payment_id', 'amount', 'item_name', 'item_description',
        'custom_int1', 'custom_int2', 'custom_int3', 'custom_int4', 'custom_int5',
        'custom_str1', 'custom_str2', 'custom_str3', 'custom_str4', 'custom_str5',
        'email_confirmation', 'confirmation_address', 'payment_method',
        'subscription_type', 'billing_date', 'recurring_amount', 'frequency', 'cycles',
        'subscription_notify_email', 'subscription_notify_webhook', 'subscription_notify_buyer',
        'line1', 'line2', 'city', 'region', 'country', 'code',
    ];

    public static function isSandbox(): bool
    {
        return Env::get('PAYFAST_SANDBOX', 'true') !== 'false';
    }

    public static function merchantId(): string
    {
        return trim(Env::get('PAYFAST_MERCHANT_ID', '') ?? '');
    }

    public static function merchantKey(): string
    {
        return trim(Env::get('PAYFAST_MERCHANT_KEY', '') ?? '');
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
        return self::isLocalUrl($url);
    }

    /** Local / private URLs that live PayFast rejects (CloudFront 403). */
    public static function isLocalUrl(string $url): bool
    {
        return (bool) preg_match('/localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]/i', $url);
    }

    /**
     * Join a public base return URL with an app path (keeps query strings like ?type=order&id=1).
     */
    public static function joinPublicRedirect(string $baseUrl, string $path): string
    {
        $baseUrl = rtrim(trim($baseUrl), '/');
        $path = trim($path);
        if ($path === '') {
            return $baseUrl;
        }
        if (!str_starts_with($path, '/')) {
            $path = '/' . $path;
        }

        $baseParts = parse_url($baseUrl);
        $pathParts = parse_url($path);
        if ($baseParts === false) {
            return $baseUrl . $path;
        }

        $scheme = ($baseParts['scheme'] ?? 'https') . '://';
        $host = $baseParts['host'] ?? '';
        $port = isset($baseParts['port']) ? ':' . $baseParts['port'] : '';
        $joinedPath = $pathParts['path'] ?? ($baseParts['path'] ?? '');
        if ($joinedPath === '') {
            $joinedPath = '/';
        }

        $query = $pathParts['query'] ?? ($baseParts['query'] ?? null);
        $url = $scheme . $host . $port . $joinedPath;
        if ($query) {
            $url .= '?' . $query;
        }
        return $url;
    }

    /**
     * Resolve return/cancel URLs. Live PayFast forbids localhost redirects (CloudFront 403).
     */
    public static function resolveRedirectUrl(?string $explicit, ?string $path, string $envKey, string $defaultPath): string
    {
        if ($explicit !== null && trim($explicit) !== '') {
            return trim($explicit);
        }

        $path = ($path !== null && $path !== '') ? $path : $defaultPath;
        $clientUrl = Client::getClientUrl();
        $candidate = $clientUrl . (str_starts_with($path, '/') ? $path : '/' . $path);

        if (!self::isSandbox() && self::isLocalUrl($candidate)) {
            $envUrl = trim((string) (Env::get($envKey, '') ?? ''));
            if ($envUrl !== '' && !self::isLocalUrl($envUrl)) {
                return self::joinPublicRedirect($envUrl, $path);
            }
            throw new InvalidArgumentException(
                'Live PayFast rejects localhost return/cancel URLs (CloudFront 403). '
                . "Set {$envKey} to your public site (e.g. https://www.villagenetacad.co.za/payment/success)."
            );
        }

        return $candidate;
    }

    /** Match PHP urlencode() as used by PayFast (spaces as +, uppercase hex). */
    public static function pfEncode(string $value): string
    {
        return urlencode(trim($value));
    }

    /**
     * Build non-blank fields in PayFast attribute order (not alphabetical).
     * @return array<string, string>
     */
    public static function orderedNonBlank(array $data): array
    {
        $ordered = [];
        foreach (self::FIELD_ORDER as $key) {
            if (!array_key_exists($key, $data) || $key === 'signature') {
                continue;
            }
            if ($data[$key] === null) {
                continue;
            }
            $trimmed = trim((string) $data[$key]);
            if ($trimmed === '') {
                continue;
            }
            $ordered[$key] = $trimmed;
        }
        foreach ($data as $key => $val) {
            if ($key === 'signature' || array_key_exists($key, $ordered)) {
                continue;
            }
            if ($val === null) {
                continue;
            }
            $trimmed = trim((string) $val);
            if ($trimmed === '') {
                continue;
            }
            $ordered[$key] = $trimmed;
        }
        return $ordered;
    }

    public static function buildSignatureString(array $data, ?string $passphrase = null, bool $useAttributeOrder = true): string
    {
        $passphrase = $passphrase ?? self::passphrase();
        $payload = $useAttributeOrder
            ? self::orderedNonBlank($data)
            : self::nonBlankPreserveOrder($data);

        $pfOutput = '';
        foreach ($payload as $key => $val) {
            $pfOutput .= $key . '=' . urlencode($val) . '&';
        }
        $paramString = $pfOutput !== '' ? substr($pfOutput, 0, -1) : '';
        if ($passphrase !== '') {
            $paramString .= ($paramString !== '' ? '&' : '') . 'passphrase=' . urlencode(trim($passphrase));
        }
        return $paramString;
    }

    /** Non-blank fields keeping array order (for ITN verification). */
    public static function nonBlankPreserveOrder(array $data): array
    {
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
        return $payload;
    }

    public static function generateSignature(array $data, ?string $passphrase = null, bool $useAttributeOrder = true): string
    {
        return md5(self::buildSignatureString($data, $passphrase, $useAttributeOrder));
    }

    /** Order fields for the HTML form and append signature last. */
    public static function withSignature(array $data, ?string $passphrase = null): array
    {
        $fields = self::orderedNonBlank($data);
        $fields['signature'] = self::generateSignature($fields, $passphrase, true);
        return array_map(static fn ($v) => (string) $v, $fields);
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
        $first = $parts[0] ?? 'Customer';
        // PayFast rejects some placeholder-only names on live accounts
        if ($first === '' || strcasecmp($first, 'Anonymous') === 0) {
            $first = 'Donor';
        }
        return [
            'first' => $first,
            'last' => count($parts) > 1 ? implode(' ', array_slice($parts, 1)) : null,
        ];
    }

    public static function buildPaymentPayload(array $opts): array
    {
        $names = self::splitName($opts['name'] ?? '');
        $notifyUrl = !empty($opts['notifyUrl'])
            ? trim((string) $opts['notifyUrl'])
            : self::getNotifyUrl();

        $returnUrl = self::resolveRedirectUrl(
            isset($opts['returnUrl']) ? (string) $opts['returnUrl'] : null,
            isset($opts['returnPath']) ? (string) $opts['returnPath'] : null,
            'PAYFAST_RETURN_URL',
            '/payment/success'
        );
        $cancelUrl = self::resolveRedirectUrl(
            isset($opts['cancelUrl']) ? (string) $opts['cancelUrl'] : null,
            isset($opts['cancelPath']) ? (string) $opts['cancelPath'] : null,
            'PAYFAST_CANCEL_URL',
            '/payment/cancel'
        );

        $itemName = preg_replace('/[#<>"]+/', '', (string) ($opts['itemName'] ?? 'Payment'));
        $itemName = trim(preg_replace('/\s+/', ' ', $itemName ?? '')) ?: 'Payment';

        $email = trim((string) ($opts['email'] ?? ''));
        if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('A valid email_address is required for PayFast');
        }

        $paymentData = [
            'merchant_id' => self::merchantId(),
            'merchant_key' => self::merchantKey(),
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl,
            'notify_url' => $notifyUrl,
            'name_first' => $names['first'],
            'email_address' => $email,
            'm_payment_id' => (string) ($opts['paymentId'] ?? ('pay-' . time())),
            'amount' => self::formatAmount((float) $opts['amount']),
            'item_name' => substr($itemName, 0, 100),
        ];

        if ($names['last']) {
            $paymentData['name_last'] = $names['last'];
        }

        $cell = trim((string) ($opts['cellNumber'] ?? ''));
        if ($cell !== '') {
            $paymentData['cell_number'] = $cell;
        }

        $itemDescription = trim((string) ($opts['itemDescription'] ?? ''));
        if ($itemDescription !== '') {
            $paymentData['item_description'] = substr($itemDescription, 0, 255);
        }

        foreach ([1, 2, 3, 4, 5] as $i) {
            $key = 'customStr' . $i;
            if (!empty($opts[$key])) {
                $paymentData['custom_str' . $i] = substr((string) $opts[$key], 0, 255);
            }
        }

        foreach (['line1', 'line2', 'city', 'region', 'country', 'code'] as $shipKey) {
            $shipVal = trim((string) ($opts[$shipKey] ?? ''));
            if ($shipVal !== '') {
                $paymentData[$shipKey] = $shipVal;
            }
        }

        $subscription = $opts['subscription'] ?? null;
        if (is_array($subscription) && !empty($subscription)) {
            if (self::passphrase() === '') {
                throw new RuntimeException('PayFast subscriptions require PAYFAST_PASSPHRASE to match your dashboard salt');
            }
            $paymentData['subscription_type'] = (string) ($subscription['type'] ?? 1);
            $billingDate = trim((string) ($subscription['billingDate'] ?? date('Y-m-d')));
            if ($billingDate !== '') {
                $paymentData['billing_date'] = $billingDate;
            }
            $recurring = $subscription['recurringAmount'] ?? $opts['amount'];
            $paymentData['recurring_amount'] = self::formatAmount((float) $recurring);
            $paymentData['frequency'] = (string) ($subscription['frequency'] ?? 3);
            $paymentData['cycles'] = (string) ($subscription['cycles'] ?? 0);
        }

        return self::withSignature($paymentData);
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
            'notify_url' => self::getNotifyUrl(),
            'has_passphrase' => self::passphrase() !== '',
            'min_amount' => 5,
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
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
        ]);
        $data = (string) curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        $plain = trim(preg_replace('/<[^>]+>/', ' ', $data));
        $plain = preg_replace('/\s+/', ' ', $plain);

        return [
            'http_status' => $status,
            'curl_error' => $curlErr !== '' ? $curlErr : null,
            'credentials_valid' => ($status >= 300 && $status < 400),
            'cloudfront_forbidden' => $status === 403 || (bool) preg_match('/cloudfront|403\s*forbidden/i', $plain),
            'payfast_message' => substr($plain, 0, 280) ?: null,
            'invalid_merchant_id' => (bool) preg_match('/invalid merchant id/i', $plain),
            'merchant_key_required' => (bool) preg_match('/merchant key.*required/i', $plain),
            'signature_mismatch' => (bool) preg_match('/signature/i', $plain),
        ];
    }
}
