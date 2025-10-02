
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the entire application
    initializeApp();
});

function initializeApp() {
    // --- Centralized Database in localStorage ---
    const AppDB = {
        admins: [],
        voters: [],
        positions: [],
        candidates: [],
        elections: [],
        votes: [],
    };

    // Check if the database already exists
    if (!localStorage.getItem('AppDB')) {
        console.log('Initializing new database in localStorage...');

        // Create a default admin user
        AppDB.admins.push({
            id: 'admin01',
            username: 'admin',
            password: 'admin123' // In a real app, this should be hashed.
        });

        // Add sample positions
        AppDB.positions.push({ id: 'pos01', name: 'Student Union President' });
        AppDB.positions.push({ id: 'pos02', name: 'Treasurer' });

        // Add sample candidates
        AppDB.candidates.push({
            id: 'cand01',
            name: 'Alice Johnson',
            position_id: 'pos01',
            image_url: 'https://i.pravatar.cc/150?img=1',
            manifesto: 'Leading with integrity and vision.',
            votes: 0
        });
        AppDB.candidates.push({
            id: 'cand02',
            name: 'Bob Williams',
            position_id: 'pos01',
            image_url: 'https://i.pravatar.cc/150?img=2',
            manifesto: 'A new voice for a new era.',
            votes: 0
        });

        // Save the initial state to localStorage
        localStorage.setItem('AppDB', JSON.stringify(AppDB));
    }
}

// --- UTILITY & DATABASE FUNCTIONS ---

const db = {
    get: () => JSON.parse(localStorage.getItem('AppDB')) || {},
    set: (data) => localStorage.setItem('AppDB', JSON.stringify(data)),
    
    getAll: (table) => db.get()[table] || [],
    add: (table, record) => {
        const data = db.get();
        if (!data[table]) data[table] = [];
        record.id = record.id || `id_${Date.now()}_${Math.random()}`; // Simple unique ID
        data[table].push(record);
        db.set(data);
    },
    update: (table, id, updatedRecord) => {
        const data = db.get();
        const records = data[table] || [];
        const index = records.findIndex(r => r.id === id);
        if (index !== -1) {
            records[index] = { ...records[index], ...updatedRecord };
            db.set(data);
        }
    }
};

// --- AUTHENTICATION ---

function login(username, password, role) {
    let user = null;
    if (role === 'admin') {
        user = db.getAll('admins').find(u => u.username === username && u.password === password);
    } else {
        user = db.getAll('voters').find(u => u.student_id === username && u.password === password);
    }

    if (user) {
        sessionStorage.setItem('currentUser', JSON.stringify({ ...user, role }));
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function getCurrentUser() {
    return JSON.parse(sessionStorage.getItem('currentUser') || 'null');
}

function isLoggedIn() {
    return !!getCurrentUser();
}

function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// --- ADMIN FUNCTIONS ---

function createElection(name, startTime, endTime) {
    if (!isAdmin()) return { success: false, message: 'Unauthorized' };
    
    db.add('elections', { name, start_time: startTime, end_time: endTime });
    return { success: true, message: 'Election created successfully.' };
}

function registerCandidate(name, position_id, image_url, manifesto) {
    if (!isAdmin()) return { success: false, message: 'Unauthorized' };

    db.add('candidates', { name, position_id, image_url, manifesto, votes: 0 });
    return { success: true, message: 'Candidate registered successfully.' };
}

function registerVoter(student_id, password, metamask_address) {
     if (!isAdmin()) return { success: false, message: 'Unauthorized' };
    
    const existingVoter = db.getAll('voters').find(v => v.student_id === student_id);
    if (existingVoter) {
        return { success: false, message: 'A voter with this Student ID already exists.' };
    }
    
    db.add('voters', { student_id, password, metamask_address, is_voted: false });
    return { success: true, message: 'Voter registered successfully.' };
}

// --- VOTER FUNCTIONS ---

function castVote(voterId, candidateId) {
    const user = getCurrentUser();
    if (!user || user.id !== voterId) return { success: false, message: 'Authentication error.' };
    
    const voter = db.getAll('voters').find(v => v.id === voterId);
    if (voter.is_voted) {
        return { success: false, message: 'You have already voted.' };
    }

    // Add the vote record
    db.add('votes', { voter_id: voterId, candidate_id: candidateId, timestamp: new Date().toISOString() });
    
    // Update the candidate's vote count
    const candidate = db.getAll('candidates').find(c => c.id === candidateId);
    if (candidate) {
        db.update('candidates', candidateId, { votes: (candidate.votes || 0) + 1 });
    }
    
    // Mark the voter as having voted
    db.update('voters', voterId, { is_voted: true });
    
    return { success: true, message: 'Your vote has been cast successfully!' };
}

// --- PUBLIC/SHARED FUNCTIONS ---

function getResults() {
    const positions = db.getAll('positions');
    const candidates = db.getAll('candidates');

    const results = positions.map(position => {
        const positionCandidates = candidates
            .filter(c => c.position_id === position.id)
            .sort((a, b) => b.votes - a.votes);
        return {
            position_name: position.name,
            candidates: positionCandidates
        };
    });
    return results;
}

// --- UI UTILITY ---

function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    const styles = {
        position: 'fixed', top: '20px', right: '20px', padding: '1rem 2rem',
        borderRadius: '5px', color: 'white', fontWeight: '600',
        zIndex: '1000', transition: 'opacity 0.5s',
        backgroundColor: '#17a2b8' // Default info
    };

    if (type === 'success') styles.backgroundColor = '#28a745';
    if (type === 'error') styles.backgroundColor = '#dc3545';

    Object.assign(messageDiv.style, styles);
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => messageDiv.remove(), 500);
    }, 3000);
}
