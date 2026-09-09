<?php

/**
 * CCNA enrolments via PayFast Pay Now Subscribe:
 * South African students: R550 × 6 monthly (shipping address required).
 */
class CcnaEnrolmentsController
{
    private const PAYNOW_URL = 'https://payment.payfast.io/eng/process';
    private const SITE = 'https://www.villagenetacad.co.za';

    /** @return list<string> */
    private static function allowedCourses(): array
    {
        return ['CCNA 1, 2 and 3'];
    }

    private static function saAmount(): float
    {
        $amount = (float) (Env::get('CCNA_SA_PAYNOW_AMOUNT', '550') ?? '550');
        return $amount >= 5 ? $amount : 550.0;
    }

    private static function payNowCycles(): int
    {
        $cycles = (int) (Env::get('CCNA_SA_PAYNOW_CYCLES', '6') ?? '6');
        return max(0, $cycles);
    }

    private static function payNowFrequency(): int
    {
        $freq = (int) (Env::get('CCNA_SA_PAYNOW_FREQUENCY', '3') ?? '3');
        return in_array($freq, [3, 4, 5, 6], true) ? $freq : 3;
    }

    private static function frequencyLabel(int $frequency): string
    {
        return match ($frequency) {
            4 => 'quarterly',
            5 => 'biannually',
            6 => 'annually',
            default => 'monthly',
        };
    }

    private static function planLabel(float $amount, int $frequency, int $cycles): string
    {
        return 'R' . number_format($amount, 2) . ' '
            . self::frequencyLabel($frequency)
            . ' × ' . $cycles . ' (PayFast Subscribe)';
    }

    public static function plans(): void
    {
        $freq = self::payNowFrequency();
        $cycles = self::payNowCycles();
        $sa = self::saAmount();

        Response::json([
            'currency' => 'ZAR',
            'south_african' => [
                'mode' => 'paynow_subscription',
                'amount' => $sa,
                'recurring_amount' => $sa,
                'frequency' => $freq,
                'frequency_label' => self::frequencyLabel($freq),
                'cycles' => $cycles,
                'item_name' => 'CCNA',
                'item_description' => 'Access to CCNA 1, 2 and 3',
                'label' => self::planLabel($sa, $freq, $cycles),
            ],
            'amount' => $sa,
            'frequency' => $freq,
            'frequency_label' => self::frequencyLabel($freq),
            'cycles' => $cycles,
            'courses' => self::allowedCourses(),
            'payfast_configured' => Payfast::isConfigured() || Payfast::merchantId() !== '',
            'receiver' => Payfast::merchantId() ?: '14050025',
        ]);
    }

    public static function enrol(): void
    {
        $body = Request::jsonBody();
        $name = trim((string) ($body['name'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $phone = trim((string) ($body['phone'] ?? ''));
        $studentType = 'south-african';
        if (($body['student_type'] ?? '') === 'international') {
            Response::error('International CCNA enrolment is not available. Please contact us for assistance.', 400);
        }
        $country = 'South Africa';
        $course = trim((string) ($body['course'] ?? ''));
        $notes = trim((string) ($body['message'] ?? $body['notes'] ?? ''));

        if ($name === '' || $email === '' || $course === '') {
            Response::error('name, email, and course are required', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('A valid email is required', 400);
        }
        if (!in_array($course, self::allowedCourses(), true)) {
            Response::error('Selected course is not a CCNA enrolment option', 400);
        }
        if ($country === '') {
            Response::error('country is required', 400);
        }

        $amount = self::saAmount();
        self::enrolPayNowSubscription($body, $name, $email, $phone, $country, $course, $notes, $studentType, $amount);
    }

    private static function enrolPayNowSubscription(
        array $body,
        string $name,
        string $email,
        string $phone,
        string $country,
        string $course,
        string $notes,
        string $studentType,
        float $amount
    ): void {
        $receiver = Payfast::merchantId();
        if ($receiver === '') {
            $receiver = '14050025';
        }

        $line1 = trim((string) ($body['line1'] ?? ''));
        $line2 = trim((string) ($body['line2'] ?? ''));
        $city = trim((string) ($body['city'] ?? ''));
        $region = trim((string) ($body['region'] ?? ''));
        $code = trim((string) ($body['code'] ?? ''));

        if ($line1 === '' || $city === '' || $region === '' || $code === '') {
            Response::error('Shipping address is required: line1, city, province (region), and postal code', 400);
        }

        $frequency = self::payNowFrequency();
        $cycles = self::payNowCycles();

        $result = Database::queryRun(
            'INSERT INTO ccna_enrolments
              (full_name, email, phone, student_type, country, course_title, notes, amount, frequency, cycles, payment_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $name,
                $email,
                $phone !== '' ? $phone : null,
                $studentType,
                $country,
                $course,
                $notes !== '' ? $notes : null,
                $amount,
                $frequency,
                $cycles,
                'pending',
            ]
        );

        $id = (int) $result['lastInsertRowid'];
        $mPaymentId = 'ccna-' . $id;

        Database::queryRun(
            'UPDATE ccna_enrolments SET m_payment_id = ? WHERE id = ?',
            [$mPaymentId, $id]
        );

        $base = rtrim((string) (Env::get('CCNA_PAYNOW_SITE_URL') ?: self::SITE), '/');
        $returnUrl = trim((string) (Env::get('CCNA_SA_RETURN_URL') ?: ($base . '/payment-success')));
        $cancelUrl = trim((string) (Env::get('CCNA_SA_CANCEL_URL') ?: ($base . '/payment-cancelled')));
        $notifyUrl = trim((string) (Env::get('CCNA_SA_NOTIFY_URL') ?: ($base . '/payfast/notify.php')));

        $names = Payfast::splitName($name);
        $amountFormatted = number_format($amount, 2, '.', '');
        $fields = [
            'cmd' => '_paynow',
            'receiver' => $receiver,
            'return_url' => $returnUrl,
            'cancel_url' => $cancelUrl,
            'notify_url' => $notifyUrl,
            'amount' => $amountFormatted,
            'item_name' => 'CCNA',
            'item_description' => 'Access to CCNA 1, 2 and 3',
            'subscription_type' => '1',
            'recurring_amount' => $amountFormatted,
            'cycles' => (string) $cycles,
            'frequency' => (string) $frequency,
            'm_payment_id' => $mPaymentId,
            'name_first' => $names['first'],
            'email_address' => $email,
            'line1' => $line1,
            'city' => $city,
            'region' => $region,
            'country' => $country,
            'code' => $code,
            'custom_str1' => 'ccna',
            'custom_str2' => substr($course, 0, 255),
            'custom_str3' => $studentType,
        ];

        if ($names['last']) {
            $fields['name_last'] = $names['last'];
        }
        if ($line2 !== '') {
            $fields['line2'] = $line2;
        }
        if ($phone !== '') {
            $fields['cell_number'] = $phone;
        }

        Response::json([
            'mode' => 'paynow_subscription',
            'enrolment_id' => $id,
            'm_payment_id' => $mPaymentId,
            'amount' => $amount,
            'recurring_amount' => $amount,
            'frequency' => $frequency,
            'cycles' => $cycles,
            'student_type' => $studentType,
            'url' => self::PAYNOW_URL,
            'fields' => $fields,
        ], 201);
    }

    public static function summary(array $params): void
    {
        $id = (int) ($params['id'] ?? 0);
        $row = Database::queryGet(
            'SELECT id, course_title, payment_status, amount, frequency, cycles, student_type, subscription_token, created_at
             FROM ccna_enrolments WHERE id = ?',
            [$id]
        );
        if (!$row) {
            Response::error('Enrolment not found', 404);
        }
        Response::json($row);
    }
}
