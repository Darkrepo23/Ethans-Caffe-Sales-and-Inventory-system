// Authentication JavaScript

// DOM Ready
document.addEventListener('DOMContentLoaded', function () {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            handleLogin();
        });
    }

    // Request account form submission
    const requestAccountForm = document.getElementById('requestAccountForm');
    if (requestAccountForm) {
        requestAccountForm.addEventListener('submit', function (e) {
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

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    // Show loading state
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    const loginBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
    loginBtn.disabled = true;

    // Simulate API call with delay
    setTimeout(() => {
        // 1. Check dynamic users from localStorage
        let users = [];
        try {
            const stored = localStorage.getItem('users');
            if (stored) users = JSON.parse(stored);
        } catch (e) { }

        const foundUser = users.find(u =>
            u.username.toLowerCase() === trimmedUsername.toLowerCase() &&
            u.password === trimmedPassword &&
            !u.isDeleted &&
            u.status === 'Active'
        );

        if (foundUser || (trimmedUsername === 'admin' && trimmedPassword === 'admin123')) {
            const role = foundUser ? foundUser.role.toLowerCase().replace(' ', '') : 'admin';
            const displayName = foundUser ? foundUser.name : 'Admin';

            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;

            // Save auth flag
            localStorage.setItem('loggedInRole', role === 'seniorstaff' ? 'admin' : role);
            localStorage.setItem('loggedInUser', displayName);

            if (window.Swal) {
                Swal.fire({
                    icon: 'success',
                    title: 'Login Successful',
                    text: `Welcome back, ${displayName}!`,
                    timer: 1500,
                    timerProgressBar: true,
                    showConfirmButton: false,
                    heightAuto: false
                }).then(() => {
                    if (role === 'admin' || role === 'seniorstaff' || role === 'owner') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'staff-menu.html';
                    }
                });
            } else {
                if (role === 'admin' || role === 'seniorstaff' || role === 'owner') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'staff-menu.html';
                }
            }
            return;
        }

        // 2. Legacy hardcoded check for safety (optional but good for dev)
        if ((trimmedUsername === 'staff' && trimmedPassword === 'staff123') ||
            (trimmedUsername === 'cashier' && trimmedPassword === 'cashier123')) {

            const role = trimmedUsername;
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
            localStorage.setItem('loggedInRole', role);
            window.location.href = 'staff-menu.html';
            return;
        }

        // If credentials don't match
        showLoginError('Invalid username or password');
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
    }, 1500);
}

function showLoginError(message) {
    if (window.Swal) {
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: message,
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#800000',
            background: '#fff',
            heightAuto: false,
            customClass: {
                popup: 'swal2-rounded'
            }
        });
    } else {
        const loginError = document.getElementById('loginError');
        if (loginError) {
            loginError.textContent = message;
            loginError.classList.remove('d-none');
            setTimeout(() => {
                loginError.classList.add('d-none');
            }, 5000);
        }
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
    const requestAccountForm = document.getElementById('requestAccountForm');
    if (!requestAccountForm) return;
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

        // Fancy SweetAlert success card
        if (window.Swal) {
            Swal.fire({
                icon: 'success',
                title: 'Request Submitted!',
                text: 'Your account request is now pending approval. Please wait for an administrator to activate your account.',
                confirmButtonText: 'Great, thanks!',
                confirmButtonColor: '#800000',
                background: '#fff',
                heightAuto: false,
                customClass: {
                    popup: 'swal2-rounded'
                }
            });
        } else {
            alert('Your request has been submitted and is pending approval.');
        }

        // Reset form
        requestAccountForm.reset();
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1000);
}

function showRequestError(message) {
    if (window.Swal) {
        Swal.fire({
            icon: 'warning',
            title: 'Oops!',
            text: message,
            confirmButtonText: 'Got it',
            confirmButtonColor: '#800000',
            background: '#fff',
            heightAuto: false,
            customClass: {
                popup: 'swal2-rounded'
            }
        });
    } else {
        const requestError = document.getElementById('requestError');
        if (requestError) {
            requestError.textContent = message;
            requestError.classList.remove('d-none');
            setTimeout(() => {
                requestError.classList.add('d-none');
            }, 5000);
        }
    }
}