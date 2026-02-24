<?php
/**
 * Temporary Accounts API
 * Handles CRUD operations for temporary staff accounts
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'supabase-api.php';

$action = $_GET['action'] ?? '';
$supabase = new SupabaseAPI();

try {
    switch ($action) {
        case 'list':
            listTempAccounts($supabase);
            break;
        case 'roles':
            listRoles($supabase);
            break;
        case 'create':
            createTempAccount($supabase);
            break;
        case 'update':
            updateTempAccount($supabase);
            break;
        case 'revoke':
            revokeTempAccount($supabase);
            break;
        case 'delete':
            deleteTempAccount($supabase);
            break;
        default:
            echo json_encode(['success' => false, 'error' => 'Invalid action']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function listRoles($supabase) {
    $result = $supabase->select('roles', []);
    
    if (is_array($result) && !isset($result['error'])) {
        // Filter out admin role
        $filteredRoles = array_filter($result, function($role) {
            $name = strtolower($role['name'] ?? '');
            return $name !== 'admin' && $name !== 'owner';
        });
        
        echo json_encode([
            'success' => true,
            'roles' => array_values($filteredRoles)
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $result['error'] ?? 'Failed to fetch roles'
        ]);
    }
}

function listTempAccounts($supabase) {
    $result = $supabase->select('temp_accounts', ['order' => 'created_at.desc']);
    
    if (is_array($result) && !isset($result['error'])) {
        echo json_encode([
            'success' => true,
            'accounts' => $result
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $result['error'] ?? 'Failed to fetch temp accounts'
        ]);
    }
}

function createTempAccount($supabase) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }
    
    $roleId = $input['role_id'] ?? null;
    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $ipAddress = $input['ip_address'] ?? '';
    $durationHours = intval($input['duration_hours'] ?? 168);
    $reason = trim($input['reason'] ?? '');
    
    if (!$roleId || !$username || !$password || !$reason) {
        echo json_encode(['success' => false, 'error' => 'Missing required fields']);
        return;
    }
    
    // Check if username already exists
    $existing = $supabase->select('temp_accounts', ['username' => 'eq.' . $username]);
    if (is_array($existing) && !isset($existing['error']) && count($existing) > 0) {
        echo json_encode(['success' => false, 'error' => 'Username already exists']);
        return;
    }
    
    // Calculate expiration
    $expiresAt = date('c', strtotime("+{$durationHours} hours"));
    
    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    
    $data = [
        'role_id' => intval($roleId),
        'username' => $username,
        'password_hash' => $passwordHash,
        'ip_address' => $ipAddress,
        'reason' => $reason,
        'expires_at' => $expiresAt,
        'status' => 'active'
    ];
    
    $result = $supabase->insert('temp_accounts', $data);
    
    if (is_array($result) && !isset($result['error'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Temp account created',
            'account' => $result[0] ?? $result
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $result['error'] ?? 'Failed to create temp account'
        ]);
    }
}

function updateTempAccount($supabase) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }
    
    $id = intval($input['id']);
    $roleId = $input['role_id'] ?? null;
    $password = $input['password'] ?? null;
    $extendHours = intval($input['extend_hours'] ?? 0);
    $status = $input['status'] ?? null;
    
    // Build update data
    $data = [];
    
    if ($roleId) {
        $data['role_id'] = intval($roleId);
    }
    
    if ($password) {
        $data['password_hash'] = password_hash($password, PASSWORD_DEFAULT);
    }
    
    if ($status) {
        $data['status'] = $status;
    }
    
    // Handle duration extension
    if ($extendHours > 0) {
        // Get current expiration
        $current = $supabase->select('temp_accounts', ['id' => 'eq.' . $id]);
        if (is_array($current) && !isset($current['error']) && count($current) > 0) {
            $currentExpires = $current[0]['expires_at'] ?? date('c');
            $newExpires = date('c', strtotime($currentExpires . " +{$extendHours} hours"));
            $data['expires_at'] = $newExpires;
        }
    }
    
    if (empty($data)) {
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        return;
    }
    
    $result = $supabase->update('temp_accounts', $data, ['id' => 'eq.' . $id]);
    
    if (is_array($result) && !isset($result['error'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Temp account updated'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $result['error'] ?? 'Failed to update temp account'
        ]);
    }
}

function revokeTempAccount($supabase) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }
    
    $id = intval($input['id']);
    
    $result = $supabase->update('temp_accounts', ['status' => 'revoked'], ['id' => 'eq.' . $id]);
    
    if (is_array($result) && !isset($result['error'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Temp account revoked'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $result['error'] ?? 'Failed to revoke temp account'
        ]);
    }
}

function deleteTempAccount($supabase) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['id'])) {
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }
    
    $id = intval($input['id']);
    
    $result = $supabase->delete('temp_accounts', ['id' => 'eq.' . $id]);
    
    if (is_array($result) && !isset($result['error'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Temp account deleted'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => $result['error'] ?? 'Failed to delete temp account'
        ]);
    }
}
