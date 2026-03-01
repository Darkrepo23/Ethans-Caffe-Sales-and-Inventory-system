<?php
/**
 * Send email notifications for system events
 * Events: low_stock, expiring_ingredients, void_transaction, refund_transaction
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
    $eventType = $input['event_type'] ?? '';
    $eventData = $input['event_data'] ?? [];
    
    if (empty($eventType)) {
        echo json_encode(['success' => false, 'message' => 'Event type is required']);
        exit;
    }
    
    // Connect to database to get admin emails and check settings
    $pdo = new PDO(
        "pgsql:host=" . SUPABASE_HOST . ";port=" . SUPABASE_PORT . ";dbname=" . SUPABASE_DB,
        SUPABASE_USER,
        SUPABASE_PASSWORD
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Check if email notifications are enabled
    $stmt = $pdo->prepare("SELECT value FROM system_settings WHERE key = 'enable_email_notifications'");
    $stmt->execute();
    $setting = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$setting || $setting['value'] !== 'true') {
        echo json_encode(['success' => true, 'message' => 'Email notifications are disabled', 'sent' => false]);
        exit;
    }
    
    // Get admin email addresses
    $stmt = $pdo->prepare("
        SELECT u.email, u.full_name
        FROM users u
        JOIN roles r ON u.role_id = r.id
        WHERE r.name IN ('Admin', 'admin')
        AND u.status = 'active'
        AND u.email IS NOT NULL
        AND u.email != ''
    ");
    $stmt->execute();
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($admins)) {
        echo json_encode(['success' => false, 'message' => 'No admin email addresses found']);
        exit;
    }
    
    // Build email content based on event type
    $subject = '';
    $body = '';
    $restaurantName = 'Ethan\'s Cafe';
    $timestamp = date('Y-m-d H:i:s');
    
    switch ($eventType) {
        case 'low_stock':
            $subject = "[{$restaurantName}] Low Stock Alert";
            $items = $eventData['items'] ?? [];
            $body = "LOW STOCK ALERT\n";
            $body .= "Generated: {$timestamp}\n\n";
            $body .= "The following ingredients are running low:\n\n";
            foreach ($items as $item) {
                $body .= "- {$item['name']}: {$item['quantity']} {$item['unit']} (Threshold: {$item['threshold']})\n";
            }
            $body .= "\nPlease restock these items soon.";
            break;
            
        case 'expiring_ingredients':
            $subject = "[{$restaurantName}] Expiring Ingredients Alert";
            $items = $eventData['items'] ?? [];
            $body = "EXPIRING INGREDIENTS ALERT\n";
            $body .= "Generated: {$timestamp}\n\n";
            $body .= "The following ingredients are expiring soon:\n\n";
            foreach ($items as $item) {
                if ($item['status'] === 'expired') {
                    $body .= "- {$item['name']}: EXPIRED {$item['days']} days ago\n";
                } else {
                    $body .= "- {$item['name']}: Expires in {$item['days']} days\n";
                }
            }
            $body .= "\nPlease check these ingredients.";
            break;
            
        case 'void_transaction':
            $subject = "[{$restaurantName}] Transaction Voided";
            $body = "TRANSACTION VOIDED\n";
            $body .= "Generated: {$timestamp}\n\n";
            $body .= "Transaction ID: " . ($eventData['transaction_id'] ?? 'N/A') . "\n";
            $body .= "Original Amount: " . ($eventData['original_amount'] ?? 'N/A') . "\n";
            $body .= "Voided By: " . ($eventData['staff_name'] ?? 'N/A') . "\n";
            $body .= "Reason: " . ($eventData['reason'] ?? 'N/A') . "\n";
            if (!empty($eventData['manager_approved'])) {
                $body .= "Manager Approved: " . ($eventData['manager_name'] ?? 'Yes') . "\n";
            }
            break;
            
        case 'refund_transaction':
            $subject = "[{$restaurantName}] Transaction Refunded";
            $body = "TRANSACTION REFUNDED\n";
            $body .= "Generated: {$timestamp}\n\n";
            $body .= "Transaction ID: " . ($eventData['transaction_id'] ?? 'N/A') . "\n";
            $body .= "Original Amount: " . ($eventData['original_amount'] ?? 'N/A') . "\n";
            $body .= "Refund Amount: " . ($eventData['refund_amount'] ?? 'N/A') . "\n";
            $body .= "Refund Type: " . ($eventData['refund_type'] ?? 'N/A') . "\n";
            $body .= "Processed By: " . ($eventData['staff_name'] ?? 'N/A') . "\n";
            $body .= "Reason: " . ($eventData['reason'] ?? 'N/A') . "\n";
            break;
            
        case 'daily_summary':
            $subject = "[{$restaurantName}] Daily Summary";
            $body = "DAILY SUMMARY\n";
            $body .= "Date: {$timestamp}\n\n";
            $body .= "Total Sales: " . ($eventData['total_sales'] ?? 0) . "\n";
            $body .= "Total Revenue: " . ($eventData['total_revenue'] ?? '0.00') . "\n";
            $body .= "Voids: " . ($eventData['void_count'] ?? 0) . "\n";
            $body .= "Refunds: " . ($eventData['refund_count'] ?? 0) . "\n";
            break;
            
        default:
            $subject = "[{$restaurantName}] System Notification";
            $body = "System Event: {$eventType}\n";
            $body .= "Timestamp: {$timestamp}\n";
            $body .= "Data: " . json_encode($eventData, JSON_PRETTY_PRINT);
    }
    
    // Add footer
    $body .= "\n\n---\nThis is an automated message from {$restaurantName} POS System.\n";
    $body .= "Do not reply to this email.";
    
    // Get email recipients
    $recipients = array_column($admins, 'email');
    
    // Send email
    $headers = "From: noreply@ethanscafe.com\r\n";
    $headers .= "Reply-To: noreply@ethanscafe.com\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion();
    
    $emailsSent = 0;
    $emailsFailed = 0;
    
    foreach ($recipients as $to) {
        if (filter_var($to, FILTER_VALIDATE_EMAIL)) {
            if (mail($to, $subject, $body, $headers)) {
                $emailsSent++;
            } else {
                $emailsFailed++;
            }
        }
    }
    
    // Log the notification attempt
    $stmt = $pdo->prepare("
        INSERT INTO activity_logs (user_id, role_label, action, reference, status, ip_address, created_at)
        VALUES (NULL, 'System', 'Email Notification', :event_type, :status, :ip, NOW())
    ");
    $stmt->execute([
        'event_type' => $eventType,
        'status' => $emailsSent > 0 ? 'Sent' : 'Failed',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'localhost'
    ]);
    
    echo json_encode([
        'success' => true, 
        'sent' => $emailsSent > 0,
        'emails_sent' => $emailsSent,
        'emails_failed' => $emailsFailed,
        'message' => $emailsSent > 0 ? 'Notifications sent successfully' : 'Failed to send notifications'
    ]);
    
} catch (PDOException $e) {
    error_log('Email notification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error']);
} catch (Exception $e) {
    error_log('Email notification error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error']);
}
