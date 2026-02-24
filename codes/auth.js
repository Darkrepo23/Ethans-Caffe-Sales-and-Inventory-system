// ===== LOGIN COOLDOWN SYSTEM =====
// Tracks failed login attempts per username in localStorage
// 3 failed attempts → 2min cooldown, escalating by +2min each cycle

/**
 * Get cooldown data for a specific username
 * @param {string} username
 * @returns {object} { attempts, cooldownLevel, cooldownUntil }
 */
function getCooldownData(username) {
    try {
        const key = 'loginCooldown_' + username.toLowerCase();
        const stored = localStorage.getItem(key);
        if (stored) return JSON.parse(stored);
    } catch (e) { }
    return { attempts: 0, cooldownLevel: 0, cooldownUntil: 0 };
}

/**
 * Save cooldown data for a specific username
 * @param {string} username
 * @param {object} data
 */
function saveCooldownData(username, data) {
    const key = 'loginCooldown_' + username.toLowerCase();
    localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Reset cooldown for a specific username
 * @param {string} username
 */
function resetCooldown(username) {
    const key = 'loginCooldown_' + username.toLowerCase();
    localStorage.removeItem(key);
}

/**
 * Reset ALL cooldowns (for all usernames)
 */
function resetAllCooldowns() {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('loginCooldown_')) {
            keysToRemove.push(key);
        }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
}

/**
 * Check if a username is currently on cooldown
 * @param {string} username
 * @returns {object} { onCooldown: bool, remainingSeconds: number }
 */
function checkCooldown(username) {
    const data = getCooldownData(username);
    const now = Date.now();

    if (data.cooldownUntil > now) {
        const remainingMs = data.cooldownUntil - now;
        return { onCooldown: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
    }

    return { onCooldown: false, remainingSeconds: 0 };
}

/**
 * Record a failed login attempt for a username
 * @param {string} username
 */
function recordFailedAttempt(username) {
    const data = getCooldownData(username);
    const now = Date.now();

    // If cooldown has expired, keep the cooldownLevel but reset attempts
    if (data.cooldownUntil > 0 && data.cooldownUntil <= now) {
        data.attempts = 0;
    }

    data.attempts++;

    // Every 3 failed attempts triggers a new cooldown
    if (data.attempts >= 3) {
        data.cooldownLevel++;
        // Cooldown = cooldownLevel * 2 minutes (in ms)
        const cooldownMinutes = data.cooldownLevel * 2;
        data.cooldownUntil = now + (cooldownMinutes * 60 * 1000);
        data.attempts = 0; // Reset attempt counter for next cycle
    }

    saveCooldownData(username, data);
    return data;
}

/**
 * Format seconds into MM:SS string
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatCooldownTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Show cooldown countdown in SweetAlert
 * @param {string} username
 * @param {number} remainingSeconds
 */
function showCooldownAlert(username, remainingSeconds) {
    const data = getCooldownData(username);
    const cooldownMinutes = data.cooldownLevel * 2;

    let timerInterval;
    Swal.fire({
        icon: 'error',
        title: 'Account Locked',
        html: `<div style="text-align:center;">
            <p>Too many failed login attempts for <strong>"${username}"</strong></p>
            <p>Account is locked for <strong>${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''}</strong></p>
            <div style="font-size: 2rem; font-weight: bold; color: #dc3545; margin: 15px 0;" id="cooldownTimer">${formatCooldownTime(remainingSeconds)}</div>
            <p class="text-muted small">Please wait for the cooldown to expire, or ask an admin to reset it.</p>
        </div>`,
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: 'OK',
        confirmButtonColor: '#800000',
        heightAuto: false,
        didOpen: () => {
            const timerEl = document.getElementById('cooldownTimer');
            if (!timerEl) return;
            let remaining = remainingSeconds;
            timerInterval = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(timerInterval);
                    timerEl.textContent = '0:00';
                    timerEl.style.color = '#28a745';
                    Swal.update({
                        html: `<div style="text-align:center;">
                            <p style="color:#28a745; font-weight:bold;">Cooldown expired! You can try again.</p>
                        </div>`,
                        icon: 'success',
                        confirmButtonText: 'Try Again'
                    });
                } else {
                    timerEl.textContent = formatCooldownTime(remaining);
                }
            }, 1000);
        },
        willClose: () => {
            if (timerInterval) clearInterval(timerInterval);
        }
    });
}

/**
 * Get list of all usernames that have cooldown data
 * @returns {Array} list of { username, data } objects
 */
function getAllCooldownUsers() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('loginCooldown_')) {
            const username = key.replace('loginCooldown_', '');
            try {
                const data = JSON.parse(localStorage.getItem(key));
                users.push({ username, ...data });
            } catch (e) { }
        }
    }
    return users;
}

// Make functions globally available for other scripts
window.getCooldownData = getCooldownData;
window.saveCooldownData = saveCooldownData;
window.resetCooldown = resetCooldown;
window.resetAllCooldowns = resetAllCooldowns;
window.checkCooldown = checkCooldown;
window.getAllCooldownUsers = getAllCooldownUsers;
window.formatCooldownTime = formatCooldownTime;

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
async function handleLogin() {
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('#loginForm button[type="submit"]');

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

    // ===== CHECK COOLDOWN BEFORE ATTEMPTING LOGIN =====
    const cooldownStatus = checkCooldown(username);
    if (cooldownStatus.onCooldown) {
        showCooldownAlert(username, cooldownStatus.remainingSeconds);
        return;
    }

    const cooldownData = getCooldownData(username);
    const attemptsRemaining = 3 - cooldownData.attempts;

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
            // ===== RECORD FAILED ATTEMPT =====
            const updatedData = recordFailedAttempt(username);
            const newCooldownCheck = checkCooldown(username);

            if (newCooldownCheck.onCooldown) {
                // Just entered cooldown
                showCooldownAlert(username, newCooldownCheck.remainingSeconds);
            } else {
                // Show remaining attempts warning
                const remaining = 3 - updatedData.attempts;
                const warningText = remaining <= 2
                    ? `<br><small style="color:#dc3545;"><i class="fas fa-exclamation-triangle"></i> ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before account lockout</small>`
                    : '';
                showLoginError((data.error || "Invalid username or password") + warningText, remaining <= 2);
            }
            return;
        }

        // ===== RESET COOLDOWN ON SUCCESSFUL LOGIN =====
        resetCooldown(username);

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

            localStorage.setItem('loggedInRole', role === 1 ? 'admin' : 'staff');
            localStorage.setItem('loggedInUser', JSON.stringify(data));

            // Mark user as active in database
            updateUserStatus(data.id, 'active').then(() => {
                if (role === 1 || roleName === "admin") {
                    window.location.href = "admin-dashboard.html";
                } else if (role === 2 || roleName === "staff") {
                    window.location.href = "staff-menu.html";
                } else {
                    window.location.href = "staff-menu.html";
                }
            }).catch(err => {
                console.error('Failed to update user status:', err);
                // Still redirect even if status update fails
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


function showLoginError(message, useHtml = false) {
    if (window.Swal) {
        const config = {
            icon: 'error',
            title: 'Login Failed',
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#800000',
            background: '#fff',
            heightAuto: false,
            customClass: {
                popup: 'swal2-rounded'
            }
        };
        if (useHtml) {
            config.html = message;
        } else {
            config.text = message;
        }
        Swal.fire(config);
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