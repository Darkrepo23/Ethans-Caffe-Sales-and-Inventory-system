<?php
/**
 * Verify Manager PIN for sensitive operations
 * Validates PIN against admin or manager accounts
 * Uses the Supabase REST API (no direct PostgreSQL needed)
 */

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

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
    
    // Use the SupabaseAPI class (loaded by config.php -> supabase-api.php)
    global $supabase;
    
    // 1. Get all roles that are Admin or Manager
    $roles = $supabase->select('roles');
    if (!is_array($roles)) {
        echo json_encode(['success' => false, 'message' => 'Failed to fetch roles']);
        exit;
    }
    
    $managerRoleIds = [];
    foreach ($roles as $role) {
        $roleName = strtolower($role['name'] ?? '');
        if ($roleName === 'admin' || $roleName === 'manager' || $roleName === 'owner') {
            $managerRoleIds[] = $role['id'];
        }
    }
    
    if (empty($managerRoleIds)) {
        echo json_encode(['success' => false, 'message' => 'No manager roles found']);
        exit;
    }
    
    // 2. Get active users with those role IDs
    foreach ($managerRoleIds as $roleId) {
        $managers = $supabase->select('users', [
            'role_id' => 'eq.' . $roleId,
            'status'  => 'eq.active',
            'select'  => 'id,full_name,password_hash,manager_pin,role_id'
        ]);
        
        if (!is_array($managers)) continue;
        
        foreach ($managers as $manager) {
            // Check against manager_pin field
            if (!empty($manager['manager_pin']) && $pin === $manager['manager_pin']) {
                echo json_encode([
                    'success'      => true, 
                    'manager_name' => $manager['full_name'],
                    'manager_id'   => $manager['id']
                ]);
                exit;
            }
            
            // Also check against password hash (in case they enter their password)
            if (!empty($manager['password_hash']) && password_verify($pin, $manager['password_hash'])) {
                echo json_encode([
                    'success'      => true, 
                    'manager_name' => $manager['full_name'],
                    'manager_id'   => $manager['id']
                ]);
                exit;
            }
        }
    }
    
    // No match found
    echo json_encode(['success' => false, 'message' => 'Invalid manager PIN or password']);
    
} catch (Exception $e) {
    error_log('Manager PIN verification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
