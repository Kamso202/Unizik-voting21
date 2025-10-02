document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('adminToken');

    // Handle voter registration
document.getElementById('voter-registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('voter-student-id').value;
    const metamaskAddress = document.getElementById('voter-metamask-address').value;
    const password = document.getElementById('voter-password').value;

    try {
        const response = await fetch('http://localhost:3000/api/voter/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                student_id: studentId,
                metamask_address: metamaskAddress,
                password: password
            })
        });
        if (response.ok) {
            alert('Voter registered successfully!');
            document.getElementById('voter-registration-form').reset();
        } else {
            const data = await response.json();
            alert(`Failed to register voter: ${data.error}`);
        }
    } catch (err) {
        alert('An error occurred. Please check the server connection.');
    }
});

// Handle setting election period
document.getElementById('election-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const electionName = document.getElementById('election-name').value;
    const startTime = document.getElementById('election-start').value;
    const endTime = document.getElementById('election-end').value;

    try {
        const response = await fetch('http://localhost:3000/api/election/set', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                name: electionName,
                start_time: startTime,
                end_time: endTime
            })
        });
        if (response.ok) {
            alert('Election period set successfully!');
        } else {
            const data = await response.json();
            alert(`Failed to set election period: ${data.error}`);
        }
    } catch (err) {
        alert('An error occurred. Please check the server connection.');
    }
});

// Function to load dashboard data on page load
async function loadAdminDashboardData() {
    await fetchPositions(); // This function should already exist
    try {
        const response = await fetch('http://localhost:3000/api/election/get', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const election = await response.json();
        if (election) {
            document.getElementById('election-name').value = election.name;
            document.getElementById('election-start').value = new Date(election.start_time).toISOString().slice(0, 16);
            document.getElementById('election-end').value = new Date(election.end_time).toISOString().slice(0, 16);
        }
    } catch (err) {
        console.error('Failed to load election details:', err);
    }
}
loadAdminDashboardData();
    if (!token) {
        window.location.href = 'admin-login.html'; // Redirect if no token
        return;
    }

    const logoutLink = document.getElementById('logout-link');
    logoutLink.addEventListener('click', () => {
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
    });

    // Function to fetch positions and populate the dropdown and list
    async function fetchPositions() {
        try {
            const response = await fetch('http://localhost:3000/api/positions', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const positions = await response.json();

            const selectElement = document.getElementById('candidate-position');
            const listElement = document.getElementById('positions-ul');
            selectElement.innerHTML = '<option value="">Select a position...</option>';
            listElement.innerHTML = '';

            positions.forEach(position => {
                const option = document.createElement('option');
                option.value = position.id;
                option.textContent = position.name;
                selectElement.appendChild(option);

                const li = document.createElement('li');
                li.textContent = position.name;
                listElement.appendChild(li);
            });
        } catch (error) {
            console.error('Failed to fetch positions:', error);
            alert('Failed to fetch positions. Please check your backend.');
        }
    }
    fetchPositions();

    // Handle adding a new position
    document.getElementById('add-position-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const positionName = document.getElementById('position-name').value;
        try {
            const response = await fetch('http://localhost:3000/api/positions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: positionName })
            });
            if (response.ok) {
                alert('Position added successfully!');
                document.getElementById('add-position-form').reset();
                fetchPositions();
            } else {
                const data = await response.json();
                alert(`Failed to add position: ${data.error}`);
            }
        } catch (err) {
            alert('An error occurred. Please check the server connection.');
        }
    });

    // Handle adding a new candidate
    document.getElementById('add-candidate-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const candidateName = document.getElementById('candidate-name').value;
        const positionId = document.getElementById('candidate-position').value;
        const imageUrl = document.getElementById('candidate-image').value;
        const manifesto = document.getElementById('candidate-manifesto').value;

        try {
            const response = await fetch('http://localhost:3000/api/candidates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    name: candidateName,
                    position_id: positionId,
                    image_url: imageUrl,
                    manifesto: manifesto
                })
            });
            if (response.ok) {
                alert('Candidate added successfully!');
                document.getElementById('add-candidate-form').reset();
            } else {
                const data = await response.json();
                alert(`Failed to add candidate: ${data.error}`);
            }
        } catch (err) {
            alert('An error occurred. Please check the server connection.');
        }
    });
});