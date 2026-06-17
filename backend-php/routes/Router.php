<?php

class Router
{
    /** @var array<int, array{method: string, pattern: string, handler: callable}> */
    private static array $routes = [];

    public static function get(string $pattern, callable|array $handler): void
    {
        self::add('GET', $pattern, $handler);
    }

    public static function post(string $pattern, callable|array $handler): void
    {
        self::add('POST', $pattern, $handler);
    }

    public static function put(string $pattern, callable|array $handler): void
    {
        self::add('PUT', $pattern, $handler);
    }

    public static function delete(string $pattern, callable|array $handler): void
    {
        self::add('DELETE', $pattern, $handler);
    }

    private static function add(string $method, string $pattern, callable|array $handler): void
    {
        if (!is_callable($handler)) {
            throw new InvalidArgumentException("Route handler for {$method} {$pattern} is not callable");
        }
        self::$routes[] = ['method' => $method, 'pattern' => $pattern, 'handler' => $handler];
    }

    public static function registerRoutes(): void
    {
        self::get('/health', fn () => Response::json(Hosting::healthPayload()));

        // Auth
        self::post('/api/auth/register', [AuthController::class, 'register']);
        self::post('/api/auth/login', [AuthController::class, 'login']);
        self::get('/api/auth/verify-email', [AuthController::class, 'verifyEmail']);
        self::post('/api/auth/forgot-password', [AuthController::class, 'forgotPassword']);
        self::post('/api/auth/reset-password', [AuthController::class, 'resetPassword']);
        self::get('/api/auth/me', [AuthController::class, 'me']);
        self::post('/api/auth/logout', [AuthController::class, 'logout']);

        // Products
        self::get('/api/products/meta/categories', [ProductsController::class, 'categories']);
        self::get('/api/products', [ProductsController::class, 'index']);
        self::get('/api/products/{slug}', fn ($p) => ProductsController::show($p));
        self::post('/api/products', [ProductsController::class, 'create']);
        self::put('/api/products/{id}', fn ($p) => ProductsController::update($p));
        self::delete('/api/products/{id}', fn ($p) => ProductsController::destroy($p));

        // Orders
        self::post('/api/orders', [OrdersController::class, 'create']);
        self::get('/api/orders/my-orders', [OrdersController::class, 'myOrders']);
        self::get('/api/orders/admin/all', [OrdersController::class, 'adminAll']);
        self::get('/api/orders/{id}', fn ($p) => OrdersController::show($p));
        self::put('/api/orders/{id}', fn ($p) => OrdersController::update($p));

        // Donations
        self::post('/api/donations', [DonationsController::class, 'create']);
        self::get('/api/donations/my-donations', [DonationsController::class, 'myDonations']);
        self::get('/api/donations/admin/all', [DonationsController::class, 'adminAll']);
        self::get('/api/donations/{id}/summary', fn ($p) => DonationsController::summary($p));

        // Cart
        self::get('/api/cart', [CartController::class, 'index']);
        self::post('/api/cart', [CartController::class, 'add']);
        self::put('/api/cart/{id}', fn ($p) => CartController::update($p));
        self::delete('/api/cart/{id}', fn ($p) => CartController::remove($p));
        self::delete('/api/cart', [CartController::class, 'clear']);

        // Wishlist
        self::get('/api/wishlist', [WishlistController::class, 'index']);
        self::post('/api/wishlist/toggle', [WishlistController::class, 'toggle']);

        // Reviews
        self::get('/api/reviews/product/{productId}', fn ($p) => ReviewsController::byProduct($p));
        self::post('/api/reviews', [ReviewsController::class, 'create']);
        self::delete('/api/reviews/{id}', fn ($p) => ReviewsController::destroy($p));

        // Contact
        self::post('/api/contact', [ContactController::class, 'create']);

        // PayFast
        self::get('/api/payfast/status', [PayfastController::class, 'status']);
        self::get('/api/payfast/check', [PayfastController::class, 'check']);
        self::get('/api/payfast/debug-signature', [PayfastController::class, 'debugSignature']);
        self::post('/api/payfast/pay', [PayfastController::class, 'handlePay']);
        self::post('/api/pay', [PayfastController::class, 'handlePay']);
        self::post('/api/payfast/order/{orderId}', fn ($p) => PayfastController::orderPayment($p));
        self::post('/api/payfast/donation/{donationId}', fn ($p) => PayfastController::donationPayment($p));
        self::post('/api/payfast/notify', [PayfastController::class, 'notify']);

        // Resellers
        self::get('/api/resellers/profile', [ResellersController::class, 'profile']);
        self::get('/api/resellers/commissions', [ResellersController::class, 'commissions']);
        self::get('/api/resellers/sales', [ResellersController::class, 'sales']);
        self::post('/api/resellers/withdraw', [ResellersController::class, 'withdraw']);
        self::get('/api/resellers/withdrawals', [ResellersController::class, 'withdrawals']);
        self::get('/api/resellers/admin/all', [ResellersController::class, 'adminAll']);
        self::put('/api/resellers/admin/{id}/status', fn ($p) => ResellersController::adminStatus($p));
        self::get('/api/resellers/admin/withdrawals', [ResellersController::class, 'adminWithdrawals']);
        self::put('/api/resellers/admin/withdrawals/{id}', fn ($p) => ResellersController::adminWithdrawalUpdate($p));

        // Admin
        self::get('/api/admin/dashboard', [AdminController::class, 'dashboard']);
        self::get('/api/admin/users', [AdminController::class, 'users']);
        self::put('/api/admin/users/{id}/role', fn ($p) => AdminController::userRole($p));
        self::put('/api/admin/users/{id}/approve', fn ($p) => AdminController::userApprove($p));
        self::delete('/api/admin/users/{id}', fn ($p) => AdminController::userDelete($p));
        self::get('/api/admin/contacts', [AdminController::class, 'contacts']);
        self::post('/api/admin/notifications', [AdminController::class, 'sendNotification']);
        self::post('/api/admin/categories', [AdminController::class, 'createCategory']);
        self::delete('/api/admin/categories/{id}', fn ($p) => AdminController::deleteCategory($p));
        self::get('/api/admin/reports/sales/csv', [AdminController::class, 'salesCsv']);
        self::get('/api/admin/reports/sales/pdf', [AdminController::class, 'salesPdf']);
        self::get('/api/admin/reports/donations/csv', [AdminController::class, 'donationsCsv']);
        self::get('/api/admin/reports/donations/pdf', [AdminController::class, 'donationsPdf']);

        // Notifications
        self::get('/api/notifications', [NotificationsController::class, 'index']);
        self::put('/api/notifications/read-all', [NotificationsController::class, 'readAll']);
        self::put('/api/notifications/{id}/read', fn ($p) => NotificationsController::read($p));

        // Search
        self::get('/api/search', [SearchController::class, 'search']);
    }

    public static function dispatch(string $method, string $path): void
    {
        if (!self::$routes) {
            self::registerRoutes();
        }

        foreach (self::$routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }
            $params = self::match($route['pattern'], $path);
            if ($params !== null) {
                call_user_func($route['handler'], $params);
                return;
            }
        }

        Response::error('Not found', 404);
    }

    private static function match(string $pattern, string $path): ?array
    {
        $regex = preg_replace('/\{([a-zA-Z_]+)\}/', '(?P<$1>[^/]+)', $pattern);
        $regex = '#^' . $regex . '$#';
        if (!preg_match($regex, $path, $m)) {
            return null;
        }
        $params = [];
        foreach ($m as $k => $v) {
            if (!is_int($k)) {
                $params[$k] = $v;
            }
        }
        return $params;
    }
}
