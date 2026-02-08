// Staff Dashboard JavaScript - Updated with Search/Filter and Fixed Images

// Global variables
let currentSaleItems = [];
let currentSaleId = null;
let allMenuItems = [];
let allIngredients = [];

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Menu functionality
    initializeMenuFunctionality();
    
    // Ingredients functionality
    initializeIngredientsFunctionality();
    
    // Receipts functionality
    initializeReceiptsFunctionality();
    
    // Account functionality
    initializeAccountFunctionality();
});

// Menu Sales Functions
function initializeMenuFunctionality() {
    // Start new sale button
    const startNewSaleBtn = document.getElementById('startNewSale');
    if (startNewSaleBtn) {
        startNewSaleBtn.addEventListener('click', function() {
            startNewSale();
        });
    }
    
    // Record sale button
    const recordSaleBtn = document.getElementById('recordSaleBtn');
    if (recordSaleBtn) {
        recordSaleBtn.addEventListener('click', function() {
            recordSale();
        });
    }
    
    // Clear sale button
    const clearSaleBtn = document.getElementById('clearSaleBtn');
    if (clearSaleBtn) {
        clearSaleBtn.addEventListener('click', function() {
            clearCurrentSale();
        });
    }
    
    // Load menu items when menu page is shown
    document.querySelector('[data-page="menu"]').addEventListener('click', function() {
        loadMenuItems();
    });
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
        
        // Use placeholder if image fails to load
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
                    <h5 class="card-title">${item.name}</h5>
                    <p class="card-text text-muted small">${item.category}</p>
                    <p class="card-text small">${item.description}</p>
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
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-id');
            const itemName = this.getAttribute('data-name');
            addItemToSale(itemId, itemName);
        });
    });
}

function filterMenuItems() {
    const searchTerm = document.getElementById('menuSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('menuCategoryFilter').value;
    
    let filteredItems = allMenuItems;
    
    // Apply search filter
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) || 
            item.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    displayMenuItems(filteredItems);
}

function startNewSale() {
    currentSaleItems = [];
    currentSaleId = 'SALE-' + Date.now();
    
    updateSaleDisplay();
    updateSaleStatus('Active');
    
    showModalNotification('New sale started', 'success', 'Sale Started');
}

function addItemToSale(itemId, itemName) {
    // Check if item already in sale
    const existingItem = currentSaleItems.find(item => item.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        currentSaleItems.push({
            id: itemId,
            name: itemName,
            quantity: 1
        });
    }
    
    updateSaleDisplay();
    showModalNotification(`${itemName} added to sale`, 'success', 'Item Added');
}

function updateSaleDisplay() {
    const saleItemsContainer = document.getElementById('saleItems');
    const totalItemsCount = document.getElementById('totalItemsCount');
    const recordSaleBtn = document.getElementById('recordSaleBtn');
    
    if (currentSaleItems.length === 0) {
        saleItemsContainer.innerHTML = '<p class="text-muted text-center py-3">No items added to sale yet. Select items from the menu above.</p>';
        totalItemsCount.textContent = '0';
        recordSaleBtn.disabled = true;
        return;
    }
    
    let totalItems = 0;
    let itemsHtml = '';
    
    currentSaleItems.forEach((item, index) => {
        totalItems += item.quantity;
        
        itemsHtml += `
            <div class="sale-item d-flex justify-content-between align-items-center">
                <div>
                    <strong>${item.name}</strong>
                    <div class="text-muted small">Item ID: ${item.id}</div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="btn-group btn-group-sm me-3">
                        <button class="btn btn-outline-secondary" onclick="adjustSaleItemQuantity(${index}, -1)">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="px-3">${item.quantity}</span>
                        <button class="btn btn-outline-secondary" onclick="adjustSaleItemQuantity(${index}, 1)">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <button class="btn btn-outline-danger btn-sm" onclick="removeSaleItem(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    saleItemsContainer.innerHTML = itemsHtml;
    totalItemsCount.textContent = totalItems;
    recordSaleBtn.disabled = false;
}

function adjustSaleItemQuantity(index, change) {
    const newQuantity = currentSaleItems[index].quantity + change;
    
    if (newQuantity <= 0) {
        removeSaleItem(index);
    } else {
        currentSaleItems[index].quantity = newQuantity;
        updateSaleDisplay();
    }
}

function removeSaleItem(index) {
    const itemName = currentSaleItems[index].name;
    currentSaleItems.splice(index, 1);
    updateSaleDisplay();
    showModalNotification(`${itemName} removed from sale`, 'warning', 'Item Removed');
}

function clearCurrentSale() {
    if (currentSaleItems.length === 0) return;
    
    showConfirm('Are you sure you want to clear the current sale? All items will be removed.', function() {
        currentSaleItems = [];
        updateSaleDisplay();
        updateSaleStatus('No active sale');
        showModalNotification('Sale cleared', 'warning', 'Sale Cleared');
    });
}

function updateSaleStatus(status) {
    const saleStatus = document.getElementById('saleStatus');
    if (saleStatus) {
        saleStatus.textContent = status;
        saleStatus.className = `badge ${status === 'Active' ? 'bg-success' : 'bg-warning'} ms-2`;
    }
}

function recordSale() {
    if (currentSaleItems.length === 0) {
        showModalNotification('Cannot record an empty sale', 'warning', 'Sale Error');
        return;
    }
    
    // Simulate processing
    const recordSaleBtn = document.getElementById('recordSaleBtn');
    const originalText = recordSaleBtn.innerHTML;
    recordSaleBtn.innerHTML = '<span class="loading-spinner"></span> Processing...';
    recordSaleBtn.disabled = true;
    
    setTimeout(() => {
        // Generate receipt
        generateReceipt();
        
        // Clear sale
        currentSaleItems = [];
        updateSaleDisplay();
        updateSaleStatus('Completed');
        
        // Update dashboard stats
        updateDashboardAfterSale();
        
        // Reset button
        recordSaleBtn.innerHTML = originalText;
        recordSaleBtn.disabled = false;
        
        showModalNotification('Sale recorded successfully! Receipt generated.', 'success', 'Sale Complete');
        
        // Switch to receipts page
        updateActivePage('receipts');
    }, 1500);
}

function generateReceipt() {
    const receiptId = 'REC-' + Date.now();
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();
    
    // Save receipt to local storage (simulated)
    const receipt = {
        id: receiptId,
        date: dateStr,
        time: timeStr,
        items: [...currentSaleItems],
        staff: 'John Doe',
        timestamp: now.getTime()
    };
    
    // Get existing receipts or initialize array
    let receipts = JSON.parse(localStorage.getItem('restaurantReceipts')) || [];
    receipts.unshift(receipt);
    localStorage.setItem('restaurantReceipts', JSON.stringify(receipts));
    
    return receiptId;
}

function updateDashboardAfterSale() {
    // Update dashboard stats
    const totalOrders = document.getElementById('totalOrders');
    const currentOrders = parseInt(totalOrders.textContent) || 0;
    totalOrders.textContent = currentOrders + 1;
    
    const totalSales = document.getElementById('totalSales');
    const currentSales = parseInt(totalSales.textContent) || 0;
    totalSales.textContent = currentSales + 1;
}

// Ingredients Functions
function initializeIngredientsFunctionality() {
    // Load ingredients when ingredients page is shown
    document.querySelector('[data-page="ingredients"]').addEventListener('click', function() {
        loadIngredients();
    });
    
    // Confirm increase button
    const confirmIncreaseBtn = document.getElementById('confirmIncrease');
    if (confirmIncreaseBtn) {
        confirmIncreaseBtn.addEventListener('click', function() {
            confirmQuantityChange('increase');
        });
    }
    
    // Confirm decrease button
    const confirmDecreaseBtn = document.getElementById('confirmDecrease');
    if (confirmDecreaseBtn) {
        confirmDecreaseBtn.addEventListener('click', function() {
            confirmQuantityChange('decrease');
        });
    }
}

function loadIngredients() {
    const ingredientsTable = document.getElementById('ingredientsListTable');
    const lowStockCount = document.getElementById('lowStockCount');
    
    if (!ingredientsTable) return;
    
    // Show loading
    const tbody = ingredientsTable.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="loading-spinner"></div><p class="mt-2">Loading ingredients...</p></td></tr>';
    
    // Simulate API call with delay
    setTimeout(() => {
        allIngredients = [
            { id: 1, name: 'Beef', category: 'Meat', quantity: 15, unit: 'kg', threshold: 5, status: 'Normal' },
            { id: 2, name: 'Chicken', category: 'Meat', quantity: 8, unit: 'kg', threshold: 10, status: 'Low' },
            { id: 3, name: 'Rice', category: 'Grains', quantity: 25, unit: 'kg', threshold: 10, status: 'Normal' },
            { id: 4, name: 'Tomatoes', category: 'Vegetables', quantity: 5, unit: 'kg', threshold: 3, status: 'Normal' },
            { id: 5, name: 'Onions', category: 'Vegetables', quantity: 3, unit: 'kg', threshold: 5, status: 'Low' },
            { id: 6, name: 'Garlic', category: 'Spices', quantity: 2, unit: 'kg', threshold: 1, status: 'Normal' },
            { id: 7, name: 'Potatoes', category: 'Vegetables', quantity: 20, unit: 'kg', threshold: 8, status: 'Normal' },
            { id: 8, name: 'Flour', category: 'Grains', quantity: 12, unit: 'kg', threshold: 5, status: 'Normal' },
            { id: 9, name: 'Cheese', category: 'Dairy', quantity: 4, unit: 'kg', threshold: 3, status: 'Low' },
            { id: 10, name: 'Butter', category: 'Dairy', quantity: 6, unit: 'kg', threshold: 2, status: 'Normal' }
        ];
        
        displayIngredients(allIngredients);
    }, 800);
}

function displayIngredients(ingredients) {
    const tbody = document.getElementById('ingredientsListTable').getElementsByTagName('tbody')[0];
    const lowStockCount = document.getElementById('lowStockCount');
    
    if (!tbody) return;
    
    // Count low stock items
    let lowStockItems = 0;
    ingredients.forEach(ing => {
        if (ing.status === 'Low') lowStockItems++;
    });
    
    if (lowStockCount) {
        lowStockCount.textContent = lowStockItems;
    }
    
    tbody.innerHTML = '';
    
    if (ingredients.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><i class="fas fa-box-open fa-2x text-muted mb-2"></i><p class="text-muted">No ingredients found</p></td></tr>';
        return;
    }
    
    ingredients.forEach(ingredient => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${ingredient.name}</td>
            <td><span class="badge bg-secondary">${ingredient.category}</span></td>
            <td>${ingredient.quantity} ${ingredient.unit}</td>
            <td>${ingredient.unit}</td>
            <td>
                <span class="badge ${ingredient.status === 'Normal' ? 'bg-success' : 'bg-warning'}">
                    ${ingredient.status}
                </span>
                ${ingredient.status === 'Low' ? 
                    `<span class="badge bg-danger ms-1">Below ${ingredient.threshold}${ingredient.unit}</span>` : 
                    ''}
            </td>
            <td>
                <button class="btn btn-sm btn-success me-1" onclick="openIncreaseModal(${ingredient.id}, '${ingredient.name}', '${ingredient.unit}')">
                    <i class="fas fa-plus"></i> Increase
                </button>
                <button class="btn btn-sm btn-warning" onclick="openDecreaseModal(${ingredient.id}, '${ingredient.name}', '${ingredient.unit}')">
                    <i class="fas fa-minus"></i> Decrease
                </button>
            </td>
        `;
    });
}

function filterIngredients() {
    const searchTerm = document.getElementById('ingredientSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('ingredientCategoryFilter').value;
    
    let filteredItems = allIngredients;
    
    // Apply search filter
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    displayIngredients(filteredItems);
}

function openIncreaseModal(id, name, unit) {
    document.getElementById('increaseIngredientId').value = id;
    document.getElementById('increaseIngredientName').value = name;
    document.getElementById('increaseUnit').value = unit;
    document.getElementById('increaseAmount').value = '';
    document.getElementById('increaseReason').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('increaseQuantityModal'));
    modal.show();
}

function openDecreaseModal(id, name, unit) {
    document.getElementById('decreaseIngredientId').value = id;
    document.getElementById('decreaseIngredientName').value = name;
    document.getElementById('decreaseUnit').value = unit;
    document.getElementById('decreaseAmount').value = '';
    document.getElementById('decreaseReason').value = '';
    document.getElementById('decreaseNotes').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('decreaseQuantityModal'));
    modal.show();
}

function confirmQuantityChange(type) {
    let modalId, amountId, reasonId, ingredientId, ingredientName, unit;
    
    if (type === 'increase') {
        modalId = 'increaseQuantityModal';
        amountId = 'increaseAmount';
        reasonId = 'increaseReason';
        ingredientId = document.getElementById('increaseIngredientId').value;
        ingredientName = document.getElementById('increaseIngredientName').value;
        unit = document.getElementById('increaseUnit').value;
    } else {
        modalId = 'decreaseQuantityModal';
        amountId = 'decreaseAmount';
        reasonId = 'decreaseReason';
        ingredientId = document.getElementById('decreaseIngredientId').value;
        ingredientName = document.getElementById('decreaseIngredientName').value;
        unit = document.getElementById('decreaseUnit').value;
    }
    
    const amount = document.getElementById(amountId).value;
    const reason = document.getElementById(reasonId).value;
    
    if (!amount || parseFloat(amount) <= 0) {
        showModalNotification('Please enter a valid amount', 'warning', 'Validation Error');
        return;
    }
    
    if (type === 'decrease' && !reason) {
        showModalNotification('Please select a reason for decrease', 'warning', 'Validation Error');
        return;
    }
    
    // Simulate API call
    setTimeout(() => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        modal.hide();
        
        // Show success message
        const action = type === 'increase' ? 'increased' : 'decreased';
        showModalNotification(`${ingredientName} quantity ${action} by ${amount} ${unit}`, 'success', 'Quantity Updated');
        
        // Log activity
        logActivity(`Ingredient quantity ${action}`, `${ingredientName} (${amount} ${unit})`, 'Success');
        
        // Refresh ingredients list
        loadIngredients();
        
        // Update dashboard low stock count if needed
        updateDashboardLowStock();
    }, 1000);
}

function updateDashboardLowStock() {
    const lowStockElement = document.getElementById('lowStock');
    if (lowStockElement) {
        const currentCount = parseInt(lowStockElement.textContent) || 0;
        const newCount = Math.max(0, currentCount - 1);
        lowStockElement.textContent = newCount;
    }
}

// Receipts Functions
function initializeReceiptsFunctionality() {
    // Print receipt button
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    if (printReceiptBtn) {
        printReceiptBtn.addEventListener('click', function() {
            printReceipt();
        });
    }
    
    // New sale from receipt button
    const newSaleFromReceiptBtn = document.getElementById('newSaleFromReceiptBtn');
    if (newSaleFromReceiptBtn) {
        newSaleFromReceiptBtn.addEventListener('click', function() {
            updateActivePage('menu');
            startNewSale();
        });
    }
}

function loadRecentReceipts() {
    const recentReceipts = document.getElementById('recentReceipts');
    if (!recentReceipts) return;
    
    // Get receipts from local storage (simulated)
    let receipts = JSON.parse(localStorage.getItem('restaurantReceipts')) || [];
    
    // If no receipts, show message
    if (receipts.length === 0) {
        recentReceipts.innerHTML = `
            <div class="list-group-item text-center py-4 text-muted">
                <i class="fas fa-receipt fa-2x mb-2"></i>
                <p>No receipts found</p>
                <small>Record a sale to generate receipts</small>
            </div>
        `;
        return;
    }
    
    // Display recent receipts (last 10)
    recentReceipts.innerHTML = '';
    const recent = receipts.slice(0, 10);
    
    recent.forEach((receipt, index) => {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action';
        
        // Calculate total items
        const totalItems = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
        
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${receipt.id}</h6>
                <small>${receipt.date}</small>
            </div>
            <p class="mb-1">${totalItems} item(s)</p>
            <small class="text-muted">${receipt.time} • ${receipt.staff}</small>
        `;
        
        item.addEventListener('click', function(e) {
            e.preventDefault();
            displayReceiptPreview(receipt);
        });
        
        recentReceipts.appendChild(item);
    });
    
    // Display the first receipt if available
    if (receipts.length > 0) {
        displayReceiptPreview(receipts[0]);
    }
}

function displayReceiptPreview(receipt) {
    const receiptPreview = document.getElementById('receiptPreview');
    const printReceiptBtn = document.getElementById('printReceiptBtn');
    
    if (!receiptPreview) return;
    
    // Calculate totals
    const totalItems = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Build receipt HTML
    let itemsHtml = '';
    receipt.items.forEach(item => {
        itemsHtml += `
            <div class="receipt-item">
                <div>${item.name} x${item.quantity}</div>
                <div>---</div>
            </div>
        `;
    });
    
    receiptPreview.innerHTML = `
        <div class="receipt-header">
            <h4 class="mb-1">RESTAURANT POS</h4>
            <p class="mb-1">123 Restaurant Street</p>
            <p class="mb-1">City, State 12345</p>
            <p class="mb-1">Tel: (123) 456-7890</p>
        </div>
        
        <div class="receipt-details mb-3">
            <div class="receipt-item">
                <div>Receipt:</div>
                <div>${receipt.id}</div>
            </div>
            <div class="receipt-item">
                <div>Date:</div>
                <div>${receipt.date}</div>
            </div>
            <div class="receipt-item">
                <div>Time:</div>
                <div>${receipt.time}</div>
            </div>
            <div class="receipt-item">
                <div>Staff:</div>
                <div>${receipt.staff}</div>
            </div>
        </div>
        
        <div class="receipt-items">
            <div class="receipt-item font-weight-bold">
                <div>ITEM</div>
                <div>QTY</div>
            </div>
            <hr class="my-1">
            ${itemsHtml}
        </div>
        
        <div class="receipt-total">
            <div class="receipt-item">
                <div>TOTAL ITEMS:</div>
                <div>${totalItems}</div>
            </div>
        </div>
        
        <div class="text-center mt-4">
            <p class="mb-1">*** Proof of Order Only ***</p>
            <p class="mb-1">No payment information shown</p>
            <p class="mb-1">Thank you for your order!</p>
            <p>Payment handled outside the system</p>
        </div>
    `;
    
    // Enable print button
    if (printReceiptBtn) {
        printReceiptBtn.disabled = false;
        printReceiptBtn.setAttribute('data-receipt-id', receipt.id);
    }
    
    // Log viewing activity
    logActivity('Viewed receipt', receipt.id, 'Success');
}

function printReceipt() {
    const printContent = document.getElementById('receiptPreview').innerHTML;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent;
    window.print();
    
    // Restore original content
    document.body.innerHTML = originalContent;
    
    // Re-initialize event listeners
    initializeReceiptsFunctionality();
    
    // Log printing activity
    const receiptId = document.getElementById('printReceiptBtn').getAttribute('data-receipt-id');
    logActivity('Printed receipt', receiptId, 'Success');
    
    showModalNotification('Receipt sent to printer', 'success', 'Print Complete');
}

// Account Functions
function initializeAccountFunctionality() {
    // Change password form
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            // Validation
            if (!currentPassword || !newPassword || !confirmNewPassword) {
                showModalNotification('Please fill in all password fields', 'warning', 'Validation Error');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showModalNotification('New passwords do not match', 'warning', 'Validation Error');
                return;
            }
            
            if (newPassword.length < 6) {
                showModalNotification('New password must be at least 6 characters', 'warning', 'Validation Error');
                return;
            }
            
            // Simulate password change
            setTimeout(() => {
                // Clear form
                changePasswordForm.reset();
                
                // Show success message
                showModalNotification('Password changed successfully', 'success', 'Password Updated');
                
                // Log activity
                logActivity('Changed password', 'Account security update', 'Success');
            }, 1000);
        });
    }
}

// Activity Log Functions
function loadActivityLog() {
    const activityTable = document.getElementById('activityLogTable');
    if (!activityTable) return;
    
    const tbody = activityTable.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="loading-spinner"></div><p class="mt-2">Loading activity log...</p></td></tr>';
    
    // Simulate API call with delay
    setTimeout(() => {
        const activities = [
            { date: '2023-10-01', time: '09:15:23', action: 'Logged in', reference: 'System', status: 'Success' },
            { date: '2023-10-01', time: '09:20:45', action: 'Recorded sale', reference: 'SALE-12345', status: 'Success' },
            { date: '2023-10-01', time: '10:05:12', action: 'Printed receipt', reference: 'REC-12345', status: 'Success' },
            { date: '2023-10-01', time: '11:30:18', action: 'Increased ingredient quantity', reference: 'Beef (+5kg)', status: 'Success' },
            { date: '2023-10-01', time: '12:15:33', action: 'Recorded sale', reference: 'SALE-12346', status: 'Success' },
            { date: '2023-10-01', time: '14:22:07', action: 'Decreased ingredient quantity', reference: 'Tomatoes (-2kg, Spoilage)', status: 'Success' },
            { date: '2023-10-01', time: '16:45:51', action: 'Printed receipt', reference: 'REC-12346', status: 'Success' },
            { date: '2023-10-01', time: '17:30:00', action: 'Logged out', reference: 'System', status: 'Success' }
        ];
        
        tbody.innerHTML = '';
        
        activities.forEach(activity => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${activity.date} ${activity.time}</td>
                <td>${activity.action}</td>
                <td><span class="badge bg-secondary">${activity.reference}</span></td>
                <td><span class="badge bg-success">${activity.status}</span></td>
            `;
        });
    }, 800);
}

// Utility Functions
function logActivity(action, reference, status) {
    console.log(`Activity Log: ${action} - ${reference} - ${status}`);
    
    if (document.getElementById('activity-log-content') && 
        !document.getElementById('activity-log-content').classList.contains('d-none')) {
        loadActivityLog();
    }
}

function showModalNotification(message, type = 'info', title = 'Notification') {
    const modalHeader = document.getElementById('notificationModalHeader');
    const modalTitle = document.getElementById('notificationModalTitle');
    const modalBody = document.getElementById('notificationModalBody');
    
    let headerClass = 'bg-primary text-white';
    switch(type) {
        case 'success':
            headerClass = 'bg-success text-white';
            break;
        case 'warning':
            headerClass = 'bg-warning text-dark';
            break;
        case 'danger':
            headerClass = 'bg-danger text-white';
            break;
        case 'info':
            headerClass = 'bg-info text-white';
            break;
    }
    
    modalHeader.className = `modal-header ${headerClass}`;
    modalTitle.textContent = title;
    modalBody.textContent = message;
    
    document.getElementById('notificationModalConfirm').style.display = 'none';
    
    const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
    modal.show();
}

// Export functions for use in inline event handlers
window.adjustSaleItemQuantity = adjustSaleItemQuantity;
window.removeSaleItem = removeSaleItem;
window.openIncreaseModal = openIncreaseModal;
window.openDecreaseModal = openDecreaseModal;