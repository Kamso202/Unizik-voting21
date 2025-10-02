document.addEventListener('DOMContentLoaded', () => {
    // If the user is already logged in as an admin, redirect them to the dashboard.
    if (isAdmin()) {
        window.location.href = 'admin.html';
        return;
    }

    const loginForm = document.getElementById('admin-login-form');
    const messageElement = document.getElementById('login-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Use the new centralized login function from main.js
        const success = login(username, password, 'admin');

        if (success) {
            messageElement.textContent = 'Login successful! Redirecting...';
            messageElement.style.color = 'green';
            
            // Redirect to the admin dashboard after a short delay
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            messageElement.textContent = 'Invalid username or password.';
            messageElement.style.color = 'red';
        }
    });
});
