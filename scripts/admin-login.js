document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('login-message');

    try {
        const response = await fetch('http://localhost:3000/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('adminToken', data.token);
            messageElement.textContent = 'Login successful! Redirecting...';
            messageElement.style.color = 'green';
            window.location.href = 'admin.html'; // Redirect to the admin dashboard
        } else {
            messageElement.textContent = data.error || 'Login failed. Please try again.';
            messageElement.style.color = 'red';
        }
    } catch (err) {
        messageElement.textContent = 'An error occurred. Please check the server connection.';
        messageElement.style.color = 'red';
    }
});