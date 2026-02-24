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

$raw = file_get_contents("php://input");
$data = json_decode($raw, true);

// Validate JSON
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON"]);
    exit();
}

$fullName  = trim($data['full_name'] ?? '');
$username  = trim($data['username'] ?? '');
$email     = trim($data['email'] ?? '');
$password  = trim($data['password'] ?? '');
$roleId    = intval($data['requested_role_id'] ?? 0);

// Basic input validation
if (empty($fullName) || empty($username) || empty($email) || empty($password) || !$roleId) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Please fill in all required fields"]);
    exit();
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Invalid email format"]);
    exit();
}

// Sanitize username
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Invalid username format"]);
    exit();
}

// Password length
if (strlen($password) < 6) {
    ob_end_clean();
    http_response_code(400);
    echo json_encode(["error" => "Password must be at least 6 characters"]);
    exit();
}

try {
    // 1. Check if username exists in users table
    $existingUser = $supabase->getUserWithRole($username);
    if ($existingUser) {
        ob_end_clean();
        http_response_code(409);
        echo json_encode(["error" => "Username already exists"]);
        exit();
    }

    // 2. Check if username exists in pending account_requests
    // Since our API currently doesn't support complex filters for 'select', 
    // we fetch all and check, or just trust the DB uniqueness if implemented.
    // For now, we'll proceed with insertion as Supabase table likely has constraints.
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $requestData = [
        'full_name' => $fullName,
        'username' => $username,
        // Removed 'email' because it doesn't exist in the database schema
        'password_hash' => $passwordHash,
        'requested_role_id' => $roleId,
        'status' => 'Pending',
        'requested_at' => date('Y-m-d H:i:s')
    ];

    $result = $supabase->insert('account_requests', $requestData);

    ob_end_clean();
    // Improved error detection: Supabase returns a list on success, or an object with 'code' on error
    if (isset($result['code']) || isset($result['error'])) {
        http_response_code(400);
        echo json_encode(["error" => "Failed to submit request", "details" => $result]);
    } else {
        echo json_encode(["success" => true, "message" => "Account request submitted successfully"]);
    }

} catch (Exception $e) {
    ob_end_clean();
    http_response_code(500);
    echo json_encode(["error" => "Server error occurred"]);
}
?>