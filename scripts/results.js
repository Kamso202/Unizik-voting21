// Results Page functionality

let refreshInterval

document.addEventListener("DOMContentLoaded", () => {
  loadResults()

  // Set up auto-refresh every 30 seconds
  refreshInterval = setInterval(loadResults, 30000)
})

// Clean up interval when leaving page
window.addEventListener("beforeunload", () => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

function loadResults() {
  const votes = JSON.parse(localStorage.getItem("votes") || "[]")
  const candidates = JSON.parse(localStorage.getItem("candidates") || "[]")
  const voters = JSON.parse(localStorage.getItem("voters") || "[]")
  const votedUsers = JSON.parse(localStorage.getItem("votedUsers") || "[]")

  // Update statistics
  updateStatistics(votes, voters, votedUsers)

  // Calculate vote counts
  const voteCounts = calculateVoteCounts(votes, candidates)

  // Display results
  displayResults(voteCounts)

  // Show winner if there are votes
  if (votes.length > 0) {
    displayWinner(voteCounts)
  }

  // Create visual chart
  createResultsChart(voteCounts)
}

function updateStatistics(votes, voters, votedUsers) {
  document.getElementById("totalVotes").textContent = votes.length
  document.getElementById("totalVoters").textContent = voters.length

  const turnout = voters.length > 0 ? ((votedUsers.length / voters.length) * 100).toFixed(1) : 0
  document.getElementById("voterTurnout").textContent = `${turnout}%`

  // Election status
  const status = votes.length > 0 ? "In Progress" : "Awaiting Votes"
  document.getElementById("electionStatus").textContent = status
}

function calculateVoteCounts(votes, candidates) {
  const voteCounts = {}

  // Initialize vote counts
  candidates.forEach((candidate) => {
    voteCounts[candidate.id] = {
      candidate: candidate,
      votes: 0,
      percentage: 0,
    }
  })

  // Count votes
  votes.forEach((vote) => {
    if (voteCounts[vote.candidateId]) {
      voteCounts[vote.candidateId].votes++
    }
  })

  // Calculate percentages
  const totalVotes = votes.length
  Object.keys(voteCounts).forEach((candidateId) => {
    if (totalVotes > 0) {
      voteCounts[candidateId].percentage = ((voteCounts[candidateId].votes / totalVotes) * 100).toFixed(1)
    }
  })

  return voteCounts
}

function displayResults(voteCounts) {
  const resultsContainer = document.getElementById("candidateResults")

  if (Object.keys(voteCounts).length === 0) {
    resultsContainer.innerHTML = "<p>No candidates available for this election.</p>"
    return
  }

  // Sort candidates by vote count (descending)
  const sortedResults = Object.values(voteCounts).sort((a, b) => b.votes - a.votes)

  resultsContainer.innerHTML = sortedResults
    .map((result, index) => {
      const isWinner = index === 0 && result.votes > 0
      const cardClass = isWinner ? "result-item winner" : "result-item"

      return `
        <div class="${cardClass}">
          <div class="candidate-info">
            <h4>${result.candidate.name} ${isWinner ? "🏆" : ""}</h4>
            <p><strong>Position:</strong> ${result.candidate.position}</p>
            <p><strong>Department:</strong> ${result.candidate.department}</p>
          </div>
          <div class="vote-stats">
            <div class="vote-count">${result.votes}</div>
            <div style="font-size: 0.9rem; color: #666;">${result.percentage}%</div>
            <div class="vote-bar">
              <div class="vote-progress" style="width: ${result.percentage}%; background-color: ${
                isWinner ? "#28a745" : "#667eea"
              };"></div>
            </div>
          </div>
        </div>
      `
    })
    .join("")
}

function displayWinner(voteCounts) {
  const sortedResults = Object.values(voteCounts).sort((a, b) => b.votes - a.votes)

  if (sortedResults.length === 0 || sortedResults[0].votes === 0) {
    document.getElementById("winnerAnnouncement").style.display = "none"
    return
  }

  const winner = sortedResults[0]
  const winnerDetails = document.getElementById("winnerDetails")

  // Check for tie
  const isTie = sortedResults.length > 1 && sortedResults[0].votes === sortedResults[1].votes

  if (isTie) {
    winnerDetails.innerHTML = `
      <div style="padding: 1.5rem; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px;">
        <h4 style="color: #856404;">Election Tie</h4>
        <p>Multiple candidates are tied with ${winner.votes} votes each. A runoff election may be required.</p>
      </div>
    `
  } else {
    winnerDetails.innerHTML = `
      <div style="padding: 1.5rem; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 8px;">
        <h4 style="color: #155724;">${winner.candidate.name}</h4>
        <p><strong>Position:</strong> ${winner.candidate.position}</p>
        <p><strong>Department:</strong> ${winner.candidate.department}</p>
        <p><strong>Votes Received:</strong> ${winner.votes} (${winner.percentage}%)</p>
        <p><strong>Manifesto:</strong> ${winner.candidate.manifesto}</p>
      </div>
    `
  }

  document.getElementById("winnerAnnouncement").style.display = "block"
}

function createResultsChart(voteCounts) {
  const chartContainer = document.getElementById("resultsChart")
  const sortedResults = Object.values(voteCounts).sort((a, b) => b.votes - a.votes)

  if (sortedResults.length === 0) {
    chartContainer.innerHTML = "<p>No data available for chart.</p>"
    return
  }

  const maxVotes = Math.max(...sortedResults.map((r) => r.votes), 1)

  chartContainer.innerHTML = `
    <div class="chart-container">
      ${sortedResults
        .map((result, index) => {
          const barHeight = (result.votes / maxVotes) * 200 // Max height 200px
          const isWinner = index === 0 && result.votes > 0

          return `
            <div class="chart-bar" style="display: flex; flex-direction: column; align-items: center; margin: 0 1rem;">
              <div class="bar" style="
                width: 60px;
                height: ${barHeight}px;
                background-color: ${isWinner ? "#28a745" : "#667eea"};
                border-radius: 4px 4px 0 0;
                margin-bottom: 0.5rem;
                display: flex;
                align-items: flex-end;
                justify-content: center;
                color: white;
                font-weight: 600;
                padding-bottom: 0.5rem;
              ">
                ${result.votes}
              </div>
              <div style="text-align: center; font-size: 0.8rem; max-width: 80px;">
                <div style="font-weight: 600;">${result.candidate.name}</div>
                <div style="color: #666;">${result.percentage}%</div>
              </div>
            </div>
          `
        })
        .join("")}
    </div>
  `
}

function verifyBlockchain() {
  const votes = JSON.parse(localStorage.getItem("votes") || "[]")
  const verificationResult = document.getElementById("verificationResult")

  if (votes.length === 0) {
    verificationResult.innerHTML = `
      <div style="padding: 1rem; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; color: #856404;">
        No votes to verify. The blockchain is empty.
      </div>
    `
    return
  }

  // Simulate blockchain verification
  let isValid = true
  const verificationDetails = []

  for (let i = 0; i < votes.length; i++) {
    const vote = votes[i]
    const expectedPreviousHash = i === 0 ? "genesis" : votes[i - 1].hash

    if (vote.previousHash !== expectedPreviousHash) {
      isValid = false
      verificationDetails.push(`Block ${i + 1}: Invalid previous hash`)
    } else {
      verificationDetails.push(`Block ${i + 1}: ✓ Valid`)
    }
  }

  const statusColor = isValid ? "#28a745" : "#dc3545"
  const statusText = isValid ? "Blockchain Integrity Verified" : "Blockchain Integrity Compromised"

  verificationResult.innerHTML = `
    <div style="padding: 1rem; background-color: ${
      isValid ? "#d4edda" : "#f8d7da"
    }; border: 1px solid ${isValid ? "#c3e6cb" : "#f5c6cb"}; border-radius: 5px; color: ${statusColor};">
      <h4>${statusText}</h4>
      <p>Total Blocks: ${votes.length}</p>
      <details style="margin-top: 0.5rem;">
        <summary>View Verification Details</summary>
        <ul style="margin-top: 0.5rem; padding-left: 1rem;">
          ${verificationDetails.map((detail) => `<li>${detail}</li>`).join("")}
        </ul>
      </details>
    </div>
  `
}

function showBlockchainExplorer() {
  const votes = JSON.parse(localStorage.getItem("votes") || "[]")

  if (votes.length === 0) {
    showMessage("No blocks to display. The blockchain is empty.", "info")
    return
  }

  const explorerHtml = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 1000; max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;">
      <h3 style="margin-bottom: 1rem;">🔗 Blockchain Explorer</h3>
      <div style="margin-bottom: 1rem;">
        <strong>Total Blocks:</strong> ${votes.length} | 
        <strong>Chain Status:</strong> <span style="color: #28a745;">Active</span>
      </div>
      <div style="max-height: 400px; overflow-y: auto;">
        ${votes
          .map(
            (vote, index) => `
          <div style="border: 1px solid #e9ecef; border-radius: 5px; padding: 1rem; margin-bottom: 1rem; background-color: #f8f9fa;">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
              <strong>Block #${vote.blockIndex}</strong>
              <span style="font-size: 0.8rem; color: #666;">${new Date(vote.timestamp).toLocaleString()}</span>
            </div>
            <div style="font-family: monospace; font-size: 0.8rem; color: #666;">
              <div><strong>Block ID:</strong> ${vote.blockId}</div>
              <div><strong>Voter Hash:</strong> ${vote.voterId}</div>
              <div><strong>Candidate ID:</strong> ${vote.candidateId}</div>
              <div><strong>Block Hash:</strong> ${vote.hash}</div>
              <div><strong>Previous Hash:</strong> ${vote.previousHash}</div>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>
      <button onclick="closeBlockchainExplorer()" class="btn btn-primary" style="width: 100%; margin-top: 1rem;">
        Close Explorer
      </button>
    </div>
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;" onclick="closeBlockchainExplorer()"></div>
  `

  const explorerDiv = document.createElement("div")
  explorerDiv.id = "blockchainExplorer"
  explorerDiv.innerHTML = explorerHtml
  document.body.appendChild(explorerDiv)
}

function closeBlockchainExplorer() {
  const explorer = document.getElementById("blockchainExplorer")
  if (explorer) {
    explorer.remove()
  }
}

function refreshResults() {
  loadResults()
  showMessage("Results refreshed successfully", "success")
}

// Utility functions
function showMessage(message, type = "info") {
  const messageDiv = document.createElement("div")
  messageDiv.className = `message ${type}`
  messageDiv.textContent = message
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 2rem;
    border-radius: 5px;
    color: white;
    font-weight: 600;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `

  switch (type) {
    case "success":
      messageDiv.style.backgroundColor = "#28a745"
      break
    case "error":
      messageDiv.style.backgroundColor = "#dc3545"
      break
    case "warning":
      messageDiv.style.backgroundColor = "#ffc107"
      messageDiv.style.color = "#212529"
      break
    default:
      messageDiv.style.backgroundColor = "#17a2b8"
  }

  document.body.appendChild(messageDiv)

  setTimeout(() => {
    messageDiv.remove()
  }, 3000)
}
