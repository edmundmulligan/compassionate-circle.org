<?php
/**
 * Booking form processor
 * Expects POST: first_name, last_name, email, phone, session_type,
 *               preferred_date, preferred_time, facilitator, notes, agree
 * Returns JSON: {"success": true} or {"success": false, "message": "..."}
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/**
 * Sanitise a plain-text field.
 *
 * @param string $value
 * @return string
 */
function sanitise_text(string $value): string
{
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

$first_name  = sanitise_text($_POST['first_name']     ?? '');
$last_name   = sanitise_text($_POST['last_name']      ?? '');
$email       = filter_input(INPUT_POST, 'email',       FILTER_SANITIZE_EMAIL);
$phone       = sanitise_text($_POST['phone']           ?? '');
$session_type = sanitise_text($_POST['session_type']  ?? '');
$pref_date   = sanitise_text($_POST['preferred_date'] ?? '');
$pref_time   = sanitise_text($_POST['preferred_time'] ?? '');
$facilitator = sanitise_text($_POST['facilitator']    ?? '');
$notes       = sanitise_text($_POST['notes']          ?? '');
$agree       = sanitise_text($_POST['agree']          ?? '');

$valid_sessions = ['individual', 'group', 'workshop', 'intro'];
$errors = [];

if ($first_name === '') { $errors[] = 'First name is required.'; }
if ($last_name  === '') { $errors[] = 'Last name is required.'; }
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}
if (!in_array($session_type, $valid_sessions, true)) {
    $errors[] = 'Please select a valid session type.';
}

/* Validate date – must be today or in the future */
if ($pref_date === '') {
    $errors[] = 'A preferred date is required.';
} else {
    $date_obj = DateTime::createFromFormat('Y-m-d', $pref_date);
    $today    = new DateTime('today');
    if (!$date_obj || $date_obj < $today) {
        $errors[] = 'Please select a date in the future.';
    }
}

if ($agree !== 'on' && $agree !== '1' && $agree !== 'yes') {
    $errors[] = 'You must agree to the booking terms.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

/* ── Send confirmation email to user ────────────────────────── */
$user_subject = 'Your Compassionate Circle Booking Confirmation';
$user_body  = "Dear {$first_name},\n\n";
$user_body .= "Thank you for booking with us! Here are your booking details:\n\n";
$user_body .= "Session:    {$session_type}\n";
$user_body .= "Date:       {$pref_date}\n";
$user_body .= "Time pref:  {$pref_time}\n";
if ($facilitator) {
    $user_body .= "Facilitator: {$facilitator}\n";
}
$user_body .= "\nWe will be in touch shortly to confirm your appointment.\n\n";
$user_body .= "Compassionate Circle Team\n";

$user_headers  = "From: bookings@compassionate-circle.org\r\n";
$user_headers .= "X-Mailer: PHP/" . phpversion();

mail($email, $user_subject, $user_body, $user_headers);

/* ── Send notification to admin ─────────────────────────────── */
$admin_to      = 'bookings@compassionate-circle.org'; // Update to real address
$admin_subject = 'New Booking: ' . $first_name . ' ' . $last_name;

$admin_body  = "Name:        {$first_name} {$last_name}\n";
$admin_body .= "Email:       {$email}\n";
$admin_body .= "Phone:       {$phone}\n";
$admin_body .= "Session:     {$session_type}\n";
$admin_body .= "Date:        {$pref_date}\n";
$admin_body .= "Time pref:   {$pref_time}\n";
$admin_body .= "Facilitator: {$facilitator}\n";
$admin_body .= "\nNotes:\n{$notes}\n";

$admin_headers  = "From: noreply@compassionate-circle.org\r\n";
$admin_headers .= "Reply-To: {$email}\r\n";
$admin_headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($admin_to, $admin_subject, $admin_body, $admin_headers);

if (!$sent) {
    error_log('Booking admin email failed for: ' . $email);
}

echo json_encode(['success' => true]);
