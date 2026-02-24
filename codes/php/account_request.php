<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit();
}

// Load secure configuration
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

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

// Validate required fields
if (empty($fullName) || empty($username) || empty($email) || empty($password) || !$roleId) {
    http_response_code(400);
    echo json_encode(["error" => "Please fill in all required fields"]);
    exit();
}

// Validate Gmail/Email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid Gmail/Email format."]);
    exit();
}

// Validate lengths
if (strlen($username) > 100 || strlen($fullName) > 255 || strlen($email) > 255) {
    http_response_code(400);
    echo json_encode(["error" => "Input too long"]);
    exit();
}

// Validate username format
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid username format. Only letters, numbers, and underscores allowed."]);
    exit();
}

// Validate password length
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(["error" => "Password must be at least 6 characters"]);
    exit();
}

// Check username uniqueness in users table
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? LIMIT 1");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "Username already exists. Please choose a different username."]);
    exit();
}

// Check username uniqueness in account_requests table
$stmt = $pdo->prepare("SELECT id FROM account_requests WHERE username = ? AND status = 'Pending' LIMIT 1");
$stmt->execute([$username]);
if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode(["error" => "A pending request with this username already exists."]);
    exit();
}

// Validate role exists and is not admin
$stmt = $pdo->prepare("SELECT id, name FROM roles WHERE id = ? LIMIT 1");
$stmt->execute([$roleId]);
$role = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$role || strtolower($role['name']) === 'admin') {
    http_response_code(403);
    echo json_encode(["error" => "Invalid or unauthorized role requested."]);
    exit();
}

// Hash password
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

// Insert account request
$stmt = $pdo->prepare("
    INSERT INTO account_requests (full_name, username, email, password_hash, requested_role_id, status, requested_at)
    VALUES (?, ?, ?, ?, ?, 'Pending', NOW())
");
$stmt->execute([$fullName, $username, $email, $passwordHash, $roleId]);

echo json_encode(["success" => true, "message" => "Account request submitted successfully."]);