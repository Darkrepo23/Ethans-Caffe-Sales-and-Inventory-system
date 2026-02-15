// Admin Dashboard JavaScript - Updated with User Management and Multi-page fixes

// Global variables
let tempAccountActive = false;
let currentRequestType = null;
let currentRequestId = null;

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
    if (document.getElementById('reportPreview')) initializeReports();
    if (document.getElementById('backupsTable')) initializeBackup();
    if (document.getElementById('accountRequestsTable')) initializeRequests();
    if (document.getElementById('systemSettingsForm')) initializeSystemSettings();
    if (document.getElementById('activityLogTable')) initializeActivityLog();
    if (document.getElementById('tempStaffTable')) initializeTempAccount();
});

// Common features for all admin pages
function initializeCommonAdminFeatures() {
    // Sidebar toggle (global)
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', function () {
            sidebar.classList.toggle('show');
        });
    }

    // Logout button (global)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showConfirm('Are you sure you want to logout?', function () {
                localStorage.removeItem('loggedInRole');
                window.location.href = 'index.html';
            });
        });
    }
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

function loadAdminDashboardData() {
    loadLowStockData();
    // Add other dashboard data loads here if needed
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

function loadLowStockData() {
    const tableElement = document.getElementById('lowStockTable');
    if (!tableElement) return;

    const lowStockTable = tableElement.getElementsByTagName('tbody')[0];
    if (!lowStockTable) return;

    setTimeout(() => {
        // Simulate updated data
        const lowStockData = [
            { name: 'Chicken', category: 'Meat', quantity: '8 kg', threshold: '10 kg', status: 'Low' },
            { name: 'Onions', category: 'Vegetables', quantity: '3 kg', threshold: '5 kg', status: 'Low' },
            { name: 'Cheese', category: 'Dairy', quantity: '4 kg', threshold: '3 kg', status: 'Low' },
            { name: 'Garlic', category: 'Spices', quantity: '1 kg', threshold: '2 kg', status: 'Low' },
            { name: 'Cooking Oil', category: 'Supplies', quantity: '2 L', threshold: '5 L', status: 'Low' },
            { name: 'Red Wine', category: 'Beverages', quantity: '1 bottle', threshold: '3 bottles', status: 'Low' }
        ];

        lowStockTable.innerHTML = '';

        lowStockData.forEach(item => {
            const row = lowStockTable.insertRow();
            row.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><span class="badge bg-secondary">${item.category}</span></td>
                <td>${item.quantity}</td>
                <td>${item.threshold}</td>
                <td><span class="badge bg-warning">${item.status}</span></td>
            `;
        });
    }, 0);
}

// Global variable for dashboard interval
let dashboardRefreshInterval;

function loadAdminDashboardData() {
    loadLowStockData();
    // Update dashboard card numbers (simulated)
    const restockCount = document.getElementById('ingredientsRestock');
    if (restockCount) restockCount.textContent = '4';

    const staffCount = document.getElementById('totalStaffAccounts');
    if (staffCount) staffCount.textContent = '12';

    const salesCount = document.getElementById('totalSalesRecords');
    if (salesCount) salesCount.textContent = '85';

    const alertsCount = document.getElementById('systemAlerts');
    if (alertsCount) alertsCount.textContent = '2';

    // Set up auto-refresh if not already set (every 30 seconds)
    if (!dashboardRefreshInterval) {
        dashboardRefreshInterval = setInterval(() => {
            loadAdminDashboardData();
        }, 30000);
    }
}

// Menu Control Functions
function initializeMenuControl() {
    // Add menu item button
    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', function () {
            showAddMenuItemModal();
        });
    }

    // Show inactive items toggle
    const showInactiveItems = document.getElementById('showInactiveItems');
    if (showInactiveItems) {
        showInactiveItems.addEventListener('change', function () {
            loadMenuControl(this.checked);
        });
    }

    // Initial Load
    loadMenuControl();
}

function loadMenuControl(showInactive = false) {
    const tableElement = document.getElementById('menuControlTable');
    if (!tableElement) return;

    const menuControlTable = tableElement.getElementsByTagName('tbody')[0];
    if (!menuControlTable) return;

    menuControlTable.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading menu items...</p></td></tr>';

    setTimeout(() => {
        const menuItems = [
            { id: 1, name: 'Beef Steak', category: 'Main Course', price: '$24.99', status: 'Active', recipes: 4 },
            { id: 2, name: 'Chicken Curry', category: 'Main Course', price: '$18.99', status: 'Active', recipes: 3 },
            { id: 3, name: 'Vegetable Salad', category: 'Appetizer', price: '$9.99', status: 'Active', recipes: 3 },
            { id: 4, name: 'Garlic Bread', category: 'Appetizer', price: '$7.99', status: 'Active', recipes: 3 },
            { id: 5, name: 'French Fries', category: 'Side Dish', price: '$5.99', status: 'Active', recipes: 1 },
            { id: 6, name: 'Grilled Salmon', category: 'Main Course', price: '$22.99', status: 'Inactive', recipes: 2 },
            { id: 7, name: 'Pasta Carbonara', category: 'Main Course', price: '$16.99', status: 'Active', recipes: 3 },
            { id: 8, name: 'Chocolate Cake', category: 'Dessert', price: '$8.99', status: 'Active', recipes: 3 }
        ];

        menuControlTable.innerHTML = '';

        menuItems.forEach(item => {
            if (!showInactive && item.status === 'Inactive') return;

            const row = menuControlTable.insertRow();
            row.innerHTML = `
                <td>${item.id}</td>
                <td><strong>${item.name}</strong></td>
                <td><span class="badge bg-secondary">${item.category}</span></td>
                <td>${item.price}</td>
                <td><span class="badge ${item.status === 'Active' ? 'bg-success' : 'bg-secondary'}">${item.status}</span></td>
                <td><span class="badge bg-info">${item.recipes} ingredients</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline-danger" onclick="editMenuItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="toggleMenuItemStatus(${item.id}, '${item.status}')">
                            <i class="fas fa-power-off"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteMenuItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        });

        const totalElems = document.getElementById('totalMenuItems');
        if (totalElems) totalElems.textContent = `${menuItems.length} Items`;
    }, 800);
}

function showAddMenuItemModal() {
    // Clear form
    const form = document.getElementById('addMenuItemForm');
    if (form) form.reset();

    // Show modal
    const modalElem = document.getElementById('addMenuItemModal');
    if (!modalElem) return;

    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    // Add ingredient to recipe button
    const addIngBtn = document.getElementById('addIngredientToRecipe');
    if (addIngBtn) {
        // Clone to rotate listeners if needed or just add once
        const newBtn = addIngBtn.cloneNode(true);
        addIngBtn.parentNode.replaceChild(newBtn, addIngBtn);
        newBtn.addEventListener('click', function () {
            addIngredientToRecipeForm();
        });
    }

    // Save menu item button
    const saveBtn = document.getElementById('saveMenuItemBtn');
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', function () {
            saveMenuItem();
        });
    }
}

function addIngredientToRecipeForm() {
    const container = document.getElementById('recipeIngredientsContainer');
    if (!container) return;

    // Clear "no ingredients" text if present
    if (container.querySelector('p.text-muted')) {
        container.innerHTML = '';
    }

    // Get available ingredients
    const ingredients = [
        { id: 1, name: 'Beef' },
        { id: 2, name: 'Chicken' },
        { id: 3, name: 'Rice' },
        { id: 4, name: 'Tomatoes' },
        { id: 5, name: 'Onions' }
    ];

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

function saveMenuItem() {
    const nameElem = document.getElementById('menuItemName');
    const categoryElem = document.getElementById('menuItemCategory');
    if (!nameElem || !categoryElem) return;

    const name = nameElem.value;
    const category = categoryElem.value;

    // Validation
    if (!name || !category) {
        showModalNotification('Please fill in all required fields', 'warning', 'Validation Error');
        return;
    }

    // Simulate save
    setTimeout(() => {
        // Close modal
        const modalElem = document.getElementById('addMenuItemModal');
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();

        // Show success message
        showModalNotification(`Menu item "${name}" added successfully`, 'success', 'Menu Item Added');

        // Log activity
        logAdminActivity('Added menu item', name, 'Success');

        // Refresh menu control
        loadMenuControl();
    }, 1000);
}

function editMenuItem(id) {
    showModalNotification(`Edit menu item ${id} - Feature under development`, 'info', 'Coming Soon');
}

function toggleMenuItemStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    showConfirm(`Are you sure you want to ${newStatus === 'Inactive' ? 'deactivate' : 'activate'} this menu item?`, function () {
        setTimeout(() => {
            showModalNotification(`Menu item ${newStatus === 'Inactive' ? 'deactivated' : 'activated'}`, 'success', 'Status Changed');
            logAdminActivity(`Changed menu item status to ${newStatus}`, `Item ID: ${id}`, 'Success');
            loadMenuControl();
        }, 800);
    });
}

function deleteMenuItem(id) {
    showConfirm('Are you sure you want to delete this menu item? This action cannot be undone.', function () {
        setTimeout(() => {
            showModalNotification('Menu item deleted', 'success', 'Item Deleted');
            logAdminActivity('Deleted menu item', `Item ID: ${id}`, 'Success');
            loadMenuControl();
        }, 800);
    });
}

// Recipe Control Functions
function initializeRecipeControl() {
    // Assign recipe button
    const assignRecipeBtn = document.getElementById('assignRecipeBtn');
    if (assignRecipeBtn) {
        assignRecipeBtn.addEventListener('click', function () {
            showAssignRecipeModal();
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

    recipeMappingTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading recipe mappings...</p></td></tr>';

    setTimeout(() => {
        const recipes = [
            { menuItem: 'Beef Steak', ingredients: 'Beef, Potatoes, Tomatoes, Onions', quantity: '0.65 kg', cost: '$8.50', actions: '<button class="btn btn-sm btn-outline-danger">Edit</button>' },
            { menuItem: 'Chicken Curry', ingredients: 'Chicken, Rice, Garlic, Onions', quantity: '0.52 kg', cost: '$6.20', actions: '<button class="btn btn-sm btn-outline-danger">Edit</button>' },
            { menuItem: 'Vegetable Salad', ingredients: 'Tomatoes, Lettuce, Cucumber', quantity: '0.33 kg', cost: '$3.10', actions: '<button class="btn btn-sm btn-outline-danger">Edit</button>' },
            { menuItem: 'Garlic Bread', ingredients: 'Flour, Butter, Garlic', quantity: '0.16 kg', cost: '$1.80', actions: '<button class="btn btn-sm btn-outline-danger">Edit</button>' },
            { menuItem: 'Pasta Carbonara', ingredients: 'Pasta, Cheese, Bacon', quantity: '0.33 kg', cost: '$4.50', actions: '<button class="btn btn-sm btn-outline-danger">Edit</button>' }
        ];

        recipeMappingTable.innerHTML = '';

        recipes.forEach(recipe => {
            const row = recipeMappingTable.insertRow();
            row.innerHTML = `
                <td><strong>${recipe.menuItem}</strong></td>
                <td>${recipe.ingredients}</td>
                <td>${recipe.quantity}</td>
                <td>${recipe.cost}</td>
                <td>${recipe.actions}</td>
            `;
        });
    }, 800);
}

function showAssignRecipeModal() {
    showModalNotification('Assign recipe feature under development', 'info', 'Coming Soon');
}

// Ingredients Masterlist Functions
function initializeIngredientsMasterlist() {
    // Add ingredient button
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', function () {
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

    // Load ingredients masterlist
    loadIngredientsMasterlist();
}

function loadIngredientsMasterlist() {
    const tableElement = document.getElementById('ingredientsMasterTable');
    if (!tableElement) return;

    const ingredientsMasterTable = tableElement.getElementsByTagName('tbody')[0];
    const masterLowStockCount = document.getElementById('masterLowStockCount');

    ingredientsMasterTable.innerHTML = '<tr><td colspan="9" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading ingredients masterlist...</p></td></tr>';

    setTimeout(() => {
        const ingredients = [
            { id: 1, name: 'Beef', category: 'Meat', unit: 'kg', quantity: 15, threshold: 5, status: 'Normal', usedIn: 2 },
            { id: 2, name: 'Chicken', category: 'Meat', unit: 'kg', quantity: 8, threshold: 10, status: 'Low', usedIn: 1 },
            { id: 3, name: 'Rice', category: 'Grains', unit: 'kg', quantity: 25, threshold: 10, status: 'Normal', usedIn: 1 },
            { id: 4, name: 'Tomatoes', category: 'Vegetables', unit: 'kg', quantity: 5, threshold: 3, status: 'Normal', usedIn: 2 },
            { id: 5, name: 'Onions', category: 'Vegetables', unit: 'kg', quantity: 3, threshold: 5, status: 'Low', usedIn: 3 },
            { id: 6, name: 'Garlic', category: 'Spices', unit: 'kg', quantity: 1, threshold: 2, status: 'Low', usedIn: 2 },
            { id: 7, name: 'Cooking Oil', category: 'Supplies', unit: 'L', quantity: 2, threshold: 5, status: 'Low', usedIn: 5 },
            { id: 8, name: 'Flour', category: 'Grains', unit: 'kg', quantity: 12, threshold: 5, status: 'Normal', usedIn: 1 },
            { id: 9, name: 'Cheese', category: 'Dairy', unit: 'kg', quantity: 4, threshold: 5, status: 'Low', usedIn: 1 },
            { id: 10, name: 'Butter', category: 'Dairy', unit: 'kg', quantity: 6, threshold: 2, status: 'Normal', usedIn: 1 },
            { id: 11, name: 'Red Wine', category: 'Beverages', unit: 'bottles', quantity: 1, threshold: 3, status: 'Low', usedIn: 1 }
        ];

        // Count low stock items
        let lowStockCount = 0;
        ingredients.forEach(ing => {
            if (ing.status === 'Low') lowStockCount++;
        });

        if (masterLowStockCount) {
            masterLowStockCount.textContent = lowStockCount;
        }

        ingredientsMasterTable.innerHTML = '';

        ingredients.forEach(ingredient => {
            const row = ingredientsMasterTable.insertRow();
            row.innerHTML = `
                <td>${ingredient.id}</td>
                <td><strong>${ingredient.name}</strong></td>
                <td><span class="badge bg-secondary">${ingredient.category}</span></td>
                <td>${ingredient.unit}</td>
                <td>${ingredient.quantity} ${ingredient.unit}</td>
                <td>${ingredient.threshold} ${ingredient.unit}</td>
                <td><span class="badge ${ingredient.status === 'Normal' ? 'bg-success' : 'bg-warning'}">${ingredient.status}</span></td>
                <td><span class="badge bg-info">${ingredient.usedIn} menu items</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-outline-danger" onclick="editIngredient(${ingredient.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="deleteIngredient(${ingredient.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
        });
    }, 800);
}

function showAddIngredientModal() {
    // Clear form
    const form = document.getElementById('addIngredientForm');
    if (form) form.reset();

    // Update threshold unit based on selected unit
    const unitSelect = document.getElementById('ingredientUnit');
    const thresholdUnit = document.getElementById('thresholdUnit');

    if (unitSelect && thresholdUnit) {
        unitSelect.addEventListener('change', function () {
            thresholdUnit.textContent = this.value;
        });
    }

    // Show modal
    const modalElem = document.getElementById('addIngredientModal');
    if (!modalElem) return;
    const modal = new bootstrap.Modal(modalElem);
    modal.show();

    // Save ingredient button
    const saveBtn = document.getElementById('saveIngredientBtn');
    if (saveBtn) {
        const newSaveBtn = saveBtn.cloneNode(true);
        saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
        newSaveBtn.addEventListener('click', function () {
            saveIngredient();
        });
    }
}

function saveIngredient() {
    const name = document.getElementById('ingredientName')?.value;
    const category = document.getElementById('ingredientCategory')?.value;
    const unit = document.getElementById('ingredientUnit')?.value;
    const threshold = document.getElementById('lowStockThreshold')?.value;

    // Validation
    if (!name || !category || !unit || !threshold) {
        showModalNotification('Please fill in all required fields', 'warning', 'Validation Error');
        return;
    }

    // Simulate save
    setTimeout(() => {
        // Close modal
        const modalElem = document.getElementById('addIngredientModal');
        const modal = bootstrap.Modal.getInstance(modalElem);
        if (modal) modal.hide();

        // Show success message
        showModalNotification(`Ingredient "${name}" added successfully`, 'success', 'Ingredient Added');

        // Log activity
        logAdminActivity('Added ingredient', name, 'Success');

        // Refresh ingredients masterlist
        loadIngredientsMasterlist();
    }, 1000);
}

function showSetThresholdsModal() {
    showModalNotification('Set thresholds feature under development', 'info', 'Coming Soon');
}

function editIngredient(id) {
    showModalNotification(`Edit ingredient ${id} - Feature under development`, 'info', 'Coming Soon');
}

function deleteIngredient(id) {
    showConfirm('Are you sure you want to delete this ingredient? This action cannot be undone and may affect existing recipes.', function () {
        setTimeout(() => {
            showModalNotification('Ingredient deletion request submitted', 'success', 'Request Submitted');
            logAdminActivity('Requested ingredient deletion', `Ingredient ID: ${id}`, 'Success');
            loadIngredientsMasterlist();
        }, 800);
    });
}

// User Management Functions
function initializeUserManagement() {
    // Add User Management specific listeners here if needed
    const addUserBtn = document.getElementById('add-user-btn'); // Example
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function () {
            // Logic to show add user modal
        });
    }

    // Load user management data
    loadUserManagement();
}

function loadUserManagement() {
    // Load active users
    loadActiveUsers();

    // Load deleted users
    loadDeletedUsers();
}

function loadActiveUsers() {
    const tableElem = document.getElementById('activeUsersTable');
    if (!tableElem) return;

    const activeUsersTable = tableElem.getElementsByTagName('tbody')[0];
    if (!activeUsersTable) return;

    activeUsersTable.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading active users...</p></td></tr>';

    setTimeout(() => {
        const users = [
            { id: 1, name: 'John Doe', role: 'Staff', username: 'johndoe', status: 'Active', lastLogin: 'Today' },
            { id: 2, name: 'Jane Smith', role: 'Cashier', username: 'janesmith', status: 'Active', lastLogin: 'Today' },
            { id: 3, name: 'Robert Johnson', role: 'Staff', username: 'robertj', status: 'Active', lastLogin: 'Yesterday' },
            { id: 4, name: 'Sarah Williams', role: 'Senior Staff', username: 'sarahw', status: 'Active', lastLogin: 'Today' }
        ];

        activeUsersTable.innerHTML = '';

        users.forEach(user => {
            const row = activeUsersTable.insertRow();
            row.innerHTML = `
                <td><strong>${user.name}</strong></td>
                <td><span class="badge ${user.role === 'Staff' ? 'bg-success' : user.role === 'Cashier' ? 'bg-info' : 'bg-warning'}">${user.role}</span></td>
                <td>${user.username}</td>
                <td><span class="badge bg-success">${user.status}</span></td>
                <td>${user.lastLogin}</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
        });
    }, 800);
}

function loadDeletedUsers() {
    const tableElem = document.getElementById('deletedUsersTable');
    if (!tableElem) return;

    const deletedUsersTable = tableElem.getElementsByTagName('tbody')[0];
    const deletedUsersCount = document.getElementById('deletedUsersCount');
    if (!deletedUsersTable) return;

    setTimeout(() => {
        const deletedUsers = [
            { id: 5, name: 'Mike Brown', role: 'Staff', username: 'mikeb', deletedDate: '2023-09-28', deletedBy: 'Admin' },
            { id: 6, name: 'Emily Davis', role: 'Cashier', username: 'emilyd', deletedDate: '2023-09-25', deletedBy: 'Admin' }
        ];

        deletedUsersTable.innerHTML = '';

        deletedUsers.forEach(user => {
            const row = deletedUsersTable.insertRow();
            row.innerHTML = `
                <td><strong>${user.name}</strong></td>
                <td><span class="badge bg-secondary">${user.role}</span></td>
                <td>${user.username}</td>
                <td>${user.deletedDate}</td>
                <td>${user.deletedBy}</td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="restoreUser(${user.id})">
                        <i class="fas fa-undo"></i> Restore
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="permanentlyDeleteUser(${user.id})">
                        <i class="fas fa-trash"></i> Permanent Delete
                    </button>
                </td>
            `;
        });

        // Update count
        if (deletedUsersCount) {
            deletedUsersCount.textContent = deletedUsers.length;
        }
    }, 800);
}

// Reports Functions
function initializeReports() {
    // Generate PDF report button
    const generatePdfReportBtn = document.getElementById('generatePdfReport');
    if (generatePdfReportBtn) {
        generatePdfReportBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to generate a PDF report?', function () {
                generatePdfReport();
            });
        });
    }

    // Apply report filters button
    const applyReportFiltersBtn = document.getElementById('applyReportFilters');
    if (applyReportFiltersBtn) {
        applyReportFiltersBtn.addEventListener('click', function () {
            generateReportPreview();
        });
    }

    // Generate button (on page)
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function () {
            loadReports();
        });
    }

    // Print report preview button
    const printReportPreviewBtn = document.getElementById('printReportPreview');
    if (printReportPreviewBtn) {
        printReportPreviewBtn.addEventListener('click', function () {
            printReportPreview();
        });
    }

    loadReports();
}

function loadReports() {
    // Default report load behavior
    generateReportPreview();
}

function generatePdfReport() {
    showModalNotification('Generating PDF report...', 'info', 'Generating Report');

    setTimeout(() => {
        // Simulate PDF generation
        const reportType = document.getElementById('reportType')?.value || 'daily-sales';
        const reportName = reportType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

        // Create download link
        const data = `Sample ${reportName} - Generated on ${new Date().toLocaleDateString()}`;
        const blob = new Blob([data], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showModalNotification('PDF report generated successfully', 'success', 'Report Generated');
        logAdminActivity('Generated PDF report', reportName, 'Success');
    }, 1500);
}

function generateReportPreview() {
    const typeElem = document.getElementById('reportType');
    const startElem = document.getElementById('reportStartDate');
    const endElem = document.getElementById('reportEndDate');

    if (!typeElem) return;

    const reportType = typeElem.value;
    const startDate = startElem?.value;
    const endDate = endElem?.value;

    const reportPreview = document.getElementById('reportPreview');
    if (!reportPreview) return;

    reportPreview.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div><p class="mt-2">Generating report preview...</p></div>';

    setTimeout(() => {
        let reportContent = '';

        switch (reportType) {
            case 'daily-sales':
                reportContent = generateDailySalesReport(startDate, endDate);
                break;
            case 'ingredient-usage':
                reportContent = generateIngredientUsageReport(startDate, endDate);
                break;
            case 'low-stock':
                reportContent = generateLowStockReportPreview(startDate, endDate);
                break;
            case 'staff-activity':
                reportContent = generateStaffActivityReport(startDate, endDate);
                break;
        }

        reportPreview.innerHTML = reportContent;
        showModalNotification('Report preview generated', 'success', 'Preview Ready');
    }, 1000);
}

function generateDailySalesReport(startDate, endDate) {
    return `
        <div class="report-header text-center mb-4">
            <h3>Daily Sales Summary Report</h3>
            <p>${startDate || 'All dates'} to ${endDate || 'Present'}</p>
            <hr>
        </div>
        
        <div class="report-summary mb-4">
            <div class="row text-center">
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>156</h5>
                            <p class="text-muted mb-0">Total Sales</p>
                        </div>
                    </div>
                </div>
                <!-- ... other cards ... -->
            </div>
        </div>
        <div class="report-details">
            <h5>Top Selling Items</h5>
            <table class="table table-bordered">
                <thead><tr><th>Menu Item</th><th>Quantity</th></tr></thead>
                <tbody><tr><td>Beef Steak</td><td>42</td></tr></tbody>
            </table>
        </div>
    `;
}

function generateIngredientUsageReport(startDate, endDate) {
    return `<div class="p-3 text-center"><h5>Ingredient Usage Report Preview</h5><p>Data for ${startDate} to ${endDate}</p></div>`;
}

function generateLowStockReportPreview(startDate, endDate) {
    return `<div class="p-3 text-center"><h5>Low Stock Report Preview</h5><p>Data for ${startDate} to ${endDate}</p></div>`;
}

function generateStaffActivityReport(startDate, endDate) {
    return `<div class="p-3 text-center"><h5>Staff Activity Report Preview</h5><p>Data for ${startDate} to ${endDate}</p></div>`;
}

function printReportPreview() {
    const preview = document.getElementById('reportPreview');
    if (!preview) return;

    const printContent = preview.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = `
        <div class="container mt-4">
            <div class="text-center mb-4">
                <h2>Restaurant POS System Report</h2>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            ${printContent}
        </div>
    `;

    window.print();
    document.body.innerHTML = originalContent;
    initializeReports();
    showModalNotification('Report printed successfully', 'success', 'Print Complete');
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
function initializeRequests() {

    const confirmApproveBtn = document.getElementById('confirmApproveBtn');
    if (confirmApproveBtn) {
        confirmApproveBtn.addEventListener('click', function () {
            handleRequestApproval();
        });
    }

    loadRequests();
}

function loadRequests() {
    updateRequestBadges();
    loadAccountRequests();
}

function updateRequestBadges() {
    const badge = document.getElementById('pendingRequestsBadge');
    if (badge) badge.textContent = '3';

    if (document.getElementById('accountRequestsCount')) document.getElementById('accountRequestsCount').textContent = '2';
    if (document.getElementById('roleRequestsCount')) document.getElementById('roleRequestsCount').textContent = '1';
}

function loadAccountRequests() {
    const tableElem = document.getElementById('accountRequestsTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    setTimeout(() => {
        const requests = [
            { id: 1, date: '2023-10-01', fullName: 'Robert Johnson', role: 'Staff' }
        ];

        tbody.innerHTML = '';
        requests.forEach(req => {
            const row = tbody.insertRow();
            row.innerHTML = `<td>${req.date}</td><td>${req.fullName}</td><td>-</td><td>${req.role}</td><td><button class="btn btn-sm btn-success">Approve</button></td>`;
        });
    }, 800);
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

// Activity Log Functions
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

    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Loading activity log...</td></tr>';

    setTimeout(() => {
        tbody.innerHTML = '<tr><td>2023-10-01 10:00</td><td>Admin</td><td>Logged in</td><td>Success</td></tr>';
    }, 500);
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

// Helper Functions
function logAdminActivity(action, details, status) {
    console.log(`Activity: ${action} | Details: ${details} | Status: ${status}`);
}

function showModalNotification(msg, type, title) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: title || 'Notification',
            text: msg,
            icon: type || 'info',
            confirmButtonColor: '#800000'
        });
    } else {
        alert(`${title}: ${msg}`);
    }
}

function showConfirm(msg, callback) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Confirm Action',
            text: msg,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#800000',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, proceed'
        }).then((result) => {
            if (result.isConfirmed && callback) {
                callback();
            }
        });
    } else {
        if (confirm(msg) && callback) {
            callback();
        }
    }
}