<?php

class SearchController
{
    private const PAGES = [
        ['title' => 'Home', 'description' => 'Village Netacad - AI Future Hub. Empowering Smart Villages through digital education.', 'path' => '/'],
        ['title' => 'About Us', 'description' => 'Learn about our mission, team, partners and community impact.', 'path' => '/about'],
        ['title' => 'Courses', 'description' => 'Explore digital skills training and academy registration.', 'path' => '/courses'],
        ['title' => 'Career', 'description' => 'Join Village NetAcad. View opportunities and apply to our team.', 'path' => '/career'],
        ['title' => 'Shop', 'description' => 'Browse our futuristic store with AI-inspired fashion and merchandise.', 'path' => '/shop'],
        ['title' => 'Donation', 'description' => 'Support the development of AI-powered innovation hubs across Africa.', 'path' => '/donation'],
        ['title' => 'Contact Us', 'description' => 'Get in touch with Village Netacad. Email, phone, location.', 'path' => '/contact'],
        ['title' => 'Register', 'description' => 'Create a new customer or reseller account.', 'path' => '/register'],
        ['title' => 'Cart', 'description' => 'View and manage items in your shopping cart.', 'path' => '/cart'],
        ['title' => 'My Orders', 'description' => 'Track your order history and status.', 'path' => '/my-orders'],
        ['title' => 'Wishlist', 'description' => 'View your saved products.', 'path' => '/wishlist'],
    ];

    public static function search(): void
    {
        $q = trim((string) Request::query('q', ''));
        if (strlen($q) < 2) {
            Response::json(['products' => [], 'pages' => [], 'categories' => []]);
        }

        $term = '%' . $q . '%';
        $products = Database::queryAll(
            "SELECT p.id, p.name, p.slug, p.price, p.image, p.description, c.name as category_name,
                (SELECT ROUND(AVG(rating),1) FROM reviews WHERE product_id = p.id) as avg_rating
             FROM products p LEFT JOIN categories c ON p.category_id = c.id
             WHERE p.is_active = 1 AND (p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)
             ORDER BY p.name ASC LIMIT 8",
            [$term, $term, $term]
        );

        $categories = Database::queryAll(
            'SELECT id, name, slug FROM categories WHERE name LIKE ? ORDER BY name LIMIT 5',
            [$term]
        );

        $lowerQ = strtolower($q);
        $pages = array_values(array_filter(self::PAGES, function ($p) use ($lowerQ) {
            return str_contains(strtolower($p['title']), $lowerQ)
                || str_contains(strtolower($p['description']), $lowerQ);
        }));

        Response::json(['products' => $products, 'pages' => $pages, 'categories' => $categories]);
    }
}
