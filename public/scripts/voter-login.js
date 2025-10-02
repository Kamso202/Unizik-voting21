document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const loginSection = document.getElementById('login-section');
    const ballotSection = document.getElementById('ballot-section');
    const loginForm = document.getElementById('voter-login-form');
    const loginMessage = document.getElementById('login-message');
    const ballotContainer = document.getElementById('ballot-container');
    const submitVoteBtn = document.getElementById('submit-vote');
    const voteStatusMessage = document.getElementById('vote-status-message');

    let selectedCandidates = {}; // Stores { positionId: candidateId }

    // --- Initial State Check ---
    // If already logged in as a voter, go straight to the ballot.
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === 'voter') {
        if (currentUser.is_voted) {
            showVotedScreen();
        } else {
            showBallot();
        }
    } else {
        showLogin();
    }

    // --- View Toggling ---
    function showLogin() {
        loginSection.style.display = 'block';
        ballotSection.style.display = 'none';
    }

    function showBallot() {
        loginSection.style.display = 'none';
        ballotSection.style.display = 'block';
        loadBallot();
    }

    function showVotedScreen() {
        loginSection.style.display = 'none';
        ballotSection.style.display = 'block';
        ballotContainer.innerHTML = '<h2 style="text-align: center; color: green;">You have already voted.</h2><p style="text-align: center;">Thank you for participating!</p>';
        submitVoteBtn.style.display = 'none'; // Hide the submit button
    }

    // --- Login Logic ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentId = document.getElementById('student-id').value;
        const password = document.getElementById('password').value;

        const success = login(studentId, password, 'voter');

        if (success) {
            const voter = getCurrentUser();
            if (voter.is_voted) {
                showVotedScreen();
            } else {
                showBallot();
            }
        } else {
            loginMessage.textContent = 'Invalid Student ID or password.';
        }
    });

    // --- Ballot Loading and Voting Logic ---
    function loadBallot() {
        const positions = db.getAll('positions');
        const candidates = db.getAll('candidates');

        ballotContainer.innerHTML = ''; // Clear previous content

        positions.forEach(position => {
            const positionSection = document.createElement('div');
            positionSection.className = 'voting-section';
            positionSection.innerHTML = `<h3>${position.name}</h3>`;

            const candidatesList = document.createElement('div');
            candidatesList.className = 'candidate-list';

            const candidatesForPosition = candidates.filter(c => c.position_id === position.id);

            candidatesForPosition.forEach(candidate => {
                const card = document.createElement('div');
                card.className = 'candidate-card';
                card.dataset.candidateId = candidate.id;
                card.dataset.positionId = position.id;
                card.innerHTML = `
                    <img src="${candidate.image_url || 'https://via.placeholder.com/100'}" alt="${candidate.name}" class='candidate-photo'>
                    <h4>${candidate.name}</h4>
                    <p>${candidate.manifesto || 'No manifesto provided.'}</p>
                `;
                card.addEventListener('click', () => handleCandidateSelection(card, position.id, candidate.id));
                candidatesList.appendChild(card);
            });

            positionSection.appendChild(candidatesList);
            ballotContainer.appendChild(positionSection);
        });
    }

    function handleCandidateSelection(selectedCard, positionId, candidateId) {
        // Deselect all other cards in the same position section
        const allCardsInPosition = document.querySelectorAll(`.candidate-card[data-position-id='${positionId}']`);
        allCardsInPosition.forEach(card => card.classList.remove('selected'));

        // Select the clicked card
        selectedCard.classList.add('selected');
        selectedCandidates[positionId] = candidateId;
    }

    // --- Submit Vote Logic ---
    submitVoteBtn.addEventListener('click', () => {
        const currentUser = getCurrentUser();
        const positions = db.getAll('positions');

        if (Object.keys(selectedCandidates).length !== positions.length) {
            voteStatusMessage.textContent = `Please make a selection for all ${positions.length} positions.`;
            voteStatusMessage.style.color = 'orange';
            return;
        }

        voteStatusMessage.textContent = 'Submitting your vote...';
        voteStatusMessage.style.color = 'blue';

        // Loop through selections and cast votes
        Object.values(selectedCandidates).forEach(candidateId => {
            castVote(currentUser.id, candidateId); 
        });

        voteStatusMessage.textContent = 'Vote successfully cast!';
        voteStatusMessage.style.color = 'green';
        submitVoteBtn.disabled = true;

        // Show the 'already voted' screen after a short delay
        setTimeout(() => {
            showVotedScreen();
        }, 1500);
    });
});
