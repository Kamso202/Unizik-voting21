document.addEventListener('DOMContentLoaded', () => {
    const blockchainContainer = document.getElementById('blockchain-container');

    function loadBlockchain() {
        // Get all votes, voters, and candidates from our local database
        const votes = db.getAll('votes');
        const voters = db.getAll('voters');
        const candidates = db.getAll('candidates');

        blockchainContainer.innerHTML = ''; // Clear previous content

        if (votes.length === 0) {
            blockchainContainer.innerHTML = '<p>No votes have been cast yet. The blockchain is empty.</p>';
            return;
        }

        // Create a lookup map for faster data retrieval
        const voterMap = new Map(voters.map(v => [v.id, v]));
        const candidateMap = new Map(candidates.map(c => [c.id, c]));

        // We will create a simplified hash for demonstration purposes
        let previousHash = '0';

        votes.forEach((vote, index) => {
            const voter = voterMap.get(vote.voter_id);
            const candidate = candidateMap.get(vote.candidate_id);
            
            // Combine the data to create a hash for the current block
            const blockData = { 
                index: index + 1,
                timestamp: vote.timestamp,
                voterId: voter ? voter.student_id : 'Unknown',
                candidateName: candidate ? candidate.name : 'Unknown',
                previousHash 
            };
            
            // In a real blockchain, this would be a cryptographic hash (e.g., SHA-256)
            const currentHash = btoa(JSON.stringify(blockData)); // Simple Base64 encoding for demo

            const block = document.createElement('div');
            block.className = 'blockchain-block';
            block.innerHTML = `
                <div class="block-header">Block #${index + 1}</div>
                <div class="block-body">
                    <p><strong>Timestamp:</strong> ${new Date(vote.timestamp).toLocaleString()}</p>
                    <p><strong>Voter ID (Hashed):</strong> ${voter ? btoa(voter.student_id).substring(0, 20) : 'N/A'}...</p>
                    <p><strong>Voted for:</strong> ${candidate ? candidate.name : 'N/A'}</p>
                    <p><strong>Hash:</strong> <span class="hash">${currentHash.substring(0, 40)}...</span></p>
                    <p><strong>Previous Hash:</strong> <span class="hash">${previousHash.substring(0, 40)}...</span></p>
                </div>
            `;
            blockchainContainer.appendChild(block);

            // The current hash becomes the next block's previous hash
            previousHash = currentHash;
        });
    }

    // Initial Load
    loadBlockchain();
});
