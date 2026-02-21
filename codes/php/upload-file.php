<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$uploadDir = __DIR__ . '/../uploads/menu_items/';

// Create folder if it doesn't exist
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['error' => 'No image uploaded or upload error']);
        exit();
    }

    $file = $_FILES['image'];
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    if (!in_array($file['type'], $allowedTypes)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid image type. Only JPG, PNG, GIF, WEBP allowed.']);
        exit();
    }

    if ($file['size'] > 2 * 1024 * 1024) {
        http_response_code(400);
        echo json_encode(['error' => 'Image too large. Max 2MB.']);
        exit();
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid('menu_', true) . '.' . $ext;
    $destination = $uploadDir . $filename;

    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save image']);
        exit();
    }

    echo json_encode([
        'success' => true,
        'filename' => $filename,
        'path' => 'uploads/menu_items/' . $filename
    ]);
    exit();
}

// DELETE image
if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $filename = basename($data['filename'] ?? '');

    if (!$filename) {
        http_response_code(400);
        echo json_encode(['error' => 'No filename provided']);
        exit();
    }

    $filePath = $uploadDir . $filename;

    if (file_exists($filePath)) {
        unlink($filePath);
        echo json_encode(['success' => true, 'message' => 'Image deleted']);
    } else {
        echo json_encode(['success' => true, 'message' => 'File not found, nothing deleted']);
    }
    exit();
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
?>