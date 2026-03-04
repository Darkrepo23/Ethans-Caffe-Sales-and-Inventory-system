<?php
// delete_otp.php
require_once 'config.php';
$email = $_POST['email'] ?? '';
if ($email) {
    $stmt = $conn->prepare('DELETE FROM password_reset_otps WHERE email = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $stmt->close();
}
echo json_encode(['status' => 'ok']);