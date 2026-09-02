<?php
/**
 * Feedback form processor
 * Expects a POST request with: name, email, feedback_type, rating, message, recommend, contact_ok
 * Returns JSON: {"success": true} or {"success": false, "message": "..."}
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/* Only accept POST requests */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

/* ── Sanitise and validate inputs ───────────────────────────── */

/**
 * Sanitise a plain-text input field.
 *
 * @param string $value
 * @return string
 */
function sanitise_text(string $value): string
{
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

$name          = sanitise_text($_POST['name']          ?? '');
$email         = filter_input(INPUT_POST, 'email',         FILTER_SANITIZE_EMAIL);
$feedback_type = sanitise_text($_POST['feedback_type'] ?? '');
$rating        = (int) ($_POST['rating']               ?? 0);
$message       = sanitise_text($_POST['message']       ?? '');
$recommend     = sanitise_text($_POST['recommend']     ?? '');
$contact_ok    = sanitise_text($_POST['contact_ok']    ?? '');

$errors = [];

if ($name === '') {
    $errors[] = 'Name is required.';
}

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'A valid email address is required.';
} elseif (preg_match('/[\r\n]/', $email)) {
    $errors[] = 'Invalid email address.';
}

if ($message === '') {
    $errors[] = 'Message is required.';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

/* ── Send email notification ────────────────────────────────── */
$to      = 'info@compassionate-circle.org'; // Update to real address
$subject = 'New Feedback from ' . $name;

$body  = "Name:          {$name}\n";
$body .= "Email:         {$email}\n";
$body .= "Type:          {$feedback_type}\n";
$body .= "Rating:        {$rating}/5\n";
$body .= "Recommend:     {$recommend}\n";
$body .= "Contact OK:    {$contact_ok}\n\n";
$body .= "Message:\n{$message}\n";

$headers  = "From: noreply@compassionate-circle.org\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

$sent = mail($to, $subject, $body, $headers);

if (!$sent) {
    // Log failure rather than exposing details to the client
    error_log('Feedback email failed for: ' . $email);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Could not send feedback. Please try again later.']);
    exit;
}

echo json_encode(['success' => true]);
