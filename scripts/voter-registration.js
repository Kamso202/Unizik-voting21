// Voter Registration functionality

document.addEventListener("DOMContentLoaded", () => {
  const voterRegistrationForm = document.getElementById("voterRegistrationForm")

  if (voterRegistrationForm) {
    voterRegistrationForm.addEventListener("submit", handleVoterRegistration)
  }
})

function handleVoterRegistration(event) {
  event.preventDefault()

  const formData = {
    fullName: document.getElementById("fullName").value.trim(),
    matricNumber: document.getElementById("matricNumber").value.trim(),
    department: document.getElementById("department").value,
    email: document.getElementById("email").value.trim(),
    password: document.getElementById("password").value,
    confirmPassword: document.getElementById("confirmPassword").value,
  }

  // Validate form data
  const validation = validateRegistrationData(formData)
  if (!validation.isValid) {
    showMessage(validation.message, "error")
    return
  }

  // Check if voter already exists
  const existingVoters = JSON.parse(localStorage.getItem("voters") || "[]")
  const existingVoter = existingVoters.find(
    (voter) => voter.matricNumber === formData.matricNumber || voter.email === formData.email,
  )

  if (existingVoter) {
    showMessage("A voter with this matric number or email already exists", "error")
    return
  }

  // Create new voter object
  const newVoter = {
    id: generateHash({ matricNumber: formData.matricNumber, timestamp: Date.now() }),
    fullName: formData.fullName,
    matricNumber: formData.matricNumber,
    department: formData.department,
    email: formData.email,
    password: formData.password, // In a real system, this would be hashed
    registrationDate: new Date().toISOString(),
    hasVoted: false,
  }

  // Add voter to localStorage
  existingVoters.push(newVoter)
  localStorage.setItem("voters", JSON.stringify(existingVoters))

  showMessage("Registration successful! You can now login to vote.", "success")

  // Clear form
  document.getElementById("voterRegistrationForm").reset()

  // Redirect to login page after a delay
  setTimeout(() => {
    window.location.href = "voter-login.html"
  }, 2000)
}

function validateRegistrationData(data) {
  // Check if all fields are filled
  if (
    !data.fullName ||
    !data.matricNumber ||
    !data.department ||
    !data.email ||
    !data.password ||
    !data.confirmPassword
  ) {
    return { isValid: false, message: "Please fill in all fields" }
  }

  // Validate matric number format
  const matricPattern = /^[0-9]{4}\/[0-9]{6}$/
  if (!matricPattern.test(data.matricNumber)) {
    return { isValid: false, message: "Invalid matric number format. Use format: YYYY/XXXXXX" }
  }

  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(data.email)) {
    return { isValid: false, message: "Invalid email format" }
  }

  // Validate password length
  if (data.password.length < 6) {
    return { isValid: false, message: "Password must be at least 6 characters long" }
  }

  // Check if passwords match
  if (data.password !== data.confirmPassword) {
    return { isValid: false, message: "Passwords do not match" }
  }

  return { isValid: true, message: "Valid" }
}

// Declare showMessage function
function showMessage(message, type) {
  const messageElement = document.createElement("div")
  messageElement.className = `message ${type}`
  messageElement.textContent = message
  document.body.appendChild(messageElement)

  // Remove message after 3 seconds
  setTimeout(() => {
    document.body.removeChild(messageElement)
  }, 3000)
}

// Declare generateHash function
function generateHash(input) {
  let hash = 0
  for (let i = 0; i < input.matricNumber.length; i++) {
    const char = input.matricNumber.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  hash += input.timestamp
  return hash.toString()
}
