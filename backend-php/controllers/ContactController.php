<?php

class ContactController
{
    public static function create(): void
    {
        $body = Request::jsonBody();
        $name = $body['name'] ?? '';
        $email = $body['email'] ?? '';
        $subject = $body['subject'] ?? '';
        $message = $body['message'] ?? '';

        if (!$name || !$email || !$message) {
            Response::error('Name, email and message are required', 400);
        }

        Database::queryRun(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [$name, $email, $subject ?: null, $message]
        );

        Mailer::send([
            'to' => Site::email(),
            'replyTo' => $email,
            'subject' => 'Contact Form: ' . ($subject ?: 'New Message') . " from $name",
            'html' => '<p><strong>From:</strong> ' . htmlspecialchars($name) . ' (' . htmlspecialchars($email) . ')</p>
                <p>' . nl2br(htmlspecialchars($message)) . '</p>',
        ]);

        Response::json(['message' => 'Message sent successfully'], 201);
    }
}
