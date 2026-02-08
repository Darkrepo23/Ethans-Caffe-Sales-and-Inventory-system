// Authentication JavaScript

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    }
    
    // Request account form submission
    const requestAccountForm = document.getElementById('requestAccountForm');
    if (requestAccountForm) {
        requestAccountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleAccountRequest();
        });
    }
});

// Handle login
function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');
    
    // Basic validation
    if (!username || !password) {
        showLoginError('Please enter both username and password');
        return;
    }
    
    // Show loading state
    const loginBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
    loginBtn.disabled = true;
    
    // Simulate API call with delay
    setTimeout(() => {
        // Mock authentication
        // In a real app, this would be a server-side check
        
        // Default admin account
        if (username === 'admin' && password === 'admin123') {
            // Redirect to admin dashboard
            window.location.href = 'admin-dashboard.html';
            return;
        }
        
        // Mock staff account
        if (username === 'staff' && password === 'staff123') {
            // Redirect to staff dashboard
            window.location.href = 'staff-dashboard.html';
            return;
        }
        
        // Mock cashier account
        if (username === 'cashier' && password === 'cashier123') {
            // Redirect to staff dashboard (cashier uses same interface)
            window.location.href = 'staff-dashboard.html';
            return;
        }
        
        // If credentials don't match
        showLoginError('Invalid username or password');
        
        // Reset button
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }, 1500);
}

function showLoginError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.remove('d-none');
        
        // Hide after 5 seconds
        setTimeout(() => {
            loginError.classList.add('d-none');
        }, 5000);
    }
}

// Handle account request
function handleAccountRequest() {
    const fullName = document.getElementById('fullName').value;
    const username = document.getElementById('requestUsername').value;
    const password = document.getElementById('requestPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const requestedRole = document.getElementById('requestedRole').value;
    
    const requestError = document.getElementById('requestError');
    const requestSuccess = document.getElementById('requestSuccess');
    
    // Validation
    if (!fullName || !username || !password || !confirmPassword) {
        showRequestError('Please fill in all required fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showRequestError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showRequestError('Password must be at least 6 characters');
        return;
    }
    
    // Check username uniqueness (simulated)
    const existingUsers = ['admin', 'staff', 'cashier', 'john', 'jane'];
    if (existingUsers.includes(username.toLowerCase())) {
        showRequestError('Username already exists. Please choose a different username.');
        return;
    }
    
    // Show loading state
    const submitBtn = requestAccountForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
    submitBtn.disabled = true;
    
    // Simulate API call
    setTimeout(() => {
        // Save request to local storage (simulated)
        const request = {
            id: Date.now(),
            fullName,
            username,
            password, // In real app, this would be hashed
            requestedRole,
            status: 'Pending',
            date: new Date().toLocaleDateString()
        };
        
        // Get existing requests or initialize array
        let requests = JSON.parse(localStorage.getItem('accountRequests')) || [];
        requests.push(request);
        localStorage.setItem('accountRequests', JSON.stringify(requests));
        
        // Show success message
        requestSuccess.classList.remove('d-none');
        if (requestError) {
            requestError.classList.add('d-none');
        }
        
        // Reset form
        requestAccountForm.reset();
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            requestSuccess.classList.add('d-none');
        }, 5000);
    }, 1000);
}

function showRequestError(message) {
    const requestError = document.getElementById('requestError');
    if (requestError) {
        requestError.textContent = message;
        requestError.classList.remove('d-none');
        
        // Hide after 5 seconds
        setTimeout(() => {
            requestError.classList.add('d-none');
        }, 5000);
    }
}