// Staff Dashboard JavaScript - Fixed & Cleaned

// API URL for database operations
const API_URL = "php/app.php";

// Database helper function
function createDB(table) {
    return {
        add: async (data) => {
            try {
                const res = await fetch(API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...data, table })
                });
                return await res.json();
            } catch (err) {
                console.error(`Add failed [${table}]:`, err);
                return { error: err.message };
            }
        },
        show: async (filters = {}) => {
            try {
                const params = new URLSearchParams({ ...filters, table }).toString();
                const res = await fetch(`${API_URL}?${params}`);
                return await res.json();
            } catch (err) {
                console.error(`Show failed [${table}]:`, err);
                return [];
            }
        },
        edit: async (data) => {
            try {
                const res = await fetch(API_URL, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...data, table })
                });
                return await res.json();
            } catch (err) {
                console.error(`Edit failed [${table}]:`, err);
                return { error: err.message };
            }
        },
        delete: async (id) => {
            try {
                const res = await fetch(API_URL, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id, table })
                });
                return await res.json();
            } catch (err) {
                console.error(`Delete failed [${table}]:`, err);
                return { error: err.message };
            }
        }
    };
}

// Database objects for staff use
const menuCategoriesDB = createDB('menu_categories');
const menuItemsDB = createDB('menu_items');
const ingredientsDB = createDB('ingredients');
const ingredientCategoriesDB = createDB('ingredient_categories');
const unitsDB = createDB('units');
const salesDB = createDB('sales');
const saleItemsDB = createDB('sale_items');
const inventoryTransactionsDB = createDB('inventory_transactions');
const recipesDB = createDB('recipes');

// Global variables
let currentSaleItems = [];
let currentSaleId = null;
let allMenuItems = [];
let allCategories = [];
let allIngredients = [];
let currentCustomer = null;
let currentDiscount = 0;
let currentCoupon = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    if (typeof bootstrap !== 'undefined') {
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(el => new bootstrap.Tooltip(el));
    }

    initializeCommonStaffFeatures();

    if (document.getElementById('menuItemsGrid')) initializeMenuFunctionality();
    if (document.getElementById('ingredientsListTable') || document.getElementById('ingredientsTable')) initializeIngredientsFunctionality();
    if (document.getElementById('recentReceipts')) initializeReceiptsFunctionality();
    if (document.getElementById('changePasswordForm')) initializeAccountFunctionality();
    if (document.getElementById('activityLogTable')) initializeActivityLogFunctionality();

    // Only poll user data on pages that show user info
    if (document.querySelector('.navbar .dropdown-toggle')) {
        setInterval(refreshUserData, 15000);
    }
});

// ─── Common ──────────────────────────────────────────────────────────────────

function initializeCommonStaffFeatures() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const headerUserName = document.querySelector('.navbar .dropdown-toggle');
    if (headerUserName && user.full_name) {
        headerUserName.innerHTML = `<i class="fas fa-user-circle me-1"></i>${user.full_name}`;
    }

    document.querySelectorAll('#logoutBtn, #logoutBtnAccount').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            performStaffLogout();
        });
    });
}

function performStaffLogout() {
    showConfirm('Are you sure you want to logout?', function () {
        const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');

        logStaffActivity('Logged out', 'User session terminated', 'Success');

        updateUserStatus(user.id, 'inactive')
            .catch(err => console.error('Failed to update status on logout:', err))
            .finally(() => {
                localStorage.removeItem('loggedInRole');
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            });
    });
}

// ─── Activity Logging (single authoritative version — async/DB) ───────────────

async function logStaffActivity(action, reference = 'N/A', status = 'Success') {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    try {
        await fetch('php/app.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table: 'activity_logs',
                user_id: user.id,
                role_label: user.role_name || 'Staff',
                action,
                reference,
                status,
                ip_address: '127.0.0.1',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
        });

        if (document.getElementById('activityLogTable')) {
            loadActivityLog();
        }
    } catch (e) {
        console.error('Failed to log activity:', e);
    }
}

// ─── Menu / POS ───────────────────────────────────────────────────────────────

function initializeMenuFunctionality() {
    document.getElementById('menuSearch')?.addEventListener('input', filterMenuItems);

    document.getElementById('clearSaleBtn')?.addEventListener('click', () =>
        showConfirm('Are you sure you want to clear the cart?', clearCurrentSale)
    );
    document.getElementById('checkoutBtn')?.addEventListener('click', processCheckout);
    document.getElementById('selectCustomerBtn')?.addEventListener('click', selectCustomer);
    document.getElementById('discountBtn')?.addEventListener('click', applyDiscount);
    document.getElementById('couponBtn')?.addEventListener('click', applyCoupon);
    document.getElementById('holdOrderBtn')?.addEventListener('click', holdOrder);
    document.getElementById('returnOrderBtn')?.addEventListener('click', handleReturn);

    // Load categories first, then menu items
    loadCategoryTabs();
    loadMenuItems();
    updateSaleDisplay();
}

// Load category tabs from database
async function loadCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    if (!tabsContainer) return;

    try {
        const categories = await menuCategoriesDB.show();
        allCategories = categories;

        // Build HTML: "All Products" first, then DB categories
        let html = '<button class="btn btn-category active" data-category="All">All Products</button>';
        categories.forEach(cat => {
            html += `<button class="btn btn-category" data-category="${cat.id}">${cat.name}</button>`;
        });
        tabsContainer.innerHTML = html;

        // Attach click listeners
        tabsContainer.querySelectorAll('.btn-category').forEach(tab => {
            tab.addEventListener('click', function () {
                tabsContainer.querySelectorAll('.btn-category').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                filterMenuItems();
            });
        });
    } catch (err) {
        console.error('Failed to load categories:', err);
    }
}

function selectCustomer() {
    Swal.fire({
        title: 'Select Customer',
        input: 'text',
        inputLabel: 'Enter Customer Name',
        inputPlaceholder: 'Search or add new customer...',
        showCancelButton: true,
        confirmButtonColor: '#800000',
    }).then(result => {
        if (result.isConfirmed && result.value) {
            currentCustomer = result.value;
            showModalNotification(`Customer "${currentCustomer}" selected.`, 'success', 'Customer Selected');
            updateSaleDisplay();
            logStaffActivity('Selected Customer', currentCustomer, 'Success');
        }
    });
}

function applyDiscount() {
    Swal.fire({
        title: 'Apply Discount',
        input: 'number',
        inputLabel: 'Enter Discount Percentage (%)',
        inputPlaceholder: '0',
        inputAttributes: { min: 0, max: 100 },
        showCancelButton: true,
        confirmButtonColor: '#800000',
    }).then(result => {
        if (result.isConfirmed) {
            currentDiscount = parseFloat(result.value) || 0;
            updateSaleDisplay();
            logStaffActivity('Applied Discount', `${currentDiscount}%`, 'Success');
        }
    });
}

function applyCoupon() {
    Swal.fire({
        title: 'Apply Coupon',
        input: 'text',
        inputLabel: 'Enter Coupon Code',
        inputPlaceholder: 'SAVE10, FREE50, etc.',
        showCancelButton: true,
        confirmButtonColor: '#800000',
    }).then(result => {
        if (!result.isConfirmed) return;

        const code = result.value.toUpperCase();
        const coupons = {
            SAVE10: { code: 'SAVE10', type: 'percentage', value: 10, label: '10% Off' },
            FREE50: { code: 'FREE50', type: 'fixed', value: 50, label: 'P50 Off' },
        };

        if (coupons[code]) {
            currentCoupon = coupons[code];
            showModalNotification(`Coupon "${code}" (${coupons[code].label}) applied!`, 'success', 'Coupon Applied');
            updateSaleDisplay();
            logStaffActivity('Applied Coupon', code, 'Success');
        } else {
            Swal.fire('Invalid Coupon', 'The coupon code entered is not valid.', 'error');
        }
    });
}

function holdOrder() {
    if (currentSaleItems.length === 0) {
        Swal.fire('Error', 'Cart is empty. Nothing to hold.', 'error');
        return;
    }

    const heldOrders = JSON.parse(localStorage.getItem('heldOrders') || '[]');
    const newHold = {
        id: 'HOLD-' + Date.now(),
        timestamp: Date.now(),
        items: [...currentSaleItems],
        customer: currentCustomer,
        discount: currentDiscount,
        coupon: currentCoupon
    };

    heldOrders.push(newHold);
    localStorage.setItem('heldOrders', JSON.stringify(heldOrders));

    showModalNotification('Order has been put on hold.', 'info', 'Order Held');
    logStaffActivity('Held Order', newHold.id, 'Success');
    clearCurrentSale();
}

function handleReturn() {
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    if (sales.length === 0) {
        Swal.fire('No Transactions', 'No recent transactions found to return.', 'info');
        return;
    }

    const inputOptions = {};
    sales.slice(0, 10).forEach(s => {
        inputOptions[s.id] = `${s.id} - P${parseFloat(s.total).toFixed(2)} (${s.time})`;
    });

    Swal.fire({
        title: 'Select Transaction to Return',
        input: 'select',
        inputOptions,
        inputPlaceholder: 'Select a receipt...',
        showCancelButton: true,
        confirmButtonColor: '#800000',
    }).then(result => {
        if (!result.isConfirmed || !result.value) return;

        const saleId = result.value;
        Swal.fire({
            title: 'Confirm Return',
            text: `Are you sure you want to process a return for ${saleId}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, Return'
        }).then(confirm => {
            if (confirm.isConfirmed) {
                const updated = sales.filter(s => s.id !== saleId);
                localStorage.setItem('sales', JSON.stringify(updated));
                showModalNotification('Transaction successfully returned and voided.', 'success', 'Return Processed');
                logStaffActivity('Processed Return', saleId, 'Success');
            }
        });
    });
}

async function loadMenuItems() {
    const menuGrid = document.getElementById('menuItemsGrid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="loading-spinner"></div><p class="mt-2">Fetching menu from system...</p></div>';

    try {
        const [menuItems, categories] = await Promise.all([
            menuItemsDB.show(),
            menuCategoriesDB.show()
        ]);

        // Create category lookup map
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.id] = cat.name;
        });

        // Transform DB items to include category_name and filter only active items
        allMenuItems = menuItems
            .filter(item => item.status === 'Active' || item.status === 'active')
            .map(item => ({
                id: item.id,
                name: item.name,
                category_id: item.category_id,
                category: categoryMap[item.category_id] || 'Uncategorized',
                price: parseFloat(item.price_reference) || 0,
                image: item.image_path || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
                description: item.description || '',
                available: true
            }));

        displayMenuItems(allMenuItems);
    } catch (err) {
        console.error('Failed to load menu items:', err);
        menuGrid.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-exclamation-circle fa-3x text-danger mb-3"></i><p class="text-muted">Failed to load menu items</p></div>';
    }
}

function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuItemsGrid');
    if (!menuGrid) return;

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-search fa-3x text-muted mb-3"></i><p class="text-muted">No items found matching your filter</p></div>';
        return;
    }

    menuGrid.innerHTML = items.map(item => {
        const imgSrc = item.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';
        return `
            <div class="col-6 col-md-4 col-lg-3 mb-3">
                <div class="menu-item-card" data-id="${item.id}" onclick="addItemToSale(${item.id})">
                    <div class="menu-item-img-container">
                        <img src="${imgSrc}" alt="${item.name}" class="menu-item-img">
                        <div class="price-tag">P${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <div class="p-2 text-center">
                        <div class="fw-bold mb-0 text-truncate" style="font-size:0.85rem">${item.name}</div>
                    </div>
                </div>
            </div>`;
    }).join('');
}

function filterMenuItems() {
    const searchTerm = document.getElementById('menuSearch')?.value.toLowerCase() || '';
    const activeTab = document.querySelector('.btn-category.active');
    const categoryValue = activeTab ? activeTab.getAttribute('data-category') : 'All';

    const filtered = allMenuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = categoryValue === 'All' ||
            item.category_id == categoryValue ||
            item.category === categoryValue;
        return matchesSearch && matchesCategory;
    });
    displayMenuItems(filtered);
}

function addItemToSale(itemId) {
    const product = allMenuItems.find(item => item.id == itemId);
    if (!product) return;

    const existing = currentSaleItems.find(item => item.id == itemId);
    if (existing) {
        existing.quantity += 1;
    } else {
        currentSaleItems.push({ id: product.id, name: product.name, price: product.price, img: product.image, quantity: 1 });
    }

    updateSaleDisplay();

    const card = document.querySelector(`.menu-item-card[data-id="${itemId}"]`);
    if (card) {
        card.classList.add('animate-add');
        setTimeout(() => card.classList.remove('animate-add'), 400);
    }
}

function calcTotals() {
    const subtotal = currentSaleItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    let discountAmount = subtotal * (currentDiscount / 100);
    if (currentCoupon) {
        discountAmount += currentCoupon.type === 'percentage'
            ? subtotal * (currentCoupon.value / 100)
            : currentCoupon.value;
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxes = discountedSubtotal * 0.12;
    const total = discountedSubtotal + taxes;

    return { subtotal, discountAmount, taxes, total };
}

function updateSaleDisplay() {
    const container = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTaxes');
    const totalEl = document.getElementById('cartTotal');
    const cartCountEl = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!container) return;

    const customerDisplay = document.querySelector('.customer-name-display');
    if (customerDisplay) customerDisplay.textContent = currentCustomer || 'Walk-in Customer';

    if (currentSaleItems.length === 0) {
        container.innerHTML = `<div class="text-center py-5 empty-cart-msg"><p class="text-muted">No items in cart</p></div>`;
        subtotalEl.textContent = 'P0.00';
        taxEl.textContent = 'P0.00';
        totalEl.textContent = 'P0.00';
        cartCountEl.textContent = '0';
        checkoutBtn.disabled = true;
        return;
    }

    const { subtotal, discountAmount, taxes, total } = calcTotals();
    const itemsCount = currentSaleItems.reduce((acc, item) => acc + item.quantity, 0);

    container.innerHTML = currentSaleItems.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-details">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">P${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            <div class="qty-controls">
                <button class="btn-qty" onclick="changeQty(${index}, -1)"><i class="fas fa-minus"></i></button>
                <span class="fw-bold mx-1">${item.quantity}</span>
                <button class="btn-qty" onclick="changeQty(${index}, 1)"><i class="fas fa-plus"></i></button>
                <button class="cart-item-remove ms-2" onclick="removeSaleItem(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        </div>`
    ).join('');

    subtotalEl.innerHTML = `P${subtotal.toFixed(2)}` +
        (discountAmount > 0 ? ` <span class="text-danger small">(-P${discountAmount.toFixed(2)})</span>` : '');
    taxEl.textContent = `P${taxes.toFixed(2)}`;
    totalEl.textContent = `P${total.toFixed(2)}`;
    cartCountEl.textContent = itemsCount;
    checkoutBtn.disabled = false;
}

function changeQty(index, delta) {
    currentSaleItems[index].quantity += delta;
    if (currentSaleItems[index].quantity <= 0) currentSaleItems.splice(index, 1);
    updateSaleDisplay();
}

function removeSaleItem(index) {
    currentSaleItems.splice(index, 1);
    updateSaleDisplay();
}

function clearCurrentSale() {
    currentSaleItems = [];
    currentCustomer = null;
    currentDiscount = 0;
    currentCoupon = null;
    updateSaleDisplay();
}

function processCheckout() {
    if (currentSaleItems.length === 0) return;

    Swal.fire({
        title: 'Confirm Checkout',
        text: `Total Amount: ${document.getElementById('cartTotal').textContent}`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#800000',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Confirm'
    }).then(result => {
        if (result.isConfirmed) recordSale();
    });
}

function recordSale() {
    const { subtotal, discountAmount, taxes, total } = calcTotals();

    const newSale = {
        id: 'SALE-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        items: [...currentSaleItems],
        subtotal,
        discount: discountAmount,
        taxes,
        total,
        customer: currentCustomer || 'Walk-in',
        staff: JSON.parse(localStorage.getItem('loggedInUser') || '{}').full_name || 'Staff'
    };

    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    sales.unshift(newSale);
    localStorage.setItem('sales', JSON.stringify(sales));

    logStaffActivity('Recorded Sale', `${newSale.id} - Total: P${total.toFixed(2)} - Customer: ${newSale.customer}`, 'Success');

    Swal.fire('Success!', 'Transaction recorded.', 'success');
    clearCurrentSale();
}

// Sync menu when admin makes changes
window.addEventListener('storage', e => {
    if (e.key === 'adminMenuItems') loadMenuItems();
});

// ─── Ingredients ──────────────────────────────────────────────────────────────

function initializeIngredientsFunctionality() {
    document.getElementById('ingredientSearch')?.addEventListener('input', filterIngredients);
    document.getElementById('ingredientCategoryFilter')?.addEventListener('change', filterIngredients);

    // Save update button listener
    const saveBtn = document.getElementById('confirmQuantityUpdate');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveIngredientUpdate);
    }

    loadIngredients();
}

async function loadIngredients() {
    const tableElem = document.getElementById('ingredientsListTable') || document.getElementById('ingredientsTable');
    if (!tableElem) return;

    const tbody = tableElem.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-spinner fa-spin me-2"></i>Loading ingredients...</td></tr>';

    try {
        // Fetch ingredients, categories, and units from database
        const [ingredients, categories, units] = await Promise.all([
            ingredientsDB.show(),
            ingredientCategoriesDB.show(),
            unitsDB.show()
        ]);

        // Create lookup maps
        const categoryMap = {};
        categories.forEach(cat => { categoryMap[cat.id] = cat.name; });

        const unitMap = {};
        units.forEach(unit => { unitMap[unit.id] = unit.abbreviation || unit.name; });

        // Map ingredients with proper display info
        allIngredients = ingredients.map(ing => {
            const qty = parseFloat(ing.current_quantity) || 0;
            const threshold = parseFloat(ing.low_stock_threshold) || 0;
            const status = qty <= threshold ? 'Low' : 'Normal';

            return {
                id: ing.id,
                name: ing.name,
                category: categoryMap[ing.category_id] || 'Uncategorized',
                category_id: ing.category_id,
                quantity: qty,
                unit: unitMap[ing.unit_id] || '',
                unit_id: ing.unit_id,
                status: status,
                minLevel: threshold
            };
        });

        displayIngredients(allIngredients);
        populateCategoryFilter(categories);

    } catch (error) {
        console.error('Failed to load ingredients:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Failed to load ingredients</td></tr>';
    }
}

/**
 * Populate the category filter dropdown with database categories
 */
function populateCategoryFilter(categories) {
    const filterSelect = document.getElementById('ingredientCategoryFilter');
    if (!filterSelect) return;

    // Keep the "All Categories" option
    filterSelect.innerHTML = '<option value="">All Categories</option>';

    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.name;
        option.textContent = cat.name;
        filterSelect.appendChild(option);
    });
}

function displayIngredients(ingredients) {
    const tableElem = document.getElementById('ingredientsListTable') || document.getElementById('ingredientsTable');
    if (!tableElem) return;

    const tbody = tableElem.querySelector('tbody');
    if (!tbody) return;

    tbody.innerHTML = ingredients.map(ing => `
        <tr class="${ing.status === 'Low' ? 'table-warning' : ''}">
            <td><strong>${ing.name}</strong></td>
            <td><span class="badge bg-secondary">${ing.category}</span></td>
            <td>
                <span class="fw-bold ${ing.status === 'Low' ? 'text-danger' : 'text-success'}">${ing.quantity}</span> 
                <small class="text-muted">${ing.unit}</small>
            </td>
            <td><small class="text-muted">${ing.minLevel ?? '-'} ${ing.unit}</small></td>
            <td>
                <span class="badge ${ing.status === 'Normal' ? 'bg-success' : 'bg-warning text-dark'}">
                    <i class="fas ${ing.status === 'Normal' ? 'fa-check-circle' : 'fa-exclamation-triangle'} me-1"></i>${ing.status}
                </span>
            </td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-success" onclick="showRestockModal(${ing.id})" title="Restock">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn btn-warning text-dark" onclick="showUsageModal(${ing.id})" title="Record Usage">
                        <i class="fas fa-minus"></i>
                    </button>
                    <button class="btn btn-outline-secondary" onclick="showIngredientHistory(${ing.id})" title="View History">
                        <i class="fas fa-history"></i>
                    </button>
                </div>
            </td>
        </tr>`
    ).join('');

    // Update total count if element exists
    const totalCount = document.getElementById('ingredientsTotalCount');
    if (totalCount) {
        totalCount.textContent = `${ingredients.length} ingredients`;
    }
}

// Track currently editing ingredient
let currentEditingIngredient = null;
let currentUpdateType = 'restock'; // 'restock' or 'usage'

/**
 * Show modal for restocking (adding) inventory
 */
function showRestockModal(id) {
    currentUpdateType = 'restock';
    showUpdateModal(id, 'restock');
}

/**
 * Show modal for recording usage (removing) inventory
 */
function showUsageModal(id) {
    currentUpdateType = 'usage';
    showUpdateModal(id, 'usage');
}

/**
 * Show ingredient transaction history
 */
async function showIngredientHistory(id) {
    const ingredient = allIngredients.find(ing => ing.id === id);
    if (!ingredient) return;

    try {
        // Fetch transactions for this ingredient
        const transactions = await inventoryTransactionsDB.show({ ingredient_id: id });

        let historyHtml = '';
        if (transactions && transactions.length > 0) {
            historyHtml = transactions.slice(-10).reverse().map(t => {
                const isPositive = parseFloat(t.change_qty) > 0;
                const date = new Date(t.timestamp).toLocaleDateString();
                const time = new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                        <div>
                            <span class="badge ${isPositive ? 'bg-success' : 'bg-danger'} me-2">
                                ${isPositive ? '+' : ''}${t.change_qty}
                            </span>
                            <small class="text-muted">${t.reason || t.transaction_type}</small>
                        </div>
                        <small class="text-muted">${date} ${time}</small>
                    </div>
                `;
            }).join('');
        } else {
            historyHtml = '<p class="text-muted text-center py-3">No transaction history</p>';
        }

        // Use SweetAlert2 to show history
        Swal.fire({
            title: `<i class="fas fa-history me-2"></i>${ingredient.name}`,
            html: `
                <div class="text-start">
                    <p class="mb-2">
                        <strong>Current Stock:</strong> ${ingredient.quantity} ${ingredient.unit}<br>
                        <strong>Min Level:</strong> ${ingredient.minLevel} ${ingredient.unit}
                    </p>
                    <hr>
                    <h6>Recent Transactions:</h6>
                    <div style="max-height: 250px; overflow-y: auto;">
                        ${historyHtml}
                    </div>
                </div>
            `,
            width: 500,
            showCloseButton: true,
            showConfirmButton: false
        });
    } catch (error) {
        console.error('Failed to load history:', error);
        showModalNotification('Failed to load transaction history', 'error', 'Error');
    }
}

function showUpdateModal(id, type = 'restock') {
    const modalEl = document.getElementById('updateQuantityModal') || document.getElementById('increaseQuantityModal');
    if (!modalEl) return;

    // Find the ingredient from our loaded data
    const ingredient = allIngredients.find(ing => ing.id === id);
    if (!ingredient) {
        console.error('Ingredient not found:', id);
        return;
    }

    currentEditingIngredient = ingredient;
    currentUpdateType = type;

    // Populate modal with ingredient data
    const nameEl = document.getElementById('updateIngName');
    const currentStockEl = document.getElementById('currentStockDisplay');
    const unitEl = document.getElementById('stockUnitDisplay');
    const amountInput = document.getElementById('updateAmount');
    const unitTextEl = document.querySelector('.unit-text');

    if (nameEl) nameEl.textContent = ingredient.name;
    if (currentStockEl) currentStockEl.textContent = ingredient.quantity;
    if (unitEl) unitEl.textContent = ingredient.unit;
    if (unitTextEl) unitTextEl.textContent = ingredient.unit;
    if (amountInput) amountInput.value = '1.00';

    // Set the correct radio button based on type
    const increaseRadio = document.getElementById('increase');
    const decreaseRadio = document.getElementById('decrease');

    if (type === 'restock' && increaseRadio) {
        increaseRadio.checked = true;
    } else if (type === 'usage' && decreaseRadio) {
        decreaseRadio.checked = true;
    }

    // Update modal title based on type
    const modalTitle = modalEl.querySelector('.modal-title');
    if (modalTitle) {
        if (type === 'restock') {
            modalTitle.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Restock Inventory';
        } else {
            modalTitle.innerHTML = '<i class="fas fa-minus-circle me-2"></i>Record Usage';
        }
    }

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

/**
 * Save updated ingredient quantity to database
 */
async function saveIngredientUpdate() {
    if (!currentEditingIngredient) {
        showModalNotification('No ingredient selected', 'warning', 'Error');
        return;
    }

    const quantityInput = document.getElementById('updateAmount');
    const changeQty = parseFloat(quantityInput?.value) || 0;

    if (changeQty <= 0) {
        showModalNotification('Please enter a valid quantity', 'warning', 'Validation Error');
        return;
    }

    const isIncrease = document.getElementById('increase')?.checked;
    const reason = document.getElementById('updateReason')?.value || 'Manual adjustment';
    const prevQty = currentEditingIngredient.quantity;
    const newQty = isIncrease ? prevQty + changeQty : prevQty - changeQty;

    if (newQty < 0) {
        showModalNotification('Cannot reduce below zero', 'warning', 'Validation Error');
        return;
    }

    // Show loading state
    const saveBtn = document.getElementById('confirmQuantityUpdate');
    const originalText = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Saving...';
    }

    try {
        // Update ingredient in database
        await ingredientsDB.edit({
            id: currentEditingIngredient.id,
            current_quantity: newQty,
            updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        // Log the transaction
        const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
        await inventoryTransactionsDB.add({
            ingredient_id: currentEditingIngredient.id,
            change_qty: isIncrease ? changeQty : -changeQty,
            transaction_type: isIncrease ? 'restock' : 'usage',
            reason: reason,
            performed_by: user.id || null,
            prev_qty: prevQty,
            new_qty: newQty,
            timestamp: new Date().toISOString().slice(0, 19).replace('T', ' ')
        });

        // Close modal
        const modalEl = document.getElementById('updateQuantityModal');
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        showModalNotification(
            `${currentEditingIngredient.name} updated: ${prevQty} → ${newQty} ${currentEditingIngredient.unit}`,
            'success',
            'Stock Updated'
        );

        // Log activity
        logStaffActivity('inventory', `Updated ${currentEditingIngredient.name}: ${isIncrease ? '+' : '-'}${changeQty} ${currentEditingIngredient.unit} (${reason})`);

        // Reload ingredients
        loadIngredients();

    } catch (error) {
        console.error('Failed to update ingredient:', error);
        showModalNotification('Failed to update stock: ' + error.message, 'error', 'Update Error');
    } finally {
        // Restore button state
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText || 'Save Update';
        }
    }
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

// ─── Receipts ─────────────────────────────────────────────────────────────────

function initializeReceiptsFunctionality() {
    loadRecentReceipts();
}

function loadRecentReceipts() {
    const container = document.getElementById('recentReceipts');
    if (!container) return;
    container.innerHTML = '<a href="#" class="list-group-item list-group-item-action">No recent receipts</a>';
}

// ─── Account ──────────────────────────────────────────────────────────────────

function initializeAccountFunctionality() {
    loadAccountData();

    document.getElementById('editAccountBtn')?.addEventListener('click', () => toggleAccountEdit());

    document.getElementById('sendAccountRequestBtn')?.addEventListener('click', async function () {
        const fullName = document.getElementById('accFullName')?.value.trim();
        const email = document.getElementById('accEmail')?.value.trim();
        const currentPass = document.getElementById('currentPass')?.value;
        const newPass = document.getElementById('newPass')?.value;
        const confirmPass = document.getElementById('confirmPass')?.value;

        if (fullName || email) await saveAccountInfo();
        if (currentPass || newPass || confirmPass) await handlePasswordUpdate();

        toggleAccountEdit(false);
    });
}

function toggleAccountEdit(forceState) {
    const editBtn = document.getElementById('editAccountBtn');
    const sendBtn = document.getElementById('sendAccountRequestBtn');
    const inputs = document.querySelectorAll('#accountInfoForm input, #changePasswordForm input:not(#accUsername)');

    const isLocked = forceState !== undefined ? !forceState : editBtn.classList.contains('btn-outline-maroon');

    if (isLocked) {
        editBtn.classList.replace('btn-outline-maroon', 'btn-maroon');
        editBtn.innerHTML = '<i class="fas fa-times me-1"></i> Cancel';
        sendBtn.classList.remove('d-none');
        inputs.forEach(input => { if (input.id !== 'accUsername') input.disabled = false; });
    } else {
        editBtn.classList.replace('btn-maroon', 'btn-outline-maroon');
        editBtn.innerHTML = '<i class="fas fa-edit me-1"></i> Edit';
        sendBtn.classList.add('d-none');
        inputs.forEach(input => input.disabled = true);
        loadAccountData();
        document.getElementById('changePasswordForm')?.reset();
    }
}

function loadAccountData() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };

    set('profFullName', user.full_name);
    set('profRole', user.role_name || 'Staff Member');
    set('profEmployeeId', `STF-${String(user.id).padStart(5, '0')}`);
    set('profStatus', user.status || 'Active');
    set('profActivityName', user.full_name);

    if (user.created_at) {
        set('profJoinDate', new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }));
    }

    setVal('accFullName', user.full_name || '');
    setVal('accUsername', user.username || '');
    setVal('accEmail', user.email || '');
}

async function saveAccountInfo() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const fullName = document.getElementById('accFullName')?.value.trim();
    const email = document.getElementById('accEmail')?.value.trim();

    if (!fullName) {
        showModalNotification('Full Name is required', 'warning', 'Validation');
        return;
    }

    try {
        const res = await fetch('php/app.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table: 'requests_tbl',
                type: 'account_update',
                requester_id: user.id,
                payload: JSON.stringify({ full_name: fullName, email }),
                status: 'Pending',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showModalNotification('Update request sent to administrator for approval.', 'success', 'Request Sent');
        logStaffActivity('Requested Account Update', `New Name: ${fullName}`, 'Pending');
    } catch (err) {
        console.error('Failed to send request:', err);
        showModalNotification('Failed to send update request.', 'danger', 'Error');
    }
}

async function handlePasswordUpdate() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const currentPass = document.getElementById('currentPass')?.value;
    const newPass = document.getElementById('newPass')?.value;
    const confirmPass = document.getElementById('confirmPass')?.value;

    if (!currentPass || !newPass || !confirmPass) {
        showModalNotification('Please fill in all password fields', 'warning', 'Validation');
        return;
    }
    if (newPass !== confirmPass) {
        showModalNotification('New passwords do not match', 'warning', 'Validation');
        return;
    }
    if (newPass.length < 6) {
        showModalNotification('Password must be at least 6 characters', 'warning', 'Validation');
        return;
    }

    try {
        const res = await fetch('php/app.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table: 'requests_tbl',
                type: 'password_change',
                requester_id: user.id,
                payload: JSON.stringify({ current_password: currentPass, new_password: newPass }),
                status: 'Pending',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showModalNotification('Password change request sent to administrator.', 'success', 'Request Sent');
        logStaffActivity('Requested Password Change', '', 'Pending');
        document.getElementById('changePasswordForm')?.reset();
    } catch (err) {
        console.error('Failed to send request:', err);
        showModalNotification('Failed to send request.', 'danger', 'Error');
    }
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

function initializeActivityLogFunctionality() {
    loadActivityLog();
    setInterval(loadActivityLog, 10000);
}

async function loadActivityLog() {
    const tableElem = document.getElementById('activityLogTable');
    if (!tableElem) return;

    const tbody = tableElem.querySelector('tbody');
    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    try {
        const res = await fetch(`/php/app.php?table=activity_logs&user_id=${user.id}`);
        const logs = await res.json();

        if (!Array.isArray(logs)) {
            console.error('Invalid logs data:', logs);
            return;
        }

        logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        tbody.innerHTML = logs.length === 0
            ? '<tr><td colspan="4" class="text-center py-4">No activity recorded yet.</td></tr>'
            : logs.map(log => `
                <tr>
                    <td>${log.created_at}</td>
                    <td>${log.action}</td>
                    <td>${log.reference}</td>
                    <td>
                        <span class="badge ${log.status === 'Success' ? 'bg-success' : log.status === 'Pending' ? 'bg-warning' : 'bg-danger'}">
                            ${log.status}
                        </span>
                    </td>
                </tr>`
            ).join('');

    } catch (err) {
        console.error('Failed to load activity logs:', err);
    }
}

// ─── User Sync ────────────────────────────────────────────────────────────────

async function refreshUserData() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    try {
        const res = await fetch(`/php/app.php?table=users&id=${user.id}`);
        const users = await res.json();
        const dbUser = Array.isArray(users) ? users[0] : users;

        if (dbUser?.id && (dbUser.full_name !== user.full_name || dbUser.email !== user.email)) {
            localStorage.setItem('loggedInUser', JSON.stringify({ ...user, ...dbUser }));

            const headerUserName = document.querySelector('.navbar .dropdown-toggle');
            if (headerUserName) {
                headerUserName.innerHTML = `<i class="fas fa-user-circle me-1"></i>${dbUser.full_name}`;
            }

            if (document.getElementById('accountInfoForm')) loadAccountData();
        }
    } catch (e) {
        console.error('User data sync failed:', e);
    }
}

async function updateUserStatus(userId, status) {
    const response = await fetch('php/user_status.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, status })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}