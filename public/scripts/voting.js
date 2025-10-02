// Voting System with Blockchain Simulation

let selectedCandidate = null

document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in as voter
  const currentUser = getCurrentUser()
  if (!currentUser || currentUser.role !== "voter") {
    showMessage("Access denied. Please login as a voter.", "error")
    setTimeout(() => {
      window.location.href = "voter-login.html"
    }, 2000)
    return
  }

  // Initialize voting interface
  initializeVoting()
})

function initializeVoting() {
  const currentUser = getCurrentUser()

  // Update welcome message
  document.getElementById("voterWelcome").textContent = `Welcome, ${currentUser.fullName}!`

  // Check voting status
  checkVotingStatus()

  // Load candidates
  loadCandidatesForVoting()

  // Set up event listeners
  setupEventListeners()
}

function checkVotingStatus() {
  const currentUser = getCurrentUser()
  const votedUsers = JSON.parse(localStorage.getItem("votedUsers") || "[]")
  const hasVoted = votedUsers.includes(currentUser.id)

  const statusContent = document.getElementById("statusContent")
  const candidatesSection = document.getElementById("candidatesSection")

  if (hasVoted) {
    statusContent.innerHTML = `
      <div style="padding: 1rem; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; color: #155724;">
        <h4>✅ Vote Successfully Cast</h4>
        <p>You have already participated in this election. Your vote has been securely recorded on the blockchain.</p>
        <p><strong>Voter ID:</strong> ${currentUser.id}</p>
        <p><strong>Vote Time:</strong> ${getVoteTimestamp(currentUser.id)}</p>
      </div>
    `
    candidatesSection.style.display = "none"
  } else {
    statusContent.innerHTML = `
      <div style="padding: 1rem; background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; color: #0c5460;">
        <h4>🗳️ Ready to Vote</h4>
        <p>You have not voted yet. Please select a candidate below to cast your vote.</p>
        <p><strong>Voter ID:</strong> ${currentUser.id}</p>
        <p><strong>Department:</strong> ${currentUser.department}</p>
      </div>
    `
  }
}

function getVoteTimestamp(voterId) {
  const votes = JSON.parse(localStorage.getItem("votes") || "[]")
  const vote = votes.find((v) => v.voterId === voterId)
  return vote ? new Date(vote.timestamp).toLocaleString() : "Unknown"
}

function loadCandidatesForVoting() {
  const candidates = JSON.parse(localStorage.getItem("candidates") || "[]")
  const candidatesList = document.getElementById("candidatesList")

  if (candidates.length === 0) {
    candidatesList.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #666;">
        <h4>No Candidates Available</h4>
        <p>There are currently no candidates registered for this election.</p>
      </div>
    `
    return
  }

  candidatesList.innerHTML = candidates
    .map(
      (candidate) => `
        <div class="candidate-card" data-candidate-id="${candidate.id}">
          <div class="candidate-info">
            <h4>${candidate.name}</h4>
            <p><strong>Position:</strong> ${candidate.position}</p>
            <p><strong>Department:</strong> ${candidate.department}</p>
            <p><strong>Manifesto:</strong> ${candidate.manifesto}</p>
          </div>
          <div class="candidate-actions">
            <button class="btn btn-primary vote-btn" onclick="selectCandidate('${candidate.id}', '${candidate.name}')">
              Select
            </button>
          </div>
        </div>
      `,
    )
    .join("")
}

function selectCandidate(candidateId, candidateName) {
  selectedCandidate = { id: candidateId, name: candidateName }

  // Update UI to show selection
  document.querySelectorAll(".candidate-card").forEach((card) => {
    card.classList.remove("selected")
  })

  document.querySelector(`[data-candidate-id="${candidateId}"]`).classList.add("selected")

  // Show confirmation dialog
  document.getElementById("selectedCandidateName").textContent = candidateName
  document.getElementById("voteConfirmation").style.display = "block"

  // Scroll to confirmation
  document.getElementById("voteConfirmation").scrollIntoView({ behavior: "smooth" })
}

function setupEventListeners() {
  document.getElementById("confirmVoteBtn").addEventListener("click", confirmVote)
  document.getElementById("cancelVoteBtn").addEventListener("click", cancelVote)
}

function confirmVote() {
  if (!selectedCandidate) {
    showMessage("Please select a candidate first", "error")
    return
  }

  const currentUser = getCurrentUser()

  // Check if user has already voted (double-check)
  const votedUsers = JSON.parse(localStorage.getItem("votedUsers") || "[]")
  if (votedUsers.includes(currentUser.id)) {
    showMessage("You have already voted in this election", "error")
    return
  }

  // Create blockchain vote block
  const voteBlock = createVoteBlock(currentUser.id, selectedCandidate.id)

  // Store vote in blockchain (localStorage simulation)
  const votes = JSON.parse(localStorage.getItem("votes") || "[]")
  votes.push(voteBlock)
  localStorage.setItem("votes", JSON.stringify(votes))

  // Mark user as voted
  votedUsers.push(currentUser.id)
  localStorage.setItem("votedUsers", JSON.stringify(votedUsers))

  // Show success message
  showMessage("Vote cast successfully! Your vote has been recorded on the blockchain.", "success")

  // Update UI
  setTimeout(() => {
    checkVotingStatus()
    document.getElementById("voteConfirmation").style.display = "none"
  }, 2000)

  // Show blockchain confirmation
  showBlockchainConfirmation(voteBlock)
}

function cancelVote() {
  selectedCandidate = null

  // Remove selection styling
  document.querySelectorAll(".candidate-card").forEach((card) => {
    card.classList.remove("selected")
  })

  // Hide confirmation dialog
  document.getElementById("voteConfirmation").style.display = "none"
}

function createVoteBlock(voterId, candidateId) {
  const timestamp = new Date().toISOString()
  const votes = JSON.parse(localStorage.getItem("votes") || "[]")

  // Get previous block hash (blockchain simulation)
  const previousHash = votes.length > 0 ? votes[votes.length - 1].hash : "genesis"

  // Create block data
  const blockData = {
    blockId: generateHash({ voterId, candidateId, timestamp }),
    voterId: hashVoterId(voterId), // Hash voter ID for privacy
    candidateId: candidateId,
    timestamp: timestamp,
    previousHash: previousHash,
    blockIndex: votes.length + 1,
  }

  // Generate block hash
  blockData.hash = generateBlockHash(blockData)

  return blockData
}

function hashVoterId(voterId) {
  // Simple hash function to anonymize voter ID
  let hash = 0
  for (let i = 0; i < voterId.length; i++) {
    const char = voterId.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

function generateBlockHash(blockData) {
  // Generate hash for the entire block
  const dataString = JSON.stringify({
    blockId: blockData.blockId,
    voterId: blockData.voterId,
    candidateId: blockData.candidateId,
    timestamp: blockData.timestamp,
    previousHash: blockData.previousHash,
    blockIndex: blockData.blockIndex,
  })

  return generateHash({ data: dataString, salt: "blockchain_vote" })
}

function showBlockchainConfirmation(voteBlock) {
  const confirmationHtml = `
    <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 1000; max-width: 500px; width: 90%;">
      <h3 style="color: #28a745; margin-bottom: 1rem;">🔗 Vote Recorded on Blockchain</h3>
      <div style="background-color: #f8f9fa; padding: 1rem; border-radius: 5px; font-family: monospace; font-size: 0.8rem; margin-bottom: 1rem;">
        <strong>Block Details:</strong><br>
        Block ID: ${voteBlock.blockId}<br>
        Block Index: #${voteBlock.blockIndex}<br>
        Voter Hash: ${voteBlock.voterId}<br>
        Timestamp: ${voteBlock.timestamp}<br>
        Block Hash: ${voteBlock.hash}<br>
        Previous Hash: ${voteBlock.previousHash}
      </div>
      <p style="color: #666; margin-bottom: 1rem;">
        Your vote is now permanently recorded and cannot be altered or deleted.
      </p>
      <button onclick="closeBlockchainConfirmation()" class="btn btn-primary" style="width: 100%;">
        Continue
      </button>
    </div>
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;" onclick="closeBlockchainConfirmation()"></div>
  `

  const confirmationDiv = document.createElement("div")
  confirmationDiv.id = "blockchainConfirmation"
  confirmationDiv.innerHTML = confirmationHtml
  document.body.appendChild(confirmationDiv)
}

function closeBlockchainConfirmation() {
  const confirmation = document.getElementById("blockchainConfirmation")
  if (confirmation) {
    confirmation.remove()
  }
}

// Utility functions
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null")
}

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

function generateHash(data) {
  let hash = 0
  const str = JSON.stringify(data)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

function logout() {
  sessionStorage.removeItem("currentUser")
  showMessage("Logged out successfully", "success")
  setTimeout(() => {
    window.location.href = "index.html"
  }, 1500)
}
