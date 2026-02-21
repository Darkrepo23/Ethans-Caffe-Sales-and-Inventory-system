// Staff Dashboard JavaScript - Updated for Multi-page support

// Global variables
let currentSaleItems = [];
let currentSaleId = null;
let allMenuItems = [];
let allIngredients = [];
let currentCustomer = null;
let currentDiscount = 0; // percentage
let currentCoupon = null;

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

    // Start background sync
    setInterval(refreshUserData, 15000); // 15 seconds
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
    // Update logged in user name in header
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const headerUserName = document.querySelector('.navbar .dropdown-toggle');
    if (headerUserName && user.full_name) {
        headerUserName.innerHTML = `<i class="fas fa-user-circle me-1"></i>${user.full_name}`;
    }

    // Logout button (global)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            showConfirm('Are you sure you want to logout?', function () {
                localStorage.removeItem('loggedInRole');
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            });
        });
    }
}

// Menu Sales Functions
function initializeMenuFunctionality() {
    // Category Tabs functionality
    const categoryTabs = document.querySelectorAll('.btn-category');
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            categoryTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            filterMenuItems();
        });
    });

    // Search functionality
    const menuSearch = document.getElementById('menuSearch');
    if (menuSearch) {
        menuSearch.addEventListener('input', filterMenuItems);
    }

    // Cart action buttons
    const clearSaleBtn = document.getElementById('clearSaleBtn');
    if (clearSaleBtn) {
        clearSaleBtn.addEventListener('click', function () {
            showConfirm('Are you sure you want to clear the cart?', clearCurrentSale);
        });
    }

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function () {
            processCheckout();
        });
    }

    // New POS Feature Buttons
    const selectCustomerBtn = document.getElementById('selectCustomerBtn');
    if (selectCustomerBtn) {
        selectCustomerBtn.addEventListener('click', selectCustomer);
    }

    const discountBtn = document.getElementById('discountBtn');
    if (discountBtn) {
        discountBtn.addEventListener('click', applyDiscount);
    }

    const couponBtn = document.getElementById('couponBtn');
    if (couponBtn) {
        couponBtn.addEventListener('click', applyCoupon);
    }

    const holdOrderBtn = document.getElementById('holdOrderBtn');
    if (holdOrderBtn) {
        holdOrderBtn.addEventListener('click', holdOrder);
    }

    const returnOrderBtn = document.getElementById('returnOrderBtn');
    if (returnOrderBtn) {
        returnOrderBtn.addEventListener('click', handleReturn);
    }

    // Load initial data
    loadMenuItems();
    updateSaleDisplay();
}

// POS Feature Implementations
function selectCustomer() {
    Swal.fire({
        title: 'Select Customer',
        input: 'text',
        inputLabel: 'Enter Customer Name',
        inputPlaceholder: 'Search or add new customer...',
        showCancelButton: true,
        confirmButtonColor: '#800000',
    }).then((result) => {
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
    }).then((result) => {
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
    }).then((result) => {
        if (result.isConfirmed) {
            const code = result.value.toUpperCase();
            if (code === 'SAVE10') {
                currentCoupon = { code: 'SAVE10', type: 'percentage', value: 10 };
                showModalNotification('Coupon "SAVE10" (10% Off) applied!', 'success', 'Coupon Applied');
            } else if (code === 'FREE50') {
                currentCoupon = { code: 'FREE50', type: 'fixed', value: 50 };
                showModalNotification('Coupon "FREE50" (P50 Off) applied!', 'success', 'Coupon Applied');
            } else {
                Swal.fire('Invalid Coupon', 'The coupon code entered is not valid.', 'error');
                return;
            }
            updateSaleDisplay();
            logStaffActivity('Applied Coupon', code, 'Success');
        }
    });
}

function holdOrder() {
    if (currentSaleItems.length === 0) {
        Swal.fire('Error', 'Cart is empty. Nothing to hold.', 'error');
        return;
    }

    const heldOrders = JSON.parse(localStorage.getItem('heldOrders')) || [];
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
    // Show recent sales to select for return
    const sales = JSON.parse(localStorage.getItem('sales')) || [];
    if (sales.length === 0) {
        Swal.fire('No Transactions', 'No recent transactions found to return.', 'info');
        return;
    }

    const inputOptions = {};
    sales.slice(0, 10).forEach(s => {
        inputOptions[s.id] = `${s.id} - P${s.total.toFixed(2)} (${s.time})`;
    });

    Swal.fire({
        title: 'Select Transaction to Return',
        input: 'select',
        inputOptions: inputOptions,
        inputPlaceholder: 'Select a receipt...',
        showCancelButton: true,
        confirmButtonColor: '#800000',
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            const saleId = result.value;
            Swal.fire({
                title: 'Confirm Return',
                text: `Are you sure you want to process a return for ${saleId}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'Yes, Return'
            }).then((confirm) => {
                if (confirm.isConfirmed) {
                    // Logic to mark as returned or remove
                    let updatedSales = sales.filter(s => s.id !== saleId);
                    localStorage.setItem('sales', JSON.stringify(updatedSales));
                    showModalNotification('Transaction successfully returned and voided.', 'success', 'Return Processed');
                    logStaffActivity('Processed Return', saleId, 'Success');
                }
            });
        }
    });
}

function loadMenuItems() {
    const menuGrid = document.getElementById('menuItemsGrid');
    if (!menuGrid) return;

    // Show loading
    menuGrid.innerHTML = '<div class="col-12 text-center py-5"><div class="loading-spinner"></div><p class="mt-2">Fetching menu from system...</p></div>';

    // Simulate real-time fetch from Admin/DB
    setTimeout(() => {
        // Try to load from "adminMenuItems" (synced from admin) if available
        const savedMenu = JSON.parse(localStorage.getItem('adminMenuItems'));

        if (savedMenu && savedMenu.length > 0) {
            allMenuItems = savedMenu;
        } else {
            // Default demo items if none in storage
            allMenuItems = [
                { id: 1, name: 'Beef Steak', category: 'Main Course', price: 450, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop', available: true },
                { id: 2, name: 'Chicken Curry', category: 'Main Course', price: 320, image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop', available: true },
                { id: 3, name: 'Vegetable Salad', category: 'Appetizer', price: 180, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=300&fit=crop', available: true },
                { id: 4, name: 'Garlic Bread', category: 'Appetizer', price: 120, image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop', available: true },
                { id: 5, name: 'French Fries', category: 'Side Dish', price: 95, image: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&h=300&fit=crop', available: true },
                { id: 6, name: 'Pasta Carbonara', category: 'Main Course', price: 280, image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop', available: true },
                { id: 7, name: 'Chocolate Cake', category: 'Dessert', price: 150, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop', available: true },
                { id: 8, name: 'Fruit Shake', category: 'Beverage', price: 85, image: 'https://images.unsplash.com/photo-1544145945-f904253d0c71?w=400&h=300&fit=crop', available: true }
            ];
            localStorage.setItem('adminMenuItems', JSON.stringify(allMenuItems));
        }

        displayMenuItems(allMenuItems);
    }, 600);
}

function displayMenuItems(items) {
    const menuGrid = document.getElementById('menuItemsGrid');
    if (!menuGrid) return;

    menuGrid.innerHTML = '';

    if (items.length === 0) {
        menuGrid.innerHTML = '<div class="col-12 text-center py-5"><i class="fas fa-search fa-3x text-muted mb-3"></i><p class="text-muted">No items found matching your filter</p></div>';
        return;
    }

    items.forEach(item => {
        const col = document.createElement('div');
        col.className = 'col-6 col-md-4 col-lg-3 mb-3';

        const imgSrc = item.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop';

        col.innerHTML = `
            <div class="menu-item-card" data-id="${item.id}" onclick="addItemToSale(${item.id})">
                <div class="menu-item-img-container">
                    <img src="${imgSrc}" alt="${item.name}" class="menu-item-img">
                    <div class="price-tag">P${parseFloat(item.price).toFixed(2)}</div>
                </div>
                <div class="p-2 text-center">
                    <div class="fw-bold mb-0 text-truncate" style="font-size: 0.85rem">${item.name}</div>
                </div>
            </div>
        `;

        menuGrid.appendChild(col);
    });
}

function filterMenuItems() {
    const searchTerm = document.getElementById('menuSearch')?.value.toLowerCase() || '';
    const activeTab = document.querySelector('.btn-category.active');
    const category = activeTab ? activeTab.getAttribute('data-category') : 'All';

    const filtered = allMenuItems.filter(item =>
        item.name.toLowerCase().includes(searchTerm) &&
        (category === 'All' || item.category === category)
    );
    displayMenuItems(filtered);
}

function addItemToSale(itemId) {
    const product = allMenuItems.find(item => item.id == itemId);
    if (!product) return;

    const existingItem = currentSaleItems.find(item => item.id == itemId);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentSaleItems.push({
            id: product.id,
            name: product.name,
            price: product.price,
            img: product.image,
            quantity: 1
        });
    }
    updateSaleDisplay();

    // Tiny toast or visual feedback
    const card = document.querySelector(`.menu-item-card[data-id="${itemId}"]`);
    if (card) {
        card.classList.add('animate-add');
        setTimeout(() => card.classList.remove('animate-add'), 400);
    }
}

function updateSaleDisplay() {
    const container = document.getElementById('cartItemsList');
    const subtotalEl = document.getElementById('cartSubtotal');
    const taxEl = document.getElementById('cartTaxes');
    const totalEl = document.getElementById('cartTotal');
    const cartCountEl = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!container) return;

    // Update Customer Display in Sidebar if exists
    const customerDisplay = document.querySelector('.customer-name-display');
    if (customerDisplay) {
        customerDisplay.textContent = currentCustomer || 'Walk-in Customer';
    }

    if (currentSaleItems.length === 0) {
        container.innerHTML = `<div class="text-center py-5 empty-cart-msg"><p class="text-muted">No items in cart</p></div>`;
        subtotalEl.textContent = 'P0.00';
        taxEl.textContent = 'P0.00';
        totalEl.textContent = 'P0.00';
        cartCountEl.textContent = '0';
        checkoutBtn.disabled = true;
        return;
    }

    let subtotal = 0;
    let itemsCount = 0;
    let itemsHtml = '';

    currentSaleItems.forEach((item, index) => {
        subtotal += item.price * item.quantity;
        itemsCount += item.quantity;
        itemsHtml += `
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
            </div>
        `;
    });

    // Apply Discount
    let discountAmount = (subtotal * (currentDiscount / 100));

    // Apply Coupon
    if (currentCoupon) {
        if (currentCoupon.type === 'percentage') {
            discountAmount += (subtotal * (currentCoupon.value / 100));
        } else {
            discountAmount += currentCoupon.value;
        }
    }

    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxes = discountedSubtotal * 0.12;
    const total = discountedSubtotal + taxes;

    container.innerHTML = itemsHtml;
    subtotalEl.textContent = 'P' + subtotal.toFixed(2);

    // Display Discounts if any
    if (discountAmount > 0) {
        subtotalEl.innerHTML += ` <span class="text-danger small">( -P${discountAmount.toFixed(2)} )</span>`;
    }

    taxEl.textContent = 'P' + taxes.toFixed(2);
    totalEl.textContent = 'P' + total.toFixed(2);
    cartCountEl.textContent = itemsCount;
    checkoutBtn.disabled = false;
}

function changeQty(index, delta) {
    currentSaleItems[index].quantity += delta;
    if (currentSaleItems[index].quantity <= 0) {
        currentSaleItems.splice(index, 1);
    }
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
    }).then((result) => {
        if (result.isConfirmed) {
            recordSale();
        }
    });
}

function recordSale() {
    const subtotal = currentSaleItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    let discountAmt = (subtotal * (currentDiscount / 100));
    if (currentCoupon) {
        discountAmt += (currentCoupon.type === 'percentage' ? (subtotal * (currentCoupon.value / 100)) : currentCoupon.value);
    }
    const finalSubtotal = Math.max(0, subtotal - discountAmt);
    const taxes = finalSubtotal * 0.12;
    const total = finalSubtotal + taxes;

    const newSale = {
        id: 'SALE-' + Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        timestamp: Date.now(),
        items: [...currentSaleItems],
        subtotal: subtotal,
        discount: discountAmt,
        taxes: taxes,
        total: total,
        customer: currentCustomer || 'Walk-in',
        staff: 'Staff Account'
    };

    // Save to sales history
    let sales = JSON.parse(localStorage.getItem('sales')) || [];
    sales.unshift(newSale); // Newest first
    localStorage.setItem('sales', JSON.stringify(sales));

    // Dedut ingredients (Simulated sync with inventory)
    updateIngredientsStock(currentSaleItems);
    logStaffActivity('Recorded Sale', `${newSale.id} - Total: P${newSale.total.toFixed(2)} - Customer: ${newSale.customer}`, 'Success');

    Swal.fire('Success!', 'Transaction recorded.', 'success');

    clearCurrentSale();
}

// Real-time listener for Admin changes
window.addEventListener('storage', (e) => {
    if (e.key === 'adminMenuItems') {
        console.log("Admin updated menu, refreshing POS...");
        loadMenuItems();
    }
});

function updateIngredientsStock(saleItems) {
    let ingredients = JSON.parse(localStorage.getItem('ingredients')) || [];
    let recipes = JSON.parse(localStorage.getItem('adminRecipes')) || [];

    saleItems.forEach(saleItem => {
        // Find recipe for this menu item
        const recipe = recipes.find(r => r.menuItem === saleItem.name);
        if (recipe) {
            recipe.ingredients.forEach(recIng => {
                const ing = ingredients.find(i => i.name === recIng.name);
                if (ing) {
                    ing.quantity -= (recIng.qty * saleItem.quantity);
                    if (ing.quantity < 0) ing.quantity = 0;
                }
            });
        }
    });

    localStorage.setItem('ingredients', JSON.stringify(ingredients));
}

// Global Activity Logging - Connects to Admin's systemActivityLogs
function logStaffActivity(action, details, status) {
    let logs = [];
    try {
        const stored = localStorage.getItem('systemActivityLogs');
        if (stored) logs = JSON.parse(stored);
    } catch (e) { logs = []; }

    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const newLog = {
        id: Date.now(),
        userName: 'Staff User', // Could be dynamic based on login
        action: action,
        reference: details,
        timestamp: ts,
        category: action.includes('Sale') || action.includes('Return') ? 'Sales' : 'Staff',
        ip: '192.168.1.10'
    };

    logs.unshift(newLog);
    if (logs.length > 500) logs = logs.slice(0, 500);
    localStorage.setItem('systemActivityLogs', JSON.stringify(logs));
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
    loadAccountData();

    const editBtn = document.getElementById('editAccountBtn');
    const sendBtn = document.getElementById('sendAccountRequestBtn');

    if (editBtn) {
        editBtn.addEventListener('click', function () {
            toggleAccountEdit();
        });
    }

    if (sendBtn) {
        sendBtn.addEventListener('click', async function () {
            const fullName = document.getElementById('accFullName').value.trim();
            const email = document.getElementById('accEmail').value.trim();
            const currentPass = document.getElementById('currentPass').value;
            const newPass = document.getElementById('newPass').value;
            const confirmPass = document.getElementById('confirmPass').value;

            // Determine what's being requested
            if (fullName || email) {
                await saveAccountInfo();
            }

            if (currentPass || newPass || confirmPass) {
                await handlePasswordUpdate();
            }

            // After sending, lock back
            toggleAccountEdit(false);
        });
    }
}

function toggleAccountEdit(forceState) {
    const editBtn = document.getElementById('editAccountBtn');
    const sendBtn = document.getElementById('sendAccountRequestBtn');
    const inputs = document.querySelectorAll('#accountInfoForm input, #changePasswordForm input:not(#accUsername)');

    const isLocked = forceState !== undefined ? !forceState : editBtn.classList.contains('btn-outline-maroon');

    if (isLocked) {
        // Unlock
        editBtn.classList.remove('btn-outline-maroon');
        editBtn.classList.add('btn-maroon');
        editBtn.innerHTML = '<i class="fas fa-times me-1"></i> Cancel';
        sendBtn.classList.remove('d-none');
        inputs.forEach(input => {
            if (input.id !== 'accUsername') input.disabled = false;
        });
    } else {
        // Lock
        editBtn.classList.add('btn-outline-maroon');
        editBtn.classList.remove('btn-maroon');
        editBtn.innerHTML = '<i class="fas fa-edit me-1"></i> Edit';
        sendBtn.classList.add('d-none');
        inputs.forEach(input => input.disabled = true);
        loadAccountData(); // Reset values
        document.getElementById('changePasswordForm').reset();
    }
}

function loadAccountData() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    // Sidebar/Header Info
    const profFullName = document.getElementById('profFullName');
    if (profFullName) profFullName.textContent = user.full_name;

    const profRole = document.getElementById('profRole');
    if (profRole) profRole.textContent = user.role_name || 'Staff Member';

    const profEmployeeId = document.getElementById('profEmployeeId');
    if (profEmployeeId) profEmployeeId.textContent = `STF-${user.id.toString().padStart(5, '0')}`;

    const profJoinDate = document.getElementById('profJoinDate');
    if (profJoinDate && user.created_at) {
        const date = new Date(user.created_at);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        profJoinDate.textContent = date.toLocaleDateString(undefined, options);
    }

    const profStatus = document.getElementById('profStatus');
    if (profStatus) {
        profStatus.innerHTML = `<i class="fas fa-check-circle me-2"></i>${user.status || 'Active'}`;
    }

    const profActivityName = document.getElementById('profActivityName');
    if (profActivityName) profActivityName.textContent = user.full_name;

    // Form inputs
    const fullNameInput = document.getElementById('accFullName');
    if (fullNameInput) fullNameInput.value = user.full_name || '';

    const usernameInput = document.getElementById('accUsername');
    if (usernameInput) usernameInput.value = user.username || '';

    const emailInput = document.getElementById('accEmail');
    if (emailInput) emailInput.value = user.email || '';
}

async function saveAccountInfo() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const newFullName = document.getElementById('accFullName').value.trim();
    const newEmail = document.getElementById('accEmail').value.trim();

    if (!newFullName) {
        showModalNotification('Full Name is required', 'warning', 'Validation');
        return;
    }

    const payload = JSON.stringify({
        full_name: newFullName,
        email: newEmail
    });

    try {
        const res = await fetch("http://localhost/Ethans%20Cafe/codes/php/app.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                table: 'requests_tbl',
                type: 'account_update',
                requester_id: user.id,
                payload: payload,
                status: 'Pending',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showModalNotification('Update request sent to administrator for approval.', 'success', 'Request Sent');
        logStaffActivity('Requested Account Update', `New Name: ${newFullName}`, 'Pending');
    } catch (err) {
        console.error('Failed to send request:', err);
        showModalNotification('Failed to send update request.', 'danger', 'Error');
    }
}

async function handlePasswordUpdate() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    const currentPass = document.getElementById('currentPass').value;
    const newPass = document.getElementById('newPass').value;
    const confirmPass = document.getElementById('confirmPass').value;

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

    const payload = JSON.stringify({
        current_password: currentPass,
        new_password: newPass
    });

    try {
        const res = await fetch("http://localhost/Ethans%20Cafe/codes/php/app.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                table: 'requests_tbl',
                type: 'password_change',
                requester_id: user.id,
                payload: payload,
                status: 'Pending',
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        showModalNotification('Password change request sent to administrator.', 'success', 'Request Sent');
        logStaffActivity('Requested Password Change', '', 'Pending');
        document.getElementById('changePasswordForm').reset();
    } catch (err) {
        console.error('Failed to send request:', err);
        showModalNotification('Failed to send request.', 'danger', 'Error');
    }
}

// Activity Log Functions
function initializeActivityLogFunctionality() {
    loadActivityLog();
    // Real-time updates for Activity Log
    setInterval(loadActivityLog, 10000); // Poll every 10 seconds
}

async function logStaffActivity(action, reference, status = 'Success') {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    try {
        await fetch("http://localhost/Ethans%20Cafe/codes/php/app.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                table: 'activity_logs',
                user_id: user.id,
                role_label: user.role_name || 'Staff',
                action: action,
                reference: reference || 'N/A',
                status: status,
                ip_address: '127.0.0.1', // Placeholder or fetch if needed
                created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
            })
        });
        // If we are currently viewing the activity log, refresh it
        if (document.getElementById('activityLogTable')) {
            loadActivityLog();
        }
    } catch (e) {
        console.error("Failed to log activity:", e);
    }
}

async function loadActivityLog() {
    const tableElem = document.getElementById('activityLogTable');
    if (!tableElem) return;

    const tbody = tableElem.getElementsByTagName('tbody')[0];
    if (!tbody) return;

    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    try {
        const res = await fetch(`http://localhost/Ethans%20Cafe/codes/php/app.php?table=activity_logs&user_id=${user.id}`);
        let logs = await res.json();

        if (!Array.isArray(logs)) {
            console.error("Invalid logs data:", logs);
            return;
        }

        // Sort by date descending
        logs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (logs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4">No activity recorded yet.</td></tr>';
            return;
        }

        tbody.innerHTML = logs.map(log => `
            <tr>
                <td>${log.created_at}</td>
                <td>${log.action}</td>
                <td>${log.reference}</td>
                <td>
                    <span class="badge ${log.status === 'Success' ? 'bg-success' : (log.status === 'Pending' ? 'bg-warning' : 'bg-danger')}">
                        ${log.status}
                    </span>
                </td>
            </tr>
        `).join('');

    } catch (err) {
        console.error('Failed to load activity logs:', err);
    }
}

async function refreshUserData() {
    const user = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
    if (!user.id) return;

    try {
        const res = await fetch(`http://localhost/Ethans%20Cafe/codes/php/app.php?table=users&id=${user.id}`);
        const users = await res.json();
        const dbUser = Array.isArray(users) ? users[0] : users;

        if (dbUser && dbUser.id) {
            // Check if anything significant changed (full_name, email)
            if (dbUser.full_name !== user.full_name || dbUser.email !== user.email) {
                // Merge and update
                const updated = { ...user, ...dbUser };
                localStorage.setItem('loggedInUser', JSON.stringify(updated));

                // Refresh UI components
                const headerUserName = document.querySelector('.navbar .dropdown-toggle');
                if (headerUserName) {
                    headerUserName.innerHTML = `<i class="fas fa-user-circle me-1"></i>${dbUser.full_name}`;
                }

                if (document.getElementById('accountInfoForm')) {
                    loadAccountData();
                }
            }
        }
    } catch (e) {
        console.error("User data sync failed", e);
    }
}

// showModalNotification and showConfirm are defined in main.js — not duplicated here
