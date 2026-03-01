# Ethan's Cafe - Point of Sale (POS) System

A comprehensive, web-based Point of Sale system designed for restaurant and cafe operations. Built with modern web technologies and powered by Supabase (PostgreSQL) for secure, real-time data management.

---

## Table of Contents

- [Features Overview](#features-overview)
- [Technology Stack](#technology-stack)
- [System Requirements](#system-requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [User Roles](#user-roles)
- [Staff Dashboard](#staff-dashboard)
- [Admin Dashboard](#admin-dashboard)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Security Features](#security-features)
- [Troubleshooting](#troubleshooting)

---

## Features Overview

### Core POS Features
- **Menu Sales** - Browse categories, add items to cart, process orders
- **Order Management** - Hold orders, modify quantities, apply discounts
- **Receipt Generation** - Generate and print receipts with transaction details
- **Transaction History** - View, filter, and manage past transactions
- **Inventory Tracking** - Real-time ingredient stock monitoring

### Administrative Features
- **User Management** - Create, edit, deactivate staff accounts
- **Role-Based Access Control** - Admin, Staff, and Cashier roles
- **Sales Reports** - Daily, weekly, monthly revenue analytics with charts
- **Menu Control** - Add/edit menu items, categories, pricing
- **Recipe Management** - Link ingredients to menu items for automatic deduction
- **Backup System** - Manual and scheduled database backups
- **Activity Logging** - Complete audit trail of all system actions
- **System Settings** - Configure discounts, coupons, and POS behavior

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **UI Framework** | Bootstrap 5.3 |
| **Icons** | Font Awesome 6.4 |
| **Animations** | Animate.css |
| **Alerts/Modals** | SweetAlert2 |
| **Charts** | Chart.js |
| **Backend API** | PHP 8.x |
| **Database** | Supabase (PostgreSQL) |
| **Server** | XAMPP/Apache (Local) |

---

## System Requirements

### Server Requirements
- XAMPP 8.0+ (or Apache with PHP 8.x)
- PHP 8.0 or higher
- cURL extension enabled
- JSON extension enabled
- Internet connection (for Supabase)

### Client Requirements
- Modern web browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Screen resolution: 1024x768 minimum (responsive design)

---

## Installation

### 1. Clone or Download
```bash
# Place in your XAMPP htdocs folder
cd C:\xampp\htdocs
# Clone or copy the project folder
```

### 2. Configure Database Connection
```bash
# Navigate to PHP config
cd codes/php

# Copy sample config
copy config.sample.php config.php

# Edit config.php with your Supabase credentials
```

### 3. Set Up Supabase
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `sql/ethans_cafe (1).sql`
3. Copy your Project URL and API keys

### 4. Access the System
```
http://localhost/Ethans Cafe1/codes/index.html
```

---

## Configuration

### config.php Settings

```php
// Supabase Configuration
define('SUPABASE_URL', 'https://your-project.supabase.co');
define('SUPABASE_ANON_KEY', 'your-anon-key');
define('SUPABASE_SERVICE_KEY', 'your-service-role-key'); // For RLS bypass

// Master Unlock Access Code (for account recovery)
define('MASTER_ACCESS_CODE', 'YOUR-SECURE-CODE');
```

### System Settings (Admin Panel)
- `enable_discount` - Enable/disable discount button
- `enable_coupon` - Enable/disable coupon button
- `receipt_footer` - Custom receipt footer text
- `store_name` - Business name on receipts

---

## User Roles

| Role | Access Level | Capabilities |
|------|--------------|--------------|
| **Admin/Owner** | Full | All features, user management, reports, settings |
| **Staff** | Operations | Menu sales, ingredients, held orders, receipts |
| **Cashier** | Limited | Menu sales, basic transactions |

### Default Accounts
| Username | Password | Role |
|----------|----------|------|
| admin | 123 | Administrator |
| staff | 123 | Staff |

> ⚠️ **Security Note**: Change default passwords immediately after installation!

---

## Staff Dashboard

### Menu Sales (`staff-dashboard.html`)
The primary POS interface for processing orders.

**Features:**
- Category-based menu navigation
- Real-time cart with quantity adjustments
- Discount and coupon application
- Payment processing
- Receipt preview and printing

**Usage:**
1. Select a category tab to view menu items
2. Click items to add to cart
3. Adjust quantities using +/- buttons
4. Apply discounts if enabled
5. Click "Complete Sale" to process
6. Print or save receipt

### Ingredients Management (`staff-ingredients.html`)
Track and manage inventory stock levels.

**Features:**
- View all ingredients with stock levels
- Low stock warnings (highlighted in red)
- Stock adjustment (add/subtract)
- Expiry date tracking
- Filter by category

### Held Orders (`staff-held-orders.html`)
Save orders for later completion.

**Features:**
- Hold current cart with customer name
- View all held orders
- Restore held orders to cart
- Delete unwanted holds

### Receipts/Transactions (`staff-receipts.html`)
View and manage completed transactions.

**Features:**
- Transaction history with date filtering
- View sale details (items, quantities, prices)
- Delete selected or all transactions
- Export capabilities

### Account Settings (`staff-account.html`)
Manage personal account details.

**Features:**
- View account information
- Change password
- Request account changes (requires admin approval)

### Activity Log (`staff-activity.html`)
View personal activity history.

---

## Admin Dashboard

### Dashboard Overview (`admin-dashboard.html`)
Central hub with key metrics and notifications.

**Widgets:**
- Today's Revenue
- Total Transactions
- Active Users
- Low Stock Alerts
- Pending Requests (notification bell)

### User Management (`admin-user-management.html`)
Complete user administration.

**Features:**
- Create new user accounts
- Edit user details and roles
- Activate/deactivate accounts
- Soft delete (preserves history)
- View user activity

### Account Requests (`admin-requests.html`)
Handle staff registration requests.

**Features:**
- Review pending requests
- Approve with role assignment
- Reject with reason
- View request history

### Temporary Accounts (`admin-temp-account.html`)
Create time-limited access accounts.

**Features:**
- Generate temporary credentials
- Set expiration time
- Auto-expire functionality
- Track usage

### Menu Control (`admin-menu-control.html`)
Manage menu items and categories.

**Features:**
- Add/edit/delete menu items
- Manage categories
- Set pricing
- Upload item images
- Enable/disable items

### Recipe Control (`admin-recipe-control.html`)
Link ingredients to menu items.

**Features:**
- Define ingredient quantities per menu item
- Automatic stock deduction on sale
- Multiple ingredients per item
- Unit conversion support

### Ingredients Masterlist (`admin-ingredients-masterlist.html`)
Full ingredient management.

**Features:**
- Add new ingredients
- Set low stock thresholds
- Manage ingredient categories
- Define measurement units
- Track expiry dates

### Reports (`admin-reports.html`)
Comprehensive sales analytics.

**Features:**
- Date range filtering
- Revenue summaries
- Transaction details table
- Interactive charts (daily/weekly/monthly)
- Transaction adjustments
- Excel export

### Backup System (`admin-backup.html`)
Database backup management.

**Features:**
- Manual backup creation
- Download backup files (JSON format)
- Restore from backup
- Scheduled backup settings
- Backup retention policies

### Activity Logs (`admin-activity-log.html`)
System-wide audit trail.

**Features:**
- All user activities
- Filter by date, user, action type
- IP address tracking
- Export capabilities

### System Settings (`admin-system-settings.html`)
Global system configuration.

**Features:**
- Toggle discount/coupon features
- Set manager PIN for overrides
- Configure receipt settings
- Database maintenance options

---

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `users` | User accounts and credentials |
| `roles` | Role definitions (admin, staff, cashier) |
| `sales` | Transaction records |
| `sale_items` | Items in each transaction |
| `menu_items` | Menu products |
| `menu_categories` | Product categories |
| `ingredients` | Inventory items |
| `recipes` | Ingredient-to-menu mappings |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `activity_logs` | Audit trail |
| `notifications` | System notifications |
| `account_requests` | Registration requests |
| `temp_accounts` | Temporary access |
| `backup_settings` | Backup configuration |
| `system_settings` | Key-value settings |
| `user_sessions` | Active sessions |
| `inventory_transactions` | Stock changes |

---

## API Reference

### Base URL
```
/codes/php/app.php
```

### Methods

#### GET - Retrieve Data
```javascript
fetch('php/app.php?table=menu_items')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### POST - Create Record
```javascript
fetch('php/app.php', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ table: 'sales', ...data })
});
```

#### PUT - Update Record
```javascript
fetch('php/app.php', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ table: 'users', id: 1, status: 'active' })
});
```

#### DELETE - Remove Record
```javascript
fetch('php/app.php', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ table: 'sales', id: 123 })
});
```

### Specialized Endpoints

| Endpoint | Purpose |
|----------|---------|
| `login.php` | User authentication |
| `logout.php` | Session termination |
| `session.php` | Session validation |
| `backup.php` | Backup operations |
| `notifications.php` | Notification management |
| `account_request.php` | Registration handling |
| `master_unlock.php` | Emergency account recovery |

---

## Security Features

### Authentication
- Session-based authentication with PHP sessions
- Password hashing using `password_hash()` (bcrypt)
- Session token validation on each request
- Automatic session expiration

### Authorization
- Role-based access control (RBAC)
- Client-side route guards (localStorage)
- Server-side session validation
- API endpoint protection

### Account Security
- Account lockout after failed attempts
- Login attempt tracking
- IP address logging
- Activity audit trails

### Data Protection
- Supabase Row Level Security (RLS)
- Service role key for server-side operations
- Input sanitization
- SQL injection prevention via Supabase API

### Master Unlock
Emergency access system for locked accounts:
1. Access login page
2. Enter master unlock code
3. Reset any user password

---

## Troubleshooting

### Common Issues

#### "Invalid API key" Error
**Cause:** Supabase API key is incorrect or expired.
**Solution:** 
1. Verify keys in `codes/php/config.php`
2. Check Supabase dashboard for valid keys
3. Ensure `SUPABASE_SERVICE_KEY` is set for RLS bypass

#### Data Not Persisting
**Cause:** RLS blocking operations with anon key.
**Solution:**
1. Add `SUPABASE_SERVICE_KEY` to config
2. Or disable RLS on affected tables

#### "Session expired" Errors
**Cause:** PHP session timeout or invalid session.
**Solution:**
1. Log out and log back in
2. Clear browser localStorage
3. Check PHP session settings

#### Cannot Delete Records
**Cause:** RLS policies or localStorage fallback.
**Solution:**
1. Ensure service role key is configured
2. Clear localStorage: `localStorage.clear()`
3. Check console for specific errors

#### Menu Items Not Showing
**Cause:** Database connection issue or empty table.
**Solution:**
1. Verify Supabase connection
2. Check `menu_items` table has data
3. Ensure items have `status = 'active'`

### Debug Mode
Enable console logging by opening browser DevTools (F12) and checking the Console tab for detailed error messages.

### Log Files
- `codes/php/app_error.log` - API errors
- `codes/php/api_access.log` - Request logs

---

## File Structure

```
Ethans Cafe1/
├── codes/
│   ├── index.html              # Login page
│   ├── staff-dashboard.html    # Staff POS interface
│   ├── staff-*.html            # Staff module pages
│   ├── admin-dashboard.html    # Admin main page
│   ├── admin-*.html            # Admin module pages
│   ├── staff.js                # Staff JavaScript
│   ├── admin.js                # Admin JavaScript
│   ├── auth.js                 # Authentication logic
│   ├── style.css               # Shared styles
│   ├── staff.css               # Staff-specific styles
│   ├── admin.css               # Admin-specific styles
│   ├── php/
│   │   ├── app.php             # Main API endpoint
│   │   ├── config.php          # Database configuration
│   │   ├── supabase-api.php    # Supabase wrapper class
│   │   ├── login.php           # Authentication
│   │   └── ...                 # Other endpoints
│   └── resources/
│       ├── ethans logo.jpg     # Brand logo
│       ├── uploads/            # Uploaded images
│       └── backups/            # Backup files
├── sql/
│   └── ethans_cafe (1).sql     # Database schema
└── README.md                   # This file
```

---

## Support

For issues or feature requests, review the troubleshooting section above or check the activity logs for error details.

---

## License

This system is proprietary software developed for Ethan's Cafe operations.

---

**Version:** 2.0  
**Last Updated:** March 2026
