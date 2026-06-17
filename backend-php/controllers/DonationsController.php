<?php

class DonationsController
{
    public static function create(): void
    {
        $body = Request::jsonBody();
        $amount = (float) ($body['amount'] ?? 0);
        $donorName = $body['donor_name'] ?? '';
        $email = $body['email'] ?? '';
        $message = $body['message'] ?? '';
        $isAnonymous = !empty($body['is_anonymous']);
        $isRecurring = !empty($body['is_recurring']);
        $recurringInterval = $body['recurring_interval'] ?? null;
        $userId = $body['user_id'] ?? null;
        $academy = trim((string) ($body['academy'] ?? ''));

        if ($amount < 1) {
            Response::error('Amount must be at least R1', 400);
        }
        if ($academy === '') {
            Response::error('Please enter the name of the academy you are donating to', 400);
        }

        $payfastEnabled = Payfast::isConfigured();
        if ($payfastEnabled && trim((string) $email) === '') {
            Response::error('Email is required for PayFast payment', 400);
        }
        if ($payfastEnabled && !$isAnonymous && trim((string) $donorName) === '') {
            Response::error('Name is required for PayFast payment', 400);
        }

        $donorLabel = $isAnonymous ? 'Anonymous' : ($donorName ?: 'Anonymous');

        $result = Database::queryRun(
            'INSERT INTO donations (user_id, donor_name, email, amount, is_recurring, recurring_interval, payment_status, message, is_anonymous, academy)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $userId ?: null,
                $donorLabel,
                $email ?: null,
                $amount,
                $isRecurring ? 1 : 0,
                $recurringInterval,
                'pending',
                $message ?: null,
                $isAnonymous ? 1 : 0,
                $academy,
            ]
        );
        $donationId = $result['lastInsertRowid'];

        if ($payfastEnabled) {
            $fields = Payfast::buildPaymentPayload([
                'amount' => $amount,
                'itemName' => "Village Netacad Donation #$donationId",
                'paymentId' => "donation-$donationId",
                'email' => trim($email),
                'name' => $donorLabel,
                'returnPath' => "/payment/success?type=donation&id=$donationId",
                'cancelPath' => "/payment/cancel?type=donation&id=$donationId",
            ]);

            Response::json([
                'donation_id' => $donationId,
                'academy' => $academy,
                'payfast' => true,
                'url' => Payfast::processUrl(),
                'fields' => $fields,
                'message' => 'Redirecting to PayFast to complete your donation.',
            ], 201);
        }

        Mailer::send([
            'to' => Site::email(),
            'replyTo' => $email ?: null,
            'subject' => "Donation pledge: R$amount from $donorLabel",
            'html' => "<p><strong>Donation ID:</strong> $donationId</p>
                <p><strong>Academy:</strong> " . htmlspecialchars($academy) . "</p>
                <p><strong>Donor:</strong> " . htmlspecialchars($donorLabel) . "</p>
                <p><strong>Email:</strong> " . htmlspecialchars($email ?: '—') . "</p>
                <p><strong>Amount:</strong> R$amount</p>"
                . ($message ? '<p><strong>Message:</strong> ' . htmlspecialchars($message) . '</p>' : ''),
        ]);

        Response::json([
            'donation_id' => $donationId,
            'academy' => $academy,
            'payfast' => false,
            'message' => 'Thank you! Your donation has been recorded.',
        ], 201);
    }

    public static function myDonations(): void
    {
        Auth::authenticate();
        Response::json(Database::queryAll(
            'SELECT * FROM donations WHERE user_id = ? ORDER BY created_at DESC',
            [Auth::$user['id']]
        ));
    }

    public static function summary(array $params): void
    {
        $donation = Database::queryGet(
            'SELECT id, academy, amount, donor_name, payment_status, is_anonymous FROM donations WHERE id = ?',
            [$params['id']]
        );
        if (!$donation) {
            Response::error('Donation not found', 404);
        }
        Response::json($donation);
    }

    public static function adminAll(): void
    {
        Auth::authorize('admin');
        $donations = Database::queryAll('SELECT * FROM donations ORDER BY created_at DESC');
        $totals = Database::queryGet(
            "SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM donations WHERE payment_status = 'completed'"
        );
        $monthly = Database::queryAll(
            "SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total, COUNT(*) as count
             FROM donations WHERE payment_status = 'completed' GROUP BY month ORDER BY month DESC LIMIT 12"
        );
        Response::json(['donations' => $donations, 'summary' => $totals, 'monthly' => $monthly]);
    }
}
