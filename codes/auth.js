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

    // Reset login UI when username changes (so different users can try to login)
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('input', function () {
            resetLoginUI();
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

// ===== Session Management Functions =====
const SessionManager = {
    /**
     * Check if user is authenticated (hits the session API)
     * @returns {Promise<{authenticated: boolean, user?: object}>}
     */
    async checkSession() {
        try {
            const response = await fetch('php/session.php?action=check', {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Session check failed:', error);
            return { authenticated: false };
        }
    },
    
    /**
     * Get current logged-in user from session
     * @returns {Promise<object|null>}
     */
    async getCurrentUser() {
        const session = await this.checkSession();
        return session.authenticated ? session.user : null;
    },
    
    /**
     * Logout user (destroys session in database)
     * @param {boolean} logoutAll - If true, logout from all devices
     * @returns {Promise<boolean>}
     */
    async logout(logoutAll = false) {
        try {
            const response = await fetch('php/logout.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ logout_all: logoutAll })
            });
            
            const data = await response.json();
            
            // Clear any localStorage remnants (for backward compatibility)
            localStorage.removeItem('loggedInUser');
            localStorage.removeItem('loggedInRole');
            localStorage.removeItem('loggedInUserId');
            
            return data.success === true;
        } catch (error) {
            console.error('Logout failed:', error);
            return false;
        }
    },
    
    /**
     * Refresh session (extend expiry)
     * @returns {Promise<boolean>}
     */
    async refreshSession() {
        try {
            const response = await fetch('php/session.php?action=refresh', {
                method: 'POST',
                credentials: 'include'
            });
            
            const data = await response.json();
            return data.success === true;
        } catch (error) {
            console.error('Session refresh failed:', error);
            return false;
        }
    },
    
    /**
     * Require authentication - redirect to login if not authenticated
     * @param {string} requiredRole - Optional: 'admin' or 'staff'
     */
    async requireAuth(requiredRole = null) {
        const session = await this.checkSession();
        
        if (!session.authenticated) {
            window.location.href = 'index.html';
            return false;
        }
        
        if (requiredRole) {
            const userRole = (session.user.role_name || '').toLowerCase();
            if (requiredRole === 'admin' && userRole !== 'admin') {
                window.location.href = 'staff-menu.html';
                return false;
            }
        }
        
        return session.user;
    }
};

// Global function for easy access
async function getCurrentUser() {
    return SessionManager.getCurrentUser();
}

async function logoutUser(logoutAll = false) {
    const success = await SessionManager.logout(logoutAll);
    if (success) {
        window.location.href = 'index.html';
    }
    return success;
}

// Handle login
async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');

    // Reset UI state before each login attempt (so different users can try to login)
    resetLoginUI();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    // Basic client-side validation
    if (!username || !password) {
        showLoginError("Please enter both username and password");
        return;
    }

    // Enforce length limits client-side too
    if (username.length > 100 || password.length > 255) {
        showLoginError("Input is too long");
        return;
    }

    // Validate username format client-side
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showLoginError("Invalid username format");
        return;
    }

    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
    loginBtn.disabled = true;

    try {
        console.log("Sending login request...", { username, password: "[HIDDEN]" });

        const res = await fetch("php/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;

        if (!res.ok || data.error) {
            // Handle account lockout
            if (data.locked) {
                showAccountLockedUI();
                Swal.fire({
                    icon: 'error',
                    title: 'Account Locked',
                    html: `<p>${data.message}</p><p class="text-muted small mt-2">Contact your administrator to unlock your account.</p>`,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#800000',
                    heightAuto: false
                });
                return;
            }
            
            // Handle cooldown (rate limiting)
            if (data.cooldown) {
                let seconds = data.remaining_seconds;
                showCooldownUI(seconds);
                return;
            }
            
            // Handle regular login errors with attempts remaining
            if (data.attempts_remaining !== undefined && data.attempts_remaining > 0) {
                // Show cooldown UI if there's a cooldown
                if (data.cooldown_seconds && data.cooldown_seconds > 0) {
                    showCooldownUI(data.cooldown_seconds);
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Login Failed',
                    html: `<p>${data.error || 'Invalid credentials'}</p><p class="text-warning small mt-2"><i class="fas fa-exclamation-triangle me-1"></i>${data.attempts_remaining} attempt(s) remaining before lockout</p>`,
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#800000',
                    heightAuto: false
                });
                return;
            }
            
            showLoginError(data.error || data.message || "Login failed");
            return;
        }

        // Clear inputs after successful login
        usernameInput.value = '';
        passwordInput.value = '';

        Swal.fire({
            icon: "success",
            title: "Login Successful",
            text: `Welcome back, ${data.full_name}!`,
            showConfirmButton: false,
            timer: 1200,
            timerProgressBar: true,
            heightAuto: false
        }).then(() => {
            const role = parseInt(data.role_id);
            const roleName = (data.role_name || "").toLowerCase();

            // Session is now managed via HTTP-only cookies set by login.php
            // localStorage entries kept for backward compatibility during transition
            localStorage.setItem('loggedInRole', role === 1 ? 'admin' : 'staff');
            localStorage.setItem('loggedInUser', JSON.stringify(data));
            localStorage.setItem('loggedInUserId', data.id);

            // Mark user as active in database and redirect
            updateUserStatus(data.id, 'active').finally(() => {
                if (role === 1 || roleName === "admin") {
                    window.location.href = "admin-dashboard.html";
                } else {
                    window.location.href = "staff-menu.html";
                }
            });
        });

    } catch (err) {
        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;
        console.error("Network or JS error:", err);
        showLoginError("Network error. Please try again.");
    }
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

// Show cooldown timer UI
function showCooldownUI(seconds) {
    const cooldownAlert = document.getElementById('loginCooldownAlert');
    const cooldownSeconds = document.getElementById('cooldownSeconds');
    const cooldownProgress = document.getElementById('cooldownProgress');
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    const accountLockedAlert = document.getElementById('accountLockedAlert');
    
    if (!cooldownAlert || !cooldownSeconds || !cooldownProgress) return;
    
    // Hide account locked alert if showing
    if (accountLockedAlert) accountLockedAlert.classList.add('d-none');
    
    const totalSeconds = seconds;
    cooldownAlert.classList.remove('d-none');
    cooldownSeconds.textContent = seconds;
    cooldownProgress.style.width = '100%';
    
    // Disable login button
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-clock me-2"></i>Please Wait...';
    }
    
    const interval = setInterval(() => {
        seconds--;
        cooldownSeconds.textContent = seconds;
        
        // Update progress bar
        const progressPercent = (seconds / totalSeconds) * 100;
        cooldownProgress.style.width = progressPercent + '%';
        
        if (seconds <= 0) {
            clearInterval(interval);
            cooldownAlert.classList.add('d-none');
            
            // Re-enable login button
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
            }
        }
    }, 1000);
}

// Reset login UI state (clear alerts and re-enable form)
function resetLoginUI() {
    const accountLockedAlert = document.getElementById('accountLockedAlert');
    const cooldownAlert = document.getElementById('loginCooldownAlert');
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    
    // Hide all alerts
    if (accountLockedAlert) accountLockedAlert.classList.add('d-none');
    if (cooldownAlert) cooldownAlert.classList.add('d-none');
    
    // Re-enable login button with default state
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
    }
}

// Show account locked UI
function showAccountLockedUI() {
    const accountLockedAlert = document.getElementById('accountLockedAlert');
    const cooldownAlert = document.getElementById('loginCooldownAlert');
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');
    
    // Hide cooldown alert if showing
    if (cooldownAlert) cooldownAlert.classList.add('d-none');
    
    if (accountLockedAlert) {
        accountLockedAlert.classList.remove('d-none');
    }
    
    // Disable login button
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-lock me-2"></i>Account Locked';
    }
}

// Handle account request
function handleAccountRequest() {
    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('requestUsername').value.trim();
    const email = document.getElementById('requestEmail').value.trim();
    const password = document.getElementById('requestPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const requestedRole = document.getElementById('requestedRole').value;

    // Validation
    if (!fullName || !username || !email || !password || !confirmPassword) {
        showRequestError('Please fill in all required fields');
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showRequestError('Please enter a valid Gmail/Email address');
        return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showRequestError('Invalid username format. Only letters, numbers, and underscores allowed.');
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

    const requestAccountForm = document.getElementById('requestAccountForm');
    if (!requestAccountForm) return;

    const submitBtn = requestAccountForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';
    submitBtn.disabled = true;

    fetch("php/account_request.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            full_name: fullName,
            username: username,
            email: email,
            password: password,
            requested_role_id: requestedRole === 'Staff' ? 2 : 3 // Adjusted based on role IDs
        })
    })
        .then(function (res) {
            return res.json().then(function (data) {
                return { status: res.status, data: data };
            });
        })
        .then(function (result) {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            if (result.data.error) {
                showRequestError(result.data.error);
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Request Submitted!',
                text: 'Your account request is now pending approval. Please wait for an administrator to activate your account.',
                confirmButtonText: 'Great, thanks!',
                confirmButtonColor: '#800000',
                background: '#fff',
                heightAuto: false
            });

            requestAccountForm.reset();
        })
        .catch(function (err) {
            console.error('Request failed:', err);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showRequestError('Network error. Please try again.');
        });
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

// Add admin user with password '123' (password will be hashed by backend)
// usersDB.add({
//     full_name: "Admin User",
//     username: "admin",
//     password_hash: "123", // Backend will hash this
//     role_id: 1,            // Make sure this role exists
//     status: "active",
//     created_at: new Date().toISOString().slice(0, 19).replace("T", " ")
// }).then(result => {
//     if (result && result.error) {
//         console.error('Failed to add admin user:', result.error);
//         alert('Failed to add admin user: ' + result.error);
//     } else {
//         console.log('Admin user added:', result);
//         alert('Admin user added successfully!');
//     }
// });

// ═══════════════════════════════════════════════════════════════════════════════
// AUTO SESSION VALIDATION
// Automatically validates session on protected pages (admin-*, staff-*)
// ═══════════════════════════════════════════════════════════════════════════════
(function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const isProtectedPage = currentPage.startsWith('admin-') || currentPage.startsWith('staff-');
    
    if (isProtectedPage) {
        // Run session validation after DOM is ready
        document.addEventListener('DOMContentLoaded', function() {
            // Quick localStorage check first (for fast UX)
            const loggedInUser = localStorage.getItem('loggedInUser');
            if (!loggedInUser) {
                console.log('🔒 No local session found, redirecting to login');
                window.location.href = 'index.html';
                return;
            }
            
            // Validate session with server
            fetch('php/session.php?action=check', {
                method: 'GET',
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (!data.authenticated || !data.user) {
                    console.log('🔒 Server session invalid, redirecting to login');
                    localStorage.removeItem('loggedInUser');
                    localStorage.removeItem('loggedInRole');
                    localStorage.removeItem('loggedInUserId');
                    window.location.href = 'index.html';
                } else {
                    console.log('✅ Server session valid for:', data.user.username);
                    // Update local storage with fresh data
                    localStorage.setItem('loggedInUser', JSON.stringify(data.user));
                    localStorage.setItem('loggedInRole', data.user.role_name);
                    localStorage.setItem('loggedInUserId', data.user.id);
                }
            })
            .catch(error => {
                console.error('❌ Session check failed:', error);
                // On network error, allow user to continue with localStorage data
                // The server will reject any API calls if the session is actually invalid
            });
        });
    }
})();