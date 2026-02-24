<?php
header("Content-Type: text/html");
require_once 'supabase-api.php';

$newPassword = '123';
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

$result = $supabase->update('users', 
    ['password_hash' => $hashedPassword],
    ['username' => 'eq.admin']
);

if (isset($result[0])) {
    echo "✅ Admin password reset to: <strong>123</strong><br>";
    echo "Username: <strong>admin</strong><br>";
    echo "<br><a href='../index.html'>Go to Login</a>";
} else {
    echo "❌ Failed to reset password<br>";
    print_r($result);
}
?>
