<?php
// Staff database connection helper (returns a PDO instance)
function getStaffDBConnection(): PDO
{
    $host = '127.0.0.1';
    $db   = 'ethans_cafe_staff';
    $user = 'root';
    $pass = '';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        return new PDO($dsn, $user, $pass, $options);
    } catch (PDOException $e) {
        throw new RuntimeException('Staff DB connection failed: ' . $e->getMessage());
    }
}

// Usage example:
// require_once __DIR__ . '/staff_db_connection.php';
// $pdo = getStaffDBConnection();
// $stmt = $pdo->query('SELECT * FROM staff LIMIT 1');
// $row = $stmt->fetch();
