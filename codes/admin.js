// Admin Dashboard JavaScript

// Global variables
let tempAccountActive = false;
let currentRequestType = null;
let currentRequestId = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize all admin functionality
    initializeAdminDashboard();
    initializeMenuControl();
    initializeRecipeControl();
    initializeIngredientsMasterlist();
    initializeReports();
    initializeBackup();
    initializeRequests();
    initializeSystemSettings();
    initializeActivityLog();
    initializeTempAccount();
});

// Admin Dashboard Functions
function initializeAdminDashboard() {
    // Export dashboard data button
    const exportDashboardBtn = document.getElementById('exportDashboardData');
    if (exportDashboardBtn) {
        exportDashboardBtn.addEventListener('click', function() {
            exportDashboardData();
        });
    }
    
    // Generate report button
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            updateActivePage('reports');
        });
    }
    
    // Refresh low stock button
    const refreshLowStockBtn = document.getElementById('refreshLowStock');
    if (refreshLowStockBtn) {
        refreshLowStockBtn.addEventListener('click', function() {
            loadLowStockData();
        });
    }
}

function exportDashboardData() {
    // Simulate data export
    showNotification('Exporting dashboard data...', 'info');
    
    setTimeout(() => {
        // Create a blob of the data
        const data = {
            timestamp: new Date().toISOString(),
            salesRecords: document.getElementById('totalSalesRecords').textContent,
            staffAccounts: document.getElementById('totalStaffAccounts').textContent,
            lowStockItems: document.getElementById('ingredientsRestock').textContent,
            systemAlerts: document.getElementById('systemAlerts').textContent
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
        
        showNotification('Dashboard data exported successfully', 'success');
    }, 1000);
}

function loadLowStockData() {
    const lowStockTable = document.getElementById('lowStockTable').getElementsByTagName('tbody')[0];
    lowStockTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading low stock items...</p></td></tr>';
    
    setTimeout(() => {
        // Simulate updated data
        const lowStockData = [
            { name: 'Chicken', category: 'Meat', quantity: '8 kg', threshold: '10 kg', status: 'Low' },
            { name: 'Onions', category: 'Vegetables', quantity: '3 kg', threshold: '5 kg', status: 'Low' },
            { name: 'Cheese', category: 'Dairy', quantity: '4 kg', threshold: '3 kg', status: 'Low' },
            { name: 'Garlic', category: 'Spices', quantity: '1 kg', threshold: '2 kg', status: 'Low' }
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
        
        showNotification('Low stock data refreshed', 'success');
    }, 800);
}

// Menu Control Functions
function initializeMenuControl() {
    // Add menu item button
    const addMenuItemBtn = document.getElementById('addMenuItemBtn');
    if (addMenuItemBtn) {
        addMenuItemBtn.addEventListener('click', function() {
            showAddMenuItemModal();
        });
    }
    
    // Show inactive items toggle
    const showInactiveItems = document.getElementById('showInactiveItems');
    if (showInactiveItems) {
        showInactiveItems.addEventListener('change', function() {
            loadMenuControl(this.checked);
        });
    }
    
    // Load menu control when page is shown
    document.querySelector('[data-page="menu-control"]').addEventListener('click', function() {
        loadMenuControl();
    });
}

function loadMenuControl(showInactive = false) {
    const menuControlTable = document.getElementById('menuControlTable').getElementsByTagName('tbody')[0];
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
    }, 800);
}

function showAddMenuItemModal() {
    // Clear form
    document.getElementById('addMenuItemForm').reset();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addMenuItemModal'));
    modal.show();
    
    // Add ingredient to recipe button
    document.getElementById('addIngredientToRecipe').addEventListener('click', function() {
        addIngredientToRecipeForm();
    });
    
    // Save menu item button
    document.getElementById('saveMenuItemBtn').addEventListener('click', function() {
        saveMenuItem();
    });
}

function addIngredientToRecipeForm() {
    const container = document.getElementById('recipeIngredientsContainer');
    
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
    row.querySelector('.remove-ingredient').addEventListener('click', function() {
        row.remove();
    });
}

function saveMenuItem() {
    const name = document.getElementById('menuItemName').value;
    const category = document.getElementById('menuItemCategory').value;
    const price = document.getElementById('menuItemPrice').value;
    const status = document.getElementById('menuItemStatus').value;
    
    // Validation
    if (!name || !category) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    // Get recipe ingredients
    const ingredients = [];
    document.querySelectorAll('#recipeIngredientsContainer .row').forEach(row => {
        const ingredientId = row.querySelector('.ingredient-select').value;
        const quantity = row.querySelector('.ingredient-quantity').value;
        
        if (ingredientId && quantity) {
            ingredients.push({
                id: ingredientId,
                quantity: quantity
            });
        }
    });
    
    // Simulate save
    setTimeout(() => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addMenuItemModal'));
        modal.hide();
        
        // Show success message
        showNotification(`Menu item "${name}" added successfully`, 'success');
        
        // Log activity
        logAdminActivity('Added menu item', name, 'Success');
        
        // Refresh menu control
        loadMenuControl();
    }, 1000);
}

function editMenuItem(id) {
    showNotification(`Edit menu item ${id} - Feature under development`, 'info');
}

function toggleMenuItemStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    if (confirm(`Are you sure you want to ${newStatus === 'Inactive' ? 'deactivate' : 'activate'} this menu item?`)) {
        setTimeout(() => {
            showNotification(`Menu item ${newStatus === 'Inactive' ? 'deactivated' : 'activated'}`, 'success');
            logAdminActivity(`Changed menu item status to ${newStatus}`, `Item ID: ${id}`, 'Success');
            loadMenuControl();
        }, 800);
    }
}

function deleteMenuItem(id) {
    if (confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
        setTimeout(() => {
            showNotification('Menu item deleted', 'success');
            logAdminActivity('Deleted menu item', `Item ID: ${id}`, 'Success');
            loadMenuControl();
        }, 800);
    }
}

// Recipe Control Functions
function initializeRecipeControl() {
    // Assign recipe button
    const assignRecipeBtn = document.getElementById('assignRecipeBtn');
    if (assignRecipeBtn) {
        assignRecipeBtn.addEventListener('click', function() {
            showAssignRecipeModal();
        });
    }
    
    // Load recipe control when page is shown
    document.querySelector('[data-page="recipe-control"]').addEventListener('click', function() {
        loadRecipeControl();
    });
}

function loadRecipeControl() {
    const recipeMappingTable = document.getElementById('recipeMappingTable').getElementsByTagName('tbody')[0];
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
    showNotification('Assign recipe feature under development', 'info');
}

// Ingredients Masterlist Functions
function initializeIngredientsMasterlist() {
    // Add ingredient button
    const addIngredientBtn = document.getElementById('addIngredientBtn');
    if (addIngredientBtn) {
        addIngredientBtn.addEventListener('click', function() {
            showAddIngredientModal();
        });
    }
    
    // Set thresholds button
    const setThresholdsBtn = document.getElementById('setThresholdsBtn');
    if (setThresholdsBtn) {
        setThresholdsBtn.addEventListener('click', function() {
            showSetThresholdsModal();
        });
    }
    
    // Load ingredients masterlist when page is shown
    document.querySelector('[data-page="ingredients-masterlist"]').addEventListener('click', function() {
        loadIngredientsMasterlist();
    });
}

function loadIngredientsMasterlist() {
    const ingredientsMasterTable = document.getElementById('ingredientsMasterTable').getElementsByTagName('tbody')[0];
    const masterLowStockCount = document.getElementById('masterLowStockCount');
    
    ingredientsMasterTable.innerHTML = '<tr><td colspan="9" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading ingredients masterlist...</p></td></tr>';
    
    setTimeout(() => {
        const ingredients = [
            { id: 1, name: 'Beef', category: 'Meat', unit: 'kg', quantity: 15, threshold: 5, status: 'Normal', usedIn: 2 },
            { id: 2, name: 'Chicken', category: 'Meat', unit: 'kg', quantity: 8, threshold: 10, status: 'Low', usedIn: 1 },
            { id: 3, name: 'Rice', category: 'Grains', unit: 'kg', quantity: 25, threshold: 10, status: 'Normal', usedIn: 1 },
            { id: 4, name: 'Tomatoes', category: 'Vegetables', unit: 'kg', quantity: 5, threshold: 3, status: 'Normal', usedIn: 2 },
            { id: 5, name: 'Onions', category: 'Vegetables', unit: 'kg', quantity: 3, threshold: 5, status: 'Low', usedIn: 3 },
            { id: 6, name: 'Garlic', category: 'Spices', unit: 'kg', quantity: 2, threshold: 1, status: 'Normal', usedIn: 2 },
            { id: 8, name: 'Flour', category: 'Grains', unit: 'kg', quantity: 12, threshold: 5, status: 'Normal', usedIn: 1 },
            { id: 9, name: 'Cheese', category: 'Dairy', unit: 'kg', quantity: 4, threshold: 3, status: 'Low', usedIn: 1 },
            { id: 10, name: 'Butter', category: 'Dairy', unit: 'kg', quantity: 6, threshold: 2, status: 'Normal', usedIn: 1 }
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
    document.getElementById('addIngredientForm').reset();
    
    // Update threshold unit based on selected unit
    const unitSelect = document.getElementById('ingredientUnit');
    const thresholdUnit = document.getElementById('thresholdUnit');
    
    unitSelect.addEventListener('change', function() {
        thresholdUnit.textContent = this.value;
    });
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('addIngredientModal'));
    modal.show();
    
    // Save ingredient button
    document.getElementById('saveIngredientBtn').addEventListener('click', function() {
        saveIngredient();
    });
}

function saveIngredient() {
    const name = document.getElementById('ingredientName').value;
    const category = document.getElementById('ingredientCategory').value;
    const unit = document.getElementById('ingredientUnit').value;
    const threshold = document.getElementById('lowStockThreshold').value;
    
    // Validation
    if (!name || !category || !unit || !threshold) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    // Simulate save
    setTimeout(() => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addIngredientModal'));
        modal.hide();
        
        // Show success message
        showNotification(`Ingredient "${name}" added successfully`, 'success');
        
        // Log activity
        logAdminActivity('Added ingredient', name, 'Success');
        
        // Refresh ingredients masterlist
        loadIngredientsMasterlist();
    }, 1000);
}

function showSetThresholdsModal() {
    showNotification('Set thresholds feature under development', 'info');
}

function editIngredient(id) {
    showNotification(`Edit ingredient ${id} - Feature under development`, 'info');
}

function deleteIngredient(id) {
    if (confirm('Are you sure you want to delete this ingredient? This action cannot be undone and may affect existing recipes.')) {
        setTimeout(() => {
            showNotification('Ingredient deletion request submitted', 'success');
            logAdminActivity('Requested ingredient deletion', `Ingredient ID: ${id}`, 'Success');
            loadIngredientsMasterlist();
        }, 800);
    }
}

// Reports Functions
function initializeReports() {
    // Generate PDF report button
    const generatePdfReportBtn = document.getElementById('generatePdfReport');
    if (generatePdfReportBtn) {
        generatePdfReportBtn.addEventListener('click', function() {
            generatePdfReport();
        });
    }
    
    // Apply report filters button
    const applyReportFiltersBtn = document.getElementById('applyReportFilters');
    if (applyReportFiltersBtn) {
        applyReportFiltersBtn.addEventListener('click', function() {
            generateReportPreview();
        });
    }
    
    // Print report preview button
    const printReportPreviewBtn = document.getElementById('printReportPreview');
    if (printReportPreviewBtn) {
        printReportPreviewBtn.addEventListener('click', function() {
            printReportPreview();
        });
    }
    
    // Load reports when page is shown
    document.querySelector('[data-page="reports"]').addEventListener('click', function() {
        initializeReports();
    });
}

function generatePdfReport() {
    showNotification('Generating PDF report...', 'info');
    
    setTimeout(() => {
        // Simulate PDF generation
        const reportType = document.getElementById('reportType').value;
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
        
        showNotification('PDF report generated successfully', 'success');
        logAdminActivity('Generated PDF report', reportName, 'Success');
    }, 1500);
}

function generateReportPreview() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('reportStartDate').value;
    const endDate = document.getElementById('reportEndDate').value;
    
    const reportPreview = document.getElementById('reportPreview');
    reportPreview.innerHTML = '<div class="text-center py-5"><div class="loading-spinner"></div><p class="mt-2">Generating report preview...</p></div>';
    
    setTimeout(() => {
        let reportContent = '';
        
        switch(reportType) {
            case 'daily-sales':
                reportContent = generateDailySalesReport(startDate, endDate);
                break;
            case 'ingredient-usage':
                reportContent = generateIngredientUsageReport(startDate, endDate);
                break;
            case 'low-stock':
                reportContent = generateLowStockReport(startDate, endDate);
                break;
            case 'staff-activity':
                reportContent = generateStaffActivityReport(startDate, endDate);
                break;
        }
        
        reportPreview.innerHTML = reportContent;
        showNotification('Report preview generated', 'success');
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
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>24</h5>
                            <p class="text-muted mb-0">Today's Sales</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>8</h5>
                            <p class="text-muted mb-0">Active Menu Items</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>3</h5>
                            <p class="text-muted mb-0">Staff Members</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h5>Top Selling Items</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Menu Item</th>
                        <th>Quantity Sold</th>
                        <th>Last Sale</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Beef Steak</td>
                        <td>42</td>
                        <td>Today</td>
                    </tr>
                    <tr>
                        <td>Chicken Curry</td>
                        <td>38</td>
                        <td>Today</td>
                    </tr>
                    <tr>
                        <td>Vegetable Salad</td>
                        <td>28</td>
                        <td>Today</td>
                    </tr>
                    <tr>
                        <td>Pasta Carbonara</td>
                        <td>25</td>
                        <td>Yesterday</td>
                    </tr>
                    <tr>
                        <td>French Fries</td>
                        <td>23</td>
                        <td>Today</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="alert alert-info mt-3">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Note:</strong> This report contains quantity-based data only. No revenue or profit information is included as per system design.
            </div>
        </div>
    `;
}

function generateIngredientUsageReport(startDate, endDate) {
    return `
        <div class="report-header text-center mb-4">
            <h3>Ingredient Usage Report</h3>
            <p>${startDate || 'All dates'} to ${endDate || 'Present'}</p>
            <hr>
        </div>
        
        <div class="report-summary mb-4">
            <div class="row text-center">
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>15</h5>
                            <p class="text-muted mb-0">Total Ingredients</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>3</h5>
                            <p class="text-muted mb-0">Low Stock</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>8</h5>
                            <p class="text-muted mb-0">Menu Items Using</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h5>Ingredient Usage Details</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Ingredient</th>
                        <th>Starting Qty</th>
                        <th>Used</th>
                        <th>Added</th>
                        <th>Current Qty</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Beef</td>
                        <td>20 kg</td>
                        <td>5 kg</td>
                        <td>0 kg</td>
                        <td>15 kg</td>
                        <td><span class="badge bg-success">Normal</span></td>
                    </tr>
                    <tr>
                        <td>Chicken</td>
                        <td>15 kg</td>
                        <td>7 kg</td>
                        <td>0 kg</td>
                        <td>8 kg</td>
                        <td><span class="badge bg-warning">Low</span></td>
                    </tr>
                    <tr>
                        <td>Rice</td>
                        <td>30 kg</td>
                        <td>5 kg</td>
                        <td>0 kg</td>
                        <td>25 kg</td>
                        <td><span class="badge bg-success">Normal</span></td>
                    </tr>
                    <tr>
                        <td>Tomatoes</td>
                        <td>10 kg</td>
                        <td>5 kg</td>
                        <td>0 kg</td>
                        <td>5 kg</td>
                        <td><span class="badge bg-success">Normal</span></td>
                    </tr>
                    <tr>
                        <td>Onions</td>
                        <td>8 kg</td>
                        <td>5 kg</td>
                        <td>0 kg</td>
                        <td>3 kg</td>
                        <td><span class="badge bg-warning">Low</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function generateLowStockReport(startDate, endDate) {
    return `
        <div class="report-header text-center mb-4">
            <h3>Low Stock History Report</h3>
            <p>${startDate || 'All dates'} to ${endDate || 'Present'}</p>
            <hr>
        </div>
        
        <div class="report-summary mb-4">
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Alert:</strong> Currently there are 3 ingredients below their low-stock threshold.
            </div>
        </div>
        
        <div class="report-details">
            <h5>Current Low Stock Items</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Ingredient</th>
                        <th>Category</th>
                        <th>Current Qty</th>
                        <th>Threshold</th>
                        <th>Days Low</th>
                        <th>Last Restock</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Chicken</td>
                        <td>Meat</td>
                        <td>8 kg</td>
                        <td>10 kg</td>
                        <td>2 days</td>
                        <td>2023-09-28</td>
                    </tr>
                    <tr>
                        <td>Onions</td>
                        <td>Vegetables</td>
                        <td>3 kg</td>
                        <td>5 kg</td>
                        <td>1 day</td>
                        <td>2023-09-30</td>
                    </tr>
                    <tr>
                        <td>Cheese</td>
                        <td>Dairy</td>
                        <td>4 kg</td>
                        <td>3 kg</td>
                        <td>3 days</td>
                        <td>2023-09-27</td>
                    </tr>
                </tbody>
            </table>
            
            <h5 class="mt-4">Low Stock History</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Ingredient</th>
                        <th>Qty Before</th>
                        <th>Qty After</th>
                        <th>Action</th>
                        <th>Performed By</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>2023-10-01</td>
                        <td>Chicken</td>
                        <td>7 kg</td>
                        <td>8 kg</td>
                        <td>Increased</td>
                        <td>John Doe</td>
                    </tr>
                    <tr>
                        <td>2023-09-30</td>
                        <td>Onions</td>
                        <td>2 kg</td>
                        <td>3 kg</td>
                        <td>Increased</td>
                        <td>Jane Smith</td>
                    </tr>
                    <tr>
                        <td>2023-09-28</td>
                        <td>Chicken</td>
                        <td>5 kg</td>
                        <td>15 kg</td>
                        <td>Stock Delivery</td>
                        <td>Admin</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function generateStaffActivityReport(startDate, endDate) {
    return `
        <div class="report-header text-center mb-4">
            <h3>Staff Activity Summary Report</h3>
            <p>${startDate || 'All dates'} to ${endDate || 'Present'}</p>
            <hr>
        </div>
        
        <div class="report-summary mb-4">
            <div class="row text-center">
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>3</h5>
                            <p class="text-muted mb-0">Active Staff</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>156</h5>
                            <p class="text-muted mb-0">Total Sales</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>42</h5>
                            <p class="text-muted mb-0">Inventory Updates</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>0</h5>
                            <p class="text-muted mb-0">System Alerts</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="report-details">
            <h5>Staff Performance Summary</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Staff Name</th>
                        <th>Role</th>
                        <th>Sales Recorded</th>
                        <th>Inventory Updates</th>
                        <th>Last Active</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>John Doe</td>
                        <td>Staff</td>
                        <td>85</td>
                        <td>18</td>
                        <td>Today</td>
                        <td><span class="badge bg-success">Active</span></td>
                    </tr>
                    <tr>
                        <td>Jane Smith</td>
                        <td>Cashier</td>
                        <td>71</td>
                        <td>24</td>
                        <td>Today</td>
                        <td><span class="badge bg-success">Active</span></td>
                    </tr>
                    <tr>
                        <td>Robert Johnson</td>
                        <td>Staff</td>
                        <td>0</td>
                        <td>0</td>
                        <td>2023-09-28</td>
                        <td><span class="badge bg-secondary">Inactive</span></td>
                    </tr>
                </tbody>
            </table>
            
            <h5 class="mt-4">Recent Activity Log (Last 7 Days)</h5>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Staff</th>
                        <th>Action</th>
                        <th>Reference</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>2023-10-01</td>
                        <td>John Doe</td>
                        <td>Recorded sale</td>
                        <td>SALE-1001</td>
                        <td>Success</td>
                    </tr>
                    <tr>
                        <td>2023-10-01</td>
                        <td>Jane Smith</td>
                        <td>Updated inventory</td>
                        <td>Onions (+5kg)</td>
                        <td>Success</td>
                    </tr>
                    <tr>
                        <td>2023-09-30</td>
                        <td>John Doe</td>
                        <td>Recorded sale</td>
                        <td>SALE-1002</td>
                        <td>Success</td>
                    </tr>
                    <tr>
                        <td>2023-09-30</td>
                        <td>Admin</td>
                        <td>System backup</td>
                        <td>Backup-0930</td>
                        <td>Success</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

function printReportPreview() {
    const printContent = document.getElementById('reportPreview').innerHTML;
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
    
    // Restore original content
    document.body.innerHTML = originalContent;
    
    // Re-initialize event listeners
    initializeReports();
    
    showNotification('Report printed successfully', 'success');
}

// Backup Functions
function initializeBackup() {
    // Create backup button
    const createBackupBtn = document.getElementById('createBackupBtn');
    if (createBackupBtn) {
        createBackupBtn.addEventListener('click', function() {
            createFullBackup();
        });
    }
    
    // Backup type buttons
    document.querySelectorAll('[data-backup-type]').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-backup-type');
            createBackup(type);
        });
    });
    
    // Restore backup button
    const restoreBackupBtn = document.getElementById('restoreBackupBtn');
    if (restoreBackupBtn) {
        restoreBackupBtn.addEventListener('click', function() {
            restoreBackup();
        });
    }
    
    // Backup file input
    const backupFileInput = document.getElementById('backupFile');
    if (backupFileInput) {
        backupFileInput.addEventListener('change', function() {
            document.getElementById('restoreBackupBtn').disabled = !this.files.length;
        });
    }
    
    // Load backup data when page is shown
    document.querySelector('[data-page="backup"]').addEventListener('click', function() {
        loadBackupData();
    });
}

function loadBackupData() {
    const backupsTable = document.getElementById('backupsTable').getElementsByTagName('tbody')[0];
    backupsTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading backup data...</p></td></tr>';
    
    setTimeout(() => {
        const backups = [
            { name: 'full-backup-2023-10-01.json', type: 'Full System', date: '2023-10-01', size: '45 KB', actions: '<button class="btn btn-sm btn-outline-success">Download</button>' },
            { name: 'inventory-backup-2023-09-30.json', type: 'Inventory', date: '2023-09-30', size: '18 KB', actions: '<button class="btn btn-sm btn-outline-success">Download</button>' },
            { name: 'sales-backup-2023-09-29.json', type: 'Sales', date: '2023-09-29', size: '22 KB', actions: '<button class="btn btn-sm btn-outline-success">Download</button>' },
            { name: 'users-backup-2023-09-28.json', type: 'Users', date: '2023-09-28', size: '8 KB', actions: '<button class="btn btn-sm btn-outline-success">Download</button>' }
        ];
        
        backupsTable.innerHTML = '';
        
        backups.forEach(backup => {
            const row = backupsTable.insertRow();
            row.innerHTML = `
                <td>${backup.name}</td>
                <td><span class="badge bg-secondary">${backup.type}</span></td>
                <td>${backup.date}</td>
                <td>${backup.size}</td>
                <td>${backup.actions}</td>
            `;
        });
    }, 800);
}

function createFullBackup() {
    showNotification('Creating full system backup...', 'info');
    
    setTimeout(() => {
        // Simulate backup creation
        const backupData = {
            timestamp: new Date().toISOString(),
            type: 'full',
            inventory: { count: 15, lowStock: 3 },
            sales: { count: 156, today: 24 },
            users: { count: 8, active: 3 },
            settings: { version: '1.0', modules: 6 }
        };
        
        // Create download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `restaurant-pos-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Full system backup created successfully', 'success');
        logAdminActivity('Created full system backup', 'Full backup', 'Success');
        
        // Refresh backup list
        loadBackupData();
    }, 1500);
}

function createBackup(type) {
    const typeNames = {
        'inventory': 'Inventory',
        'sales': 'Sales Records',
        'users': 'User Accounts'
    };
    
    showNotification(`Creating ${typeNames[type]} backup...`, 'info');
    
    setTimeout(() => {
        // Simulate backup creation
        const backupData = {
            timestamp: new Date().toISOString(),
            type: type,
            data: `Sample ${typeNames[type]} backup data`
        };
        
        // Create download
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`${typeNames[type]} backup created successfully`, 'success');
        logAdminActivity(`Created ${type} backup`, typeNames[type], 'Success');
        
        // Refresh backup list
        loadBackupData();
    }, 1000);
}

function restoreBackup() {
    const fileInput = document.getElementById('backupFile');
    const restoreType = document.getElementById('restoreType').value;
    
    if (!fileInput.files.length) {
        showNotification('Please select a backup file to restore', 'warning');
        return;
    }
    
    const typeNames = {
        'inventory': 'Inventory',
        'sales': 'Sales Records',
        'users': 'User Accounts',
        'all': 'All System Data'
    };
    
    if (confirm(`Are you sure you want to restore ${typeNames[restoreType]}? This will overwrite existing data.`)) {
        showNotification(`Restoring ${typeNames[restoreType]} from backup...`, 'info');
        
        setTimeout(() => {
            // Simulate restore
            showNotification(`${typeNames[restoreType]} restored successfully`, 'success');
            logAdminActivity(`Restored ${restoreType} from backup`, typeNames[restoreType], 'Success');
            
            // Clear file input
            fileInput.value = '';
            document.getElementById('restoreBackupBtn').disabled = true;
            
            // Refresh affected pages
            if (restoreType === 'inventory' || restoreType === 'all') {
                loadIngredientsMasterlist();
            }
        }, 2000);
    }
}

// Requests Functions
function initializeRequests() {
    // Refresh requests button
    const refreshRequestsBtn = document.getElementById('refreshRequests');
    if (refreshRequestsBtn) {
        refreshRequestsBtn.addEventListener('click', function() {
            loadRequests();
        });
    }
    
    // Confirm approve button
    const confirmApproveBtn = document.getElementById('confirmApproveBtn');
    if (confirmApproveBtn) {
        confirmApproveBtn.addEventListener('click', function() {
            handleRequestApproval();
        });
    }
    
    // Load requests when page is shown
    document.querySelector('[data-page="requests"]').addEventListener('click', function() {
        loadRequests();
    });
}

function loadRequests() {
    // Update badge counts
    updateRequestBadges();
    
    // Load account requests
    loadAccountRequests();
    
    // Load role change requests
    loadRoleChangeRequests();
    
    // Load ingredient deletion requests
    loadIngredientDeletionRequests();
}

function updateRequestBadges() {
    // Simulate request counts
    const accountRequestsCount = 2;
    const roleRequestsCount = 1;
    const ingredientRequestsCount = 0;
    const totalRequests = accountRequestsCount + roleRequestsCount + ingredientRequestsCount;
    
    // Update badges
    document.getElementById('accountRequestsCount').textContent = accountRequestsCount;
    document.getElementById('roleRequestsCount').textContent = roleRequestsCount;
    document.getElementById('ingredientRequestsCount').textContent = ingredientRequestsCount;
    document.getElementById('pendingRequestsBadge').textContent = totalRequests;
    document.getElementById('sidebarPendingRequests').textContent = totalRequests;
    document.getElementById('quickPendingCount').textContent = totalRequests;
}

function loadAccountRequests() {
    const accountRequestsTable = document.getElementById('accountRequestsTable').getElementsByTagName('tbody')[0];
    accountRequestsTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading account requests...</p></td></tr>';
    
    setTimeout(() => {
        const requests = [
            { date: '2023-10-01', fullName: 'Robert Johnson', username: 'robertj', role: 'Staff', actions: '<button class="btn btn-sm btn-success me-1" onclick="showApprovalModal(1, \'account\', \'Robert Johnson\', \'Staff\')">Approve</button><button class="btn btn-sm btn-danger" onclick="rejectRequest(1, \'account\')">Reject</button>' },
            { date: '2023-09-30', fullName: 'Sarah Williams', username: 'sarahw', role: 'Cashier', actions: '<button class="btn btn-sm btn-success me-1" onclick="showApprovalModal(2, \'account\', \'Sarah Williams\', \'Cashier\')">Approve</button><button class="btn btn-sm btn-danger" onclick="rejectRequest(2, \'account\')">Reject</button>' }
        ];
        
        accountRequestsTable.innerHTML = '';
        
        requests.forEach(request => {
            const row = accountRequestsTable.insertRow();
            row.innerHTML = `
                <td>${request.date}</td>
                <td><strong>${request.fullName}</strong></td>
                <td>${request.username}</td>
                <td><span class="badge bg-secondary">${request.role}</span></td>
                <td>${request.actions}</td>
            `;
        });
    }, 800);
}

function loadRoleChangeRequests() {
    const roleRequestsTable = document.getElementById('roleRequestsTable').getElementsByTagName('tbody')[0];
    roleRequestsTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading role change requests...</p></td></tr>';
    
    setTimeout(() => {
        const requests = [
            { staffName: 'John Doe', currentRole: 'Staff', requestedRole: 'Senior Staff', date: '2023-09-29', actions: '<button class="btn btn-sm btn-success me-1" onclick="showApprovalModal(3, \'role\', \'John Doe\', \'Senior Staff\')">Approve</button><button class="btn btn-sm btn-danger" onclick="rejectRequest(3, \'role\')">Reject</button>' }
        ];
        
        roleRequestsTable.innerHTML = '';
        
        requests.forEach(request => {
            const row = roleRequestsTable.insertRow();
            row.innerHTML = `
                <td><strong>${request.staffName}</strong></td>
                <td><span class="badge bg-info">${request.currentRole}</span></td>
                <td><span class="badge bg-warning">${request.requestedRole}</span></td>
                <td>${request.date}</td>
                <td>${request.actions}</td>
            `;
        });
    }, 800);
}

function loadIngredientDeletionRequests() {
    const ingredientRequestsTable = document.getElementById('ingredientRequestsTable').getElementsByTagName('tbody')[0];
    ingredientRequestsTable.innerHTML = '<tr><td colspan="6" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading ingredient deletion requests...</p></td></tr>';
    
    setTimeout(() => {
        // Simulate no requests
        ingredientRequestsTable.innerHTML = '<tr><td colspan="6" class="text-center">No ingredient deletion requests</td></tr>';
    }, 800);
}

function showApprovalModal(requestId, type, name, details) {
    currentRequestType = type;
    currentRequestId = requestId;
    
    const modalTitle = document.getElementById('approvalModalTitle');
    const modalContent = document.getElementById('approvalModalContent');
    
    if (type === 'account') {
        modalTitle.innerHTML = '<i class="fas fa-check-circle me-2"></i>Approve Account Request';
        modalContent.innerHTML = `
            <p>You are about to approve the following account request:</p>
            <div class="alert alert-info">
                <strong>Name:</strong> ${name}<br>
                <strong>Requested Role:</strong> ${details}<br>
                <strong>Request ID:</strong> ${requestId}
            </div>
            <p>Once approved, the user will be able to log in immediately with their chosen credentials.</p>
        `;
    } else if (type === 'role') {
        modalTitle.innerHTML = '<i class="fas fa-user-tag me-2"></i>Approve Role Change';
        modalContent.innerHTML = `
            <p>You are about to approve a role change request:</p>
            <div class="alert alert-warning">
                <strong>Staff Member:</strong> ${name}<br>
                <strong>New Role:</strong> ${details}<br>
                <strong>Request ID:</strong> ${requestId}
            </div>
            <p>The staff member's permissions will be updated immediately after approval.</p>
        `;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('approvalModal'));
    modal.show();
}

function handleRequestApproval() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('approvalModal'));
    
    setTimeout(() => {
        modal.hide();
        
        // Simulate approval
        showNotification(`Request ${currentRequestId} approved successfully`, 'success');
        logAdminActivity(`Approved ${currentRequestType} request`, `Request ID: ${currentRequestId}`, 'Success');
        
        // Refresh requests
        loadRequests();
        
        // Reset current request
        currentRequestType = null;
        currentRequestId = null;
    }, 1000);
}

function rejectRequest(requestId, type) {
    if (confirm('Are you sure you want to reject this request?')) {
        setTimeout(() => {
            showNotification(`Request ${requestId} rejected`, 'warning');
            logAdminActivity(`Rejected ${type} request`, `Request ID: ${requestId}`, 'Success');
            
            // Refresh requests
            loadRequests();
        }, 800);
    }
}

// System Settings Functions
function initializeSystemSettings() {
    // Save settings button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function() {
            saveSystemSettings();
        });
    }
    
    // Load settings when page is shown
    document.querySelector('[data-page="system-settings"]').addEventListener('click', function() {
        loadSystemSettings();
    });
}

function loadSystemSettings() {
    // Simulate loading settings
    setTimeout(() => {
        // Set default values
        document.getElementById('defaultThreshold').value = 5;
        document.getElementById('receiptFooter').value = 'Thank you for your order! Payment handled outside the system.';
        document.getElementById('autoLogoutMinutes').value = 30;
        document.getElementById('dateFormat').value = 'mm/dd/yyyy';
        
        // Module settings
        document.getElementById('moduleSales').checked = true;
        document.getElementById('moduleInventory').checked = true;
        document.getElementById('moduleReports').checked = true;
        document.getElementById('moduleRequests').checked = true;
        document.getElementById('moduleBackup').checked = true;
        document.getElementById('moduleTempAccount').checked = true;
        
        // Security settings
        document.getElementById('maxLoginAttempts').value = '5';
        document.getElementById('lockoutDuration').value = '30';
        document.getElementById('enableAuditLog').checked = true;
        document.getElementById('requireStrongPasswords').checked = true;
    }, 500);
}

function saveSystemSettings() {
    showNotification('Saving system settings...', 'info');
    
    setTimeout(() => {
        // Simulate save
        showNotification('System settings saved successfully', 'success');
        logAdminActivity('Updated system settings', 'General configuration', 'Success');
    }, 1000);
}

// Activity Log Functions
function initializeActivityLog() {
    // Export activity log button
    const exportActivityLogBtn = document.getElementById('exportActivityLog');
    if (exportActivityLogBtn) {
        exportActivityLogBtn.addEventListener('click', function() {
            exportActivityLog();
        });
    }
    
    // Clear old logs button
    const clearOldLogsBtn = document.getElementById('clearOldLogs');
    if (clearOldLogsBtn) {
        clearOldLogsBtn.addEventListener('click', function() {
            clearOldActivityLogs();
        });
    }
    
    // Apply activity filter button
    const applyActivityFilterBtn = document.getElementById('applyActivityFilter');
    if (applyActivityFilterBtn) {
        applyActivityFilterBtn.addEventListener('click', function() {
            loadFullActivityLog();
        });
    }
    
    // Load activity log when page is shown
    document.querySelector('[data-page="activity-log"]').addEventListener('click', function() {
        loadFullActivityLog();
    });
}

function loadFullActivityLog() {
    const fullActivityLogTable = document.getElementById('fullActivityLogTable').getElementsByTagName('tbody')[0];
    fullActivityLogTable.innerHTML = '<tr><td colspan="7" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading activity log...</p></td></tr>';
    
    // Get filter values
    const userFilter = document.getElementById('filterUser').value;
    const actionFilter = document.getElementById('filterAction').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    
    setTimeout(() => {
        const activities = [
            { datetime: '2023-10-01 10:30:15', user: 'John Doe', role: 'Staff', action: 'Recorded sale', reference: 'SALE-1001', status: 'Success', ip: '192.168.1.10' },
            { datetime: '2023-10-01 09:45:22', user: 'System', role: 'System', action: 'Low stock alert', reference: 'Chicken (8kg)', status: 'Warning', ip: 'System' },
            { datetime: '2023-10-01 09:15:08', user: 'Admin', role: 'Admin', action: 'Approved account', reference: 'Robert Johnson', status: 'Success', ip: '192.168.1.1' },
            { datetime: '2023-09-30 16:22:45', user: 'Jane Smith', role: 'Cashier', action: 'Updated inventory', reference: 'Onions (+5kg)', status: 'Success', ip: '192.168.1.12' },
            { datetime: '2023-09-30 14:30:00', user: 'Admin', role: 'Admin', action: 'System backup', reference: 'Backup-0930', status: 'Success', ip: '192.168.1.1' },
            { datetime: '2023-09-30 11:15:33', user: 'John Doe', role: 'Staff', action: 'Logged in', reference: 'System', status: 'Success', ip: '192.168.1.10' },
            { datetime: '2023-09-29 17:45:18', user: 'Owner (Temp)', role: 'Owner as Staff', action: 'Recorded sale', reference: 'SALE-099', status: 'Success', ip: '192.168.1.1' }
        ];
        
        fullActivityLogTable.innerHTML = '';
        
        activities.forEach(activity => {
            // Apply filters
            if (userFilter && activity.role.toLowerCase() !== userFilter.toLowerCase()) return;
            if (actionFilter && !activity.action.toLowerCase().includes(actionFilter.toLowerCase())) return;
            if (dateFrom && activity.datetime.split(' ')[0] < dateFrom) return;
            if (dateTo && activity.datetime.split(' ')[0] > dateTo) return;
            
            const row = fullActivityLogTable.insertRow();
            row.innerHTML = `
                <td>${activity.datetime}</td>
                <td>${activity.user}</td>
                <td><span class="badge ${activity.role === 'Owner as Staff' ? 'bg-danger' : activity.role === 'Admin' ? 'bg-danger' : activity.role === 'Staff' ? 'bg-success' : 'bg-info'}">${activity.role}</span></td>
                <td>${activity.action}</td>
                <td><span class="badge bg-secondary">${activity.reference}</span></td>
                <td><span class="badge ${activity.status === 'Success' ? 'bg-success' : 'bg-warning'}">${activity.status}</span></td>
                <td><small class="text-muted">${activity.ip}</small></td>
            `;
        });
    }, 800);
}

function exportActivityLog() {
    showNotification('Exporting activity log...', 'info');
    
    setTimeout(() => {
        // Create CSV data
        const headers = ['Date & Time', 'User', 'Role', 'Action', 'Reference', 'Status', 'IP Address'];
        const rows = [
            ['2023-10-01 10:30:15', 'John Doe', 'Staff', 'Recorded sale', 'SALE-1001', 'Success', '192.168.1.10'],
            ['2023-10-01 09:45:22', 'System', 'System', 'Low stock alert', 'Chicken (8kg)', 'Warning', 'System'],
            ['2023-10-01 09:15:08', 'Admin', 'Admin', 'Approved account', 'Robert Johnson', 'Success', '192.168.1.1']
        ];
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        // Create download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Activity log exported successfully', 'success');
        logAdminActivity('Exported activity log', 'Full log export', 'Success');
    }, 1000);
}

function clearOldActivityLogs() {
    if (confirm('Are you sure you want to clear activity logs older than 30 days? This action cannot be undone.')) {
        showNotification('Clearing old activity logs...', 'info');
        
        setTimeout(() => {
            showNotification('Old activity logs cleared successfully', 'success');
            logAdminActivity('Cleared old activity logs', 'Log maintenance', 'Success');
            
            // Refresh activity log
            loadFullActivityLog();
        }, 1500);
    }
}

// Temporary Account Functions
function initializeTempAccount() {
    // Activate temp account button
    const activateTempAccountBtn = document.getElementById('activateTempAccountBtn');
    if (activateTempAccountBtn) {
        activateTempAccountBtn.addEventListener('click', function() {
            toggleTempAccount();
        });
    }
    
    // Toggle temp account button
    const toggleTempAccountBtn = document.getElementById('toggleTempAccount');
    if (toggleTempAccountBtn) {
        toggleTempAccountBtn.addEventListener('click', function() {
            toggleTempAccount();
        });
    }
    
    // Temp account feature buttons
    const tempRecordSaleBtn = document.getElementById('tempRecordSale');
    const tempAdjustStockBtn = document.getElementById('tempAdjustStock');
    const tempPrintReceiptBtn = document.getElementById('tempPrintReceipt');
    
    if (tempRecordSaleBtn) {
        tempRecordSaleBtn.addEventListener('click', function() {
            showNotification('Opening sales interface in temporary mode...', 'info');
        });
    }
    
    if (tempAdjustStockBtn) {
        tempAdjustStockBtn.addEventListener('click', function() {
            showNotification('Opening inventory adjustment in temporary mode...', 'info');
        });
    }
    
    if (tempPrintReceiptBtn) {
        tempPrintReceiptBtn.addEventListener('click', function() {
            showNotification('Opening receipt printer in temporary mode...', 'info');
        });
    }
    
    // Load temp account when page is shown
    document.querySelector('[data-page="temp-account"]').addEventListener('click', function() {
        loadTempAccountStatus();
    });
}

function loadTempAccountStatus() {
    const tempAccountStatus = document.getElementById('tempAccountStatus');
    const toggleTempAccountBtn = document.getElementById('toggleTempAccount');
    const tempFeatureButtons = document.querySelectorAll('#temp-account-content .btn[disabled]');
    
    if (tempAccountActive) {
        tempAccountStatus.textContent = 'Active';
        tempAccountStatus.className = 'text-success';
        toggleTempAccountBtn.innerHTML = '<i class="fas fa-power-off me-2"></i> Deactivate';
        toggleTempAccountBtn.className = 'btn btn-lg btn-warning';
        
        // Enable feature buttons
        tempFeatureButtons.forEach(btn => {
            btn.disabled = false;
        });
    } else {
        tempAccountStatus.textContent = 'Inactive';
        tempAccountStatus.className = 'text-warning';
        toggleTempAccountBtn.innerHTML = '<i class="fas fa-power-off me-2"></i> Activate';
        toggleTempAccountBtn.className = 'btn btn-lg btn-danger';
        
        // Disable feature buttons
        tempFeatureButtons.forEach(btn => {
            btn.disabled = true;
        });
    }
    
    // Load temp account log
    loadTempAccountLog();
}

function toggleTempAccount() {
    if (tempAccountActive) {
        if (confirm('Are you sure you want to deactivate the temporary staff account?')) {
            tempAccountActive = false;
            showNotification('Temporary staff account deactivated', 'warning');
            logAdminActivity('Deactivated temporary staff account', 'Owner acting as staff ended', 'Success');
        }
    } else {
        tempAccountActive = true;
        showNotification('Temporary staff account activated. All actions will be flagged as "Owner acting as staff".', 'success');
        logAdminActivity('Activated temporary staff account', 'Owner acting as staff started', 'Success');
    }
    
    loadTempAccountStatus();
}

function loadTempAccountLog() {
    const tempAccountLogTable = document.getElementById('tempAccountLogTable').getElementsByTagName('tbody')[0];
    tempAccountLogTable.innerHTML = '<tr><td colspan="5" class="text-center"><div class="loading-spinner"></div><p class="mt-2">Loading temporary account activity...</p></td></tr>';
    
    setTimeout(() => {
        const activities = [
            { datetime: '2023-09-29 17:45:18', action: 'Recorded sale', reference: 'SALE-099', status: 'Success', flag: 'Owner acting as staff' },
            { datetime: '2023-09-28 14:20:33', action: 'Adjusted stock', reference: 'Beef (+10kg)', status: 'Success', flag: 'Owner acting as staff' },
            { datetime: '2023-09-27 11:15:45', action: 'Printed receipt', reference: 'REC-098', status: 'Success', flag: 'Owner acting as staff' },
            { datetime: '2023-09-20 16:30:22', action: 'Recorded sale', reference: 'SALE-095', status: 'Success', flag: 'Owner acting as staff' }
        ];
        
        tempAccountLogTable.innerHTML = '';
        
        activities.forEach(activity => {
            const row = tempAccountLogTable.insertRow();
            row.innerHTML = `
                <td>${activity.datetime}</td>
                <td>${activity.action}</td>
                <td><span class="badge bg-secondary">${activity.reference}</span></td>
                <td><span class="badge bg-success">${activity.status}</span></td>
                <td><span class="badge bg-danger">${activity.flag}</span></td>
            `;
        });
    }, 800);
}

// Utility Functions
function logAdminActivity(action, reference, status) {
    // In a real app, this would send data to server
    console.log(`Admin Activity Log: ${action} - ${reference} - ${status}`);
    
    // Update activity log if it's currently visible
    if (document.getElementById('activity-log-content') && 
        !document.getElementById('activity-log-content').classList.contains('d-none')) {
        loadFullActivityLog();
    }
}

// Export functions for use in inline event handlers
window.showApprovalModal = showApprovalModal;
window.rejectRequest = rejectRequest;
window.editMenuItem = editMenuItem;
window.toggleMenuItemStatus = toggleMenuItemStatus;
window.deleteMenuItem = deleteMenuItem;
window.editIngredient = editIngredient;
window.deleteIngredient = deleteIngredient;