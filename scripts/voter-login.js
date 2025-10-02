document.addEventListener('DOMContentLoaded', async () => {
    const ballotContainer = document.getElementById('ballot-container');

    // Fetch ballot data from the backend
    try {
        const response = await fetch('http://localhost:3000/api/ballot');
        const positions = await response.json();

        positions.forEach(positionData => {
            const section = document.createElement('section');
            section.className = 'voting-section';
            section.innerHTML = <h3>${positionData.position}</h3>;

            const candidateList = document.createElement('div');
            candidateList.className = 'candidate-list';

            positionData.candidates.forEach(candidate => {
                const card = document.createElement('div');
                card.className = 'candidate-card';
                card.innerHTML = `
                    <img src="${candidate.image_url}" alt="${candidate.name}" class="candidate-photo">
                    <h4>${candidate.name}</h4>
                    <p>Manifesto: ${candidate.manifesto}</p>
                    <button class="vote-button" data-candidate-id="${candidate.id}">Vote</button>
                `;
                candidateList.appendChild(card);
            });
            section.appendChild(candidateList);
            ballotContainer.appendChild(section);
        });
    } catch (error) {
        console.error('Failed to fetch ballot data:', error);
        ballotContainer.innerHTML = '<p>Failed to load ballot. Please check the server.</p>';
    }
});