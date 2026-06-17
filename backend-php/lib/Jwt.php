<?php

class Jwt
{
    public static function sign(int $userId): string
    {
        $secret = Env::get('JWT_SECRET', 'dev-secret-change-in-production');
        $expires = Env::get('JWT_EXPIRES_IN', '7d');
        $exp = time() + self::parseExpiry($expires);
        $payload = ['id' => $userId, 'exp' => $exp, 'iat' => time()];
        return self::encode($payload, $secret);
    }

    public static function verify(string $token): ?array
    {
        $secret = Env::get('JWT_SECRET', 'dev-secret-change-in-production');
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }
        [$headerB64, $payloadB64, $sigB64] = $parts;
        $expected = self::base64UrlEncode(hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true));
        if (!hash_equals($expected, $sigB64)) {
            return null;
        }
        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!is_array($payload) || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }
        return $payload;
    }

    private static function encode(array $payload, string $secret): string
    {
        $header = self::base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        $body = self::base64UrlEncode(json_encode($payload));
        $sig = self::base64UrlEncode(hash_hmac('sha256', "$header.$body", $secret, true));
        return "$header.$body.$sig";
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $pad = 4 - (strlen($data) % 4);
        if ($pad < 4) {
            $data .= str_repeat('=', $pad);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }

    private static function parseExpiry(string $expires): int
    {
        if (preg_match('/^(\d+)([dhms])$/', $expires, $m)) {
            $n = (int) $m[1];
            return match ($m[2]) {
                'd' => $n * 86400,
                'h' => $n * 3600,
                'm' => $n * 60,
                's' => $n,
                default => 7 * 86400,
            };
        }
        return 7 * 86400;
    }
}
