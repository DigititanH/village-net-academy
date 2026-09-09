<?php

class NotificationsController
{
    public static function index(): void
    {
        Auth::authenticate();
        Response::json(Database::queryAll(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [Auth::$user['id']]
        ));
    }

    public static function readAll(): void
    {
        Auth::authenticate();
        Database::queryRun('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [Auth::$user['id']]);
        Response::json(['message' => 'All marked as read']);
    }

    public static function read(array $params): void
    {
        Auth::authenticate();
        Database::queryRun(
            'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
            [$params['id'], Auth::$user['id']]
        );
        Response::json(['message' => 'Marked as read']);
    }
}
