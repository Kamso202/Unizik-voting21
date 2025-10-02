const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret';

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// --- Mock Database ---
let db = {
    admins: [],
    voters: [],
    positions: [],
    candidates: [],
    votes: [],
    elections: []
};

// --- Helper Functions ---
const findAdminByUsername = (username) => db.admins.find(admin => admin.username === username);
const findVoterByStudentId = (studentId) => db.voters.find(voter => voter.student_id === studentId);

// --- API Routes ---

// Admin Authentication
app.post('/api/admin/register', async (req, res) => {
    const { username, password } = req.body;
    if (findAdminByUsername(username)) {
        return res.status(400).json({ message: 'Admin already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = { id: db.admins.length + 1, username, password: hashedPassword };
    db.admins.push(newAdmin);
    res.status(201).json({ message: 'Admin registered successfully' });
});

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const admin = findAdminByUsername(username);
    if (!admin || !await bcrypt.compare(password, admin.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token });
});

// Voter Authentication
app.post('/api/voters/register', (req, res) => {
    const { student_id, metamask_address, password } = req.body;
    if (findVoterByStudentId(student_id)) {
        return res.status(400).json({ message: 'Voter already registered' });
    }
    const hashedPassword = bcrypt.hashSync(password, 8);
    const newVoter = {
        id: db.voters.length + 1,
        student_id,
        metamask_address,
        password: hashedPassword,
        is_voted: false
    };
    db.voters.push(newVoter);
    res.status(201).json({ message: 'Voter registered successfully' });
});


app.post('/api/voters/login', (req, res) => {
    const { student_id, password } = req.body;
    const voter = findVoterByStudentId(student_id);
    if (!voter || !bcrypt.compareSync(password, voter.password)) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
     if (voter.is_voted) {
        return res.status(403).json({ message: 'You have already voted.' });
    }
    const token = jwt.sign({ id: voter.id, student_id: voter.student_id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, student_id });
});

// Elections
app.post('/api/elections', (req, res) => {
    const { name, start_time, end_time } = req.body;
    const newElection = { id: db.elections.length + 1, name, start_time, end_time };
    db.elections.push(newElection);
    res.status(201).json(newElection);
});

app.get('/api/elections', (req, res) => {
    res.json(db.elections);
});

// Positions
app.post('/api/positions', (req, res) => {
    const { name } = req.body;
    if (db.positions.find(p => p.name === name)) {
        return res.status(400).json({ message: 'Position already exists' });
    }
    const newPosition = { id: db.positions.length + 1, name };
    db.positions.push(newPosition);
    res.status(201).json(newPosition);
});

app.get('/api/positions', (req, res) => {
    res.json(db.positions);
});


// Candidates
app.post('/api/candidates', (req, res) => {
    const { name, position_id, image_url, manifesto } = req.body;
    const newCandidate = { id: db.candidates.length + 1, name, position_id, image_url, manifesto, votes: 0 };
    db.candidates.push(newCandidate);
    res.status(201).json(newCandidate);
});

app.get('/api/candidates', (req, res) => {
    const candidatesWithPositions = db.candidates.map(candidate => {
        const position = db.positions.find(p => p.id === candidate.position_id);
        return { ...candidate, position_name: position ? position.name : 'Unknown' };
    });
    res.json(candidatesWithPositions);
});

// Votes
app.post('/api/votes/cast', (req, res) => {
    const { voter_id, candidate_id } = req.body;
    const voter = db.voters.find(v => v.id === voter_id);
    if (!voter) return res.status(404).json({ message: 'Voter not found' });
    if (voter.is_voted) return res.status(400).json({ message: 'Voter has already cast their vote' });

    const candidate = db.candidates.find(c => c.id === candidate_id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Simple hash for block simulation
    const previous_hash = db.votes.length > 0 ? db.votes[db.votes.length - 1].transaction_hash : '0';
    const transaction_hash = bcrypt.hashSync(`${voter_id}-${candidate_id}-${Date.now()}`, 1);

    const newVote = { id: db.votes.length + 1, voter_id, candidate_id, previous_hash, transaction_hash, created_at: new Date().toISOString() };
    db.votes.push(newVote);

    voter.is_voted = true;
    candidate.votes++;

    res.status(201).json({ message: 'Vote cast successfully', vote: newVote });
});

// Results
app.get('/api/results', (req, res) => {
    const results = db.positions.map(position => {
        const positionCandidates = db.candidates
            .filter(c => c.position_id === position.id)
            .map(candidate => ({
                id: candidate.id,
                name: candidate.name,
                votes: candidate.votes
            }))
            .sort((a, b) => b.votes - a.votes);

        return {
            position_id: position.id,
            position_name: position.name,
            candidates: positionCandidates
        };
    });
    res.json(results);
});

// --- Server Initialization ---

// Default admin
bcrypt.hash('admin123', 10).then(password => {
    db.admins.push({ id: 1, username: 'admin', password });
});

app.listen(PORT, () => {
    console.log(`Mock server running on http://localhost:${PORT}`);
});
