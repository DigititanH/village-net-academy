<?php

class Response
{
    public static function json(mixed $data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(string $message, int $status = 400): void
    {
        self::json(['message' => $message], $status);
    }

    public static function send(string $body, int $status = 200, array $headers = []): void
    {
        http_response_code($status);
        foreach ($headers as $name => $value) {
            header("$name: $value");
        }
        echo $body;
        exit;
    }

    public static function csv(string $filename, string $csv): void
    {
        self::send($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename=' . $filename,
        ]);
    }

    public static function textReport(string $filename, string $content): void
    {
        self::send($content, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
            'Content-Disposition' => 'attachment; filename=' . $filename,
        ]);
    }
}
