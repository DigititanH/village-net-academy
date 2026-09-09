<?php
require_once dirname(__DIR__) . '/bootstrap.php';

$pdo = Database::connection();

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) AS c FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?'
    );
    $stmt->execute([$table, $column]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    return (int) ($row['c'] ?? 0) > 0;
}

$slideCols = [
    'label' => "VARCHAR(255) NOT NULL DEFAULT ''",
    'title' => "VARCHAR(255) NOT NULL DEFAULT ''",
    'title_highlight' => "VARCHAR(255) NOT NULL DEFAULT ''",
    'subtitle' => 'TEXT NULL',
    'body' => 'TEXT NULL',
];

foreach ($slideCols as $col => $def) {
    if (!columnExists($pdo, 'hero_slides', $col)) {
        $pdo->exec("ALTER TABLE hero_slides ADD COLUMN `$col` $def");
        echo "Added hero_slides.$col\n";
    }
}

if (!columnExists($pdo, 'hero_buttons', 'slide_id')) {
    $pdo->exec('ALTER TABLE hero_buttons ADD COLUMN slide_id INT NULL AFTER id');
    echo "Added hero_buttons.slide_id\n";
}

$defaults = [
    'label' => 'Village Netacad powered by Digititan',
    'title' => 'Real Skills.',
    'title_highlight' => 'Right Where Learning Happens.',
    'subtitle' => 'Village NetAcad brings world-class ICT training to rural South Africa, making it possible to build a future without leaving home.',
    'body' => 'Village NetAcad provides free, certified digital skills training for young people aged 18 to 34 in villages and townships. Through Cisco Networking Academy, learners gain practical skills in networking, cybersecurity and coding, plus a globally recognised certificate that employers trust.',
];

$content = Database::queryGet('SELECT * FROM hero_content ORDER BY id ASC LIMIT 1');
$source = $content ?: $defaults;

$slides = Database::queryAll('SELECT id, title FROM hero_slides ORDER BY sort_order ASC, id ASC');
foreach ($slides as $i => $slide) {
    if (trim((string) ($slide['title'] ?? '')) !== '') {
        continue;
    }
    // First slide gets full default copy; later slides get numbered variants so each has distinct info
    $n = $i + 1;
    $title = $i === 0 ? $source['title'] : "Village NetAcad — Slide $n";
    $highlight = $i === 0 ? ($source['title_highlight'] ?? '') : 'Learn. Grow. Lead.';
    $subtitle = $i === 0
        ? ($source['subtitle'] ?? '')
        : 'Discover digital skills opportunities with Village NetAcad across South Africa.';
    $body = $i === 0
        ? ($source['body'] ?? '')
        : 'Explore free, certified training pathways designed for youth in villages and townships.';
    Database::queryRun(
        'UPDATE hero_slides SET label = ?, title = ?, title_highlight = ?, subtitle = ?, body = ? WHERE id = ?',
        [
            $source['label'] ?? $defaults['label'],
            $title,
            $highlight,
            $subtitle,
            $body,
            $slide['id'],
        ]
    );
    echo "Backfilled content for slide {$slide['id']}\n";
}

$firstSlide = Database::queryGet('SELECT id FROM hero_slides ORDER BY sort_order ASC, id ASC LIMIT 1');
if ($firstSlide) {
    Database::queryRun(
        'UPDATE hero_buttons SET slide_id = ? WHERE slide_id IS NULL',
        [$firstSlide['id']]
    );
}

echo "Per-slide hero schema ready\n";
