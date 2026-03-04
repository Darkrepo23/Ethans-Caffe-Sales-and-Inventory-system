<?php
/**
 * SECURE CONFIGURATION FILE
 * ============================================
 * IMPORTANT: This file contains sensitive credentials.
 *
 * For production deployment:
 * 1. Move this file OUTSIDE your web root
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
define('SUPABASE_SERVICE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwdXlpYWFkbmlydm52emp1Z3F6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTgyNTU3MCwiZXhwIjoyMDg3NDAxNTcwfQ.j9xKF31en8cs3cazuJxkr0p9KVcZo7CFelXIZbeiaPA');

// Master Unlock Access Code
define('MASTER_ACCESS_CODE', 'ETHANS-0491-772-CAFE');

// Frontend Unlock Sequence
define('FRONTEND_UNLOCK_SEQUENCE', 'ETHANS-4726');

// Load Supabase API helper
require_once __DIR__ . '/supabase-api.php';