<?php

class HeroController
{
    private static array $textPositions = [
        'center',
        'left',
        'right',
        'top',
        'bottom',
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
    ];

    private static function normalizeTextPosition(mixed $value): string
    {
        $pos = strtolower(trim((string) $value));
        return in_array($pos, self::$textPositions, true) ? $pos : 'center';
    }

    /** Allow empty (use theme default) or #RGB / #RRGGBB */
    private static function normalizeColor(mixed $value, string $fallback = ''): string
    {
        $color = trim((string) $value);
        if ($color === '') {
            return $fallback;
        }
        if (preg_match('/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $color)) {
            return strtoupper($color);
        }
        return $fallback;
    }

    private static function colorDefaults(): array
    {
        return [
            'label_color' => '#FDE68A',
            'title_color' => '#FFFFFF',
            'title_highlight_color' => '',
            'subtitle_color' => '#F5F5F5',
            'body_color' => '#E5E5E5',
        ];
    }

    private static function defaults(): array
    {
        return [
            'label' => 'Village Netacad powered by Digititan',
            'title' => 'Real Skills.',
            'title_highlight' => 'Right Where Learning Happens.',
            'subtitle' => 'Village NetAcad brings world-class ICT training to rural South Africa, making it possible to build a future without leaving home.',
            'body' => 'Village NetAcad provides free, certified digital skills training for young people aged 18 to 34 in villages and townships. Through Cisco Networking Academy, learners gain practical skills in networking, cybersecurity and coding, plus a globally recognised certificate that employers trust.',
            'slides' => [
                ['image_url' => '/IM1.png', 'alt_text' => 'Village NetAcad — slide 1', 'sort_order' => 1, 'title' => 'Real Skills.', 'title_highlight' => 'Right Where Learning Happens.'],
                ['image_url' => '/IM2.png', 'alt_text' => 'Village NetAcad — slide 2', 'sort_order' => 2, 'title' => 'Learn Where You Live.', 'title_highlight' => 'No Need to Leave Home.'],
                ['image_url' => '/IM3.png', 'alt_text' => 'Village NetAcad — slide 3', 'sort_order' => 3, 'title' => 'Cisco Pathways.', 'title_highlight' => 'Globally Recognised.'],
                ['image_url' => '/IM4.png', 'alt_text' => 'Village NetAcad — slide 4', 'sort_order' => 4, 'title' => 'Build Your Future.', 'title_highlight' => 'One Skill at a Time.'],
                ['image_url' => '/IM5.png', 'alt_text' => 'Village NetAcad — slide 5', 'sort_order' => 5, 'title' => 'Community First.', 'title_highlight' => 'Training That Reaches You.'],
                ['image_url' => '/IM6.png', 'alt_text' => 'Village NetAcad — slide 6', 'sort_order' => 6, 'title' => 'Job-Ready Skills.', 'title_highlight' => 'For Today\'s Digital Economy.'],
                ['image_url' => '/IM7.png', 'alt_text' => 'Village NetAcad — slide 7', 'sort_order' => 7, 'title' => 'Join Village NetAcad.', 'title_highlight' => 'Start Your Journey.'],
            ],
            'buttons' => [
                ['label' => 'Explore Courses', 'url' => '/courses', 'style' => 'primary', 'sort_order' => 1, 'open_in_new_tab' => 0],
                ['label' => 'Join Now', 'url' => '/login', 'style' => 'outline-primary', 'sort_order' => 2, 'open_in_new_tab' => 0],
                ['label' => 'Contact Us', 'url' => '/contact', 'style' => 'outline-accent', 'sort_order' => 3, 'open_in_new_tab' => 0],
            ],
        ];
    }

    private static function ensureSeeded(): void
    {
        try {
            $slideCount = Database::queryGet('SELECT COUNT(*) AS total FROM hero_slides');
        } catch (Throwable $e) {
            return;
        }

        $d = self::defaults();
        if ((int) ($slideCount['total'] ?? 0) === 0) {
            foreach ($d['slides'] as $slide) {
                Database::queryRun(
                    'INSERT INTO hero_slides (image_url, alt_text, label, title, title_highlight, subtitle, body, sort_order, is_active)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)',
                    [
                        $slide['image_url'],
                        $slide['alt_text'],
                        $d['label'],
                        $slide['title'],
                        $slide['title_highlight'],
                        $d['subtitle'],
                        $d['body'],
                        $slide['sort_order'],
                    ]
                );
            }
        }

        try {
            $buttonCount = Database::queryGet('SELECT COUNT(*) AS total FROM hero_buttons');
            if ((int) ($buttonCount['total'] ?? 0) === 0) {
                $first = Database::queryGet('SELECT id FROM hero_slides ORDER BY sort_order ASC, id ASC LIMIT 1');
                $slideId = $first['id'] ?? null;
                foreach ($d['buttons'] as $btn) {
                    Database::queryRun(
                        'INSERT INTO hero_buttons (slide_id, label, url, style, sort_order, is_active, open_in_new_tab) VALUES (?, ?, ?, ?, ?, 1, ?)',
                        [$slideId, $btn['label'], $btn['url'], $btn['style'], $btn['sort_order'], $btn['open_in_new_tab']]
                    );
                }
            }
        } catch (Throwable $e) {
            // ignore
        }
    }

    private static function mapButton(array $b): array
    {
        return [
            'id' => (int) $b['id'],
            'slide_id' => isset($b['slide_id']) ? (int) $b['slide_id'] : null,
            'label' => $b['label'] ?? '',
            'url' => $b['url'] ?? '',
            'style' => $b['style'] ?? 'primary',
            'sort_order' => (int) ($b['sort_order'] ?? 0),
            'is_active' => (int) ($b['is_active'] ?? 1),
            'open_in_new_tab' => (int) ($b['open_in_new_tab'] ?? 0),
        ];
    }

    private static function loadPayload(bool $activeOnly): array
    {
        self::ensureSeeded();
        SchemaEnsure::heroSlides();

        $colorCols = 'label_color, title_color, title_highlight_color, subtitle_color, body_color';
        try {
            $sql = "SELECT id, image_url, alt_text, label, title, title_highlight, subtitle, body, text_position, {$colorCols}, sort_order, is_active FROM hero_slides";
            if ($activeOnly) {
                $sql .= ' WHERE is_active = 1';
            }
            $sql .= ' ORDER BY sort_order ASC, id ASC';
            $slides = Database::queryAll($sql);
        } catch (Throwable $e) {
            try {
                $sql = 'SELECT id, image_url, alt_text, label, title, title_highlight, subtitle, body, text_position, sort_order, is_active FROM hero_slides';
                if ($activeOnly) {
                    $sql .= ' WHERE is_active = 1';
                }
                $sql .= ' ORDER BY sort_order ASC, id ASC';
                $slides = Database::queryAll($sql);
            } catch (Throwable $e2) {
                $sql = 'SELECT id, image_url, alt_text, label, title, title_highlight, subtitle, body, sort_order, is_active FROM hero_slides';
                if ($activeOnly) {
                    $sql .= ' WHERE is_active = 1';
                }
                $sql .= ' ORDER BY sort_order ASC, id ASC';
                $slides = Database::queryAll($sql);
            }
        }

        $buttonsBySlide = [];
        try {
            $btnSql = 'SELECT id, slide_id, label, url, style, sort_order, is_active, open_in_new_tab FROM hero_buttons';
            if ($activeOnly) {
                $btnSql .= ' WHERE is_active = 1';
            }
            $btnSql .= ' ORDER BY sort_order ASC, id ASC';
            foreach (Database::queryAll($btnSql) as $b) {
                $sid = (int) ($b['slide_id'] ?? 0);
                if (!isset($buttonsBySlide[$sid])) {
                    $buttonsBySlide[$sid] = [];
                }
                $buttonsBySlide[$sid][] = self::mapButton($b);
            }
        } catch (Throwable $e) {
            $buttonsBySlide = [];
        }

        $defaults = self::colorDefaults();
        $mappedSlides = array_map(static function (array $s) use ($buttonsBySlide, $defaults): array {
            $id = (int) $s['id'];
            return [
                'id' => $id,
                'image' => $s['image_url'],
                'image_url' => $s['image_url'],
                'alt' => $s['alt_text'] ?? '',
                'alt_text' => $s['alt_text'] ?? '',
                'label' => $s['label'] ?? '',
                'title' => $s['title'] ?? '',
                'title_highlight' => $s['title_highlight'] ?? '',
                'subtitle' => $s['subtitle'] ?? '',
                'body' => $s['body'] ?? '',
                'text_position' => self::normalizeTextPosition($s['text_position'] ?? 'center'),
                'label_color' => self::normalizeColor($s['label_color'] ?? null, $defaults['label_color']),
                'title_color' => self::normalizeColor($s['title_color'] ?? null, $defaults['title_color']),
                'title_highlight_color' => self::normalizeColor($s['title_highlight_color'] ?? null, $defaults['title_highlight_color']),
                'subtitle_color' => self::normalizeColor($s['subtitle_color'] ?? null, $defaults['subtitle_color']),
                'body_color' => self::normalizeColor($s['body_color'] ?? null, $defaults['body_color']),
                'sort_order' => (int) ($s['sort_order'] ?? 0),
                'is_active' => (int) ($s['is_active'] ?? 1),
                'buttons' => $buttonsBySlide[$id] ?? [],
            ];
        }, $slides);

        return ['slides' => $mappedSlides];
    }

    public static function show(): void
    {
        Response::json(self::loadPayload(true));
    }

    public static function adminShow(): void
    {
        Auth::authorizeAdmin();
        Response::json(self::loadPayload(false));
    }

    /** @deprecated Global hero content — kept for older admin clients; no longer used by homepage */
    public static function updateContent(): void
    {
        Auth::authorizeAdmin();
        Response::json(['message' => 'Use per-slide messages instead', 'hero' => self::loadPayload(false)]);
    }

    public static function createSlide(): void
    {
        Auth::authorizeAdmin();
        self::ensureSeeded();

        $alt = trim((string) ($_POST['alt_text'] ?? $_POST['alt'] ?? ''));
        $label = trim((string) ($_POST['label'] ?? ''));
        $title = trim((string) ($_POST['title'] ?? ''));
        $titleHighlight = trim((string) ($_POST['title_highlight'] ?? ''));
        $subtitle = trim((string) ($_POST['subtitle'] ?? ''));
        $bodyText = trim((string) ($_POST['body'] ?? ''));
        $textPosition = self::normalizeTextPosition($_POST['text_position'] ?? 'center');
        $defaults = self::colorDefaults();
        $labelColor = self::normalizeColor($_POST['label_color'] ?? null, $defaults['label_color']);
        $titleColor = self::normalizeColor($_POST['title_color'] ?? null, $defaults['title_color']);
        $titleHighlightColor = self::normalizeColor($_POST['title_highlight_color'] ?? null, $defaults['title_highlight_color']);
        $subtitleColor = self::normalizeColor($_POST['subtitle_color'] ?? null, $defaults['subtitle_color']);
        $bodyColor = self::normalizeColor($_POST['body_color'] ?? null, $defaults['body_color']);
        $sortOrder = (int) ($_POST['sort_order'] ?? 0);
        $isActive = isset($_POST['is_active']) ? (int) $_POST['is_active'] : 1;

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        if (!$imageUrl) {
            $imageUrl = trim((string) ($_POST['image_url'] ?? ''));
        }
        if ($imageUrl === '') {
            Response::error('Slide image is required', 400);
        }

        if ($sortOrder <= 0) {
            $max = Database::queryGet('SELECT COALESCE(MAX(sort_order), 0) AS m FROM hero_slides');
            $sortOrder = (int) ($max['m'] ?? 0) + 1;
        }

        SchemaEnsure::heroSlides();

        try {
            $result = Database::queryRun(
                'INSERT INTO hero_slides (image_url, alt_text, label, title, title_highlight, subtitle, body, text_position, label_color, title_color, title_highlight_color, subtitle_color, body_color, sort_order, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$imageUrl, $alt, $label, $title, $titleHighlight, $subtitle, $bodyText, $textPosition, $labelColor, $titleColor, $titleHighlightColor, $subtitleColor, $bodyColor, $sortOrder, $isActive ? 1 : 0]
            );
        } catch (Throwable $e) {
            $result = Database::queryRun(
                'INSERT INTO hero_slides (image_url, alt_text, label, title, title_highlight, subtitle, body, text_position, sort_order, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [$imageUrl, $alt, $label, $title, $titleHighlight, $subtitle, $bodyText, $textPosition, $sortOrder, $isActive ? 1 : 0]
            );
        }

        Response::json([
            'message' => 'Slide added',
            'id' => $result['lastInsertRowid'] ?? null,
            'hero' => self::loadPayload(false),
        ], 201);
    }

    public static function updateSlide(array $params): void
    {
        Auth::authorizeAdmin();
        $id = (int) ($params['id'] ?? 0);
        $slide = Database::queryGet('SELECT * FROM hero_slides WHERE id = ?', [$id]);
        if (!$slide) {
            Response::error('Slide not found', 404);
        }

        $body = array_merge($_POST, Request::jsonBody());
        $defaults = self::colorDefaults();
        $alt = array_key_exists('alt_text', $body) || array_key_exists('alt', $body)
            ? trim((string) ($body['alt_text'] ?? $body['alt'] ?? ''))
            : ($slide['alt_text'] ?? '');
        $label = array_key_exists('label', $body) ? trim((string) $body['label']) : ($slide['label'] ?? '');
        $title = array_key_exists('title', $body) ? trim((string) $body['title']) : ($slide['title'] ?? '');
        $titleHighlight = array_key_exists('title_highlight', $body)
            ? trim((string) $body['title_highlight'])
            : ($slide['title_highlight'] ?? '');
        $subtitle = array_key_exists('subtitle', $body) ? trim((string) $body['subtitle']) : ($slide['subtitle'] ?? '');
        $bodyText = array_key_exists('body', $body) ? trim((string) $body['body']) : ($slide['body'] ?? '');
        $textPosition = array_key_exists('text_position', $body)
            ? self::normalizeTextPosition($body['text_position'])
            : self::normalizeTextPosition($slide['text_position'] ?? 'center');
        $labelColor = array_key_exists('label_color', $body)
            ? self::normalizeColor($body['label_color'], $defaults['label_color'])
            : self::normalizeColor($slide['label_color'] ?? null, $defaults['label_color']);
        $titleColor = array_key_exists('title_color', $body)
            ? self::normalizeColor($body['title_color'], $defaults['title_color'])
            : self::normalizeColor($slide['title_color'] ?? null, $defaults['title_color']);
        $titleHighlightColor = array_key_exists('title_highlight_color', $body)
            ? self::normalizeColor($body['title_highlight_color'], $defaults['title_highlight_color'])
            : self::normalizeColor($slide['title_highlight_color'] ?? null, $defaults['title_highlight_color']);
        $subtitleColor = array_key_exists('subtitle_color', $body)
            ? self::normalizeColor($body['subtitle_color'], $defaults['subtitle_color'])
            : self::normalizeColor($slide['subtitle_color'] ?? null, $defaults['subtitle_color']);
        $bodyColor = array_key_exists('body_color', $body)
            ? self::normalizeColor($body['body_color'], $defaults['body_color'])
            : self::normalizeColor($slide['body_color'] ?? null, $defaults['body_color']);
        $sortOrder = array_key_exists('sort_order', $body)
            ? (int) $body['sort_order']
            : (int) $slide['sort_order'];
        $isActive = array_key_exists('is_active', $body)
            ? (int) $body['is_active']
            : (int) $slide['is_active'];

        $imageUrl = Request::handleUpload($_FILES['image'] ?? null);
        $uploadedNew = (bool) $imageUrl;
        if (!$imageUrl && !empty($body['image_url'])) {
            $imageUrl = trim((string) $body['image_url']);
        }
        if (!$imageUrl) {
            $imageUrl = $slide['image_url'];
        }

        SchemaEnsure::heroSlides();

        try {
            Database::queryRun(
                'UPDATE hero_slides SET image_url = ?, alt_text = ?, label = ?, title = ?, title_highlight = ?, subtitle = ?, body = ?, text_position = ?, label_color = ?, title_color = ?, title_highlight_color = ?, subtitle_color = ?, body_color = ?, sort_order = ?, is_active = ? WHERE id = ?',
                [$imageUrl, $alt, $label, $title, $titleHighlight, $subtitle, $bodyText, $textPosition, $labelColor, $titleColor, $titleHighlightColor, $subtitleColor, $bodyColor, $sortOrder, $isActive ? 1 : 0, $id]
            );
        } catch (Throwable $e) {
            Database::queryRun(
                'UPDATE hero_slides SET image_url = ?, alt_text = ?, label = ?, title = ?, title_highlight = ?, subtitle = ?, body = ?, text_position = ?, sort_order = ?, is_active = ? WHERE id = ?',
                [$imageUrl, $alt, $label, $title, $titleHighlight, $subtitle, $bodyText, $textPosition, $sortOrder, $isActive ? 1 : 0, $id]
            );
        }

        if ($uploadedNew && !empty($slide['image_url']) && $slide['image_url'] !== $imageUrl) {
            self::deleteUploadFile($slide['image_url']);
        }

        Response::json(['message' => 'Slide updated', 'hero' => self::loadPayload(false)]);
    }

    public static function deleteSlide(array $params): void
    {
        Auth::authorizeAdmin();
        $id = (int) ($params['id'] ?? 0);
        $slide = Database::queryGet('SELECT id, image_url FROM hero_slides WHERE id = ?', [$id]);
        if (!$slide) {
            Response::error('Slide not found', 404);
        }
        try {
            Database::queryRun('DELETE FROM hero_buttons WHERE slide_id = ?', [$id]);
        } catch (Throwable $e) {
            // ignore
        }
        Database::queryRun('DELETE FROM hero_slides WHERE id = ?', [$id]);
        if (!empty($slide['image_url'])) {
            self::deleteUploadFile($slide['image_url']);
        }
        Response::json(['message' => 'Slide deleted', 'hero' => self::loadPayload(false)]);
    }

    private static function deleteUploadFile(string $url): void
    {
        if (!str_starts_with($url, '/uploads/')) {
            return;
        }
        $filename = basename($url);
        if ($filename === '' || $filename === '.' || $filename === '..') {
            return;
        }
        $path = Paths::getUploadsDir() . DIRECTORY_SEPARATOR . $filename;
        if (is_file($path)) {
            @unlink($path);
        }
    }

    public static function createButton(): void
    {
        Auth::authorizeAdmin();
        self::ensureSeeded();
        $body = Request::jsonBody();

        $slideId = (int) ($body['slide_id'] ?? 0);
        $label = trim((string) ($body['label'] ?? ''));
        $url = trim((string) ($body['url'] ?? ''));
        $style = trim((string) ($body['style'] ?? 'primary'));
        $sortOrder = (int) ($body['sort_order'] ?? 0);
        $isActive = isset($body['is_active']) ? (int) $body['is_active'] : 1;
        $openInNewTab = !empty($body['open_in_new_tab']) ? 1 : 0;

        if ($slideId <= 0) {
            Response::error('slide_id is required', 400);
        }
        $slide = Database::queryGet('SELECT id FROM hero_slides WHERE id = ?', [$slideId]);
        if (!$slide) {
            Response::error('Slide not found', 404);
        }
        if ($label === '' || $url === '') {
            Response::error('Button label and URL are required', 400);
        }

        $allowedStyles = ['primary', 'outline-primary', 'outline-accent'];
        if (!in_array($style, $allowedStyles, true)) {
            $style = 'primary';
        }

        if ($sortOrder <= 0) {
            $max = Database::queryGet(
                'SELECT COALESCE(MAX(sort_order), 0) AS m FROM hero_buttons WHERE slide_id = ?',
                [$slideId]
            );
            $sortOrder = (int) ($max['m'] ?? 0) + 1;
        }

        $result = Database::queryRun(
            'INSERT INTO hero_buttons (slide_id, label, url, style, sort_order, is_active, open_in_new_tab) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [$slideId, $label, $url, $style, $sortOrder, $isActive ? 1 : 0, $openInNewTab]
        );

        Response::json([
            'message' => 'Button added',
            'id' => $result['lastInsertRowid'] ?? null,
            'hero' => self::loadPayload(false),
        ], 201);
    }

    public static function updateButton(array $params): void
    {
        Auth::authorizeAdmin();
        $id = (int) ($params['id'] ?? 0);
        $btn = Database::queryGet('SELECT * FROM hero_buttons WHERE id = ?', [$id]);
        if (!$btn) {
            Response::error('Button not found', 404);
        }

        $body = Request::jsonBody();
        $slideId = array_key_exists('slide_id', $body) ? (int) $body['slide_id'] : (int) ($btn['slide_id'] ?? 0);
        $label = array_key_exists('label', $body) ? trim((string) $body['label']) : $btn['label'];
        $url = array_key_exists('url', $body) ? trim((string) $body['url']) : $btn['url'];
        $style = array_key_exists('style', $body) ? trim((string) $body['style']) : $btn['style'];
        $sortOrder = array_key_exists('sort_order', $body) ? (int) $body['sort_order'] : (int) $btn['sort_order'];
        $isActive = array_key_exists('is_active', $body) ? (int) $body['is_active'] : (int) $btn['is_active'];
        $openInNewTab = array_key_exists('open_in_new_tab', $body)
            ? (!empty($body['open_in_new_tab']) ? 1 : 0)
            : (int) $btn['open_in_new_tab'];

        if ($label === '' || $url === '') {
            Response::error('Button label and URL are required', 400);
        }

        $allowedStyles = ['primary', 'outline-primary', 'outline-accent'];
        if (!in_array($style, $allowedStyles, true)) {
            $style = 'primary';
        }

        Database::queryRun(
            'UPDATE hero_buttons SET slide_id = ?, label = ?, url = ?, style = ?, sort_order = ?, is_active = ?, open_in_new_tab = ? WHERE id = ?',
            [$slideId ?: null, $label, $url, $style, $sortOrder, $isActive ? 1 : 0, $openInNewTab, $id]
        );

        Response::json(['message' => 'Button updated', 'hero' => self::loadPayload(false)]);
    }

    public static function deleteButton(array $params): void
    {
        Auth::authorizeAdmin();
        $id = (int) ($params['id'] ?? 0);
        $btn = Database::queryGet('SELECT id FROM hero_buttons WHERE id = ?', [$id]);
        if (!$btn) {
            Response::error('Button not found', 404);
        }
        Database::queryRun('DELETE FROM hero_buttons WHERE id = ?', [$id]);
        Response::json(['message' => 'Button deleted', 'hero' => self::loadPayload(false)]);
    }
}
