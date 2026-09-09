<?php

class AscController
{
    private static array $provinces = [
        'Eastern Cape',
        'Free State',
        'Gauteng',
        'KwaZulu-Natal',
        'Limpopo',
        'Mpumalanga',
        'Northern Cape',
        'North West',
        'Western Cape',
    ];

    private static function centresPath(): string
    {
        return Paths::backendRoot() . '/data/asc_centres.json';
    }

    /** @return array<int, array<string, mixed>> */
    private static function loadCentres(): array
    {
        $path = self::centresPath();
        if (!is_file($path)) {
            return [];
        }
        $data = json_decode((string) file_get_contents($path), true);
        if (!is_array($data)) {
            return [];
        }

        return array_map(static function ($c): array {
            if (!is_array($c)) {
                return [];
            }
            return [
                'id' => (int) ($c['id'] ?? 0),
                'name' => (string) ($c['name'] ?? ''),
                'province' => (string) ($c['province'] ?? ''),
                'city' => (string) ($c['city'] ?? ''),
                'address' => (string) ($c['address'] ?? ''),
                'contact' => (string) ($c['contact'] ?? ''),
                'people_trained' => (int) ($c['people_trained'] ?? 0),
                'sales_made' => (int) ($c['sales_made'] ?? 0),
            ];
        }, $data);
    }

    /** @param array<int, array<string, mixed>> $centres */
    private static function saveCentres(array $centres): void
    {
        $path = self::centresPath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $payload = array_values(array_map(static function (array $c): array {
            return [
                'id' => (int) $c['id'],
                'name' => (string) $c['name'],
                'province' => (string) $c['province'],
                'city' => (string) ($c['city'] ?? ''),
                'address' => (string) ($c['address'] ?? ''),
                'contact' => (string) ($c['contact'] ?? ''),
                'people_trained' => max(0, (int) ($c['people_trained'] ?? 0)),
                'sales_made' => max(0, (int) ($c['sales_made'] ?? 0)),
            ];
        }, $centres));

        $json = json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        if ($json === false) {
            Response::error('Failed to encode centres data', 500);
        }
        if (file_put_contents($path, $json . PHP_EOL, LOCK_EX) === false) {
            Response::error('Failed to save centres data', 500);
        }
    }

    private static function normalizeCentreInput(array $body, ?array $existing = null): array
    {
        $name = trim((string) ($body['name'] ?? ($existing['name'] ?? '')));
        $province = trim((string) ($body['province'] ?? ($existing['province'] ?? '')));
        $city = trim((string) ($body['city'] ?? ($existing['city'] ?? '')));
        $address = trim((string) ($body['address'] ?? ($existing['address'] ?? '')));
        $contact = trim((string) ($body['contact'] ?? ($existing['contact'] ?? '')));
        $peopleTrained = array_key_exists('people_trained', $body)
            ? (int) $body['people_trained']
            : (int) ($existing['people_trained'] ?? 0);
        $salesMade = array_key_exists('sales_made', $body)
            ? (int) $body['sales_made']
            : (int) ($existing['sales_made'] ?? 0);

        if ($name === '') {
            Response::error('Academy name is required', 400);
        }
        if (!in_array($province, self::$provinces, true)) {
            Response::error('Invalid province', 400);
        }
        if ($peopleTrained < 0) {
            Response::error('People trained cannot be negative', 400);
        }
        if ($salesMade < 0) {
            Response::error('Sales made cannot be negative', 400);
        }

        return [
            'name' => $name,
            'province' => $province,
            'city' => $city,
            'address' => $address,
            'contact' => $contact,
            'people_trained' => $peopleTrained,
            'sales_made' => $salesMade,
        ];
    }

    public static function findById(int $id): ?array
    {
        if ($id <= 0) {
            return null;
        }
        foreach (self::loadCentres() as $centre) {
            if ((int) ($centre['id'] ?? 0) === $id) {
                return $centre;
            }
        }
        return null;
    }

    public static function index(): void
    {
        $province = trim((string) Request::query('province', ''));
        $centres = self::loadCentres();

        if ($province !== '') {
            $centres = array_values(array_filter(
                $centres,
                static fn (array $c): bool => strcasecmp((string) ($c['province'] ?? ''), $province) === 0
            ));
        }

        Response::json(['centres' => $centres]);
    }

    public static function adminIndex(): void
    {
        Auth::authorizeAdmin();
        Response::json(['centres' => self::loadCentres(), 'provinces' => self::$provinces]);
    }

    public static function create(): void
    {
        Auth::authorizeAdmin();
        $input = self::normalizeCentreInput(Request::jsonBody());
        $centres = self::loadCentres();
        $maxId = 0;
        foreach ($centres as $c) {
            $maxId = max($maxId, (int) ($c['id'] ?? 0));
        }
        $input['id'] = $maxId + 1;
        $centres[] = $input;
        self::saveCentres($centres);
        Response::json(['message' => 'Academy added', 'centre' => $input, 'centres' => $centres], 201);
    }

    public static function update(array $params): void
    {
        Auth::authorizeAdmin();
        $id = (int) ($params['id'] ?? 0);
        $centres = self::loadCentres();
        $index = null;
        foreach ($centres as $i => $c) {
            if ((int) $c['id'] === $id) {
                $index = $i;
                break;
            }
        }
        if ($index === null) {
            Response::error('Academy not found', 404);
        }

        $updated = self::normalizeCentreInput(Request::jsonBody(), $centres[$index]);
        $updated['id'] = $id;
        $centres[$index] = $updated;
        self::saveCentres($centres);
        Response::json(['message' => 'Academy updated', 'centre' => $updated, 'centres' => $centres]);
    }

    public static function destroy(array $params): void
    {
        Auth::authorizeAdmin();
        $id = (int) ($params['id'] ?? 0);
        $centres = self::loadCentres();
        $filtered = array_values(array_filter(
            $centres,
            static fn (array $c): bool => (int) $c['id'] !== $id
        ));
        if (count($filtered) === count($centres)) {
            Response::error('Academy not found', 404);
        }
        self::saveCentres($filtered);
        Response::json(['message' => 'Academy deleted', 'centres' => $filtered]);
    }
}
