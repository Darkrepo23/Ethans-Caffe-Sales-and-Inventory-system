<?php
/**
 * Verify Manager PIN for sensitive operations
 * Validates PIN against admin or manager accounts
 */

header('Content-Type: application/json');

require_once 'config.php';
require_once 'session.php';

try {
    // Only accept POST requests
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        exit;
    }
    
    // Get JSON input
    $input = json_decode(file_get_contents('php://input'), true);
    $pin = $input['pin'] ?? '';
    
    if (empty($pin)) {
        echo json_encode(['success' => false, 'message' => 'PIN is required']);
        exit;
    }
    
    // Connect to database
    $pdo = new PDO(
        "pgsql:host=" . SUPABASE_HOST . ";port=" . SUPABASE_PORT . ";dbname=" . SUPABASE_DB,
        SUPABASE_USER,
        SUPABASE_PASSWORD
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Get admin and manager users
    $stmt = $pdo->prepare("
        SELECT u.id, u.full_name, u.password_hash, u.manager_pin, r.name as role_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name IN ('Admin', 'Manager', 'admin', 'manager')
        AND u.status = 'active'
    ");
    $stmt->execute();
    $managers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Check PIN against each manager
    foreach ($managers as $manager) {
        // Check against manager_pin field if it exists
        if (!empty($manager['manager_pin']) && $pin === $manager['manager_pin']) {
            echo json_encode([
                'success' => true, 
                'manager_name' => $manager['full_name'],
                'manager_id' => $manager['id']
            ]);
            exit;
        }
        
        // Also check against password hash
        if (!empty($manager['password_hash']) && password_verify($pin, $manager['password_hash'])) {
            echo json_encode([
                'success' => true, 
                'manager_name' => $manager['full_name'],
                'manager_id' => $manager['id']
            ]);
            exit;
        }
    }
    
    // No match found
    echo json_encode(['success' => false, 'message' => 'Invalid manager PIN or password']);
    
} catch (PDOException $e) {
    error_log('Manager PIN verification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
} catch (Exception $e) {
    error_log('Manager PIN verification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
