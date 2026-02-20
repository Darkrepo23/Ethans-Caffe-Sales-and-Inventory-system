<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");

session_start();

$host = '127.0.0.1';
$db   = 'ethans_cafe';
$user = 'root';
$pass = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false); // force true prepared statements
} catch (Exception $e) {
    echo json_encode(["error" => "Database connection failed"]);
    exit();
}

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
    http_response_code(400);
    echo json_encode(["error" => "Missing username or password"]);
    exit();
}

// Limit input length to prevent abuse
if (strlen($username) > 100 || strlen($password) > 255) {
    http_response_code(400);
    echo json_encode(["error" => "Input too long"]);
    exit();
}

// Sanitize username (alphanumeric + underscore only)
if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid username format"]);
    exit();
}

// Brute force protection — track failed attempts in session
if (!isset($_SESSION['login_attempts'])) {
    $_SESSION['login_attempts'] = 0;
    $_SESSION['login_last_attempt'] = time();
}

// Reset attempts after 15 minutes
if (time() - $_SESSION['login_last_attempt'] > 900) {
    $_SESSION['login_attempts'] = 0;
    $_SESSION['login_last_attempt'] = time();
}

if ($_SESSION['login_attempts'] >= 5) {
    http_response_code(429);
    echo json_encode(["error" => "Too many login attempts. Please wait 15 minutes."]);
    exit();
}

// Fetch user with role name via JOIN
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.full_name, u.password_hash, u.role_id, r.name AS role_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.username = ? AND u.deleted_at IS NULL
    LIMIT 1
");
$stmt->execute([$username]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

// Always verify password even if user not found (prevent timing attacks)
$dummyHash = '$2y$10$invalidhashfortimingprotection000000000000000000000000';
$hashToVerify = $user ? $user['password_hash'] : $dummyHash;
$passwordValid = password_verify($password, $hashToVerify);

if (!$user || !$passwordValid) {
    $_SESSION['login_attempts']++;
    $_SESSION['login_last_attempt'] = time();
    http_response_code(401);
    echo json_encode(["error" => "Invalid username or password"]);
    exit();
}

// Reset attempts on success
$_SESSION['login_attempts'] = 0;

// Regenerate session ID to prevent session fixation
session_regenerate_id(true);

$_SESSION['user_id'] = $user['id'];
$_SESSION['role_id'] = $user['role_id'];

echo json_encode([
    "success"    => true,
    "session_id" => session_id(),
    "user_id"    => $user['id'],
    "role_id"    => $user['role_id'],
    "role_name"  => $user['role_name'],
    "full_name"  => htmlspecialchars($user['full_name'], ENT_QUOTES, 'UTF-8')
]);