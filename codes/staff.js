// Staff Dashboard JavaScript

// Global variables
let currentSaleItems = [];
let currentSaleId = null;

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
        const menuItems = [
            { id: 1, name: 'Beef Steak', category: 'Main Course', image: 'assets/products/beef-steak.jpg', available: true },
            { id: 2, name: 'Chicken Curry', category: 'Main Course', image: 'assets/products/chicken-curry.jpg', available: true },
            { id: 3, name: 'Vegetable Salad', category: 'Appetizer', image: 'assets/products/salad.jpg', available: true },
            { id: 4, name: 'Garlic Bread', category: 'Appetizer', image: 'assets/products/garlic-bread.jpg', available: true },
            { id: 5, name: 'French Fries', category: 'Side Dish', image: 'assets/products/fries.jpg', available: true },
            { id: 6, name: 'Grilled Salmon', category: 'Main Course', image: 'assets/products/salmon.jpg', available: false },
            { id: 7, name: 'Pasta Carbonara', category: 'Main Course', image: 'assets/products/pasta.jpg', available: true },
            { id: 8, name: 'Chocolate Cake', category: 'Dessert', image: 'assets/products/cake.jpg', available: true }
        ];
        
        menuGrid.innerHTML = '';
        
        menuItems.forEach(item => {
            const col = document.createElement('div');
            col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
            
            col.innerHTML = `
                <div class="menu-item-card ${!item.available ? 'opacity-50' : ''}">
                    <div class="position-relative">
                        <img src="${item.image}" alt="${item.name}" class="menu-item-img" onerror="this.src='assets/products/default.jpg'">
                        <span class="menu-item-badge badge ${item.available ? 'bg-green' : 'bg-secondary'}">
                            ${item.available ? 'Available' : 'Out of Stock'}
                        </span>
                    </div>
                    <div class="p-3">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text text-muted small">${item.category}</p>
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
    }, 800);
}

function startNewSale() {
    currentSaleItems = [];
    currentSaleId = 'SALE-' + Date.now();
    
    updateSaleDisplay();
    updateSaleStatus('Active');
    
    showNotification('New sale started', 'success');
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
    showNotification(`${itemName} added to sale`, 'success');
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
    showNotification(`${itemName} removed from sale`, 'warning');
}

function clearCurrentSale() {
    if (currentSaleItems.length === 0) return;
    
    if (confirm('Are you sure you want to clear the current sale? All items will be removed.')) {
        currentSaleItems = [];
        updateSaleDisplay();
        updateSaleStatus('No active sale');
        showNotification('Sale cleared', 'warning');
    }
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
        showNotification('Cannot record an empty sale', 'warning');
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
        
        showNotification('Sale recorded successfully! Receipt generated.', 'success');
        
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
    
    // Update quick stats
    const quickOrders = document.getElementById('quickOrders');
    if (quickOrders) {
        quickOrders.textContent = currentOrders + 1;
    }
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
    const categoryFilter = document.getElementById('categoryFilter');
    const lowStockCount = document.getElementById('lowStockCount');
    
    if (!ingredientsTable) return;
    
    // Show loading
    const tbody = ingredientsTable.getElementsByTagName('tbody')[0];
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4"><div class="loading-spinner"></div><p class="mt-2">Loading ingredients...</p></td></tr>';
    
    // Simulate API call with delay
    setTimeout(() => {
        const ingredients = [
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
        
        // Update low stock count
        let lowStockItems = 0;
        ingredients.forEach(ing => {
            if (ing.status === 'Low') lowStockItems++;
        });
        
        if (lowStockCount) {
            lowStockCount.textContent = lowStockItems;
        }
        
        // Populate category filter
        if (categoryFilter) {
            const categories = [...new Set(ingredients.map(ing => ing.category))];
            categoryFilter.innerHTML = '';
            
            // Add "All" button
            const allButton = document.createElement('button');
            allButton.type = 'button';
            allButton.className = 'btn btn-outline-maroon active';
            allButton.textContent = 'All';
            allButton.addEventListener('click', function() {
                // Remove active class from all buttons
                categoryFilter.querySelectorAll('button').forEach(btn => {
                    btn.classList.remove('active');
                });
                this.classList.add('active');
                filterIngredientsByCategory('All');
            });
            categoryFilter.appendChild(allButton);
            
            // Add category buttons
            categories.forEach(category => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'btn btn-outline-secondary';
                button.textContent = category;
                button.addEventListener('click', function() {
                    // Remove active class from all buttons
                    categoryFilter.querySelectorAll('button').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    this.classList.add('active');
                    filterIngredientsByCategory(category);
                });
                categoryFilter.appendChild(button);
            });
        }
        
        // Populate table
        tbody.innerHTML = '';
        
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
                    <button class="btn btn-sm btn-success me-1" onclick="openIncreaseModal(${ingredient.id}, '${ingredient.name}')">
                        <i class="fas fa-plus"></i> Increase
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="openDecreaseModal(${ingredient.id}, '${ingredient.name}')">
                        <i class="fas fa-minus"></i> Decrease
                    </button>
                </td>
            `;
        });
    }, 800);
}

function filterIngredientsByCategory(category) {
    const rows = document.querySelectorAll('#ingredientsListTable tbody tr');
    
    rows.forEach(row => {
        const rowCategory = row.cells[1].textContent.trim();
        
        if (category === 'All' || rowCategory === category) {
            row.style.display = '';
            row.classList.add('animate__animated', 'animate__fadeIn');
        } else {
            row.style.display = 'none';
        }
    });
}

function openIncreaseModal(id, name) {
    document.getElementById('increaseIngredientId').value = id;
    document.getElementById('increaseIngredientName').value = name;
    document.getElementById('increaseAmount').value = '';
    document.getElementById('increaseReason').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('increaseQuantityModal'));
    modal.show();
}

function openDecreaseModal(id, name) {
    document.getElementById('decreaseIngredientId').value = id;
    document.getElementById('decreaseIngredientName').value = name;
    document.getElementById('decreaseAmount').value = '';
    document.getElementById('decreaseReason').value = '';
    document.getElementById('decreaseNotes').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('decreaseQuantityModal'));
    modal.show();
}

function confirmQuantityChange(type) {
    let modalId, amountId, reasonId, ingredientId, ingredientName;
    
    if (type === 'increase') {
        modalId = 'increaseQuantityModal';
        amountId = 'increaseAmount';
        reasonId = 'increaseReason';
        ingredientId = document.getElementById('increaseIngredientId').value;
        ingredientName = document.getElementById('increaseIngredientName').value;
    } else {
        modalId = 'decreaseQuantityModal';
        amountId = 'decreaseAmount';
        reasonId = 'decreaseReason';
        ingredientId = document.getElementById('decreaseIngredientId').value;
        ingredientName = document.getElementById('decreaseIngredientName').value;
    }
    
    const amount = document.getElementById(amountId).value;
    const reason = document.getElementById(reasonId).value;
    
    if (!amount || parseInt(amount) <= 0) {
        showNotification('Please enter a valid amount', 'warning');
        return;
    }
    
    if (type === 'decrease' && !reason) {
        showNotification('Please select a reason for decrease', 'warning');
        return;
    }
    
    // Simulate API call
    setTimeout(() => {
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        modal.hide();
        
        // Show success message
        const action = type === 'increase' ? 'increased' : 'decreased';
        showNotification(`${ingredientName} quantity ${action} by ${amount}`, 'success');
        
        // Log activity
        logActivity(`Ingredient quantity ${action}`, `${ingredientName} (${amount})`, 'Success');
        
        // Refresh ingredients list
        loadIngredients();
        
        // Update dashboard low stock count if needed
        updateDashboardLowStock();
    }, 1000);
}

function updateDashboardLowStock() {
    // This would normally make an API call to get updated low stock count
    const lowStockElement = document.getElementById('lowStock');
    if (lowStockElement) {
        const currentCount = parseInt(lowStockElement.textContent) || 0;
        // Simulate a change (in real app, this would be based on actual data)
        const newCount = Math.max(0, currentCount - 1);
        lowStockElement.textContent = newCount;
        
        // Update quick stats too
        const quickLowStock = document.getElementById('quickLowStock');
        if (quickLowStock) {
            quickLowStock.textContent = newCount;
        }
    }
}

// Receipts Functions
function initializeReceiptsFunctionality() {
    // Load receipts when receipts page is shown
    document.querySelector('[data-page="receipts"]').addEventListener('click', function() {
        loadRecentReceipts();
    });
    
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
    
    showNotification('Receipt sent to printer', 'success');
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
                showNotification('Please fill in all password fields', 'warning');
                return;
            }
            
            if (newPassword !== confirmNewPassword) {
                showNotification('New passwords do not match', 'warning');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('New password must be at least 6 characters', 'warning');
                return;
            }
            
            // Simulate password change (in real app, this would be an API call)
            setTimeout(() => {
                // Clear form
                changePasswordForm.reset();
                
                // Show success message
                showNotification('Password changed successfully', 'success');
                
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
    // In a real app, this would send data to server
    console.log(`Activity Log: ${action} - ${reference} - ${status}`);
    
    // Update activity log if it's currently visible
    if (document.getElementById('activity-log-content') && 
        !document.getElementById('activity-log-content').classList.contains('d-none')) {
        loadActivityLog();
    }
}

// Export functions for use in inline event handlers
window.adjustSaleItemQuantity = adjustSaleItemQuantity;
window.removeSaleItem = removeSaleItem;
window.openIncreaseModal = openIncreaseModal;
window.openDecreaseModal = openDecreaseModal;