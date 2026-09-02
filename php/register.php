<?php
/**
 * Registration processor
 * Expects POST: first_name, last_name, email, password, password_confirm,
 *               dob, phone, interests[], referral, terms, newsletter
 * Returns JSON: {"success": true} or {"success": false, "message": "..."}
 *
 * NOTE: This implementation stores registrations in a JSON file for
 * demonstration. In a production system you would use a database and
 * a proper authentication framework (e.g. OAuth / bcrypt in a DB).
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

$first_name = sanitise_text($_POST['first_name'] ?? '');
$last_name  = sanitise_text($_POST['last_name']  ?? '');
$email      = filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL);
$password   = $_POST['password']         ?? '';
$password2  = $_POST['password_confirm'] ?? '';
$dob        = sanitise_text($_POST['dob']        ?? '');
$phone      = sanitise_text($_POST['phone']      ?? '');
$interests  = array_map('htmlspecialchars', (array) ($_POST['interests'] ?? []));
$referral   = sanitise_text($_POST['referral']   ?? '');
$terms      = sanitise_text($_POST['terms']      ?? '');
$newsletter = sanitise_text($_POST['newsletter'] ?? '');

$errors = [];

if ($first_name === '') { $errors[] = 'First name is required.'; }
if ($last_name  === '') { $errors[] = 'Last name is required.'; }

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
}

if (strlen($password) < 8) {
    $errors[] = 'Password must be at least 8 characters.';
}

if ($password !== $password2) {
    $errors[] = 'Passwords do not match.';
}

if ($terms !== 'on' && $terms !== '1' && $terms !== 'yes') {
    $errors[] = 'You must agree to the Terms of Service.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

/* ── Persist registration ───────────────────────────────────── */
$data_dir  = __DIR__ . '/../data';
$data_file = $data_dir . '/registrations.json';

if (!is_dir($data_dir)) {
    mkdir($data_dir, 0750, true);
}

$registrations = [];
if (file_exists($data_file)) {
    $json = file_get_contents($data_file);
    if ($json !== false) {
        $registrations = json_decode($json, true) ?? [];
    }
}

/* Check for duplicate email */
foreach ($registrations as $reg) {
    if (isset($reg['email']) && strtolower($reg['email']) === strtolower($email)) {
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'An account with that email address already exists.']);
        exit;
    }
}

/* Store a hashed password – never store plain text */
$registrations[] = [
    'id'         => uniqid('user_', true),
    'first_name' => $first_name,
    'last_name'  => $last_name,
    'email'      => $email,
    'password'   => password_hash($password, PASSWORD_BCRYPT),
    'dob'        => $dob,
    'phone'      => $phone,
    'interests'  => $interests,
    'referral'   => $referral,
    'newsletter' => $newsletter === 'yes',
    'created_at' => date('c'),
];

$written = file_put_contents($data_file, json_encode($registrations, JSON_PRETTY_PRINT));
if ($written === false) {
    error_log('Could not write registrations file.');
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Registration could not be saved. Please try again later.']);
    exit;
}

/* ── Welcome email ──────────────────────────────────────────── */
$subject = 'Welcome to Compassionate Circle!';
$body    = "Dear {$first_name},\n\n";
$body   .= "Thank you for registering with Compassionate Circle.\n";
$body   .= "We are delighted to have you as part of our community.\n\n";
$body   .= "You can now browse and book sessions at https://www.compassionate-circle.org/events.html\n\n";
$body   .= "Warm regards,\nCompassionate Circle Team\n";

$headers  = "From: welcome@compassionate-circle.org\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

mail($email, $subject, $body, $headers);

echo json_encode(['success' => true]);
