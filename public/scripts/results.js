document.addEventListener('DOMContentLoaded', () => {
    const resultsContainer = document.getElementById('results-container');
    const electionStatusDiv = document.getElementById('election-status');

    function loadResults() {
        // Get results directly from our local 'database' via the function in main.js
        const results = getResults(); 

        resultsContainer.innerHTML = ''; // Clear previous results

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<p>No election results are available at this time.</p>';
            return;
        }

        results.forEach(positionResult => {
            const positionSection = document.createElement('div');
            positionSection.className = 'position-results';

            const title = document.createElement('h3');
            title.textContent = positionResult.position_name;
            positionSection.appendChild(title);

            if (positionResult.candidates.length === 0) {
                positionSection.innerHTML += '<p>No candidates for this position.</p>';
            } else {
                // The getResults function already sorts candidates by votes, so we just display them.
                positionResult.candidates.forEach(candidate => {
                    const candidateDiv = document.createElement('div');
                    candidateDiv.className = 'candidate-result';
                    candidateDiv.innerHTML = `
                        <span class="candidate-name">${candidate.name}</span>
                        <span class="candidate-votes">${candidate.votes} Votes</span>
                    `;
                    positionSection.appendChild(candidateDiv);
                });
            }
            resultsContainer.appendChild(positionSection);
        });
    }

    function loadElectionStatus() {
        // Get election data directly from the local 'database'
        const elections = db.getAll('elections');

        if (elections.length > 0) {
            const lastElection = elections[elections.length - 1];
            const now = new Date();
            const start = new Date(lastElection.start_time);
            const end = new Date(lastElection.end_time);
            let status = '';

            if (now < start) {
                status = `<strong>${lastElection.name}</strong> is scheduled to start on ${start.toLocaleString()}.`;
            } else if (now > end) {
                status = `<strong>${lastElection.name}</strong> has ended on ${end.toLocaleString()}. Results are final.`;
            } else {
                status = `<strong>${lastElection.name}</strong> is currently active and will end on ${end.toLocaleString()}.`;
            }
            electionStatusDiv.innerHTML = status;
        } else {
            electionStatusDiv.innerHTML = 'No election is currently scheduled.';
        }
    }

    // --- Initial Load ---
    // Since all data is local, we just need to load it once.
    loadResults();
    loadElectionStatus();
});
