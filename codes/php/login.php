<?php
ob_start();

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

session_start();
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Load Supabase API helper
require_once 'supabase-api.php';

// Only accept POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

// Only accept JSON content type
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') === false) {
    http_response_code(415);
    echo json_encode(["error" => "Unsupported Media Type"]);
    exit();
}

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

// Validate JSON
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON"]);
    exit();
}

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');

// Basic input validation
if (empty($username) || empty($password)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password"]);
    exit();
}

// Limit input length to prevent abuse
if (strlen($username) > 100 || strlen($password) > 255) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Input too long"]);
    exit();
}

// Sanitize username (alphanumeric + underscore only)
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Invalid username format"]);
    exit();
}

// Use Supabase API to get user
$user = $supabase->getUserWithRole($username);

// Always verify password even if user not found (prevent timing attacks)
$dummyHash = '$2y$10$invalidhashfortimingprotection000000000000000000000000';
$hashToVerify = $user ? $user['password_hash'] : $dummyHash;
$passwordValid = password_verify($password, $hashToVerify);

if (!$user || !$passwordValid) {
    ob_end_clean();
    http_response_code(401);
    echo json_encode(["error" => "Invalid username or password"]);
    exit();
}

// Regenerate session ID to prevent session fixation
session_regenerate_id(true);

$_SESSION['user_id'] = $user['id'];
$_SESSION['role_id'] = $user['role_id'];

// Log successful login for "My Activity"
try {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $logData = [
        'user_id' => $user['id'],
        'role_label' => $user['role_name'] ?? 'unknown',
        'action' => 'Logged in',
        'reference' => 'System',
        'status' => 'Success',
        'ip_address' => $ip,
        'created_at' => date('Y-m-d H:i:s')
    ];
    $supabase->insert('activity_logs', $logData);
} catch (Exception $e) {
    // Silently fail logging if it errors out
}

ob_end_clean();
echo json_encode([
    "success"    => true,
    "session_id" => session_id(),
    "id"         => $user['id'],
    "username"   => $user['username'],
    "role_id"    => $user['role_id'],
    "role_name"  => $user['role_name'] ?? 'unknown',
    "full_name"  => $user['full_name'] ?? ''
]);
?>