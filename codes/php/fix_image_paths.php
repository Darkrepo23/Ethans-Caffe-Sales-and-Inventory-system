<?php
/**
 * Fix image paths in database - removes any absolute or folder-specific paths
 * Makes all image paths relative to the codes/ folder
 */
header('Content-Type: text/html; charset=UTF-8');

require_once 'supabase-api.php';

echo "<h2>Image Path Fixer</h2>";

// Get all menu items with image paths
$menuItems = $supabase->select('menu_items', []);

if (!is_array($menuItems)) {
    echo "<p style='color:red;'>Failed to fetch menu items</p>";
    exit;
}

$fixed = 0;
$skipped = 0;

echo "<h3>Processing menu items...</h3>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>ID</th><th>Name</th><th>Old Path</th><th>New Path</th><th>Status</th></tr>";

foreach ($menuItems as $item) {
    $oldPath = $item['image_path'] ?? '';
    
    if (empty($oldPath)) {
        $skipped++;
        continue;
    }
    
    $newPath = $oldPath;
    
    // Fix various path formats to be relative
    // Remove leading slash
    if (strpos($newPath, '/') === 0) {
        $newPath = substr($newPath, 1);
    }
    
    // Remove folder prefixes like "Ethans Cafe/codes/" or "Ethans Cafe1/codes/"
    if (preg_match('#^.*?/codes/#', $newPath, $matches)) {
        $newPath = preg_replace('#^.*?/codes/#', '', $newPath);
    }
    
    // If path starts with http/https (Supabase storage), leave it alone
    if (strpos($oldPath, 'http://') === 0 || strpos($oldPath, 'https://') === 0) {
        $newPath = $oldPath;
        $skipped++;
        continue;
    }
    
    // Make sure it starts with resources/ if it's a local upload
    if (strpos($newPath, 'uploads/') === 0) {
        $newPath = 'resources/' . $newPath;
    }
    
    $status = 'OK';
    if ($newPath !== $oldPath) {
        // Update in database
        $result = $supabase->update('menu_items', 
            ['image_path' => $newPath],
            ['id' => 'eq.' . $item['id']]
        );
        
        if (isset($result['error'])) {
            $status = '❌ Error';
        } else {
            $status = '✅ Fixed';
            $fixed++;
        }
    } else {
        $status = '— No change';
        $skipped++;
    }
    
    echo "<tr>";
    echo "<td>{$item['id']}</td>";
    echo "<td>{$item['name']}</td>";
    echo "<td><code>" . htmlspecialchars($oldPath) . "</code></td>";
    echo "<td><code>" . htmlspecialchars($newPath) . "</code></td>";
    echo "<td>$status</td>";
    echo "</tr>";
}

echo "</table>";
echo "<h3>Summary</h3>";
echo "<p><strong>Fixed:</strong> $fixed items</p>";
echo "<p><strong>Skipped (no change needed):</strong> $skipped items</p>";
echo "<p style='color:green;'>✅ Done! Your images should now load from any folder.</p>";
echo "<p><strong>Delete this file after use for security.</strong></p>";
?>
