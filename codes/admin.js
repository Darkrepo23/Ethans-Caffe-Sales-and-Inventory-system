// Admin Dashboard JavaScript - Updated with User Management and Multi-page fixes
const API_URL = "php/app.php";

function createDB(table) {
    return {
        add: async (data) => {
            console.log(`[usersDB.add] Sending:`, { ...data, table });
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    body: JSON.stringify({ ...data, table })
                });
                console.log(`[usersDB.add] Response status:`, res.status);
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    console.log(`[usersDB.add] Response JSON:`, json);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return json;
                } catch (parseErr) {
                    console.error(`[usersDB.add] Response not JSON:`, text);
                    throw parseErr;
                }
            } catch (err) {
                console.error(`Add failed [${table}]:`, err);
                return { error: err.message };
            }
        },
        show: async (filters = {}) => {
            console.log(`[${table}DB.show] Filters:`, filters);
            try {
                const params = new URLSearchParams({ ...filters, table }).toString();
                const res = await fetch(`${API_URL}?${params}`, {
                    headers: {
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });
                console.log(`[${table}DB.show] Response status:`, res.status);
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    console.log(`[${table}DB.show] Response JSON:`, json);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return json;
                } catch (parseErr) {
                    console.error(`[${table}DB.show] Response not JSON:`, text);
                    throw parseErr;
                }
            } catch (err) {
                console.error(`Show failed [${table}]:`, err);
                return [];
            }
        },
        edit: async (data) => {
            console.log(`[${table}DB.edit] Data:`, data);
            try {
                if (!data.id && !data.key) throw new Error("Missing id/key for update");
                const res = await fetch(API_URL, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    body: JSON.stringify({ ...data, table })
                });
                console.log(`[${table}DB.edit] Response status:`, res.status);
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    console.log(`[${table}DB.edit] Response JSON:`, json);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return json;
                } catch (parseErr) {
                    console.error(`[${table}DB.edit] Response not JSON:`, text);
                    throw parseErr;
                }
            } catch (err) {
                console.error(`Edit failed [${table}]:`, err);
                return { error: err.message };
            }
        },
        delete: async (idOrKey) => {
            console.log(`[${table}DB.delete] Key:`, idOrKey);
            try {
                const keyName = typeof idOrKey === 'object' ? Object.keys(idOrKey)[0] : (table === 'system_settings' ? 'key' : 'id');
                const keyValue = typeof idOrKey === 'object' ? Object.values(idOrKey)[0] : idOrKey;
                const res = await fetch(API_URL, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "X-Requested-With": "XMLHttpRequest"
                    },
                    body: JSON.stringify({ [keyName]: keyValue, table })
                });
                console.log(`[${table}DB.delete] Response status:`, res.status);
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    console.log(`[${table}DB.delete] Response JSON:`, json);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return json;
                } catch (parseErr) {
                    console.error(`[${table}DB.delete] Response not JSON:`, text);
                    throw parseErr;
                }
            } catch (err) {
                console.error(`Delete failed [${table}]:`, err);
                return { error: err.message };
            }
        }
    };
}

// Ready-to-use DB objects for each table
const rolesDB = createDB('roles');
const usersDB = createDB('users');
const accountRequestsDB = createDB('account_requests');
const menuCategoriesDB = createDB('menu_categories');
const menuItemsDB = createDB('menu_items');
const ingredientCategoriesDB = createDB('ingredient_categories');
const unitsDB = createDB('units');
const ingredientsDB = createDB('ingredients');
const recipesDB = createDB('recipes');
const salesDB = createDB('sales');
const saleItemsDB = createDB('sale_items');
const inventoryTransactionsDB = createDB('inventory_transactions');
const activityLogsDB = createDB('activity_logs');
const requestsTblDB = createDB('requests_tbl');
const backupsDB = createDB('backups');
const systemSettingsDB = createDB('system_settings');
const temporaryAccountLogDB = createDB('temporary_account_log');

// Global variables
let tempAccountActive = false;
let currentRequestType = null;
let currentRequestId = null;
let realtimeRefreshInterval = null;


function loadDashboardStats() {
    // Ingredients to Restock + Low Stock Table
    Promise.all([
        ingredientsDB.show(),
        ingredientCategoriesDB.show()
    ]).then(function (results) {
        const ingredients = Array.isArray(results[0]) ? results[0] : [];
        const categories = Array.isArray(results[1]) ? results[1] : [];

        const categoryMap = {};
        categories.forEach(function (cat) {
            categoryMap[cat.id] = cat.name;
        });

        // Count restock
        const lowItems = ingredients.filter(function (ing) {
            return parseFloat(ing.current_quantity) <= parseFloat(ing.low_stock_threshold);
        });

        const restockEl = document.getElementById('ingredientsRestock');
        if (restockEl) {
            const currentCount = parseInt(restockEl.textContent);
            if (currentCount !== lowItems.length && !isNaN(currentCount)) {
                restockEl.classList.add('animate__animated', 'animate__pulse');
                setTimeout(() => restockEl.classList.remove('animate__animated', 'animate__pulse'), 1000);
            }
            restockEl.textContent = lowItems.length;
        }

        // Total ingredients count
        const totalItemsEl = document.getElementById('totalIngredientsCount');
        if (totalItemsEl) totalItemsEl.textContent = ingredients.length;

        // Fill low stock table
        const lowStockTable = document.getElementById('lowStockTable');
        if (!lowStockTable) return;

        const tbody = lowStockTable.querySelector('tbody');
        if (!tbody) return;

        if (lowItems.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No low stock items.</td></tr>';
            return;
        }

        // Only update HTML if changed to prevent flicker
        const newHtml = lowItems.map(function (ing) {
            const isOut = parseFloat(ing.current_quantity) === 0;
            return `
                <tr>
                    <td><strong>${ing.name}</strong></td>
                    <td><span class="badge bg-secondary">${categoryMap[ing.category_id] || '—'}</span></td>
                    <td class="text-danger fw-bold">${ing.current_quantity}</td>
                    <td>${ing.low_stock_threshold}</td>
                    <td><span class="badge ${isOut ? 'bg-danger' : 'bg-warning'}">${isOut ? 'Out of Stock' : 'Low Stock'}</span></td>
                </tr>
            `;
        }).join('');

        if (tbody.innerHTML !== newHtml) {
            tbody.innerHTML = newHtml;
        }

    }).catch(function (err) {
        console.error('Failed to load ingredient stats:', err);
    });

    // Active Staff Accounts
    usersDB.show().then(function (users) {
        const staffCount = users.filter(function (u) {
            return parseInt(u.role_id) === 2 &&
                (u.status || '').trim().toLowerCase() === 'active' &&
                (u.deleted_at === null || u.deleted_at === undefined || u.deleted_at === '');
        }).length;

        const staffEl = document.getElementById('totalStaffAccounts');
        if (staffEl) staffEl.textContent = staffCount;

    }).catch(function (err) {
        console.error('Failed to load staff accounts:', err);
    });
}

// Call on page load
loadDashboardStats();


async function loadUnits() {
    console.log("🔄 loadUnits() called");

    const unitSelect = document.getElementById("ingredientUnit");

    if (!unitSelect) {
        console.error("❌ ingredientUnit element NOT FOUND");
        return;
    }

    console.log("✔ ingredientUnit element FOUND");

    unitSelect.innerHTML = `<option value="">Select Unit</option>`;

    try {
        console.log("📡 Fetching units from unitsDB.show()...");
        const units = await unitsDB.show();
        console.log("📥 Units received:", units);

        if (!units || units.length === 0) {
            console.warn("⚠ No units found");
            unitSelect.innerHTML = `<option value="">No units found</option>`;
            return;
        }

        console.log(`✔ ${units.length} units found. Rendering...`);

        units.forEach(unit => {
            const opt = document.createElement("option");
            opt.value = unit.id;
            opt.textContent = unit.short_name || unit.name;
            unitSelect.appendChild(opt);
        });

        console.log("🎉 Units successfully loaded!");

    } catch (error) {
        console.error("🔥 ERROR loading units:", error);
    }
}

// Run on page load
document.addEventListener("DOMContentLoaded", () => {
    console.log("🌐 DOMContentLoaded fired");
    loadUnits();
});


// Load ingredient categories into the select element
async function loadIngredientCategories() {
    const categorySelect = document.getElementById("ingredientCategory");

    if (!categorySelect) {
        console.error("❌ ingredientCategory element not found");
        return;
    }

    // Reset select
    categorySelect.innerHTML = `<option value="">Select Category</option>`;

    try {
        console.log("📡 Fetching categories from ingredientCategoriesDB...");
        const categories = await ingredientCategoriesDB.show();
        console.log("📥 Categories received:", categories);

        if (!Array.isArray(categories) || categories.length === 0) {
            categorySelect.innerHTML = `<option value="">No categories found</option>`;
            return;
        }

        categories.forEach(cat => {
            const opt = document.createElement("option");
            opt.value = cat.id;       // Save ID to ingredients table
            opt.textContent = cat.name; // Display name
            categorySelect.appendChild(opt);
        });

        console.log("🎉 Ingredient categories loaded successfully!");
    } catch (error) {
        console.error("🔥 ERROR loading ingredient categories:", error);
        categorySelect.innerHTML = `<option value="">Error loading categories</option>`;
    }
}

// Ensure DOM is ready before loading
document.addEventListener('DOMContentLoaded', () => {
    if (typeof ingredientCategoriesDB === 'undefined') {
        console.error("❌ ingredientCategoriesDB is not defined!");
        return;
    }
    loadIngredientCategories();
});


// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    // Initialize tooltips - only if bootstrap is available
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    // Initialize only the sections present on the current page
    initializeCommonAdminFeatures();

    // Auto-initialize based on elements present
    if (document.getElementById('lowStockTable')) initializeAdminDashboard();
    if (document.getElementById('menuControlTable')) initializeMenuControl();
    if (document.getElementById('recipeMappingTable')) initializeRecipeControl();
    if (document.getElementById('ingredientsMasterTable')) initializeIngredientsMasterlist();
    if (document.getElementById('activeUsersTable')) initializeUserManagement();
    if (document.getElementById('reports-content')) initializeReports();
    if (document.getElementById('backupsTable')) initializeBackup();
    if (document.getElementById('requestsTable')) initializeRequests();
    if (document.getElementById('systemSettingsForm')) initializeSystemSettings();
    updateRequestSidebarBadge();
    startRequestBadgePolling();
    if (document.getElementById('activityLogTable')) initializeActivityLog();
    if (document.getElementById('fullActivityLogTable')) initializeFullActivityLog();
    if (document.getElementById('tempStaffTable')) initializeTempAccount();

    // Start Real-time Auto Refresh (Consolidated)
    startGlobalAutoRefresh();

    // Load recent activities on the dashboard
    if (document.getElementById('recentActivities')) loadRecentActivities();
});

function startGlobalAutoRefresh() {
    // Clear existing if any
    if (realtimeRefreshInterval) clearInterval(realtimeRefreshInterval);

    // Initial calls
    updateAllData();

    // Set interval for every 5 seconds (Real-time Feel)
    realtimeRefreshInterval = setInterval(updateAllData, 5000);
}

function updateAllData() {
    // 1. Always update badges (Consolidated)
    updateSystemAlertsCount();
    updateRequestSidebarBadge();

    // 2. Refresh page-specific content if present
    if (document.getElementById('lowStockTable')) loadDashboardStats();
    if (document.getElementById('ingredientsMasterTable')) loadIngredientsMasterlist();
    if (document.getElementById('activeUsersTable')) loadActiveUsers(); // Corrected function name
    if (document.getElementById('requestsTable')) loadRequests();
    if (document.getElementById('menuControlTable')) loadMenuControl();
    if (document.getElementById('recipeMappingTable')) loadRecipeControl();
    if (document.getElementById('recentActivities')) loadRecentActivities();
}

// Common features for all admin pages
function initializeCommonAdminFeatures() {
    // Logout button (global)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔄 Admin logout initiated - showing confirmation dialog');

            showConfirm('Are you sure you want to logout?', function () {
                console.log('✅ Admin logout confirmed by user');

                // Get user info before clearing
                const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');

                // Log the logout activity
                logAdminActivity('Logged out', 'Admin session terminated', 'Success');

                // Mark user as inactive
                updateUserStatus(user.id, 'inactive').then(() => {
                    console.log('✅ Admin user marked as inactive');
                    localStorage.removeItem('loggedInRole');
                    localStorage.removeItem('loggedInUser');
                    console.log('🔐 Session cleared, redirecting to login...');
                    window.location.href = 'index.html';
                }).catch(err => {
                    console.error('❌ Failed to update status, but proceeding with logout:', err);
                    localStorage.removeItem('loggedInRole');
                    localStorage.removeItem('loggedInUser');
                    window.location.href = 'index.html';
                });
            });
        });
    }

    // Load sidebar badges
    updateRequestSidebarBadge();
}

// Admin Dashboard Functions
function initializeAdminDashboard() {
    // Export dashboard data button
    const exportDashboardBtn = document.getElementById('exportDashboardData');
    if (exportDashboardBtn) {
        exportDashboardBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to Export Dashboard Data?', function () {
                exportDashboardData();
            });
        });
    }

    // Generate report button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function () {
            window.location.href = 'admin-reports.html';
        });
    }

    // Load initial data
    loadAdminDashboardData();
}

function exportDashboardData() {
    // Simulate data export
    showModalNotification('Exporting dashboard data...', 'info', 'Exporting Data');

    setTimeout(() => {
        // Create a blob of the data
        const data = {
            timestamp: new Date().toISOString(),
            salesRecords: document.getElementById('totalSalesRecords')?.textContent || '0',
            staffAccounts: document.getElementById('totalStaffAccounts')?.textContent || '0',
            lowStockItems: document.getElementById('ingredientsRestock')?.textContent || '0',
            systemAlerts: document.getElementById('systemAlerts')?.textContent || '0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create download link
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showModalNotification('Dashboard data exported successfully', 'success', 'Export Complete');
    }, 1000);
}

async function loadLowStockData() {
    const tableElement = document.getElementById('lowStockTable');
    if (!tableElement) return;

    const lowStockTable = tableElement.getElementsByTagName('tbody')[0];
    if (!lowStockTable) return;

    try {
        const allIngredients = await ingredientsDB.show();
        if (!allIngredients || !Array.isArray(allIngredients)) {
            lowStockTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Unable to load ingredient data.</td></tr>';
            return;
        }
        const lowStockData = allIngredients.filter(ing => ing.current_quantity <= ing.low_stock_threshold);

        lowStockTable.innerHTML = '';

        if (lowStockData.length === 0) {
            lowStockTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">All ingredients are well-stocked.</td></tr>';
            return;
        }

        lowStockData.forEach(item => {
            const row = lowStockTable.insertRow();
            row.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><span class="badge bg-secondary">${item.category_id || 'N/A'}</span></td>
                <td>${item.current_quantity} ${item.unit_id || 'unit'}</td>
                <td>${item.low_stock_threshold} ${item.unit_id || 'unit'}</td>
                <td><span class="badge bg-warning">Low</span></td>
            `;
        });
    } catch (error) {
        console.error('Error loading low stock data:', error);
        lowStockTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-3">Error loading data.</td></tr>';
    }
}

// Global variable for dashboard interval
let dashboardRefreshInterval;

function loadAdminDashboardData() {
    loadLowStockData().catch(err => console.error('Error loading low stock data:', err));

    ingredientsDB.show().then(allIngredients => {
        if (allIngredients && Array.isArray(allIngredients)) {
            const restockItems = allIngredients.filter(ing => ing.current_quantity <= ing.low_stock_threshold);
            const restockCount = document.getElementById('ingredientsRestock');
            if (restockCount) restockCount.textContent = restockItems.length;

            const alertsCount = document.getElementById('systemAlerts');
            if (alertsCount) alertsCount.textContent = restockItems.length > 0 ? '1' : '0';
        }
    }).catch(err => console.error('Error loading ingredients:', err));

    getUsers().then(users => {
        if (users && Array.isArray(users)) {
            const activeUsers = users.filter(u => !u.isDeleted);
            const staffCount = document.getElementById('totalStaffAccounts');
            if (staffCount) staffCount.textContent = activeUsers.length;
        }
    }).catch(err => console.error('Error loading users:', err));

    const salesCount = document.getElementById('totalSalesRecords');
    if (salesCount) salesCount.textContent = '85';

    // Set up auto-refresh if not already set (every 30 seconds)
    if (!dashboardRefreshInterval) {
        dashboardRefreshInterval = setInterval(() => {
            loadAdminDashboardData();
        }, 30000);
    }
}

// Menu Control Functions

// Get menu items from localStorage or seed with defaults
function getMenuItems() {
    let items = [];
    try {
        const stored = localStorage.getItem('adminMenuItems');
        if (stored) items = JSON.parse(stored);
    } catch (e) { items = []; }

    if (!items || items.length === 0) {
        items = [
            { id: 1, name: 'Beef Steak', category: 'Main Course', price: 24.99, status: 'Active', recipes: 4 },
            { id: 2, name: 'Chicken Curry', category: 'Main Course', price: 18.99, status: 'Active', recipes: 3 },
            { id: 3, name: 'Vegetable Salad', category: 'Appetizer', price: 9.99, status: 'Active', recipes: 3 },
            { id: 4, name: 'Garlic Bread', category: 'Appetizer', price: 7.99, status: 'Active', recipes: 3 },
            { id: 5, name: 'French Fries', category: 'Side Dish', price: 5.99, status: 'Active', recipes: 1 },
            { id: 6, name: 'Grilled Salmon', category: 'Main Course', price: 22.99, status: 'Inactive', recipes: 2 },
            { id: 7, name: 'Pasta Carbonara', category: 'Main Course', price: 16.99, status: 'Active', recipes: 3 },
            { id: 8, name: 'Chocolate Cake', category: 'Dessert', price: 8.99, status: 'Active', recipes: 3 }
        ];
        localStorage.setItem('adminMenuItems', JSON.stringify(items));
    }
    return items;
}

function saveMenuItemsToStorage(items) {
    localStorage.setItem('adminMenuItems', JSON.stringify(items));
}

// Variable to track if we are editing
let editingMenuItemId = null;

function initializeMenuControl() {
    // Add menu item button
    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', function () {
            editingMenuItemId = null;
            showAddMenuItemModal();
        });
    }

    // Show inactive items toggle
    const showInactiveItems = document.getElementById('showInactiveItems');
    if (showInactiveItems) {
        showInactiveItems.addEventListener('change', function () {
            loadMenuControl();
        });
    }

    // Search filter
    const searchInput = document.getElementById('menuControlSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            loadMenuControl();
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('menuControlCategory');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            loadMenuControl();
        });
    }

    // Initial Load
    loadMenuControl();
}

function loadMenuControl() {
    const tableElement = document.getElementById('menuControlTable');
    if (!tableElement) return;

    const menuControlTable = tableElement.getElementsByTagName('tbody')[0];
    if (!menuControlTable) return;

    const showInactive = document.getElementById('showInactiveItems') ? document.getElementById('showInactiveItems').checked : false;
    const searchQuery = (document.getElementById('menuControlSearch')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('menuControlCategory')?.value || '';

    // Only show loading if empty
    if (menuControlTable.children.length === 0 || (menuControlTable.children.length === 1 && menuControlTable.innerText.includes('Loading'))) {
        menuControlTable.innerHTML = '<tr><td colspan="7" class="text-center py-3"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</td></tr>';
    }

    Promise.all([
        menuItemsDB.show(),
        menuCategoriesDB.show()
    ]).then(function (results) {
        const allItems = Array.isArray(results[0]) ? results[0] : [];
        const categories = Array.isArray(results[1]) ? results[1] : [];

        const categoryMap = {};
        categories.forEach(function (cat) {
            categoryMap[cat.id] = cat.name;
        });

        let menuItems = allItems;

        if (!showInactive) {
            menuItems = menuItems.filter(function (item) {
                return (item.status || '').trim().toLowerCase() === 'active';
            });
        }

        if (searchQuery) {
            menuItems = menuItems.filter(function (item) {
                const catName = (categoryMap[item.category_id] || '').toLowerCase();
                return item.name.toLowerCase().includes(searchQuery) ||
                    catName.includes(searchQuery);
            });
        }

        if (categoryFilter) {
            menuItems = menuItems.filter(function (item) {
                return item.category_id == categoryFilter;
            });
        }

        if (menuItems.length === 0) {
            menuControlTable.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4"><i class="fas fa-utensils fa-2x mb-2 d-block"></i>No menu items found.</td></tr>';
            return;
        }

        const newHtml = menuItems.map(function (item) {
            const catName = categoryMap[item.category_id] || '—';
            const itemStatus = (item.status || '').trim();
            const isActive = itemStatus.toLowerCase() === 'active';
            const imageHtml = item.image_path
                ? `<img src="${item.image_path}" alt="${item.name}" class="rounded" style="width: 50px; height: 50px; object-fit: cover;">`
                : '<span class="text-muted"><i class="fas fa-image fa-2x"></i></span>';

            return `
                <tr class="animate__animated animate__fadeIn">
                    <td>${item.id}</td>
                    <td class="text-center">${imageHtml}</td>
                    <td><strong>${item.name}</strong></td>
                    <td><span class="badge bg-secondary">${catName}</span></td>
                    <td>₱${parseFloat(item.price_reference || 0).toFixed(2)}</td>
                    <td><span class="badge ${isActive ? 'bg-success' : 'bg-secondary'}">${itemStatus}</span></td>
                    <td><span class="badge bg-info">${item.recipe || 0} ingredients</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="editMenuItem(${item.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-${isActive ? 'warning' : 'success'}" onclick="toggleMenuItemStatus(${item.id})" title="${isActive ? 'Deactivate' : 'Activate'}">
                                <i class="fas fa-power-off"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteMenuItem(${item.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (menuControlTable.innerHTML !== newHtml) {
            menuControlTable.innerHTML = newHtml;
        }

        const totalElems = document.getElementById('totalMenuItems');
        if (totalElems) totalElems.textContent = `${allItems.length} Items`;

    }).catch(function (err) {
        console.error('Failed to load menu control:', err);
        menuControlTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle me-2"></i>Failed to load menu items.</td></tr>';
    });
}
function showAddMenuItemModal() {
    // Clear form
    const form = document.getElementById('addMenuItemForm');
    if (form) form.reset();

    // Reset recipe ingredients container
    const recipeContainer = document.getElementById('recipeIngredientsContainer');
    if (recipeContainer) {
        recipeContainer.innerHTML = '<p class="text-muted text-center py-2">No ingredients assigned yet</p>';
    }

    // Update modal title
    const modalTitle = document.querySelector('#addMenuItemModal .modal-title');
    if (modalTitle) {
        if (editingMenuItemId) {
            modalTitle.innerHTML = '<i class="fas fa-edit me-2"></i>Edit Menu Item';
        } else {
            modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Add Menu Item';
        }
    }

    // Load categories into dropdown
    menuCategoriesDB.show().then(function (categories) {
        const select = document.getElementById('menuItemCategory');
        if (!select) return;
        select.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(function (cat) {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            select.appendChild(opt);
        });

        // If editing, fetch item from DB and pre-fill after categories are loaded
        if (editingMenuItemId) {
            menuItemsDB.show({ id: editingMenuItemId }).then(function (items) {
                const item = Array.isArray(items) ? items[0] : items;
                if (!item) return;

                const nameEl = document.getElementById('menuItemName');
                const catEl = document.getElementById('menuItemCategory');
                const priceEl = document.getElementById('menuItemPrice');
                const statusEl = document.getElementById('menuItemStatus');
                const imagePathEl = document.getElementById('menuItemImagePath');
                const previewContainer = document.getElementById('imagePreviewContainer');
                const previewImg = document.getElementById('menuItemImagePreview');

                if (nameEl) nameEl.value = item.name || '';
                if (catEl) catEl.value = item.category_id || '';
                if (priceEl) priceEl.value = item.price_reference || '';
                if (statusEl) statusEl.value = item.status || 'Active';

                // Load existing image preview if available
                if (item.image_path) {
                    if (imagePathEl) imagePathEl.value = item.image_path;
                    if (previewImg) previewImg.src = item.image_path;
                    if (previewContainer) previewContainer.style.display = 'block';
                } else {
                    resetImagePreview();
                }

            }).catch(function (err) {
                console.error('Failed to load menu item for editing:', err);
            });
        }

    }).catch(function (err) {
        console.error('Failed to load categories:', err);
    });

    // Show modal
    const modalElem = document.getElementById('addMenuItemModal');
    if (!modalElem) return;

    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    // Add ingredient button — clone to remove old listeners
    const addIngBtn = document.getElementById('addIngredientToRecipe');
    if (addIngBtn) {
        const newBtn = addIngBtn.cloneNode(true);
        addIngBtn.parentNode.replaceChild(newBtn, addIngBtn);
        newBtn.addEventListener('click', function () {
            addIngredientToRecipeForm();
        });
    }

    // Save button — clone to remove old listeners
    const saveBtn = document.getElementById('saveMenuItemBtn');
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', function () {
            saveMenuItem();
        });
    }

    // Image preview functionality
    initializeImageUpload();

    // Reset image preview on new item
    if (!editingMenuItemId) {
        resetImagePreview();
    }
}

/**
 * Initialize image upload preview and handlers
 */
function initializeImageUpload() {
    const imageInput = document.getElementById('menuItemImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('menuItemImagePreview');
    const removeBtn = document.getElementById('removeImageBtn');
    const hiddenPath = document.getElementById('menuItemImagePath');

    if (!imageInput) return;

    // Clone to remove old listeners
    const newImageInput = imageInput.cloneNode(true);
    imageInput.parentNode.replaceChild(newImageInput, imageInput);

    // File selection preview
    newImageInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showModalNotification('Invalid file type. Allowed: JPEG, PNG, GIF, WebP', 'warning', 'Invalid File');
                e.target.value = '';
                return;
            }

            // Validate file size (5MB)
            if (file.size > 5 * 1024 * 1024) {
                showModalNotification('File too large. Maximum size is 5MB', 'warning', 'File Too Large');
                e.target.value = '';
                return;
            }

            // Show preview
            const reader = new FileReader();
            reader.onload = function (event) {
                if (previewImg) previewImg.src = event.target.result;
                if (previewContainer) previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // Remove image button
    if (removeBtn) {
        const newRemoveBtn = removeBtn.cloneNode(true);
        removeBtn.parentNode.replaceChild(newRemoveBtn, removeBtn);
        newRemoveBtn.addEventListener('click', function () {
            resetImagePreview();
        });
    }
}

/**
 * Reset image preview to default state
 */
function resetImagePreview() {
    const imageInput = document.getElementById('menuItemImage');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const previewImg = document.getElementById('menuItemImagePreview');
    const hiddenPath = document.getElementById('menuItemImagePath');

    if (imageInput) imageInput.value = '';
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (hiddenPath) hiddenPath.value = '';
}

/**
 * Upload image file to server
 * @returns {Promise<string|null>} - Returns uploaded image URL or null
 */
async function uploadMenuItemImage() {
    const imageInput = document.getElementById('menuItemImage');
    if (!imageInput || !imageInput.files || !imageInput.files[0]) {
        return null; // No image selected
    }

    const file = imageInput.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
        const response = await fetch('php/upload_file.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            console.log('Image uploaded:', result.url);
            return result.url;
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('Image upload error:', error);
        showModalNotification('Failed to upload image: ' + error.message, 'error', 'Upload Error');
        return null;
    }
}

function addIngredientToRecipeForm() {
    const container = document.getElementById('recipeIngredientsContainer');
    if (!container) return;

    // Clear "no ingredients" text if present
    if (container.querySelector('p.text-muted')) {
        container.innerHTML = '';
    }

    // Get available ingredients from localStorage or default list
    let ingredients = [];
    try {
        const stored = localStorage.getItem('ingredients');
        if (stored) {
            ingredients = JSON.parse(stored).map(i => ({ id: i.id, name: i.name }));
        }
    } catch (e) { }
    if (ingredients.length === 0) {
        ingredients = [
            { id: 1, name: 'Beef' }, { id: 2, name: 'Chicken' }, { id: 3, name: 'Rice' },
            { id: 4, name: 'Tomatoes' }, { id: 5, name: 'Onions' }, { id: 6, name: 'Garlic' },
            { id: 7, name: 'Salt' }, { id: 8, name: 'Flour' }, { id: 9, name: 'Cheese' },
            { id: 10, name: 'Butter' }, { id: 11, name: 'Potatoes' }, { id: 12, name: 'Lettuce' }
        ];
    }

    // Create ingredient row
    const row = document.createElement('div');
    row.className = 'row g-3 mb-3 align-items-center';
    row.innerHTML = `
        <div class="col-md-6">
            <select class="form-select ingredient-select">
                <option value="">Select Ingredient</option>
                ${ingredients.map(ing => `<option value="${ing.id}">${ing.name}</option>`).join('')}
            </select>
        </div>
        <div class="col-md-4">
            <div class="input-group">
                <input type="number" class="form-control ingredient-quantity" placeholder="Quantity" min="0.01" step="0.01">
                <span class="input-group-text">kg</span>
            </div>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-sm btn-outline-danger w-100 remove-ingredient">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    container.appendChild(row);

    // Add remove event listener
    row.querySelector('.remove-ingredient').addEventListener('click', function () {
        row.remove();
        if (container.querySelectorAll('.row').length === 0) {
            container.innerHTML = '<p class="text-muted text-center py-2">No ingredients assigned yet</p>';
        }
    });
}

async function saveMenuItem() {
    const nameElem = document.getElementById('menuItemName');
    const categoryElem = document.getElementById('menuItemCategory');
    const priceElem = document.getElementById('menuItemPrice');
    const statusElem = document.getElementById('menuItemStatus');
    if (!nameElem || !categoryElem) return;

    const name = nameElem.value.trim();
    const categoryId = categoryElem.value;
    const price = parseFloat(priceElem?.value) || 0;
    const status = statusElem?.value || 'Active';

    // Validation
    if (!name || !categoryId) {
        showModalNotification('Please fill in all required fields', 'warning', 'Validation Error');
        return;
    }

    // Count recipe ingredients assigned
    const ingredientRows = document.querySelectorAll('#recipeIngredientsContainer .ingredient-select');
    let recipesCount = 0;
    ingredientRows.forEach(sel => { if (sel.value) recipesCount++; });

    // Show loading state
    const saveBtn = document.getElementById('saveMenuItemBtn');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
    }

    try {
        // Upload image if selected
        let imagePath = document.getElementById('menuItemImagePath')?.value || null;
        const imageInput = document.getElementById('menuItemImage');
        if (imageInput && imageInput.files && imageInput.files[0]) {
            const uploadedUrl = await uploadMenuItemImage();
            if (uploadedUrl) {
                imagePath = uploadedUrl;
            }
        }

        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (editingMenuItemId) {
            // --- EDIT existing item in DB ---
            const updateData = {
                id: editingMenuItemId,
                name: name,
                category_id: parseInt(categoryId),
                price_reference: price,
                status: status,
                recipe: recipesCount,
                updated_at: now
            };

            // Only update image if a new one was uploaded
            if (imagePath) {
                updateData.image_path = imagePath;
            }

            await menuItemsDB.edit(updateData);

            // Close modal
            const modalElem = document.getElementById('addMenuItemModal');
            const modal = bootstrap.Modal.getInstance(modalElem);
            if (modal) modal.hide();

            showModalNotification(`Menu item "${name}" updated successfully`, 'success', 'Menu Item Updated');
            logAdminActivity('Updated menu item', name, 'Success');
            editingMenuItemId = null;
        } else {
            // --- ADD new item to DB ---
            const newItem = {
                name: name,
                category_id: parseInt(categoryId),
                price_reference: price,
                status: status,
                recipe: recipesCount,
                image_path: imagePath,
                created_at: now,
                updated_at: now
            };

            await menuItemsDB.add(newItem);

            // Close modal
            const modalElem = document.getElementById('addMenuItemModal');
            const modal = bootstrap.Modal.getInstance(modalElem);
            if (modal) modal.hide();

            showModalNotification(`Menu item "${name}" added successfully`, 'success', 'Menu Item Added');
            logAdminActivity('Added menu item', name, 'Success');
        }

        // Refresh menu control immediately
        loadMenuControl();

    } catch (error) {
        console.error('Error saving menu item:', error);
        showModalNotification('Failed to save menu item: ' + error.message, 'error', 'Save Error');
    } finally {
        // Restore button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText || 'Save Item';
        }
    }
}

function editMenuItem(id) {
    editingMenuItemId = id;
    showAddMenuItemModal();
}

function toggleMenuItemStatus(id) {
    menuItemsDB.show({ id: id }).then(function (items) {
        const item = Array.isArray(items) ? items[0] : items;
        if (!item) return;

        const newStatus = item.status === 'Active' ? 'Inactive' : 'Active';
        const actionWord = newStatus === 'Inactive' ? 'deactivate' : 'activate';

        showConfirm(`Are you sure you want to ${actionWord} "${item.name}"?`, function () {
            menuItemsDB.edit({ id: id, status: newStatus }).then(function (result) {
                if (result.error) {
                    Swal.fire('Error', result.error, 'error');
                    return;
                }

                showModalNotification(`"${item.name}" has been ${newStatus === 'Inactive' ? 'deactivated' : 'activated'}`, 'success', 'Status Changed');
                logAdminActivity(`${newStatus === 'Inactive' ? 'Deactivated' : 'Activated'} menu item`, item.name, 'Success');
                loadMenuControl();

            }).catch(function (err) {
                console.error('Failed to update menu item status:', err);
                Swal.fire('Error', 'Failed to update status.', 'error');
            });
        });

    }).catch(function (err) {
        console.error('Failed to fetch menu item:', err);
    });
}
function deleteMenuItem(id) {
    menuItemsDB.show({ id: id }).then(function (items) {
        const item = Array.isArray(items) ? items[0] : items;
        if (!item) return;

        showConfirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`, function () {
            menuItemsDB.delete(id).then(function (result) {
                if (result.error) {
                    Swal.fire('Error', result.error, 'error');
                    return;
                }

                showModalNotification(`"${item.name}" has been deleted`, 'success', 'Item Deleted');
                logAdminActivity('Deleted menu item', item.name, 'Success');
                loadMenuControl();

            }).catch(function (err) {
                console.error('Delete menu item failed:', err);
                Swal.fire('Error', 'Failed to delete menu item.', 'error');
            });
        });

    }).catch(function (err) {
        console.error('Failed to fetch menu item:', err);
    });
}

// ===== Recipe Control Functions =====

// Available ingredients master list (shared with the rest of the system)
function getAvailableIngredients(callback) {
    ingredientsDB.show().then(function (ingredients) {
        if (typeof callback === 'function') {
            callback(ingredients);
        }
    }).catch(function (err) {
        console.error('Failed to load ingredients:', err);
        if (typeof callback === 'function') {
            callback([]);
        }
    });
}

function saveIngredientsToStorage(ingredients) {
    localStorage.setItem('ingredients', JSON.stringify(ingredients));
}

// Get recipes from localStorage or seed with defaults
function getRecipes() {
    let recipes = [];
    try {
        const stored = localStorage.getItem('adminRecipes');
        if (stored) recipes = JSON.parse(stored);
    } catch (e) { recipes = []; }

    if (!recipes || recipes.length === 0) {
        recipes = [
            {
                id: 1, menuItem: 'Beef Steak',
                ingredients: [
                    { name: 'Beef', qty: 0.30, unit: 'kg', cost: 3.60 },
                    { name: 'Potatoes', qty: 0.15, unit: 'kg', cost: 0.38 },
                    { name: 'Tomatoes', qty: 0.10, unit: 'kg', cost: 0.30 },
                    { name: 'Onions', qty: 0.10, unit: 'kg', cost: 0.20 }
                ]
            },
            {
                id: 2, menuItem: 'Chicken Curry',
                ingredients: [
                    { name: 'Chicken', qty: 0.25, unit: 'kg', cost: 2.00 },
                    { name: 'Rice', qty: 0.15, unit: 'kg', cost: 0.38 },
                    { name: 'Garlic', qty: 0.02, unit: 'kg', cost: 0.10 },
                    { name: 'Onions', qty: 0.10, unit: 'kg', cost: 0.20 }
                ]
            },
            {
                id: 3, menuItem: 'Vegetable Salad',
                ingredients: [
                    { name: 'Tomatoes', qty: 0.10, unit: 'kg', cost: 0.30 },
                    { name: 'Lettuce', qty: 0.13, unit: 'kg', cost: 0.46 },
                    { name: 'Cucumber', qty: 0.10, unit: 'kg', cost: 0.28 }
                ]
            },
            {
                id: 4, menuItem: 'Garlic Bread',
                ingredients: [
                    { name: 'Flour', qty: 0.08, unit: 'kg', cost: 0.12 },
                    { name: 'Butter', qty: 0.05, unit: 'kg', cost: 0.35 },
                    { name: 'Garlic', qty: 0.03, unit: 'kg', cost: 0.15 }
                ]
            },
            {
                id: 5, menuItem: 'Pasta Carbonara',
                ingredients: [
                    { name: 'Pasta', qty: 0.15, unit: 'kg', cost: 0.45 },
                    { name: 'Cheese', qty: 0.08, unit: 'kg', cost: 0.80 },
                    { name: 'Bacon', qty: 0.10, unit: 'kg', cost: 1.10 }
                ]
            }
        ];
        localStorage.setItem('adminRecipes', JSON.stringify(recipes));
    }
    return recipes;
}

function saveRecipesToStorage(recipes) {
    localStorage.setItem('adminRecipes', JSON.stringify(recipes));
}

let editingRecipeId = null;

function initializeRecipeControl() {
    // Assign recipe button
    const assignRecipeBtn = document.getElementById('assignRecipeBtn');
    if (assignRecipeBtn) {
        assignRecipeBtn.addEventListener('click', function () {
            editingRecipeId = null;
            showAssignRecipeModal();
        });
    }

    // Search filter
    const searchInput = document.getElementById('recipeSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            loadRecipeControl();
        });
    }

    // Load recipe control list
    loadRecipeControl();
}

function loadRecipeControl() {
    const tableElement = document.getElementById('recipeMappingTable');
    if (!tableElement) return;

    const recipeMappingTable = tableElement.getElementsByTagName('tbody')[0];
    if (!recipeMappingTable) return;

    const searchQuery = (document.getElementById('recipeSearch')?.value || '').toLowerCase().trim();

    // Only show loading if empty
    if (recipeMappingTable.children.length === 0 || (recipeMappingTable.children.length === 1 && recipeMappingTable.innerText.includes('Loading'))) {
        recipeMappingTable.innerHTML = '<tr><td colspan="5" class="text-center py-3"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</td></tr>';
    }

    Promise.all([
        recipesDB.show(),
        menuItemsDB.show(),
        ingredientsDB.show()
    ]).then(function (results) {
        const recipes = Array.isArray(results[0]) ? results[0] : [];
        const menuItems = Array.isArray(results[1]) ? results[1] : [];
        const ingredients = Array.isArray(results[2]) ? results[2] : [];

        // Build lookup maps
        const menuItemMap = {};
        menuItems.forEach(function (item) {
            menuItemMap[item.id] = item.name;
        });

        const ingredientMap = {};
        ingredients.forEach(function (ing) {
            ingredientMap[ing.id] = ing;
        });

        // Group recipe rows by menu_item_id
        const grouped = {};
        recipes.forEach(function (recipe) {
            const mid = recipe.menu_item_id;
            if (!grouped[mid]) {
                grouped[mid] = {
                    menu_item_id: mid,
                    menu_item_name: menuItemMap[mid] || '—',
                    ingredients: []
                };
            }
            const ing = ingredientMap[recipe.ingredient_id];
            grouped[mid].ingredients.push({
                name: ing ? ing.name : '—',
                qty: parseFloat(recipe.qty_per_sale) || 0,
                unit: ing ? (ing.unit || 'kg') : 'kg'
            });
        });

        let groupedList = Object.values(grouped);

        // Filter by search
        if (searchQuery) {
            groupedList = groupedList.filter(function (r) {
                return r.menu_item_name.toLowerCase().includes(searchQuery) ||
                    r.ingredients.some(function (i) {
                        return i.name.toLowerCase().includes(searchQuery);
                    });
            });
        }

        if (groupedList.length === 0) {
            recipeMappingTable.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4"><i class="fas fa-clipboard-list fa-2x mb-2 d-block"></i>No recipe mappings found.</td></tr>';
            return;
        }

        const newHtml = groupedList.map(function (recipe) {
            const ingredientBadges = recipe.ingredients.map(function (i) {
                return `<span class="badge bg-light text-dark border me-1 mb-1" style="font-size: 0.78em;">
                    <i class="fas fa-leaf text-success me-1"></i>${i.name} <small class="text-muted">(${i.qty} ${i.unit})</small>
                </span>`;
            }).join('');

            return `
                <tr class="animate__animated animate__fadeIn">
                    <td><strong>${recipe.menu_item_name}</strong></td>
                    <td style="max-width: 300px;">${ingredientBadges}</td>
                    <td><span class="badge bg-info">${recipe.ingredients.length} Ingredients</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="editRecipe(${recipe.menu_item_id})" title="Edit Recipe">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteRecipe(${recipe.menu_item_id})" title="Delete Recipe">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (recipeMappingTable.innerHTML !== newHtml) {
            recipeMappingTable.innerHTML = newHtml;
        }

    }).catch(function (err) {
        console.error('Failed to load recipes:', err);
        if (recipeMappingTable.innerHTML === '' || recipeMappingTable.innerText.includes('Loading')) {
            recipeMappingTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4"><i class="fas fa-exclamation-triangle me-2"></i>Failed to load recipes.</td></tr>';
        }
    });
}
function showAssignRecipeModal() {
    const form = document.getElementById('assignRecipeForm');
    if (form) form.reset();

    const title = document.getElementById('recipeModalTitle');
    if (title) {
        title.innerHTML = editingRecipeId
            ? '<i class="fas fa-edit me-2"></i>Edit Recipe'
            : '<i class="fas fa-book me-2"></i>Assign New Recipe';
    }

    // Clear ingredients area
    const ingredientsArea = document.getElementById('recipeIngredientsArea');
    if (ingredientsArea) {
        ingredientsArea.innerHTML = '<p class="text-muted text-center py-3" id="noIngredientsMsg"><i class="fas fa-info-circle me-1"></i>Click "Add Ingredient" to start building the recipe.</p>';
    }

    // Reset summary
    updateRecipeSummary();

    // Load menu items and ingredients from DB together
    Promise.all([
        menuItemsDB.show(),
        ingredientsDB.show(),
        unitsDB.show()
    ]).then(function (results) {
        const menuItems = results[0];
        const ingredients = results[1];
        const units = results[2];

        // Populate menu item dropdown
        const menuSelect = document.getElementById('recipeMenuItem');
        if (menuSelect) {
            menuSelect.innerHTML = '<option value="">Select a menu item...</option>';
            menuItems.forEach(function (item) {
                const opt = document.createElement('option');
                opt.value = item.id;
                opt.textContent = item.name;
                menuSelect.appendChild(opt);
            });
        }

        // Build unit map
        const unitMap = {};
        units.forEach(function (u) {
            unitMap[u.id] = u.short_name || u.name;
        });

        // Attach unit name to each ingredient
        ingredients.forEach(function (ing) {
            ing.unit_name = unitMap[ing.unit_id] || '';
        });


        // Wire up Add Ingredient button — always, not just in else
        const addIngBtn = document.getElementById('addRecipeIngredientBtn');
        if (addIngBtn) {
            const newBtn = addIngBtn.cloneNode(true);
            addIngBtn.parentNode.replaceChild(newBtn, addIngBtn);
            newBtn.addEventListener('click', function () {
                addRecipeIngredientRow(ingredients);
            });
        }

        // If editing, pre-fill from DB
        if (editingRecipeId) {
            recipesDB.show().then(function (allRecipes) {
                const recipes = allRecipes.filter(function (r) {
                    return r.menu_item_id == editingRecipeId;
                });

                if (!recipes || recipes.length === 0) return;

                if (menuSelect) menuSelect.value = recipes[0].menu_item_id;

                const ingredientsArea = document.getElementById('recipeIngredientsArea');
                if (ingredientsArea) ingredientsArea.innerHTML = '';

                recipes.forEach(function (recipe) {
                    addRecipeIngredientRow(ingredients, recipe.ingredient_id, recipe.qty_per_sale);
                });

                updateRecipeSummary();

            }).catch(function (err) {
                console.error('Failed to load recipe for editing:', err);
            });
        }

    }).catch(function (err) {
        console.error('Failed to load modal data:', err);
    });
    // Show modal
    const modalElem = document.getElementById('assignRecipeModal');
    if (!modalElem) return;
    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    // Wire up Save button
    const saveBtn = document.getElementById('saveRecipeBtn');
    if (saveBtn) {
        const newBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newBtn, saveBtn);
        newBtn.addEventListener('click', function () {
            saveRecipe();
        });
    }
}

function addRecipeIngredientRow(ingredients, selectedIngredientId, qty) {
    const ingredientsArea = document.getElementById('recipeIngredientsArea');
    if (!ingredientsArea) return;

    const noMsg = document.getElementById('noIngredientsMsg');
    if (noMsg) noMsg.remove();

    const row = document.createElement('div');
    row.className = 'row align-items-center mb-2 recipe-ingredient-row';

    // Ingredient dropdown
    const ingSelect = document.createElement('select');
    ingSelect.className = 'form-select ingredient-select col';
    ingSelect.innerHTML = '<option value="">Select Ingredient</option>';
    ingredients.forEach(function (ing) {
        const opt = document.createElement('option');
        opt.value = ing.id;
        opt.textContent = ing.name;
        opt.dataset.unit = ing.unit_name || ing.unit || '';
        if (ing.id == selectedIngredientId) opt.selected = true;
        ingSelect.appendChild(opt);
    });

    // Quantity input
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'form-control ingredient-qty';
    qtyInput.min = '0';
    qtyInput.step = '0.01';
    qtyInput.value = qty || '';

    // Set initial placeholder based on pre-selected ingredient
    if (selectedIngredientId) {
        const preSelected = ingredients.find(function (i) { return i.id == selectedIngredientId; });
        if (preSelected) qtyInput.placeholder = 'Qty (' + (preSelected.unit_name || preSelected.unit || 'unit') + ')';
    } else {
        qtyInput.placeholder = 'Qty';
    }

    // Update placeholder when ingredient changes
    ingSelect.addEventListener('change', function () {
        const selected = ingSelect.options[ingSelect.selectedIndex];
        const unit = selected.dataset.unit || '';
        qtyInput.placeholder = unit ? 'Qty (' + unit + ')' : 'Qty';
        updateRecipeSummary();
    });

    qtyInput.addEventListener('input', updateRecipeSummary);

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-outline-danger';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.addEventListener('click', function () {
        row.remove();
        updateRecipeSummary();
    });

    const col1 = document.createElement('div');
    col1.className = 'col-md-6';
    col1.appendChild(ingSelect);

    const col2 = document.createElement('div');
    col2.className = 'col-md-4';
    col2.appendChild(qtyInput);

    const col3 = document.createElement('div');
    col3.className = 'col-md-2 text-end';
    col3.appendChild(removeBtn);

    row.appendChild(col1);
    row.appendChild(col2);
    row.appendChild(col3);

    ingredientsArea.appendChild(row);
    updateRecipeSummary();
}
function updateRecipeSummary() {
    const rows = document.querySelectorAll('.recipe-ingredient-row');
    const countEl = document.getElementById('recipeIngredientCount');
    const totalQtyEl = document.getElementById('recipeTotalQty');

    let totalQty = 0;
    rows.forEach(function (row) {
        const qty = parseFloat(row.querySelector('.ingredient-qty')?.value) || 0;
        totalQty += qty;
    });

    if (countEl) countEl.textContent = rows.length;
    if (totalQtyEl) totalQtyEl.textContent = totalQty.toFixed(2);
}

function saveRecipe() {
    const menuItemId = document.getElementById('recipeMenuItem')?.value;
    if (!menuItemId) {
        showModalNotification('Please select a menu item.', 'warning', 'Validation Error');
        return;
    }

    const rows = document.querySelectorAll('#recipeIngredientsArea .recipe-ingredient-row');
    const ingredientsList = [];
    let valid = true;

    rows.forEach(function (row) {
        const ingredientId = row.querySelector('.ingredient-select')?.value;
        const qty = parseFloat(row.querySelector('.ingredient-qty')?.value) || 0;

        if (!ingredientId || qty <= 0) {
            valid = false;
            return;
        }

        ingredientsList.push({
            ingredient_id: ingredientId,
            qty_per_sale: qty
        });
    });

    if (ingredientsList.length === 0 || !valid) {
        showModalNotification('Please add at least one ingredient with a valid quantity.', 'warning', 'Validation Error');
        return;
    }

    const ids = ingredientsList.map(function (i) { return i.ingredient_id; });
    if (new Set(ids).size !== ids.length) {
        showModalNotification('Duplicate ingredients found. Please use each ingredient only once.', 'warning', 'Validation Error');
        return;
    }

    const saveBtn = document.getElementById('saveRecipeBtn');
    if (saveBtn) saveBtn.disabled = true;

    function doInsert() {
        return Promise.all(ingredientsList.map(function (ing) {
            return recipesDB.add({
                menu_item_id: menuItemId,
                ingredient_id: ing.ingredient_id,
                qty_per_sale: ing.qty_per_sale
            });
        }));
    }

    function afterSave() {
        const modalElem = document.getElementById('assignRecipeModal');
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();
        editingRecipeId = null;
        if (saveBtn) saveBtn.disabled = false;
        loadRecipeControl();
    }

    if (editingRecipeId) {
        // Fetch ALL recipes then filter client-side by menu_item_id
        recipesDB.show().then(function (allRecipes) {
            const existingRows = allRecipes.filter(function (r) {
                return r.menu_item_id == editingRecipeId;
            });

            // Delete each row by its own id
            return Promise.all(existingRows.map(function (r) {
                return recipesDB.delete(r.id);
            }));

        }).then(function () {
            return doInsert();

        }).then(function () {
            showModalNotification('Recipe updated successfully!', 'success', 'Recipe Updated');
            logAdminActivity('Updated recipe', menuItemId, 'Success');
            afterSave();

        }).catch(function (err) {
            console.error('Failed to update recipe:', err);
            Swal.fire('Error', 'Failed to update recipe.', 'error');
            if (saveBtn) saveBtn.disabled = false;
        });

    } else {
        // Fetch ALL recipes then filter client-side to check duplicate
        recipesDB.show().then(function (allRecipes) {
            const existing = allRecipes.filter(function (r) {
                return r.menu_item_id == menuItemId;
            });

            if (existing.length > 0) {
                showModalNotification('A recipe for this menu item already exists. Edit the existing recipe instead.', 'warning', 'Duplicate Recipe');
                if (saveBtn) saveBtn.disabled = false;
                return;
            }

            return doInsert().then(function () {
                showModalNotification('Recipe assigned successfully!', 'success', 'Recipe Assigned');
                logAdminActivity('Assigned new recipe', menuItemId, 'Success');
                afterSave();
            });

        }).catch(function (err) {
            console.error('Failed to save recipe:', err);
            Swal.fire('Error', 'Failed to save recipe.', 'error');
            if (saveBtn) saveBtn.disabled = false;
        });
    }
}
function editRecipe(id) {
    editingRecipeId = id;
    showAssignRecipeModal();
}

function deleteRecipe(menuItemId) {
    recipesDB.show().then(function (allRecipes) {
        const rows = allRecipes.filter(function (r) {
            return r.menu_item_id == menuItemId;
        });

        if (!rows || rows.length === 0) {
            showModalNotification('Recipe not found.', 'warning', 'Not Found');
            return;
        }

        menuItemsDB.show({ id: menuItemId }).then(function (items) {
            const item = Array.isArray(items) ? items[0] : items;
            const menuItemName = item ? item.name : 'Unknown';

            showConfirm(`Are you sure you want to delete the recipe for "${menuItemName}"? This action cannot be undone.`, function () {
                Promise.all(rows.map(function (r) {
                    return recipesDB.delete(r.id);
                })).then(function () {
                    showModalNotification(`Recipe for "${menuItemName}" has been deleted.`, 'success', 'Recipe Deleted');
                    logAdminActivity('Deleted recipe', menuItemName, 'Success');
                    loadRecipeControl();
                }).catch(function (err) {
                    console.error('Failed to delete recipe:', err);
                    Swal.fire('Error', 'Failed to delete recipe.', 'error');
                });
            });
        });

    }).catch(function (err) {
        console.error('Failed to fetch recipes:', err);
    });
}

// Ingredients Masterlist Functions
let editingIngredientId = null;

// Ingredients Masterlist Functions
function initializeIngredientsMasterlist() {
    // Add ingredient button
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', function () {
            editingIngredientId = null;
            showAddIngredientModal();
        });
    }

    // Set thresholds button
    const setThresholdsBtn = document.getElementById('setThresholdsBtn');
    if (setThresholdsBtn) {
        setThresholdsBtn.addEventListener('click', function () {
            showSetThresholdsModal();
        });
    }

    // Search and Filter Listeners
    const searchInput = document.getElementById('masterIngredientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            loadIngredientsMasterlist();
        });
    }

    const categoryFilter = document.getElementById('masterCategoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            loadIngredientsMasterlist();
        });
    }

    // Load ingredients masterlist
    loadIngredientsMasterlist();
}

async function loadIngredientsMasterlist() {
    const tableElement = document.getElementById('ingredientsMasterTable');
    if (!tableElement) return;

    const ingredientsMasterTable = tableElement.getElementsByTagName('tbody')[0];
    const masterLowStockCount = document.getElementById('masterLowStockCount');
    const masterTotalIngredients = document.getElementById('masterTotalIngredients');

    const searchQuery = (document.getElementById('masterIngredientSearch')?.value || '').toLowerCase().trim();
    const categoryFilter = document.getElementById('masterCategoryFilter')?.value || '';

    // Only show loading indicator if table is empty
    if (ingredientsMasterTable.children.length === 0 || (ingredientsMasterTable.children.length === 1 && ingredientsMasterTable.innerText.includes('Loading'))) {
        ingredientsMasterTable.innerHTML = '<tr><td colspan="9" class="text-center py-3"><i class="fas fa-spinner fa-spin me-2"></i>Loading...</td></tr>';
    }

    try {
        const results = await Promise.all([
            ingredientsDB.show(),
            ingredientCategoriesDB.show(),
            unitsDB.show(),
            recipesDB.show()
        ]);

        const ingredientsRaw = Array.isArray(results[0]) ? results[0] : [];
        const categories = Array.isArray(results[1]) ? results[1] : [];
        const units = Array.isArray(results[2]) ? results[2] : [];
        const recipes = Array.isArray(results[3]) ? results[3] : [];

        let ingredients = [...ingredientsRaw];

        const getCategoryName = function (id) {
            const cat = categories.find(function (c) { return c.id == id; });
            return cat ? cat.name : 'Unknown';
        };

        const getUnitName = function (id) {
            const unit = units.find(function (u) { return u.id == id; });
            return unit ? (unit.short_name || unit.name) : 'Unknown';
        };

        const getUsedInCount = function (ingredientId) {
            return recipes.filter(function (r) {
                return r.ingredient_id == ingredientId;
            }).length;
        };

        if (categoryFilter) {
            ingredients = ingredients.filter(function (ing) {
                return ing.category_id == categoryFilter;
            });
        }

        if (searchQuery) {
            ingredients = ingredients.filter(function (ing) {
                return (ing.name || '').toLowerCase().includes(searchQuery) ||
                    (ing.id || '').toString().includes(searchQuery);
            });
        }

        let lowStockCount = 0;
        ingredients.forEach(function (ing) {
            if (parseFloat(ing.current_quantity) <= parseFloat(ing.low_stock_threshold)) lowStockCount++;
        });

        if (masterLowStockCount) masterLowStockCount.textContent = lowStockCount;
        if (masterTotalIngredients) masterTotalIngredients.textContent = ingredients.length;

        if (ingredients.length === 0) {
            ingredientsMasterTable.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No ingredients found.</td></tr>';
            return;
        }

        const newHtml = ingredients.map(function (ingredient) {
            const currentQty = parseFloat(ingredient.current_quantity) || 0;
            const threshold = parseFloat(ingredient.low_stock_threshold) || 0;
            const isLow = currentQty <= threshold;
            const unitName = getUnitName(ingredient.unit_id);
            const usedIn = getUsedInCount(ingredient.id);

            return `
                <tr class="animate__animated animate__fadeIn">
                    <td>${ingredient.id}</td>
                    <td><strong>${ingredient.name}</strong></td>
                    <td><span class="badge bg-secondary">${getCategoryName(ingredient.category_id)}</span></td>
                    <td>${unitName}</td>
                    <td class="${isLow ? 'text-danger fw-bold' : ''}">${currentQty} ${unitName}</td>
                    <td>${threshold} ${unitName}</td>
                    <td><span class="badge ${!isLow ? 'bg-success' : 'bg-warning'}">${!isLow ? 'Normal' : 'Low Stock'}</span></td>
                    <td><span class="badge bg-info">${usedIn} menu item${usedIn !== 1 ? 's' : ''}</span></td>
                    <td>
                        <div class="table-actions">
                            <button class="btn-action-premium btn-edit-premium" onclick="editIngredient(${ingredient.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action-premium btn-delete-premium" onclick="deleteIngredient(${ingredient.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (ingredientsMasterTable.innerHTML !== newHtml) {
            ingredientsMasterTable.innerHTML = newHtml;
        }

    } catch (err) {
        console.error('Failed to load ingredients list:', err);
        ingredientsMasterTable.innerHTML = '<tr><td colspan="9" class="text-center text-danger py-4">Error loading data.</td></tr>';
    }
}


async function showAddIngredientModal() {
    const modalElem = document.getElementById('addIngredientModal');
    if (!modalElem) return;

    const unitSelect = document.getElementById('ingredientUnit');
    const categorySelect = document.getElementById('ingredientCategory');
    const thresholdUnitLabel = modalElem.querySelector('.threshold-unit-label');
    const quantityUnitLabel = modalElem.querySelector('.quantity-unit-label');
    const modalTitle = modalElem.querySelector('.modal-title');
    const form = document.getElementById('addIngredientForm');

    if (form) form.reset();
    if (thresholdUnitLabel) thresholdUnitLabel.textContent = 'unit';
    if (quantityUnitLabel) quantityUnitLabel.textContent = 'unit';

    if (modalTitle) {
        modalTitle.innerHTML = editingIngredientId
            ? '<i class="fas fa-edit me-2"></i>Edit Ingredient'
            : '<i class="fas fa-plus-circle me-2"></i>Add Ingredient';
    }

    try {
        const results = await Promise.all([
            ingredientCategoriesDB.show(),
            unitsDB.show()
        ]);

        const categories = results[0];
        const units = results[1];

        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            categories.forEach(function (cat) {
                const opt = document.createElement('option');
                opt.value = cat.id;
                opt.textContent = cat.name;
                categorySelect.appendChild(opt);
            });
        }

        if (unitSelect) {
            unitSelect.innerHTML = '<option value="">Select Unit</option>';
            units.forEach(function (u) {
                const opt = document.createElement('option');
                opt.value = u.id;
                opt.textContent = u.short_name || u.name;
                opt.dataset.short = u.short_name || u.name;
                unitSelect.appendChild(opt);
            });
        }

        if (editingIngredientId) {
            const ingredients = await ingredientsDB.show({ id: editingIngredientId });
            const ing = Array.isArray(ingredients) ? ingredients[0] : ingredients;
            if (ing) {
                document.getElementById('ingredientName').value = ing.name;
                if (categorySelect) categorySelect.value = ing.category_id;
                if (unitSelect) {
                    unitSelect.value = ing.unit_id;
                    const unitName = unitSelect.selectedOptions[0]?.dataset.short || '';
                    if (thresholdUnitLabel) thresholdUnitLabel.textContent = unitName;
                    if (quantityUnitLabel) quantityUnitLabel.textContent = unitName;
                }
                document.getElementById('lowStockThreshold').value = ing.low_stock_threshold;
                document.getElementById('ingredientQuantity').value = ing.current_quantity;
            }
        }

    } catch (err) {
        console.error('Failed to load modal data:', err);
    }

    if (unitSelect && thresholdUnitLabel) {
        const newUnitSelect = unitSelect.cloneNode(true);
        unitSelect.parentNode.replaceChild(newUnitSelect, unitSelect);
        newUnitSelect.addEventListener('change', function () {
            const unitName = this.selectedOptions[0]?.dataset.short || 'unit';
            if (thresholdUnitLabel) thresholdUnitLabel.textContent = unitName;
            if (quantityUnitLabel) quantityUnitLabel.textContent = unitName;
        });
        // Re-set value after clone
        if (editingIngredientId) newUnitSelect.value = newUnitSelect.value;
    }

    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    // Reset editingIngredientId when modal is closed
    modalElem.addEventListener('hidden.bs.modal', function () {
        editingIngredientId = null;
    }, { once: true });

    const saveBtn = document.getElementById('saveIngredientBtn');
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', saveIngredient);
    }
}



async function saveIngredient() {
    const name = document.getElementById('ingredientName')?.value.trim();
    const category_id = parseInt(document.getElementById('ingredientCategory')?.value);
    const unit_id = parseInt(document.getElementById('ingredientUnit')?.value);
    const threshold = parseFloat(document.getElementById('lowStockThreshold')?.value) || 0;
    const quantity = parseFloat(document.getElementById('ingredientQuantity')?.value) || 0;

    if (!name || !category_id || !unit_id) {
        showModalNotification('Please fill in all required fields', 'warning', 'Validation Error');
        return;
    }

    try {
        // Check for duplicate
        const allIngredients = await ingredientsDB.show();
        const duplicate = allIngredients.find(function (ing) {
            const sameName = ing.name.trim().toLowerCase() === name.toLowerCase();
            // If editing, exclude itself from duplicate check
            if (editingIngredientId) {
                return sameName && ing.id != editingIngredientId;
            }
            return sameName;
        });

        if (duplicate) {
            showModalNotification(`Ingredient "${name}" already exists.`, 'warning', 'Duplicate Ingredient');
            return;
        }

        const ingredientData = {
            name,
            category_id,
            unit_id,
            current_quantity: quantity,
            low_stock_threshold: threshold,
            status: 'active',
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        if (editingIngredientId) {
            ingredientData.id = editingIngredientId;
            await ingredientsDB.edit(ingredientData);
            editingIngredientId = null;
        } else {
            await ingredientsDB.add(ingredientData);
        }

        const modalElem = document.getElementById('addIngredientModal');
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();

        loadIngredientsMasterlist();
        showModalNotification(`Ingredient "${name}" saved successfully`, 'success', 'Ingredient Saved');

    } catch (err) {
        console.error('Failed to save ingredient:', err);
        showModalNotification('Failed to save ingredient', 'danger', 'Error');
    }
}

function showSetThresholdsModal() {
    ingredientCategoriesDB.show().then(function (categories) {
        const inputs = categories.map(function (cat) {
            return `
                <div class="mb-3">
                    <label class="form-label">${cat.name}</label>
                    <input type="number" id="swal-cat-${cat.id}" class="swal2-input mt-0" placeholder="Threshold" min="0" step="0.01">
                </div>
            `;
        }).join('');

        Swal.fire({
            title: 'Inventory Thresholds',
            html: `
                <div class="premium-swal-container">
                    <div class="alert alert-info py-2" style="font-size: 0.85rem; border-radius: 12px; border: none; background: rgba(128,0,0,0.05); color: var(--maroon);">
                        <i class="fas fa-info-circle me-2"></i> Update warning levels for all ingredients in these categories.
                    </div>
                    <div class="row g-3 mt-1">
                        ${categories.map(cat => `
                            <div class="col-6 text-start">
                                <label class="form-label" style="font-size: 0.8rem; color: #666; font-weight: 700;">${cat.name}</label>
                                <div class="input-group">
                                    <input type="number" id="swal-cat-${cat.id}" class="form-control" style="border-radius: 10px; border: 2px solid #eee;" placeholder="0.00" min="0" step="0.01">
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-3 py-2 px-3" style="background: #fff5f5; border-radius: 10px; border-left: 4px solid #dc3545;">
                         <p class="small text-danger mb-0" style="font-weight: 600;">⚠️ This will override individual ingredient settings.</p>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Update Global Sync',
            cancelButtonText: 'Keep Current',
            confirmButtonColor: '#800000',
            cancelButtonColor: '#eee',
            buttonsStyling: true,
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'btn-premium-save',
                cancelButton: 'btn-premium-cancel'
            },
            preConfirm: function () {
                const values = {};
                categories.forEach(function (cat) {
                    const val = parseFloat(document.getElementById('swal-cat-' + cat.id)?.value);
                    if (!isNaN(val)) values[cat.id] = val;
                });
                return values;
            }
        }).then(function (result) {
            if (!result.isConfirmed) return;

            ingredientsDB.show().then(function (ingredients) {
                const updates = ingredients
                    .filter(function (ing) {
                        return result.value[ing.category_id] !== undefined;
                    })
                    .map(function (ing) {
                        return ingredientsDB.edit({
                            id: ing.id,
                            low_stock_threshold: result.value[ing.category_id]
                        });
                    });

                Promise.all(updates).then(function () {
                    showModalNotification('Thresholds updated successfully', 'success', 'Bulk Update');
                    loadIngredientsMasterlist();
                }).catch(function (err) {
                    console.error('Failed to update thresholds:', err);
                    showModalNotification('Failed to update thresholds', 'danger', 'Error');
                });
            });
        });
    });
}

async function editIngredient(id) {
    editingIngredientId = id;
    showAddIngredientModal();
}

async function deleteIngredient(id) {
    try {
        const ingredients = await ingredientsDB.show({ id });
        if (!ingredients || ingredients.length === 0) return;
        const ing = Array.isArray(ingredients) ? ingredients[0] : ingredients;

        showConfirm(`Are you sure you want to delete "${ing.name}"? This will also remove it from any assigned recipes.`, async function () {
            try {
                // Delete related recipe rows first
                const recipeRows = await recipesDB.show({ ingredient_id: id });
                if (recipeRows && recipeRows.length > 0) {
                    await Promise.all(recipeRows.map(function (r) {
                        return recipesDB.delete(r.id);
                    }));
                }

                // Then delete the ingredient
                await ingredientsDB.delete(id);

                showModalNotification(`"${ing.name}" has been deleted`, 'success', 'Ingredient Deleted');
                logAdminActivity('Deleted ingredient', ing.name, 'Success');
                loadIngredientsMasterlist();

            } catch (err) {
                console.error('Failed to delete ingredient:', err);
                showModalNotification('Failed to delete ingredient', 'danger', 'Error');
            }
        });

    } catch (err) {
        console.error('Failed to fetch ingredient:', err);
    }
}
// ===== User Management Functions =====

async function getUsers() {
    try {
        const dbUsers = await usersDB.show();
        if (!dbUsers || dbUsers.length === 0) return [];

        const users = dbUsers.map(u => ({
            id: u.id,
            name: u.full_name,
            username: u.username,
            role: u.role_id,              // map role_id to string later if needed
            status: u.status || 'Active',
            lastLogin: u.last_login ? new Date(u.last_login).toLocaleString() : 'Never',
            isDeleted: !!u.deleted_at,
            deletedDate: u.deleted_at ? new Date(u.deleted_at).toLocaleDateString() : null,
            deletedBy: u.deleted_by || null
        }));

        return users;
    } catch (e) {
        console.error('Failed to fetch users:', e);
        return [];
    }
}

function initializeUserManagement() {
    // Add User Button
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function () {
            showAddUserModal();
        });
    }

    // Save New User Button
    const saveNewUserBtn = document.getElementById('saveNewUserBtn');
    if (saveNewUserBtn) {
        saveNewUserBtn.addEventListener('click', function () {
            saveNewUser();
        });
    }

    // Save Edit User Button
    const saveUserChangesBtn = document.getElementById('saveUserChangesBtn');
    if (saveUserChangesBtn) {
        saveUserChangesBtn.addEventListener('click', function () {
            saveUserChanges();
        });
    }

    // Load initial data
    loadUserManagement();
}

async function loadUserManagement() {
    await loadActiveUsers();
    await loadDeletedUsers();
}

async function loadActiveUsers() {
    const tableElem = document.getElementById('activeUsersTable');
    if (!tableElem) return;

    const tbody = tableElem.querySelector('tbody');
    if (!tbody) return;

    try {
        // 1️⃣ Get all users
        const usersRaw = await getUsers();
        const users = Array.isArray(usersRaw) ? usersRaw.filter(u => !u.isDeleted) : [];

        // 2️⃣ Get all roles from roleDB
        let roles = [];
        try {
            const rolesRaw = await rolesDB.show();
            roles = Array.isArray(rolesRaw) ? rolesRaw : [];
        } catch (err) {
            console.error('Failed to fetch roles:', err);
        }

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No active users found.</td></tr>';
            return;
        }

        const newHtml = users.map(user => {
            const roleName = roles.find(r => r.id === user.role)?.name || 'Unknown';
            return `
                <tr class="animate__animated animate__fadeIn">
                    <td><strong>${user.name}</strong></td>
                    <td><span class="badge ${roleName === 'Staff' ? 'bg-success' : roleName === 'Cashier' ? 'bg-info' : 'bg-warning'}">${roleName}</span></td>
                    <td>${user.username}</td>
                    <td><span class="badge ${user.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${user.status}</span></td>
                    <td>${user.lastLogin || 'Never'}</td>
                    <td>
                        <div class="table-actions">
                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        if (tbody.innerHTML !== newHtml) {
            tbody.innerHTML = newHtml;
        }
    } catch (err) {
        console.error('Failed to load active users:', err);
        if (tbody.innerHTML === '') {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger py-4">Error loading data.</td></tr>';
        }
    }
}

// Populate ingredient select with unit_id as attribute
function populateIngredientSelect(selectId) {
    const selectElem = document.getElementById(selectId);
    if (!selectElem) return;

    selectElem.innerHTML = '<option value="">Select Ingredient</option>'; // placeholder

    ingredientsDB.show().then(ingredients => {
        unitsDB.show().then(units => {
            ingredients.forEach(ing => {
                const option = document.createElement('option');
                option.value = ing.id; // store ingredient id as value
                option.textContent = ing.name; // display ingredient name

                // Add unit_id as custom attribute
                option.setAttribute('data-unit-id', ing.unit_id);

                // Optionally display unit name next to ingredient
                const unitName = units.find(u => u.id === ing.unit_id)?.name || '';
                option.textContent = `${ing.name} (${unitName})`;

                selectElem.appendChild(option);
            });
        }).catch(err => console.error('Failed to load units:', err));
    }).catch(err => console.error('Failed to load ingredients:', err));
}

populateIngredientSelect()
// Usage
populateIngredientSelect('ingredientsSelect');

async function filterRole(selectId) {
    const selectElem = document.getElementById(selectId);
    if (!selectElem) return;

    selectElem.innerHTML = '<option value="">Select</option>'; // placeholder

    try {
        const roles = await rolesDB.show(); // fetch all roles from rolesDB
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.name;
            option.textContent = role.name; // display the role name
            selectElem.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load roles for select:', err);
    }
}

filterRole("editUserRole")
filterRole("newUserRole")


async function loadDeletedUsers() {
    const tableElem = document.getElementById('deletedUsersTable');
    if (!tableElem) return;

    const tbody = tableElem.querySelector('tbody');
    const badge = document.getElementById('deletedUsersCount');
    if (!tbody) return;

    const users = (await getUsers()).filter(u => u.isDeleted);

    if (badge) badge.textContent = users.length;

    tbody.innerHTML = '';
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No deleted accounts.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = tbody.insertRow();
        row.classList.add('animate__animated', 'animate__fadeIn');
        row.innerHTML = `
            <td><strong>${user.name}</strong></td>
            <td><span class="badge bg-secondary">${user.role}</span></td>
            <td>${user.username}</td>
            <td>${user.deletedDate || 'Unknown'}</td>
            <td>${user.deletedBy || 'System'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-outline-success" onclick="restoreUser(${user.id})" title="Restore">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="permanentlyDeleteUser(${user.id})" title="Permanent Delete">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </td>
        `;
    });
}
function showAddUserModal() {
    const form = document.getElementById('addUserForm');
    if (form) form.reset();

    const modalElem = document.getElementById('addUserModal');
    if (!modalElem) return;
    const modal = new bootstrap.Modal(modalElem);
    modal.show();
}

// Helper: get role ID by role name from DB
async function getRoleIdByName(roleName) {
    const roles = await rolesDB.show(); // fetch all roles
    const role = roles.find(r => r.name.toLowerCase() === roleName.toLowerCase());
    return role ? role.id : null;
}

async function getRoleNameById(roleId) {
    const roles = await rolesDB.show();
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : '';
}

async function saveNewUser() {
    const name = document.getElementById('newFullName')?.value.trim();
    const username = document.getElementById('newUsername')?.value.trim();
    const pass = document.getElementById('newUserPassword')?.value;
    const confirmPass = document.getElementById('confirmUserPassword')?.value;
    const roleName = document.getElementById('newUserRole')?.value;

    if (!name || !username || !pass || !confirmPass || !roleName) {
        showModalNotification('Please fill in all fields', 'warning', 'Validation Error');
        return;
    }

    if (pass !== confirmPass) {
        showModalNotification('Passwords do not match', 'warning', 'Validation Error');
        return;
    }

    try {
        // 1️⃣ Get role_id from DB
        const role_id = await getRoleIdByName(roleName);
        if (!role_id) {
            showModalNotification('Invalid role selected', 'warning', 'Validation Error');
            return;
        }

        // 2️⃣ Check if username already exists in DB
        const existingUsers = await usersDB.show({ username });
        if (existingUsers.length > 0) {
            showModalNotification('Username already exists', 'warning', 'Duplicate Entry');
            return;
        }

        // 3️⃣ Create user object
        const newUser = {
            full_name: name,
            username: username,
            password_hash: pass, // store hash if needed
            role_id: role_id,
            status: 'Active',
            last_login: null,
            created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        // 4️⃣ Insert into users DB
        await usersDB.add(newUser);

        // 5️⃣ Close modal
        const modalElem = document.getElementById('addUserModal');
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();

        showModalNotification(`User "${name}" created successfully`, 'success', 'User Added');

        // 6️⃣ Log activity and refresh table
        logAdminActivity('Created new user account', username, 'Success');
        loadUserManagement();

    } catch (err) {
        console.error('Failed to add new user:', err);
        showModalNotification('Failed to create user', 'danger', 'Error');
    }
}

// Attach click listener
document.getElementById('saveNewUserBtn')?.addEventListener('click', saveNewUser);

// Edit user: fetch from DB and prefill modal
async function editUser(id) {
    try {
        const users = await usersDB.show({ id });
        if (!users || users.length === 0) return;
        const user = users[0];

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editFullName').value = user.full_name;
        document.getElementById('editUsername').value = user.username;
        document.getElementById('editUserStatus').value = user.status;

        // Fetch role name from role_id
        const roleName = await getRoleNameById(user.role_id);
        document.getElementById('editUserRole').value = roleName;

        document.getElementById('editUserPassword').value = ''; // clear password

        const modalElem = document.getElementById('editUserModal');
        if (!modalElem) return;
        const modal = new bootstrap.Modal(modalElem);
        modal.show();

    } catch (err) {
        console.error('Failed to load user for editing:', err);
        showModalNotification('Failed to load user', 'danger', 'Error');
    }
}

// Save edited user to DB
async function saveUserChanges() {
    const id = parseInt(document.getElementById('editUserId').value);
    const name = document.getElementById('editFullName').value.trim();
    const username = document.getElementById('editUsername').value.trim();
    const roleName = document.getElementById('editUserRole').value;
    const status = document.getElementById('editUserStatus').value;
    const newPass = document.getElementById('editUserPassword').value;

    if (!name || !username || !roleName) {
        showModalNotification('Full name, username, and role are required', 'warning', 'Validation Error');
        return;
    }

    try {
        const role_id = await getRoleIdByName(roleName);
        if (!role_id) {
            showModalNotification('Invalid role selected', 'warning', 'Validation Error');
            return;
        }

        // Fetch user
        const users = await usersDB.show({ id });
        if (!users || users.length === 0) return;
        const user = users[0];

        // Update fields
        const updatedUser = {
            ...user,
            full_name: name,
            username: username,
            role_id: role_id,
            status: status,
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };

        // Update password if provided
        if (newPass) updatedUser.password_hash = newPass;

        // Save to DB
        await usersDB.edit(updatedUser);

        const modalElem = document.getElementById('editUserModal');
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();

        showModalNotification(`Account for "${name}" updated`, 'success', 'User Updated');
        logAdminActivity('Updated user account', username, 'Success');
        loadUserManagement();

    } catch (err) {
        console.error('Failed to save user changes:', err);
        showModalNotification('Failed to update user', 'danger', 'Error');
    }
}

// Delete user: mark as deleted in DB
async function deleteUser(id) {
    try {
        const users = await usersDB.show({ id });
        if (!users || users.length === 0) return;
        const user = users[0];

        showConfirm(`Are you sure you want to delete "${user.full_name}"? This account will be moved to Deleted Accounts.`, async function () {
            const updatedUser = {
                ...user,
                status: 'Deleted',
                deleted_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                deleted_by: 'Administrator'
            };

            await usersDB.edit(updatedUser);

            showModalNotification(`Account "${user.username}" deleted`, 'success', 'User Removed');
            logAdminActivity('Deleted user account', user.username, 'Success');
            loadUserManagement();
        });
    } catch (err) {
        console.error('Failed to delete user:', err);
        showModalNotification('Failed to delete user', 'danger', 'Error');
    }
}
async function restoreUser(id) {
    try {
        const users = await usersDB.show({ id });
        if (!users || users.length === 0) return;
        const user = users[0];

        showConfirm(`Restore account for "${user.full_name}"?`, async function () {
            await usersDB.edit({ id: user.id, deleted_at: null });
            showModalNotification(`Account "${user.username}" restored`, 'success', 'User Restored');
            logAdminActivity('Restored user account', user.username, 'Success');
            loadUserManagement();
        });
    } catch (err) {
        console.error('Failed to restore user:', err);
        showModalNotification('Failed to restore user', 'danger', 'Error');
    }
}

async function permanentlyDeleteUser(id) {
    try {
        const users = await usersDB.show({ id });
        if (!users || users.length === 0) return;
        const user = users[0];

        showConfirm(`PERMANENTLY DELETE "${user.full_name}"? This action cannot be reversed.`, async function () {
            await usersDB.delete({ id: user.id });
            showModalNotification(`Account "${user.username}" permanently removed`, 'success', 'User Purged');
            logAdminActivity('Permanently deleted user account', user.username, 'Success');
            loadUserManagement();
        });
    } catch (err) {
        console.error('Failed to permanently delete user:', err);
        showModalNotification('Failed to delete user', 'danger', 'Error');
    }
}

// Reports Functions
let reportsChart = null;

function initializeReports() {
    // Generate button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function () {
            generateReport();
        });
    }

    // Print button
    const printReportBtn = document.getElementById('printReportBtn');
    if (printReportBtn) {
        printReportBtn.addEventListener('click', function () {
            printReport();
        });
    }

    // Excel button
    const downloadExcelBtn = document.getElementById('downloadExcelBtn');
    if (downloadExcelBtn) {
        downloadExcelBtn.addEventListener('click', function () {
            exportToExcel();
        });
    }

    // Set default dates (today)
    const dateFrom = document.getElementById('reportDateFrom');
    const dateTo = document.getElementById('reportDateTo');
    if (dateFrom && dateTo) {
        const today = new Date().toISOString().split('T')[0];
        // Set dateFrom to 7 days ago by default
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateFrom.value = lastWeek.toISOString().split('T')[0];
        dateTo.value = today;
    }

    // Seed sample sales if none exist
    ensureSampleSalesExist();

    // Initial load
    generateReport();

    // Real-time update every 30 seconds
    setInterval(() => {
        if (document.getElementById('reports-content')) {
            generateReport(true); // silent update
        }
    }, 30000);
}

function ensureSampleSalesExist() {
    let sales = loadFromLocalStorage('sales');
    if (!sales || sales.length === 0) {
        const today = new Date();
        const sampleSales = [];

        // Generate some sales for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // 2-4 sales per day
            const salesPerDay = Math.floor(Math.random() * 3) + 2;
            for (let j = 0; j < salesPerDay; j++) {
                const total = Math.floor(Math.random() * 500) + 100;
                sampleSales.push({
                    id: 'SALE-' + (1000 + sampleSales.length),
                    date: dateStr,
                    time: '12:00:00',
                    timestamp: date.getTime(),
                    items: [
                        { name: 'Beef Steak', quantity: 2, price: 24.99, subtotal: 49.98 },
                        { name: 'Chicken Curry', quantity: 1, price: 18.99, subtotal: 18.99 }
                    ],
                    total: total,
                    staff: 'Staff Member'
                });
            }
        }
        saveToLocalStorage('sales', sampleSales);
    }
}

function generateReport(silent = false) {
    if (!silent) {
        showModalNotification('Generating report data...', 'info', 'Loading');
    }

    setTimeout(() => {
        const reportType = document.getElementById('reportType')?.value || 'Daily';
        const dateFrom = document.getElementById('reportDateFrom')?.value;
        const dateTo = document.getElementById('reportDateTo')?.value;

        let sales = loadFromLocalStorage('sales') || [];

        // Filter sales by date
        if (dateFrom && dateTo) {
            sales = sales.filter(sale => {
                const saleDate = sale.date; // yyyy-mm-dd
                return saleDate >= dateFrom && saleDate <= dateTo;
            });
        }

        // Update Summary Metrics
        updateSummaryMetrics(sales);

        // Update Graph
        updateReportsChart(sales, reportType);

        // Update Detailed Table
        updateReportsDetailTable(sales);

        if (!silent) {
            showModalNotification('Report generated successfully', 'success', 'Complete');
            logAdminActivity('Generated report', `${reportType} (${dateFrom} to ${dateTo})`, 'Success');
        }
    }, silent ? 0 : 800);
}

function updateSummaryMetrics(sales) {
    const totalNetSalesElem = document.getElementById('totalNetSales');
    const totalTransactionsElem = document.getElementById('totalReportTransactions');
    const topSellingItemElem = document.getElementById('topSellingItem');
    const avgOrderValueElem = document.getElementById('avgOrderValue');

    if (!totalNetSalesElem) return;

    let totalSales = 0;
    let itemCounts = {};

    sales.forEach(sale => {
        totalSales += sale.total;
        sale.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
    });

    // Find top selling item
    let topItem = '-';
    let maxCount = 0;
    for (let item in itemCounts) {
        if (itemCounts[item] > maxCount) {
            maxCount = itemCounts[item];
            topItem = item;
        }
    }

    totalNetSalesElem.textContent = formatCurrency(totalSales);
    totalTransactionsElem.textContent = sales.length;
    topSellingItemElem.textContent = topItem === '-' ? '-' : `${topItem} (${maxCount})`;
    avgOrderValueElem.textContent = sales.length > 0 ? formatCurrency(totalSales / sales.length) : formatCurrency(0);
}

function updateReportsChart(sales, reportType) {
    const ctx = document.getElementById('reportsChart');
    if (!ctx) return;

    // Destroy existing chart if it exists
    if (reportsChart) {
        reportsChart.destroy();
    }

    // Group sales by date for the labels
    const salesByDate = {};
    sales.forEach(sale => {
        const date = sale.date;
        salesByDate[date] = (salesByDate[date] || 0) + sale.total;
    });

    // Sort dates
    const sortedDates = Object.keys(salesByDate).sort();
    const data = sortedDates.map(date => salesByDate[date]);

    // If no data, show sample data for the graph as requested
    let chartLabels = sortedDates.length > 0 ? sortedDates : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let chartData = data.length > 0 ? data : [120, 190, 300, 500, 200, 300, 450];
    let label = sortedDates.length > 0 ? 'Sales Amount' : 'Sample Sales Data (No Actual Sales)';

    reportsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: label,
                data: chartData,
                backgroundColor: 'rgba(128, 0, 0, 0.1)',
                borderColor: 'rgba(128, 0, 0, 1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'rgba(128, 0, 0, 1)',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return '$' + value;
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

function updateReportsDetailTable(sales) {
    const tableBody = document.querySelector('#reportsDetailTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (sales.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No transactions found for the selected period</td></tr>';
        return;
    }

    // Sort sales by date decending (newest first)
    const sortedSales = [...sales].sort((a, b) => b.timestamp - a.timestamp);

    sortedSales.forEach(sale => {
        const row = tableBody.insertRow();
        const itemsList = sale.items.map(i => `${i.name} x${i.quantity}`).join(', ');

        row.innerHTML = `
            <td>${sale.date} ${sale.time}</td>
            <td><code>${sale.id}</code></td>
            <td>${sale.staff}</td>
            <td><small>${itemsList}</small></td>
            <td class="fw-bold">${formatCurrency(sale.total)}</td>
            <td>
                <button class="btn btn-sm btn-outline-danger" onclick="viewSaleDetails('${sale.id}')">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
    });
}

function viewSaleDetails(saleId) {
    const sales = loadFromLocalStorage('sales') || [];
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    let itemsHtml = sale.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.subtotal)}</td>
        </tr>
    `).join('');

    Swal.fire({
        title: `Transaction Details: ${sale.id}`,
        html: `
            <div class="text-start">
                <p><strong>Date:</strong> ${sale.date} ${sale.time}</p>
                <p><strong>Staff:</strong> ${sale.staff}</p>
                <table class="table table-sm table-bordered mt-3">
                    <thead>
                        <tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr><th colspan="3" class="text-end">Total:</th><th>${formatCurrency(sale.total)}</th></tr>
                    </tfoot>
                </table>
            </div>
        `,
        confirmButtonColor: '#800000'
    });
}

function printReport() {
    const reportContent = document.getElementById('reports-content');
    if (!reportContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');

    // Create print-friendly version
    const summary = {
        sales: document.getElementById('totalNetSales').textContent,
        transactions: document.getElementById('totalReportTransactions').textContent,
        topItem: document.getElementById('topSellingItem').textContent,
        avg: document.getElementById('avgOrderValue').textContent
    };

    const tableRows = document.querySelector('#reportsDetailTable tbody').innerHTML;

    printWindow.document.write(`
        <html>
            <head>
                <title>Owner Report - ${new Date().toLocaleDateString()}</title>
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { padding: 30px; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #800000; padding-bottom: 10px; }
                    .metrics { display: flex; justify-content: space-between; margin-bottom: 30px; }
                    .metric-box { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; margin: 0 10px; text-align: center; }
                    .metric-val { font-size: 1.2rem; font-weight: bold; color: #800000; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Ethan's Cafe - Owner Report</h2>
                    <p>Generated on: ${new Date().toLocaleString()}</p>
                </div>
                <div class="metrics">
                    <div class="metric-box"><div>Total Sales</div><div class="metric-val">${summary.sales}</div></div>
                    <div class="metric-box"><div>Transactions</div><div class="metric-val">${summary.transactions}</div></div>
                    <div class="metric-box"><div>Top Item</div><div class="metric-val">${summary.topItem}</div></div>
                    <div class="metric-box"><div>Avg Order</div><div class="metric-val">${summary.avg}</div></div>
                </div>
                <h4>Transaction Details</h4>
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr><th>Date/Time</th><th>Reference</th><th>Staff</th><th>Items</th><th>Total</th></tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
                <div class="mt-5 text-center text-muted small">
                    End of Report
                </div>
            </body>
        </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
        printWindow.print();
    }, 500);

    logAdminActivity('Printed report', 'Print View Generated', 'Success');
}

function exportToExcel() {
    const sales = loadFromLocalStorage('sales') || [];
    if (sales.length === 0) {
        showModalNotification('No data to export', 'warning', 'Export Empty');
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Time,Reference,Staff,Items,Total\n";

    sales.forEach(sale => {
        const itemsList = sale.items.map(i => `${i.name} (${i.quantity})`).join('|');
        const row = [
            sale.date,
            sale.time,
            sale.id,
            sale.staff,
            `"${itemsList}"`,
            sale.total
        ].join(",");
        csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reports_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showModalNotification('Excel/CSV export completed', 'success', 'Export Success');
    logAdminActivity('Exported reports', 'CSV Export', 'Success');
}

// Backup Functions
function initializeBackup() {
    // Create backup button
    const createBackupBtn = document.getElementById('createBackupBtn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to create a full system backup?', function () {
                createFullBackup();
            });
        });
    }

    // Backup type buttons
    document.querySelectorAll('[data-backup-type]').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.getAttribute('data-backup-type');
            createBackup(type);
        });
    });

    // Restore backup button
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to restore from this backup? Current data will be overwritten.', function () {
                restoreBackup();
            });
        });
    }

    // Backup file input
    const backupFileInput = document.getElementById('backupFile');
    if (backupFileInput) {
        backupFileInput.addEventListener('change', function () {
            const btn = document.getElementById('restoreBackupBtn');
            if (btn) btn.disabled = !this.files.length;
        });
    }

    // Load backup data
    loadBackupData();
}

function loadBackupData() {
    const tableElem = document.getElementById('backupsTable');
    if (!tableElem) return;

    const backupsTable = tableElem.getElementsByTagName('tbody')[0];
    if (!backupsTable) return;

    backupsTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading backup data...</p></td></tr>';

    setTimeout(() => {
        const backups = [
            { name: 'full-backup-2023-10-01.json', type: 'Full System', date: '2023-10-01', size: '45 KB' },
            { name: 'inventory-backup-2023-09-30.json', type: 'Inventory', date: '2023-09-30', size: '18 KB' }
        ];

        backupsTable.innerHTML = '';

        backups.forEach(backup => {
            const row = backupsTable.insertRow();
            row.innerHTML = `
                <td>${backup.name}</td>
                <td><span class="badge bg-secondary">${backup.type}</span></td>
                <td>${backup.date}</td>
                <td>${backup.size}</td>
                <td><button class="btn btn-sm btn-outline-success">Download</button></td>
            `;
        });
    }, 800);
}

function createFullBackup() {
    showModalNotification('Creating full system backup...', 'info', 'Creating Backup');
    setTimeout(() => {
        showModalNotification('Full system backup created successfully', 'success', 'Backup Complete');
        logAdminActivity('Created full system backup', 'Full backup', 'Success');
        loadBackupData();
    }, 1500);
}

function createBackup(type) {
    showModalNotification(`Creating ${type} backup...`, 'info', 'Creating Backup');
    setTimeout(() => {
        showModalNotification(`${type} backup created successfully`, 'success', 'Backup Complete');
        logAdminActivity(`Created ${type} backup`, type, 'Success');
        loadBackupData();
    }, 1000);
}

function restoreBackup() {
    showModalNotification('Restoring from backup...', 'info', 'Restoring Backup');
    setTimeout(() => {
        showModalNotification('Data restored successfully', 'success', 'Restore Complete');
        logAdminActivity('Restored system from backup', 'System Restore', 'Success');
    }, 2000);
}

// Requests Functions
// ===== Request Management Functions =====

function getAccountRequests() {
    try {
        const stored = localStorage.getItem('accountRequests');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveAccountRequests(requests) {
    localStorage.setItem('accountRequests', JSON.stringify(requests));
}

function initializeRequests() {
    // Search listener
    const searchInput = document.getElementById('requestSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => loadRequests());
    }

    // Filter listener
    const statusFilter = document.getElementById('requestStatusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => loadRequests());
    }

    // Initial load
    loadRequests();
}

async function loadRequests() {
    const tableElem = document.getElementById('requestsTable');
    if (!tableElem) {
        updateRequestSidebarBadge();
        return;
    }

    const tbody = tableElem.querySelector('tbody');
    if (!tbody) return;

    const searchTerm = (document.getElementById('requestSearch')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('requestStatusFilter')?.value || 'Pending';

    // Only show loading if empty
    if (tbody.children.length === 0 || (tbody.children.length === 1 && tbody.innerText.includes('Loading'))) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border spinner-border-sm text-danger me-2"></div>Loading requests...</td></tr>';
    }

    try {
        // Fetch from both tables
        const results = await Promise.all([
            accountRequestsDB.show(),
            requestsTblDB.show(),
            usersDB.show(),
            rolesDB.show()
        ]);

        const regRequests = Array.isArray(results[0]) ? results[0] : [];
        const updateRequests = Array.isArray(results[1]) ? results[1] : [];
        const users = Array.isArray(results[2]) ? results[2] : [];
        const roles = Array.isArray(results[3]) ? results[3] : [];

        const userMap = {};
        users.forEach(u => userMap[u.id] = u.full_name);

        const roleMap = {};
        roles.forEach(r => roleMap[r.id] = r.name);

        let allRequests = [];

        // Add Account Registration Requests
        regRequests.forEach(req => {
            allRequests.push({
                id: req.id,
                source: 'account_requests',
                date: req.requested_at,
                name: req.full_name,
                typeLabel: 'Account Request',
                itemAction: roleMap[req.requested_role_id] || 'Staff',
                note: `New user registration (${req.email || 'No email'})`,
                status: req.status,
                raw: req
            });
        });

        // Add Staff Update Requests
        updateRequests.forEach(req => {
            const payload = JSON.parse(req.payload || '{}');
            let actionText = req.type === 'account_update' ? 'Profile Update' : 'Password Change';
            let noteText = '';
            if (req.type === 'account_update') {
                noteText = `New Name: ${payload.full_name || '-'}`;
            } else {
                noteText = 'Security credential update';
            }

            allRequests.push({
                id: req.id,
                source: 'requests_tbl',
                date: req.created_at,
                name: userMap[req.requester_id] || 'Unknown Staff',
                typeLabel: 'Staff Request',
                itemAction: actionText,
                note: noteText,
                status: req.status || 'Pending',
                raw: req
            });
        });

        // Sort by date descending
        allRequests.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Apply filters
        if (statusFilter !== 'All') {
            allRequests = allRequests.filter(r => r.status === statusFilter);
        }
        if (searchTerm) {
            allRequests = allRequests.filter(r =>
                r.name.toLowerCase().includes(searchTerm) ||
                r.itemAction.toLowerCase().includes(searchTerm) ||
                r.note.toLowerCase().includes(searchTerm)
            );
        }

        tbody.innerHTML = '';

        if (allRequests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No matching requests found.</td></tr>';
            return;
        }

        const newHtml = allRequests.map(req => {
            const isPending = req.status === 'Pending';
            const statusBadge = req.status === 'Pending' ? 'bg-warning' : (req.status === 'Approved' ? 'bg-success' : 'bg-danger');

            return `
                <tr class="animate__animated animate__fadeIn">
                    <td>${new Date(req.date).toLocaleString()}</td>
                    <td><strong>${req.name}</strong></td>
                    <td><span class="badge bg-secondary">${req.typeLabel}</span></td>
                    <td>${req.itemAction}</td>
                    <td class="small">${req.note}</td>
                    <td><span class="badge ${statusBadge}">${req.status}</span></td>
                    <td>
                        ${isPending ? `
                            <div class="table-actions">
                                <button class="btn btn-sm btn-outline-success" onclick="approveRequest('${req.source}', ${req.id})" title="Approve">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" onclick="denyRequest('${req.source}', ${req.id})" title="Deny">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        ` : `
                            <button class="btn btn-sm btn-outline-secondary" onclick="deleteRequestRecord('${req.source}', ${req.id})" title="Delete Record">
                                <i class="fas fa-trash"></i>
                            </button>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        if (tbody.innerHTML !== newHtml) {
            tbody.innerHTML = newHtml;
        }

        const pageBadge = document.getElementById('pendingRequestsBadge');
        if (pageBadge) {
            const pendingCount = allRequests.filter(r => r.status === 'Pending').length;
            pageBadge.textContent = `${pendingCount} Pending Request${pendingCount !== 1 ? 's' : ''}`;
        }

        updateRequestSidebarBadge();
    } catch (e) {
        console.error('Failed to load requests:', e);
        if (tbody.innerHTML === '' || tbody.innerText.includes('Loading')) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error loading requests.</td></tr>';
        }
    }
}



async function updateRequestSidebarBadge() {
    try {
        const [regs, others] = await Promise.all([
            accountRequestsDB.show({ status: 'Pending' }),
            requestsTblDB.show({ status: 'Pending' })
        ]);

        const pendingCount = (Array.isArray(regs) ? regs.length : 0) + (Array.isArray(others) ? others.length : 0);

        // 1. Update global ID-based badge if it exists (usually in dashboard content or requests page header)
        const idBadge = document.getElementById('pendingRequestsBadge');
        if (idBadge) {
            idBadge.textContent = pendingCount + (idBadge.tagName === 'SPAN' && idBadge.innerText.includes('Pending') ? ' Pending Requests' : '');
            if (pendingCount > 0) {
                idBadge.classList.remove('d-none');
            } else {
                idBadge.classList.add('d-none');
            }
        }

        // 2. Update SIDEBAR specific badges
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            // Check if this link is for Requests
            if (link.href.includes('admin-requests.html') || link.textContent.includes('Requests')) {
                let sidebarBadge = link.querySelector('.sidebar-badge-item');

                if (pendingCount > 0) {
                    if (!sidebarBadge) {
                        sidebarBadge = document.createElement('span');
                        sidebarBadge.className = 'badge bg-danger rounded-pill ms-auto sidebar-badge-item animate__animated animate__bounceIn';
                        link.appendChild(sidebarBadge);
                    }
                    sidebarBadge.textContent = pendingCount;
                } else if (sidebarBadge) {
                    sidebarBadge.remove();
                }
            }
        });
        // Also update dashboard alert count if on dashboard
        const alertsCount = document.getElementById('systemAlerts');
        if (alertsCount) {
            const ingredients = await ingredientsDB.show();
            const lowStock = ingredients.filter(ing => parseFloat(ing.current_quantity) <= parseFloat(ing.low_stock_threshold)).length;
            alertsCount.textContent = (pendingCount > 0 || lowStock > 0) ? (pendingCount + (lowStock > 0 ? 1 : 0)) : '0';
        }
    } catch (e) {
        console.error('Badge update failed:', e);
    }
}

function startRequestBadgePolling() {
    updateRequestSidebarBadge();
    setInterval(updateRequestSidebarBadge, 10000); // 10 seconds
}

async function approveRequest(source, id) {
    showConfirm(`Are you sure you want to approve this request?`, async function () {
        try {
            if (source === 'account_requests') {
                const reqs = await accountRequestsDB.show({ id });
                const req = Array.isArray(reqs) ? reqs[0] : reqs;
                if (!req) return;

                // 1. Create User
                const newUser = {
                    full_name: req.full_name,
                    username: req.username,
                    email: req.email, // Include email from request
                    password_hash: req.password_hash, // Already hashed by backend on insertion
                    role_id: req.requested_role_id,
                    status: 'Active',
                    created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                };
                const addUserResult = await usersDB.add(newUser);
                if (addUserResult.error) {
                    showModalNotification(`Failed to create user: ${addUserResult.error}`, 'danger', 'Error');
                    return;
                }

                // 2. Update Request Status
                const editReqResult = await accountRequestsDB.edit({
                    id: req.id,
                    status: 'Approved',
                    reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });

                if (editReqResult.error) {
                    showModalNotification(`Failed to update request status: ${editReqResult.error}`, 'danger', 'Error');
                    return;
                }

                showModalNotification(`Account for "${req.username}" approved and created successfully.`, 'success', 'Approved');
                logAdminActivity('Approved account registration', req.username, 'Success');

            } else {
                const reqs = await requestsTblDB.show({ id });
                const req = Array.isArray(reqs) ? reqs[0] : reqs;
                if (!req) return;

                const payload = JSON.parse(req.payload || '{}');

                if (req.type === 'account_update') {
                    // Update user record
                    await usersDB.edit({
                        id: req.requester_id,
                        full_name: payload.full_name,
                        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                    });
                } else if (req.type === 'password_change') {
                    // Update password
                    await usersDB.edit({
                        id: req.requester_id,
                        password_hash: payload.new_password, // Backend handled? Actually app.php hashes on PUT if table is users
                        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                    });
                }

                // Update Request Status
                await requestsTblDB.edit({
                    id: req.id,
                    status: 'Approved',
                    handled_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });

                showModalNotification(`Staff update request approved.`, 'success', 'Approved');
                logAdminActivity('Approved staff account update', `Requester ID: ${req.requester_id}`, 'Success');
            }

            loadRequests();

        } catch (err) {
            console.error('Approval failed:', err);
            showModalNotification('Process failed.', 'danger', 'Error');
        }
    });
}

async function denyRequest(source, id) {
    showConfirm(`Deny this request?`, async function () {
        try {
            if (source === 'account_requests') {
                await accountRequestsDB.edit({
                    id: id,
                    status: 'Denied',
                    reviewed_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });
            } else {
                await requestsTblDB.edit({
                    id: id,
                    status: 'Denied',
                    handled_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
                });
            }

            showModalNotification('Request denied.', 'info', 'Denied');
            loadRequests();
        } catch (err) {
            console.error('Deny failed:', err);
            showModalNotification('Process failed.', 'danger', 'Error');
        }
    });
}

async function deleteRequestRecord(source, id) {
    showConfirm(`Delete this request record permanently?`, async function () {
        try {
            if (source === 'account_requests') {
                await accountRequestsDB.delete(id);
            } else {
                await requestsTblDB.delete(id);
            }
            showModalNotification('Record deleted.', 'success', 'Deleted');
            loadRequests();
        } catch (err) {
            console.error('Delete failed:', err);
            showModalNotification('Process failed.', 'danger', 'Error');
        }
    });
}


// System Settings Functions
function initializeSystemSettings() {
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to save settings?', function () {
                saveSystemSettings();
            });
        });
    }
}

function saveSystemSettings() {
    showModalNotification('Saving system settings...', 'info', 'Saving');
    setTimeout(() => {
        showModalNotification('Settings saved successfully', 'success', 'Saved');
    }, 1000);
}

// ===== Activity Log Functions =====

// Determine category of an activity based on its action text
function getActivityCategory(action) {
    const a = action.toLowerCase();
    if (a.includes('log in') || a.includes('logged in') || a.includes('login') ||
        a.includes('log out') || a.includes('logged out') || a.includes('logout')) {
        return 'Login';
    }
    if (a.includes('sale') || a.includes('receipt') || a.includes('transaction') ||
        a.includes('recorded sale') || a.includes('printed receipt') || a.includes('payment') ||
        a.includes('order') || a.includes('refund') || a.includes('void')) {
        return 'Sales';
    }
    if (a.includes('ingredient') || a.includes('inventory') || a.includes('stock') ||
        a.includes('increased') || a.includes('decreased') || a.includes('restock') ||
        a.includes('quantity')) {
        return 'Inventory';
    }
    // Everything else is Administrative
    return 'Admin';
}

// Get category badge HTML
function getCategoryBadge(category) {
    const map = {
        'Login': { bg: 'bg-info', label: 'Login / Logout', icon: 'fa-sign-in-alt' },
        'Sales': { bg: 'bg-success', label: 'Sales & Transactions', icon: 'fa-cash-register' },
        'Inventory': { bg: 'bg-warning text-dark', label: 'Inventory Update', icon: 'fa-boxes' },
        'Admin': { bg: 'bg-danger', label: 'Administrative', icon: 'fa-shield-alt' }
    };
    const info = map[category] || map['Admin'];
    return `<span class="badge ${info.bg}"><i class="fas ${info.icon} me-1"></i>${info.label}</span>`;
}

// Get all activity logs from localStorage (merged with sample data)
function getAllActivityLogs() {
    let logs = [];
    try {
        const stored = localStorage.getItem('systemActivityLogs');
        if (stored) logs = JSON.parse(stored);
    } catch (e) { logs = []; }

    // If empty, seed with sample data
    if (!logs || logs.length === 0) {
        logs = generateSeedActivityLogs();
        localStorage.setItem('systemActivityLogs', JSON.stringify(logs));
    }
    // Sort by timestamp descending (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return logs;
}

// Generate seed activity data so the log is not empty on first load
function generateSeedActivityLogs() {
    const today = new Date();
    const fmt = (d) => {
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    const ms = (h, m) => h * 3600000 + m * 60000;

    // Generate activities for today and past couple of days
    const seeds = [];
    let id = 1;

    // --- Today ---
    const t0 = new Date(today); t0.setHours(8, 5, 12, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Logged in', reference: 'System', timestamp: fmt(t0), category: 'Login', ip: '192.168.1.10' });

    const t1 = new Date(today); t1.setHours(8, 12, 45, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Updated system settings', reference: 'System Settings', timestamp: fmt(t1), category: 'Admin', ip: '192.168.1.10' });

    const t2 = new Date(today); t2.setHours(8, 30, 0, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Logged in', reference: 'System', timestamp: fmt(t2), category: 'Login', ip: '192.168.1.15' });

    const t3 = new Date(today); t3.setHours(9, 15, 33, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Recorded sale', reference: 'SALE-2001', timestamp: fmt(t3), category: 'Sales', ip: '192.168.1.15' });

    const t4 = new Date(today); t4.setHours(9, 17, 10, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Printed receipt', reference: 'REC-2001', timestamp: fmt(t4), category: 'Sales', ip: '192.168.1.15' });

    const t5 = new Date(today); t5.setHours(10, 0, 22, 0);
    seeds.push({ id: id++, userName: 'Jane Smith', action: 'Logged in', reference: 'System', timestamp: fmt(t5), category: 'Login', ip: '192.168.1.20' });

    const t6 = new Date(today); t6.setHours(10, 25, 5, 0);
    seeds.push({ id: id++, userName: 'Jane Smith', action: 'Increased ingredient quantity', reference: 'Chicken (+10 kg)', timestamp: fmt(t6), category: 'Inventory', ip: '192.168.1.20' });

    const t7 = new Date(today); t7.setHours(11, 2, 44, 0);
    seeds.push({ id: id++, userName: 'Jane Smith', action: 'Recorded sale', reference: 'SALE-2002', timestamp: fmt(t7), category: 'Sales', ip: '192.168.1.20' });

    const t8 = new Date(today); t8.setHours(11, 45, 18, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Added new menu item', reference: 'Grilled Salmon', timestamp: fmt(t8), category: 'Admin', ip: '192.168.1.10' });

    const t9 = new Date(today); t9.setHours(12, 10, 30, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Recorded sale', reference: 'SALE-2003', timestamp: fmt(t9), category: 'Sales', ip: '192.168.1.15' });

    const t10 = new Date(today); t10.setHours(13, 5, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Decreased ingredient quantity', reference: 'Tomatoes (-2 kg, Spoilage)', timestamp: fmt(t10), category: 'Inventory', ip: '192.168.1.10' });

    const t11 = new Date(today); t11.setHours(14, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Sarah Williams', action: 'Logged in', reference: 'System', timestamp: fmt(t11), category: 'Login', ip: '192.168.1.25' });

    const t12 = new Date(today); t12.setHours(14, 20, 15, 0);
    seeds.push({ id: id++, userName: 'Sarah Williams', action: 'Recorded sale', reference: 'SALE-2004', timestamp: fmt(t12), category: 'Sales', ip: '192.168.1.25' });

    const t13 = new Date(today); t13.setHours(15, 30, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Created full system backup', reference: 'Backup', timestamp: fmt(t13), category: 'Admin', ip: '192.168.1.10' });

    const t14 = new Date(today); t14.setHours(16, 0, 0, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Logged out', reference: 'System', timestamp: fmt(t14), category: 'Login', ip: '192.168.1.15' });

    // --- Yesterday ---
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const y0 = new Date(yesterday); y0.setHours(7, 55, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Logged in', reference: 'System', timestamp: fmt(y0), category: 'Login', ip: '192.168.1.10' });

    const y1 = new Date(yesterday); y1.setHours(8, 30, 0, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Logged in', reference: 'System', timestamp: fmt(y1), category: 'Login', ip: '192.168.1.15' });

    const y2 = new Date(yesterday); y2.setHours(9, 0, 0, 0);
    seeds.push({ id: id++, userName: 'John Doe', action: 'Recorded sale', reference: 'SALE-1998', timestamp: fmt(y2), category: 'Sales', ip: '192.168.1.15' });

    const y3 = new Date(yesterday); y3.setHours(10, 15, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Approved staff account request', reference: 'Robert Johnson', timestamp: fmt(y3), category: 'Admin', ip: '192.168.1.10' });

    const y4 = new Date(yesterday); y4.setHours(11, 30, 0, 0);
    seeds.push({ id: id++, userName: 'Jane Smith', action: 'Logged in', reference: 'System', timestamp: fmt(y4), category: 'Login', ip: '192.168.1.20' });

    const y5 = new Date(yesterday); y5.setHours(12, 45, 0, 0);
    seeds.push({ id: id++, userName: 'Jane Smith', action: 'Recorded sale', reference: 'SALE-1999', timestamp: fmt(y5), category: 'Sales', ip: '192.168.1.20' });

    const y6 = new Date(yesterday); y6.setHours(14, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Increased ingredient quantity', reference: 'Beef (+5 kg)', timestamp: fmt(y6), category: 'Inventory', ip: '192.168.1.10' });

    const y7 = new Date(yesterday); y7.setHours(15, 30, 0, 0);
    seeds.push({ id: id++, userName: 'Jane Smith', action: 'Recorded sale', reference: 'SALE-2000', timestamp: fmt(y7), category: 'Sales', ip: '192.168.1.20' });

    const y8 = new Date(yesterday); y8.setHours(17, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Logged out', reference: 'System', timestamp: fmt(y8), category: 'Login', ip: '192.168.1.10' });

    // --- Two days ago ---
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const d0 = new Date(twoDaysAgo); d0.setHours(8, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Logged in', reference: 'System', timestamp: fmt(d0), category: 'Login', ip: '192.168.1.10' });

    const d1 = new Date(twoDaysAgo); d1.setHours(9, 15, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Deleted user account', reference: 'Mike Brown', timestamp: fmt(d1), category: 'Admin', ip: '192.168.1.10' });

    const d2 = new Date(twoDaysAgo); d2.setHours(10, 30, 0, 0);
    seeds.push({ id: id++, userName: 'Robert Johnson', action: 'Logged in', reference: 'System', timestamp: fmt(d2), category: 'Login', ip: '192.168.1.30' });

    const d3 = new Date(twoDaysAgo); d3.setHours(11, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Robert Johnson', action: 'Recorded sale', reference: 'SALE-1995', timestamp: fmt(d3), category: 'Sales', ip: '192.168.1.30' });

    const d4 = new Date(twoDaysAgo); d4.setHours(13, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Decreased ingredient quantity', reference: 'Onions (-1 kg, Used)', timestamp: fmt(d4), category: 'Inventory', ip: '192.168.1.10' });

    const d5 = new Date(twoDaysAgo); d5.setHours(16, 0, 0, 0);
    seeds.push({ id: id++, userName: 'Admin', action: 'Generated PDF report', reference: 'Daily Sales', timestamp: fmt(d5), category: 'Admin', ip: '192.168.1.10' });

    return seeds;
}

// ===== Dashboard Recent Activity Timeline =====
function loadRecentActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;

    const logs = getAllActivityLogs();
    const recent = logs.slice(0, 8); // Show last 8 activities

    if (recent.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-4">No recent activities.</p>';
        return;
    }

    const iconMap = {
        'Login': { icon: 'fa-sign-in-alt', color: 'text-info' },
        'Sales': { icon: 'fa-cash-register', color: 'text-success' },
        'Inventory': { icon: 'fa-boxes', color: 'text-warning' },
        'Admin': { icon: 'fa-shield-alt', color: 'text-danger' }
    };

    let html = '';
    recent.forEach(log => {
        const cat = log.category || getActivityCategory(log.action);
        const info = iconMap[cat] || iconMap['Admin'];
        const ts = new Date(log.timestamp);
        const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = ts.toLocaleDateString();

        html += `
            <div class="activity-item">
                <div class="d-flex align-items-start">
                    <div class="activity-icon me-3 ${info.color}" style="min-width:40px;">
                        <i class="fas ${info.icon}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between align-items-center">
                            <strong class="small">${log.userName}</strong>
                            <small class="text-muted">${timeStr}</small>
                        </div>
                        <p class="mb-0 small">${log.action}</p>
                        <small class="text-muted">${log.reference || ''} &middot; ${dateStr}</small>
                    </div>
                </div>
            </div>`;
    });

    container.innerHTML = html;
}

// ===== Old initializeActivityLog (for activityLogTable if it exists on other pages) =====
function initializeActivityLog() {
    const exportBtn = document.getElementById('exportActivityLog');
    if (exportBtn) {
        exportBtn.addEventListener('click', function () {
            showModalNotification('Exporting activity log...', 'info', 'Exporting');
        });
    }
    loadActivityLog();
}

function loadActivityLog() {
    const tableElem = document.getElementById('activityLogTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    const logs = getAllActivityLogs().slice(0, 20);
    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No activity logs found.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    logs.forEach(log => {
        const row = tbody.insertRow();
        row.innerHTML = `<td>${log.timestamp}</td><td>${log.userName}</td><td>${log.action}</td><td>${log.reference || '-'}</td>`;
    });
}

// ===== Full Activity Log Page =====
let fullLogCurrentPage = 1;
const FULL_LOG_PAGE_SIZE = 15;
let fullLogFilteredData = [];

function initializeFullActivityLog() {
    // Category filter
    const categoryFilter = document.getElementById('activityCategoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function () {
            fullLogCurrentPage = 1;
            loadFullActivityLog();
        });
    }

    // User filter
    const userFilter = document.getElementById('activityUserFilter');
    if (userFilter) {
        userFilter.addEventListener('change', function () {
            fullLogCurrentPage = 1;
            loadFullActivityLog();
        });
    }

    // Filter button
    const filterBtn = document.getElementById('filterFullActivityBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', function () {
            fullLogCurrentPage = 1;
            loadFullActivityLog();
        });
    }

    // Populate user dropdown
    populateUserFilter();

    // Initial load
    loadFullActivityLog();
}

function populateUserFilter() {
    const userFilter = document.getElementById('activityUserFilter');
    if (!userFilter) return;

    const logs = getAllActivityLogs();
    const users = [...new Set(logs.map(l => l.userName))];
    users.sort();

    // Keep the "All Users" option, add user options
    userFilter.innerHTML = '<option value="">All Users</option>';
    users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u;
        opt.textContent = u;
        userFilter.appendChild(opt);
    });
}

function loadFullActivityLog() {
    const tableElem = document.getElementById('fullActivityLogTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" class="text-center"><div class="spinner-border spinner-border-sm text-danger me-2" role="status"></div>Loading activity logs...</td></tr>';

    // Get filter values
    const categoryVal = document.getElementById('activityCategoryFilter')?.value || '';
    const userVal = document.getElementById('activityUserFilter')?.value || '';
    const fromDate = document.getElementById('activityFromDate')?.value || '';
    const toDate = document.getElementById('activityToDate')?.value || '';

    setTimeout(() => {
        let logs = getAllActivityLogs();

        // Apply category filter
        if (categoryVal) {
            logs = logs.filter(log => {
                const cat = log.category || getActivityCategory(log.action);
                return cat === categoryVal;
            });
        }

        // Apply user filter
        if (userVal) {
            logs = logs.filter(log => log.userName === userVal);
        }

        // Apply date filters
        if (fromDate) {
            const from = new Date(fromDate);
            from.setHours(0, 0, 0, 0);
            logs = logs.filter(log => new Date(log.timestamp) >= from);
        }
        if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            logs = logs.filter(log => new Date(log.timestamp) <= to);
        }

        fullLogFilteredData = logs;

        // Update entry count
        const countBadge = document.getElementById('logEntryCount');
        if (countBadge) countBadge.textContent = `${logs.length} Entries`;

        // Paginate
        const totalPages = Math.max(1, Math.ceil(logs.length / FULL_LOG_PAGE_SIZE));
        if (fullLogCurrentPage > totalPages) fullLogCurrentPage = totalPages;

        const startIdx = (fullLogCurrentPage - 1) * FULL_LOG_PAGE_SIZE;
        const pageData = logs.slice(startIdx, startIdx + FULL_LOG_PAGE_SIZE);

        tbody.innerHTML = '';

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4"><i class="fas fa-inbox fa-2x mb-2 d-block"></i>No activity logs match your filters.</td></tr>';
        } else {
            pageData.forEach(log => {
                const cat = log.category || getActivityCategory(log.action);
                const row = tbody.insertRow();
                row.classList.add('animate__animated', 'animate__fadeIn');
                row.innerHTML = `
                    <td>${log.action}</td>
                    <td>${getCategoryBadge(cat)}</td>
                    <td><code>${log.ip || 'N/A'}</code></td>
                    <td><small class="text-muted">${log.reference || '-'}</small></td>
                `;
            });
        }

        // Render pagination
        renderActivityPagination(totalPages);
    }, 400);
}

function renderActivityPagination(totalPages) {
    const paginationContainer = document.getElementById('activityPagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${fullLogCurrentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1"><i class="fas fa-chevron-left"></i></a>`;
    prevLi.addEventListener('click', function (e) {
        e.preventDefault();
        if (fullLogCurrentPage > 1) {
            fullLogCurrentPage--;
            loadFullActivityLog();
        }
    });
    paginationContainer.appendChild(prevLi);

    // Page numbers (show max 5 pages around current)
    let startPage = Math.max(1, fullLogCurrentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === fullLogCurrentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        li.addEventListener('click', function (e) {
            e.preventDefault();
            fullLogCurrentPage = i;
            loadFullActivityLog();
        });
        paginationContainer.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${fullLogCurrentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#"><i class="fas fa-chevron-right"></i></a>`;
    nextLi.addEventListener('click', function (e) {
        e.preventDefault();
        if (fullLogCurrentPage < totalPages) {
            fullLogCurrentPage++;
            loadFullActivityLog();
        }
    });
    paginationContainer.appendChild(nextLi);

    // Style active page
    paginationContainer.querySelectorAll('.page-item.active .page-link').forEach(el => {
        el.style.backgroundColor = '#dc3545';
        el.style.borderColor = '#dc3545';
    });
}

// Temp Account Functions
function initializeTempAccount() {
    const createBtn = document.getElementById('createTempAccountBtn');
    if (createBtn) {
        createBtn.addEventListener('click', function () {
            showModalNotification('Temporary account created', 'success', 'Created');
        });
    }

    loadTempAccounts();
}

function loadTempAccounts() {
    const tableElem = document.getElementById('tempStaffTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No active temporary accounts</td></tr>';
}

// ===== Helper Functions =====
function logAdminActivity(action, details, status) {
    console.log(`Activity: ${action} | Details: ${details} | Status: ${status}`);

    // Persist to localStorage
    let logs = [];
    try {
        const stored = localStorage.getItem('systemActivityLogs');
        if (stored) logs = JSON.parse(stored);
    } catch (e) { logs = []; }

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    let uName = 'Admin';
    try {
        const u = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        uName = u.full_name || 'Admin';
    } catch (e) { }

    const newLog = {
        id: Date.now(),
        userName: uName,
        action: action,
        reference: details ? `${details} [${ts}]` : ts,
        timestamp: ts,
        category: getActivityCategory(action),
        ip: '192.168.1.10'
    };

    logs.unshift(newLog);

    // Keep max 500 entries
    if (logs.length > 500) logs = logs.slice(0, 500);

    localStorage.setItem('systemActivityLogs', JSON.stringify(logs));

    // Refresh dashboard recent activities if on dashboard
    if (document.getElementById('recentActivities')) {
        loadRecentActivities();
    }

    // Refresh full log if on activity log page
    if (document.getElementById('fullActivityLogTable')) {
        loadFullActivityLog();
    }
}

// ===== User Timestamp & Deletion Helper Functions =====

/**
 * Get current timestamp in database format (YYYY-MM-DD HH:MM:SS)
 */
function getCurrentTimestamp() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * Mark a user as deleted (soft delete) by setting deleted_at timestamp
 * @param {number} userId - User ID to delete
 * @param {string} deletedBy - Name/ID of user performing the deletion
 */
async function markUserDeleted(userId, deletedBy = 'Admin') {
    try {
        const deleteTime = getCurrentTimestamp();
        const result = await usersDB.edit({
            id: userId,
            deleted_at: deleteTime
        });

        if (result && !result.error) {
            console.log(`✅ User ${userId} marked as deleted at ${deleteTime}`);
            return { success: true, timestamp: deleteTime };
        } else {
            console.error('❌ Failed to mark user as deleted:', result);
            return { success: false, error: result?.error };
        }
    } catch (err) {
        console.error('❌ Error marking user deleted:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Restore a deleted user by clearing deleted_at timestamp
 * @param {number} userId - User ID to restore
 */
async function restoreUserRecord(userId) {
    try {
        const result = await usersDB.edit({
            id: userId,
            deleted_at: null
        });

        if (result && !result.error) {
            console.log(`✅ User ${userId} restored (deleted_at cleared)`);
            return { success: true };
        } else {
            console.error('❌ Failed to restore user:', result);
            return { success: false, error: result?.error };
        }
    } catch (err) {
        console.error('❌ Error restoring user:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Update the updated_at timestamp for a user (call when modifying user data)
 * @param {number} userId - User ID
 */
async function updateUserTimestamp(userId) {
    try {
        const updateTime = getCurrentTimestamp();
        const result = await usersDB.edit({
            id: userId,
            updated_at: updateTime
        });

        if (result && !result.error) {
            console.log(`✅ User ${userId} updated_at set to ${updateTime}`);
            return { success: true, timestamp: updateTime };
        } else {
            console.error('❌ Failed to update user timestamp:', result);
            return { success: false };
        }
    } catch (err) {
        console.error('❌ Error updating user timestamp:', err);
        return { success: false };
    }
}

/**
 * Check if a user is marked as deleted
 * @param {object} user - User object from DB
 * @returns {boolean} - True if user is deleted
 */
function isUserDeleted(user) {
    return user && (user.deleted_at !== null && user.deleted_at !== undefined && user.deleted_at !== '');
}

/**
 * Get deletion information for a user
 * @param {object} user - User object from DB
 * @returns {object} - Deletion info { isDeleted, deletedAt, status }
 */
function getUserDeletionInfo(user) {
    const isDeleted = isUserDeleted(user);
    return {
        isDeleted: isDeleted,
        deletedAt: user.deleted_at || null,
        status: isDeleted ? 'Deleted' : 'Active',
        deletedDaysAgo: isDeleted ? Math.floor((Date.now() - new Date(user.deleted_at).getTime()) / (1000 * 60 * 60 * 24)) : null
    };
}

/**
 * Get user update history info
 * @param {object} user - User object from DB
 * @returns {object} - Update info { updatedAt, createdAt, lastModified }
 */
function getUserUpdateInfo(user) {
    const updated = user.updated_at ? new Date(user.updated_at).toLocaleString() : 'Never';
    const created = user.created_at ? new Date(user.created_at).toLocaleString() : 'Unknown';

    return {
        updatedAt: user.updated_at || null,
        createdAt: user.created_at || null,
        updatedAtDisplay: updated,
        createdAtDisplay: created,
        lastModified: user.updated_at || user.created_at || null
    };
}

/**
 * Update the last_login timestamp for a user (call when user logs in)
 * @param {number} userId - User ID
 */
async function updateUserLastLogin(userId) {
    try {
        const loginTime = getCurrentTimestamp();
        const result = await usersDB.edit({
            id: userId,
            last_login: loginTime
        });

        if (result && !result.error) {
            console.log(`✅ User ${userId} last_login updated to ${loginTime}`);
            return { success: true, timestamp: loginTime };
        } else {
            console.error('❌ Failed to update last_login:', result);
            return { success: false };
        }
    } catch (err) {
        console.error('❌ Error updating last_login:', err);
        return { success: false };
    }
}

/**
 * Get last login information for a user
 * @param {object} user - User object from DB
 * @returns {object} - Login info { lastLogin, lastLoginDisplay, timeSinceLastLogin, daysAgo }
 */
function getUserLastLoginInfo(user) {
    if (!user.last_login) {
        return {
            lastLogin: null,
            lastLoginDisplay: 'Never',
            timeSinceLastLogin: null,
            daysAgo: null,
            status: 'Never logged in'
        };
    }

    const lastLoginDate = new Date(user.last_login);
    const lastLoginDisplay = lastLoginDate.toLocaleString();
    const now = new Date();
    const diffMs = now.getTime() - lastLoginDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    let timeSinceText = '';
    if (diffDays > 0) {
        timeSinceText = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
        timeSinceText = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        timeSinceText = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }

    return {
        lastLogin: user.last_login,
        lastLoginDisplay: lastLoginDisplay,
        timeSinceLastLogin: timeSinceText,
        daysAgo: diffDays,
        hoursAgo: diffHours,
        status: `Last login: ${timeSinceText}`
    };
}

/**
 * Check if user is active (logged in recently)
 * @param {object} user - User object from DB
 * @param {number} daysThreshold - Threshold in days (default 30)
 * @returns {boolean} - True if user logged in within threshold
 */
function isUserActive(user, daysThreshold = 30) {
    if (!user.last_login) return false;

    const lastLoginDate = new Date(user.last_login);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24));

    return diffDays <= daysThreshold;
}

/**
 * Get user login statistics
 * @param {array} users - Array of user objects from DB
 * @returns {object} - Statistics { totalUsers, activeUsers, inactiveUsers, neverLoggedIn }
 */
function getUserLoginStats(users) {
    if (!Array.isArray(users)) return { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, neverLoggedIn: 0 };

    let activeUsers = 0;
    let inactiveUsers = 0;
    let neverLoggedIn = 0;

    users.forEach(user => {
        if (!user.last_login) {
            neverLoggedIn++;
        } else if (isUserActive(user, 30)) {
            activeUsers++;
        } else {
            inactiveUsers++;
        }
    });

    return {
        totalUsers: users.length,
        activeUsers: activeUsers,
        inactiveUsers: inactiveUsers,
        neverLoggedIn: neverLoggedIn,
        activePercentage: users.length > 0 ? Math.round((activeUsers / users.length) * 100) : 0
    };
}

/**
 * Update user status (active/inactive) in database
 * @param {number} userId - User ID
 * @param {string} status - 'active' or 'inactive'
 * @returns {Promise} - Resolves when status is updated
 */
async function updateUserStatus(userId, status) {
    try {
        const response = await fetch('php/user_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId,
                status: status
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`✅ User ${userId} marked as ${status}:`, data);
        return data;
    } catch (error) {
        console.error(`❌ Failed to update user status:`, error);
        throw error;
    }
}

// showModalNotification and showConfirm are defined in main.js — not duplicated here

async function updateSystemAlertsCount() {
    const alertsCount = document.getElementById('systemAlerts');
    if (!alertsCount) return;

    try {
        const [ingredients, regs, others] = await Promise.all([
            ingredientsDB.show(),
            accountRequestsDB.show({ status: 'Pending' }),
            requestsTblDB.show({ status: 'Pending' })
        ]);

        const ings = Array.isArray(ingredients) ? ingredients : [];
        const lowStock = ings.filter(ing => parseFloat(ing.current_quantity) <= parseFloat(ing.low_stock_threshold)).length;
        const pendingRequests = (Array.isArray(regs) ? regs.length : 0) + (Array.isArray(others) ? others.length : 0);

        // Alert count is number of pending requests + 1 if there's any low stock
        const totalAlerts = pendingRequests + (lowStock > 0 ? 1 : 0);

        if (alertsCount.textContent !== totalAlerts.toString()) {
            alertsCount.textContent = totalAlerts;
            if (totalAlerts > 0) {
                alertsCount.classList.remove('d-none');
                alertsCount.classList.add('animate__animated', 'animate__bounceIn');
            } else {
                alertsCount.classList.add('d-none');
            }
        }
    } catch (e) {
        console.error('Failed to update system alerts:', e);
    }
}