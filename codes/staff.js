// Staff Dashboard JavaScript - Updated for Multi-page support

// Global variables
let currentSaleItems = [];
let currentSaleId = null;
let allMenuItems = [];
let allIngredients = [];

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
    initializeCommonStaffFeatures();

    // Auto-initialize based on elements present
    if (document.getElementById('menuItemsGrid')) initializeMenuFunctionality();
    if (document.getElementById('ingredientsListTable') || document.getElementById('ingredientsTable')) initializeIngredientsFunctionality();
    if (document.getElementById('recentReceipts')) initializeReceiptsFunctionality();
    if (document.getElementById('changePasswordForm')) initializeAccountFunctionality();
    if (document.getElementById('activityLogTable')) initializeActivityLogFunctionality();
});

// // Aliases for compatibility with separate pages
// // const loadMenuItems = () => initializeMenuFunctionality();
// const loadMenuItemsData = () => loadMenuItems();
// // const loadIngredients = () => initializeIngredientsFunctionality();
// const loadIngredientsData = () => loadIngredients();
const loadReceipts = () => initializeReceiptsFunctionality();
// const loadRecentReceipts = () => initializeReceiptsFunctionality();
// const loadAccountInfo = () => initializeAccountFunctionality();
// const loadActivityLog = () => initializeActivityLogFunctionality();

// Common features for all staff pages
function initializeCommonStaffFeatures() {
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

// Menu Sales Functions
function initializeMenuFunctionality() {
    // Start new sale button
    const startNewSaleBtn = document.getElementById('startNewSale');
    if (startNewSaleBtn) {
        startNewSaleBtn.addEventListener('click', function () {
            startNewSale();
        });
    }

    // Record sale button
    const recordSaleBtn = document.getElementById('recordSaleBtn');
    if (recordSaleBtn) {
        recordSaleBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to record this sale?', function () {
                recordSale();
            });
        });
    }

    // Clear sale button
    const clearSaleBtn = document.getElementById('clearSaleBtn');
    if (clearSaleBtn) {
        clearSaleBtn.addEventListener('click', function () {
            clearCurrentSale();
        });
    }

    // Load initial data
    loadMenuItems();
}

function loadMenuItems() {
    const menuGrid = document.getElementById('menuItemsGrid');
    if (!menuGrid) return;

    // Show loading
    menuGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="loading-spinner"></div><p class="mt-2">Loading menu items...</p></div>';

    // Simulate API call with delay
    setTimeout(() => {
        allMenuItems = [
            { id: 1, name: 'Beef Steak', category: 'Main Course', image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop', available: true, description: 'Grilled beef steak with vegetables' },
            { id: 2, name: 'Chicken Curry', category: 'Main Course', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', available: true, description: 'Spicy chicken curry with rice' },
            { id: 3, name: 'Vegetable Salad', category: 'Appetizer', image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', available: true, description: 'Fresh mixed vegetable salad' },
            { id: 4, name: 'Garlic Bread', category: 'Appetizer', image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop', available: true, description: 'Toasted bread with garlic butter' },
            { id: 5, name: 'French Fries', category: 'Side Dish', image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&h=300&fit=crop', available: true, description: 'Crispy golden french fries' },
            { id: 6, name: 'Grilled Salmon', category: 'Main Course', image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop', available: false, description: 'Fresh grilled salmon with lemon butter sauce' },
            { id: 7, name: 'Pasta Carbonara', category: 'Main Course', image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop', available: true, description: 'Creamy pasta with bacon and cheese' },
            { id: 8, name: 'Chocolate Cake', category: 'Dessert', image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', available: true, description: 'Rich chocolate cake with frosting' }
        ];

        displayMenuItems(allMenuItems);
    }, 800);
}

function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuItemsGrid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '';

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-utensils fa-3x text-muted mb-3"></i><p class="text-muted">No menu items found</p></div>';
        return;
    }

    items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';

        const imgSrc = item.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';

        col.innerHTML = `
            <div class="menu-item-card ${!item.available ? 'opacity-50' : ''}">
                <div class="position-relative">
                    <img src="${imgSrc}" alt="${item.name}" class="menu-item-img" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop'">
                    <span class="menu-item-badge badge ${item.available ? 'bg-green' : 'bg-secondary'}">
                        ${item.available ? 'Available' : 'Out of Stock'}
                    </span>
                </div>
                <div class="p-3">
                    <h5 class="card-title text-maroon">${item.name}</h5>
                    <p class="card-text text-muted small">${item.category}</p>
                    <p class="card-text small mb-3">${item.description}</p>
                    ${item.available ?
                `<button class="btn btn-sm btn-maroon w-100 add-to-sale" data-id="${item.id}" data-name="${item.name}">
                            <i class="fas fa-cart-plus me-1"></i> Add to Sale
                        </button>` :
                `<button class="btn btn-sm btn-secondary w-100" disabled>Unavailable</button>`
            }
                </div>
            </div>
        `;

        menuGrid.appendChild(col);
    });

    // Add event listeners to add-to-sale buttons
    document.querySelectorAll('.add-to-sale').forEach(button => {
        button.addEventListener('click', function () {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            addItemToSale(itemId, itemName);
        });
    });
}

function filterMenuItems() {
    const searchTerm = document.getElementById('menuSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('menuCategoryFilter')?.value || '';

    const filtered = allMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) &&
        (category === '' || item.category === category)
    );
    displayMenuItems(filtered);
}

function startNewSale() {
    currentSaleItems = [];
    currentSaleId = 'SALE-' + Date.now();
    updateSaleDisplay();
    showModalNotification('New sale started', 'success', 'Sale Started');
}

function addItemToSale(itemId, itemName) {
    const existingItem = currentSaleItems.find(item => item.id === itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentSaleItems.push({ id: itemId, name: itemName, quantity: 1 });
    }
    updateSaleDisplay();
    showModalNotification(`${itemName} added to sale`, 'success', 'Item Added');
}

function updateSaleDisplay() {
    const saleItemsContainer = document.getElementById('saleItems');
    const totalItemsCount = document.getElementById('totalItemsCount');
    const recordSaleBtn = document.getElementById('recordSaleBtn');

    if (!saleItemsContainer) return;

    if (currentSaleItems.length === 0) {
        saleItemsContainer.innerHTML = '<p class="text-muted text-center py-3">No items added to sale yet.</p>';
        if (totalItemsCount) totalItemsCount.textContent = '0';
        if (recordSaleBtn) recordSaleBtn.disabled = true;
        return;
    }

    let totalItems = 0;
    let itemsHtml = '';

    currentSaleItems.forEach((item, index) => {
        totalItems += item.quantity;
        itemsHtml += `
            <div class="sale-item d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                <div>
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">ID: ${item.id}</small>
                </div>
                <div class="d-flex align-items-center">
                    <span class="badge bg-maroon me-2">${item.quantity}</span>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeSaleItem(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    });

    saleItemsContainer.innerHTML = itemsHtml;
    if (totalItemsCount) totalItemsCount.textContent = totalItems;
    if (recordSaleBtn) recordSaleBtn.disabled = false;
}

function removeSaleItem(index) {
    currentSaleItems.splice(index, 1);
    updateSaleDisplay();
}

function clearCurrentSale() {
    currentSaleItems = [];
    updateSaleDisplay();
}

function recordSale() {
    if (currentSaleItems.length === 0) return;

    showModalNotification('Recording sale...', 'info', 'Processing');
    setTimeout(() => {
        showModalNotification('Sale recorded successfully!', 'success', 'Success');
        clearCurrentSale();
    }, 1000);
}

// Ingredients Functions
function initializeIngredientsFunctionality() {
    const searchInput = document.getElementById('ingredientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterIngredients);
    }

    const categoryFilter = document.getElementById('ingredientCategoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterIngredients);
    }

    loadIngredients();
}

function loadIngredients() {
    console.log("✅ loadIngredients() called");

    const tableElem =
        document.getElementById('ingredientsListTable') ||
        document.getElementById('ingredientsTable');

    console.log("🔎 Table element found:", tableElem);

    if (!tableElem) {
        console.warn("❌ Table element not found!");
        return;
    }

    const tbody = tableElem.querySelector('tbody');
    console.log("🔎 tbody:", tbody);

    if (!tbody) {
        console.warn("❌ tbody not found!");
        return;
    }

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading...</td></tr>';

    setTimeout(() => {
        console.log("📦 Setting ingredient data");

        allIngredients = [
            { id: 1, name: 'Beef', category: 'Meat', quantity: 15, unit: 'kg', status: 'Normal', minLevel: 5 },
            { id: 2, name: 'Chicken', category: 'Meat', quantity: 8, unit: 'kg', status: 'Low', minLevel: 10 },
            { id: 3, name: 'Onions', category: 'Vegetables', quantity: 3, unit: 'kg', status: 'Low', minLevel: 5 },
            { id: 4, name: 'Cheese', category: 'Dairy', quantity: 4, unit: 'kg', status: 'Low', minLevel: 5 },
            { id: 5, name: 'Garlic', category: 'Spices', quantity: 1, unit: 'kg', status: 'Low', minLevel: 2 },
            { id: 6, name: 'Cooking Oil', category: 'Supplies', quantity: 2, unit: 'L', status: 'Low', minLevel: 5 },
            { id: 7, name: 'Red Wine', category: 'Beverages', quantity: 1, unit: 'bottle', status: 'Low', minLevel: 3 }
        ];

        displayIngredients(allIngredients);

    }, 500);
}


function displayIngredients(ingredients) {
    const tableElem = document.getElementById('ingredientsListTable') || document.getElementById('ingredientsTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    tbody.innerHTML = '';
    ingredients.forEach(ing => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${ing.name}</td>
            <td>${ing.category}</td>
            <td>${ing.quantity} ${ing.unit}</td>
            <td>${ing.minLevel || '-'}</td>
            <td><span class="badge ${ing.status === 'Normal' ? 'bg-success' : 'bg-warning'}">${ing.status}</span></td>
            <td><button class="btn btn-sm btn-outline-maroon" onclick="showUpdateModal(${ing.id})">Update</button></td>
        `;
    });
}

function showUpdateModal(id) {
    // Logic to show update modal
    const modal = new bootstrap.Modal(document.getElementById('updateQuantityModal') || document.getElementById('increaseQuantityModal'));
    modal.show();
}

function filterIngredients() {
    const searchTerm = document.getElementById('ingredientSearch')?.value.toLowerCase() || '';
    const category = document.getElementById('ingredientCategoryFilter')?.value || '';

    const filtered = allIngredients.filter(ing =>
        ing.name.toLowerCase().includes(searchTerm) &&
        (category === '' || ing.category === category)
    );
    displayIngredients(filtered);
}

// Receipts Functions
function initializeReceiptsFunctionality() {
    loadRecentReceipts();
}

function loadRecentReceipts() {
    const container = document.getElementById('recentReceipts');
    if (!container) return;

    container.innerHTML = '<a href="#" class="list-group-item list-group-item-action">No recent receipts</a>';
}

// Account Functions
function initializeAccountFunctionality() {
    const form = document.getElementById('changePasswordForm');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            showModalNotification('Password updated successfully', 'success', 'Account');
        });
    }

    const saveBtn = document.getElementById('saveAccountInfoBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function (e) {
            e.preventDefault();
            saveAccountInfo();
        });
    }
}

function saveAccountInfo() {
    showModalNotification('Account information updated successfully', 'success', 'Account');
}

// Activity Log Functions
function initializeActivityLogFunctionality() {
    loadActivityLog();
}

function loadActivityLog() {
    const tableElem = document.getElementById('activityLogTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    tbody.innerHTML = '<tr><td>2023-10-01</td><td>Logged in</td><td>-</td><td>Success</td></tr>';
}

// Helper Functions
function showModalNotification(msg, type, title) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({ title: title || 'Notification', text: msg, icon: type || 'info', confirmButtonColor: '#800000' });
    } else {
        alert(`${title}: ${msg}`);
    }
}

function showConfirm(msg, callback) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Confirm', text: msg, icon: 'question', showCancelButton: true, confirmButtonColor: '#800000'
        }).then(result => { if (result.isConfirmed && callback) callback(); });
    } else {
        if (confirm(msg) && callback) callback();
    }
}