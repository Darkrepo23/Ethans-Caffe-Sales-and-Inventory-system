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

    const originalText = loginBtn.innerHTML;
    loginBtn.innerHTML = '<span class="loading-spinner"></span> Logging in...';
    loginBtn.disabled = true;

    try {
        console.log("Sending login request...", { username, password: "[HIDDEN]" });

        const res = await fetch("http://localhost/Ethans%20Cafe/codes/php/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        loginBtn.innerHTML = originalText;
        loginBtn.disabled = false;

        if (!res.ok || data.error) {
            showLoginError(data.error || "Login failed");
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
            timerProgressBar: true
        }).then(() => {
            const role = parseInt(data.role_id);
            const roleName = (data.role_name || "").toLowerCase();

            // Save current user info
            localStorage.setItem('loggedInUserId', data.user_id);
            localStorage.setItem('loggedInUser', data.full_name);
            localStorage.setItem('currentUser', JSON.stringify({
                id: data.user_id,
                name: data.full_name,
                role: roleName
            }));

            if (role === 1 || roleName === "admin") {
                localStorage.setItem('loggedInRole', 'admin');
                window.location.href = "admin-dashboard.html";
            } else if (role === 2 || roleName === "staff") {
                localStorage.setItem('loggedInRole', 'staff');
                window.location.href = "staff-menu.html";
            } else {
                localStorage.setItem('loggedInRole', 'user');
                window.location.href = "staff-menu.html";
            }
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

let isSubmittingRequest = false;

function handleAccountRequest() {
    if (isSubmittingRequest) return; // block duplicate calls

    const fullName = document.getElementById('fullName').value.trim();
    const username = document.getElementById('requestUsername').value.trim();
    const password = document.getElementById('requestPassword').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const requestedRoleId = parseInt(document.getElementById('requestedRole').value);

    if (!fullName || !username || !password || !confirmPassword) {
        showRequestError('Please fill in all required fields');
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

    if (!requestedRoleId) {
        showRequestError('Please select a role');
        return;
    }

    const submitBtn = document.querySelector('#requestAccountForm button[type="submit"]');
    if (!submitBtn) return;

    isSubmittingRequest = true;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Submitting...';

    const originalText = '<i class="fas fa-paper-plane me-2"></i>Submit Request';

    fetch("http://localhost/Ethans%20Cafe/codes/php/account_request.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            full_name: fullName,
            username: username,
            password: password,
            requested_role_id: requestedRoleId
        })
    })
        .then(function (res) {
            return res.json().then(function (data) {
                return { status: res.status, data: data };
            });
        })
        .then(function (result) {
            isSubmittingRequest = false;
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

            document.getElementById('requestAccountForm').reset();

        })
        .catch(function (err) {
            console.error('Request failed:', err);
            isSubmittingRequest = false;
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