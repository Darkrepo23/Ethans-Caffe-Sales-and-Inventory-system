<?php
/**
 * SECURE CONFIGURATION FILE
 * ============================================
 * IMPORTANT: This file contains sensitive credentials.
 * 
 * For production deployment:
 * 1. Move this file OUTSIDE your web root (e.g., C:\xam\config\ethans_config.php)
 * 2. Update the require_once paths in other PHP files
 * 3. Set restrictive file permissions
 * 4. Never commit this file to version control
 * 
 * Add to .gitignore:
 *   php/config.php
 */

// Supabase Configuration
define('SUPABASE_URL', 'https://kpuyiaadnirvnvzjugqz.supabase.co');
define('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXlpYWFkbmlydm52emp1Z3F6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4MjU1NzAsImV4cCI6MjA4NzQwMTU3MH0.BdeFCxm3m4s_EgIJ8GVbBMzGIM8sWIy6FZwprA87aUc');

// REPLACE WITH YOUR SERVICE_ROLE KEY FOR BETTER SECURITY:
// This bypasses RLS and should ONLY be used server-side
// define('SUPABASE_SERVICE_KEY', 'your-service-role-key-here');

// Master Unlock Access Code
// Change this to your own secure code
define('MASTER_ACCESS_CODE', 'ETHANS-0491-772-CAFE');

// Frontend Unlock Sequence (used in index.html JavaScript)
// This is validated client-side to show the overlay, actual auth happens server-side
define('FRONTEND_UNLOCK_SEQUENCE', 'ETHANS-4726');

// Database Configuration (for local MySQL if needed)
define('DB_HOST', 'localhost');
define('DB_NAME', 'ethans_cafe');
define('DB_USER', 'root');
define('DB_PASS', '');
