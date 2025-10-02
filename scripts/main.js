// Main JavaScript file for the Blockchain Voting System

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

// Initialize application data structures
function initializeApp() {
  // Initialize localStorage if not exists
  if (!localStorage.getItem("voters")) {
    localStorage.setItem("voters", JSON.stringify([]))
  }

  if (!localStorage.getItem("candidates")) {
    // Initialize with sample candidates
    const sampleCandidates = [
      {
        id: "candidate_1",
        name: "John Doe",
        position: "Student Union President",
        department: "Computer Science",
        manifesto: "Committed to improving student welfare and academic excellence.",
      },
      {
        id: "candidate_2",
        name: "Jane Smith",
        position: "Student Union President",
        department: "Engineering",
        manifesto: "Focused on infrastructure development and student representation.",
      },
    ]
    localStorage.setItem("candidates", JSON.stringify(sampleCandidates))
  }

  if (!localStorage.getItem("votes")) {
    localStorage.setItem("votes", JSON.stringify([]))
  }

  if (!localStorage.getItem("votedUsers")) {
    localStorage.setItem("votedUsers", JSON.stringify([]))
  }

  // Initialize admin account
  if (!localStorage.getItem("admin")) {
    const admin = {
      username: "admin",
      password: "admin123",
    }
    localStorage.setItem("admin", JSON.stringify(admin))
  }
}

// Utility functions
function generateHash(data) {
  // Simple hash function for blockchain simulation
  let hash = 0
  const str = JSON.stringify(data) + Date.now()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser") || "null")
}

function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user))
}

function logout() {
  sessionStorage.removeItem("currentUser")
  window.location.href = "index.html"
}

function isLoggedIn() {
  return getCurrentUser() !== null
}

function isAdmin() {
  const user = getCurrentUser()
  return user && user.role === "admin"
}

function showMessage(message, type = "info") {
  // Create and show a temporary message
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

// Add CSS animation for messages
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`
document.head.appendChild(style)

// Navigation highlighting
function updateNavigation() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html"
  const navLinks = document.querySelectorAll(".nav-link")

  navLinks.forEach((link) => {
    link.classList.remove("active")
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active")
    }
  })
}

// Call updateNavigation when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", updateNavigation)
} else {
  updateNavigation()
}
