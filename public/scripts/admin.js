document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication Check ---
    if (!isAdmin()) {
        // If not logged in as admin, redirect to the admin login page.
        window.location.href = 'admin-login.html';
        return; // Stop script execution
    }

    // --- Element Selectors ---
    const logoutLink = document.getElementById('logout-link');
    const voterRegForm = document.getElementById('voter-registration-form');
    const electionForm = document.getElementById('election-form');
    const addPositionForm = document.getElementById('add-position-form');
    const addCandidateForm = document.getElementById('add-candidate-form');
    const positionsSelect = document.getElementById('candidate-position');
    const positionsUl = document.getElementById('positions-ul');
    const electionStatusDiv = document.getElementById('election-status');

    // --- Event Listeners ---

    // Logout functionality
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        logout(); // This function is from main.js
    });

    // Voter Registration Form
    voterRegForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentId = document.getElementById('voter-student-id').value;
        const password = document.getElementById('voter-password').value;
        const metamaskAddress = document.getElementById('voter-metamask-address').value;

        // Using the registerVoter function from main.js
        const result = registerVoter(studentId, password, metamaskAddress);

        if (result.success) {
            showMessage(result.message, 'success');
            voterRegForm.reset();
        } else {
            showMessage(result.message, 'error');
        }
    });

    // Election Creation Form
    electionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const electionName = document.getElementById('election-name').value;
        const startTime = document.getElementById('election-start').value;
        const endTime = document.getElementById('election-end').value;

        // Using the createElection function from main.js
        const result = createElection(electionName, startTime, endTime);
        
        if (result.success) {
            showMessage(result.message, 'success');
            electionForm.reset();
            loadElectionStatus(); // Refresh the displayed status
        } else {
            showMessage(result.message, 'error');
        }
    });

    // Add New Position Form
    addPositionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const positionName = document.getElementById('position-name').value;
        
        // The logic for adding positions is simple, so we can use the db object directly.
        db.add('positions', { name: positionName });
        
        showMessage('Position added successfully!', 'success');
        addPositionForm.reset();
        fetchPositions(); // Refresh the positions list
    });

    // Add New Candidate Form
    addCandidateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const candidateName = document.getElementById('candidate-name').value;
        const positionId = positionsSelect.value;
        const imageUrl = document.getElementById('candidate-image').value;
        const manifesto = document.getElementById('candidate-manifesto').value;

        if (!positionId) {
            showMessage('Please select a position for the candidate.', 'warning');
            return;
        }

        // Using the registerCandidate function from main.js
        const result = registerCandidate(candidateName, positionId, imageUrl, manifesto);
        
        if (result.success) {
            showMessage(result.message, 'success');
            addCandidateForm.reset();
        } else {
            showMessage(result.message, 'error');
        }
    });

    // --- Data Loading Functions ---

    function fetchPositions() {
        const positions = db.getAll('positions');

        positionsSelect.innerHTML = '<option value="">Select a position...</option>'; // Reset
        positionsUl.innerHTML = ''; // Reset

        positions.forEach(position => {
            // Add to dropdown
            const option = document.createElement('option');
            option.value = position.id;
            option.textContent = position.name;
            positionsSelect.appendChild(option);

            // Add to list
            const li = document.createElement('li');
            li.textContent = position.name;
            positionsUl.appendChild(li);
        });
    }

    function loadElectionStatus() {
        const elections = db.getAll('elections');

        if (elections.length > 0) {
            const lastElection = elections[elections.length - 1];
            electionStatusDiv.innerHTML = `
                <p><strong>Current Election:</strong> ${lastElection.name}</p>
                <p><strong>Starts:</strong> ${new Date(lastElection.start_time).toLocaleString()}</p>
                <p><strong>Ends:</strong> ${new Date(lastElection.end_time).toLocaleString()}</p>
            `;
        } else {
            electionStatusDiv.innerHTML = '<p>No election has been set up yet.</p>';
        }
    }

    // --- Initial Dashboard Load ---
    function initializeDashboard() {
        fetchPositions();
        loadElectionStatus();
    }

    initializeDashboard();
});
