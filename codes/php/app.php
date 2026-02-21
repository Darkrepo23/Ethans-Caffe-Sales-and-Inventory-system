<?php
session_start();

// ---------------------------
// Security check snippet
// ---------------------------
$_SESSION['user_id'] = 1;
$_SESSION['role_id'] = 1; // Admin


$user_id = $_SESSION['user_id'] ?? null;
$role_id = $_SESSION['role_id'] ?? null;



if (!$user_id) {
    echo json_encode(['error' => 'Unauthorized: You must log in']);
    exit();
}

// Restrict sensitive tables to Admins only
$adminOnlyTables = ['users', 'roles', 'system_settings'];
$table = $_GET['table'] ?? $_POST['table'] ?? null;

if (in_array($table, $adminOnlyTables) && $role_id != 1) {
    echo json_encode(['error' => 'Permission denied: Admin only']);
    exit();
}

// Optional logging
file_put_contents('api_access.log', date('Y-m-d H:i:s') . " | User $user_id | Table $table | Method {$_SERVER['REQUEST_METHOD']}\n", FILE_APPEND);
function log_php_error($msg) {
	$logfile = __DIR__ . '/app_error.log';
	$entry = date('Y-m-d H:i:s') . ' ' . $msg . "\n";
	file_put_contents($logfile, $entry, FILE_APPEND);
}
if (basename($_SERVER['PHP_SELF']) === 'app.php' && empty($_SERVER['HTTP_X_REQUESTED_WITH']) && (!isset($_SERVER['HTTP_ACCEPT']) || strpos($_SERVER['HTTP_ACCEPT'], 'application/json') === false)) {
	log_php_error('Redirected direct access to index.html: ' . json_encode($_SERVER));
	header('Location: ../index.html');
	exit();
}
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

$host = '127.0.0.1';
$db   = 'ethans_cafe';
$user = 'root';
$pass = '';

try {
	$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
} catch (Exception $e) {
    log_php_error('DB Connection Error: ' . $e->getMessage());
	die(json_encode(["error" => $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true) ?: [];
// Log all incoming requests (after $data is defined)
log_php_error('Request: ' . $_SERVER['REQUEST_METHOD'] . ' ' . ($_GET['table'] ?? ($data['table'] ?? '')) . ' | Data: ' . json_encode($data));
// CORS Headers
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, GET, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

$host = '127.0.0.1';
$db   = 'ethans_cafe';
$user = 'root';
$pass = '';

try {
	$pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
} catch (Exception $e) {
    log_php_error('DB Connection Error: ' . $e->getMessage());
	die(json_encode(["error" => $e->getMessage()]));
}

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true) ?: [];

// Table whitelist and columns
$TABLES = [
	'roles' => ['id', 'name', 'permissions'],
	'users' => ['id', 'full_name', 'username', 'email', 'password_hash', 'role_id', 'status', 'last_login', 'created_at', 'updated_at', 'deleted_at'],
	'account_requests' => ['id', 'full_name', 'username', 'email', 'password_hash', 'requested_role_id', 'status', 'requested_at', 'reviewed_by', 'reviewed_at', 'notes'],
	'menu_categories' => ['id', 'name', 'description'],
	'menu_items' => ['id', 'name', 'category_id', 'description', 'recipe', 'price_reference', 'status', 'image_path', 'created_at', 'updated_at'],
	'ingredient_categories' => ['id', 'name'],
	'units' => ['id', 'name'],
	'ingredients' => ['id', 'name', 'category_id', 'unit_id', 'current_quantity', 'low_stock_threshold', 'status', 'created_at', 'updated_at'],
	'recipes' => ['id', 'menu_item_id', 'ingredient_id', 'qty_per_sale', 'unit_id'],
	'sales' => ['id', 'receipt_no', 'sale_datetime', 'staff_id', 'total_items', 'notes', 'created_at'],
	'sale_items' => ['id', 'sale_id', 'menu_item_id', 'quantity'],
	'inventory_transactions' => ['id', 'ingredient_id', 'change_qty', 'transaction_type', 'reason', 'performed_by', 'prev_qty', 'new_qty', 'timestamp'],
	'activity_logs' => ['id', 'user_id', 'role_label', 'action', 'reference', 'status', 'ip_address', 'created_at'],
	'requests_tbl' => ['id', 'type', 'requester_id', 'target_id', 'payload', 'status', 'created_at', 'handled_by', 'handled_at'],
	'backups' => ['id', 'name', 'type', 'file_path', 'created_at', 'size'],
	'system_settings' => ['key', 'value', 'updated_at'],
	'temporary_account_log' => ['id', 'activated_by', 'activated_at', 'deactivated_at', 'note']
];

// Get table name from query string or body
$table = $_GET['table'] ?? $data['table'] ?? null;
if (!$table || !isset($TABLES[$table])) {
	echo json_encode(["error" => "Invalid or missing table name"]); exit;
}
$COLUMNS = $TABLES[$table];

switch($method) {
	case 'POST':
		$filtered = array_intersect_key($data, array_flip($COLUMNS));
		// Hash password for users and account_requests (but only if not already hashed)
		if (($table === 'users' || $table === 'account_requests') && isset($filtered['password_hash'])) {
			if (strpos($filtered['password_hash'], '$2y$') !== 0) {
				$filtered['password_hash'] = password_hash($filtered['password_hash'], PASSWORD_DEFAULT);
			}
		}
		$keys = implode(', ', array_keys($filtered));
		$placeholders = implode(', ', array_fill(0, count($filtered), '?'));
		try {
			$stmt = $pdo->prepare("INSERT INTO `$table` ($keys) VALUES ($placeholders)");
			$stmt->execute(array_values($filtered));
			echo json_encode(["message" => "Added successfully", "id" => $pdo->lastInsertId()]);
		} catch (Exception $e) {
			log_php_error('POST error: ' . $e->getMessage() . ' | Data: ' . json_encode($filtered));
			echo json_encode(["error" => $e->getMessage()]);
		}
		break;
	case 'GET':
		$sql = "SELECT * FROM `$table`";
		// Optional: filter by query string
		$filters = array_intersect_key($_GET, array_flip($COLUMNS));
		unset($filters['table']);
		if ($filters) {
			$where = [];
			foreach ($filters as $k => $v) {
				$where[] = "$k = :$k";
			}
			$sql .= " WHERE " . implode(' AND ', $where);
		}
		try {
			$stmt = $pdo->prepare($sql);
			if ($filters) {
				foreach ($filters as $k => $v) {
					$stmt->bindValue(":$k", $v);
				}
			}
			$stmt->execute();
			echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
		} catch (Exception $e) {
			log_php_error('GET error: ' . $e->getMessage() . ' | SQL: ' . $sql);
			echo json_encode(["error" => $e->getMessage()]);
		}
		break;
	case 'PUT':
		if (!isset($data['id']) && !isset($data['key'])) {
			echo json_encode(["error" => "Missing id/key for update"]); exit;
		}
		$idField = in_array('id', $COLUMNS) ? 'id' : 'key';
		$id = $data[$idField];
		unset($data[$idField]);
		$filtered = array_intersect_key($data, array_flip($COLUMNS));
		// Hash password for users and account_requests (but only if not already hashed)
		if (($table === 'users' || $table === 'account_requests') && isset($filtered['password_hash'])) {
			if (strpos($filtered['password_hash'], '$2y$') !== 0) {
				$filtered['password_hash'] = password_hash($filtered['password_hash'], PASSWORD_DEFAULT);
			}
		}
		$set = [];
		foreach ($filtered as $k => $v) {
			$set[] = "$k = ?";
		}
		try {
			$stmt = $pdo->prepare("UPDATE `$table` SET ".implode(', ', $set)." WHERE $idField = ?");
			$stmt->execute(array_merge(array_values($filtered), [$id]));
			echo json_encode(["message" => "Updated successfully"]);
		} catch (Exception $e) {
			log_php_error('PUT error: ' . $e->getMessage() . ' | Data: ' . json_encode($filtered));
			echo json_encode(["error" => $e->getMessage()]);
		}
		break;
	case 'DELETE':
		$idField = in_array('id', $COLUMNS) ? 'id' : 'key';
		if (!isset($data[$idField])) {
			echo json_encode(["error" => "Missing id/key for delete"]); exit;
		}
		try {
			$stmt = $pdo->prepare("DELETE FROM `$table` WHERE $idField = ?");
			$stmt->execute([$data[$idField]]);
			echo json_encode(["message" => "Deleted successfully"]);
		} catch (Exception $e) {
			log_php_error('DELETE error: ' . $e->getMessage() . ' | ID: ' . $data[$idField]);
			echo json_encode(["error" => $e->getMessage()]);
		}
		break;
	default:
		log_php_error('Unsupported method: ' . $method);
		echo json_encode(["error" => "Unsupported method"]);
}
?>
