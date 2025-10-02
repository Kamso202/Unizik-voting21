const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ....other imports

// (Removed duplicate express, cors, and app declarations)

// New code to serve static files
app.use(express.static('.'));

// Database connection details
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'unizik_voting',
    password: '2004', // REPLACE WITH YOUR PASSWORD
    port: 5432,
});

// A secret key for JWT (JSON Web Tokens)
const jwtSecret = process.env.JWT_SECRET || 'your-very-strong-secret-key';

// Middleware to check for a valid admin token
const authenticateAdminToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401); // If no token

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) return res.sendStatus(403); // If token is not valid
        req.user = user;
        next();
    });
};

// API Endpoints for Admin Management

// Admin Registration (only for initial setup)
app.post('/api/admin/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO admins (username, password) VALUES ($1, $2) RETURNING *';
        const result = await pool.query(query, [username, hashedPassword]);
        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register admin' });
    }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const query = 'SELECT * FROM admins WHERE username = $1';
        const result = await pool.query(query, [username]);
        const admin = result.rows[0];
        if (!admin) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const token = jwt.sign({ id: admin.id, username: admin.username }, jwtSecret, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Add a new position (Admin only)
app.post('/api/positions', authenticateAdminToken, async (req, res) => {
    try {
        const { name } = req.body;
        const query = 'INSERT INTO positions(name) VALUES($1) RETURNING *';
        const result = await pool.query(query, [name]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add position' });
    }
});

// Add a new candidate (Admin only)
app.post('/api/candidates', authenticateAdminToken, async (req, res) => {
    try {
        const { name, position_id, image_url, manifesto } = req.body;
        const query = 'INSERT INTO candidates(name, position_id, image_url, manifesto) VALUES($1, $2, $3, $4) RETURNING *';
        const result = await pool.query(query, [name, position_id, image_url, manifesto]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add candidate' });
    }
});

// API Endpoints for Voters and Voting

// Voter Registration
app.post('/api/voter/register', async (req, res) => {
    try {
        const { student_id, metamask_address, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO voters (student_id, metamask_address, password) VALUES ($1, $2, $3) RETURNING *';
        const result = await pool.query(query, [student_id, metamask_address, hashedPassword]);
        res.status(201).json({ message: 'Voter registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to register voter' });
    }
});

// Voter Login
app.post('/api/voter/login', async (req, res) => {
    try {
        const { student_id, password } = req.body;
        const query = 'SELECT * FROM voters WHERE student_id = $1';
        const result = await pool.query(query, [student_id]);
        const voter = result.rows[0];
        if (!voter) {
            return res.status(400).json({ error: 'Invalid student ID or password' });
        }
        const isMatch = await bcrypt.compare(password, voter.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid student ID or password' });
        }
        const token = jwt.sign({ id: voter.id, student_id: voter.student_id }, jwtSecret, { expiresIn: '1h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Cast a vote
app.post('/api/vote', async (req, res) => {
    try {
        const { voter_id: reqVoterId, candidate_id: reqCandidateId } = req.body;

        // Check if voter has already voted
        const voterCheck = await pool.query('SELECT is_voted FROM voters WHERE id = $1', [reqVoterId]);
        if (voterCheck.rows[0].is_voted) {
            return res.status(400).json({ error: 'Voter has already cast a vote.' });
        }

        // Generate the transaction hash
        const previousVoteQuery = await pool.query('SELECT transaction_hash FROM votes ORDER BY id DESC LIMIT 1');
        const previousHash = previousVoteQuery.rows.length > 0 ? previousVoteQuery.rows[0].transaction_hash : '0000000000000000000000000000000000000000000000000000000000000000';
        const timestamp = new Date().toISOString();
        const transactionData = `${reqVoterId}-${reqCandidateId}-${timestamp}-${previousHash}`;
        const transactionHash = crypto.createHash('sha256').update(transactionData).digest('hex');

        // Insert the vote into the "blockchain"
        const voteQuery = 'INSERT INTO votes (voter_id, candidate_id, previous_hash, transaction_hash) VALUES ($1, $2, $3, $4) RETURNING *';
        await pool.query(voteQuery, [reqVoterId, reqCandidateId, previousHash, transactionHash]);

        // Mark the voter as having voted
        await pool.query('UPDATE voters SET is_voted = TRUE WHERE id = $1', [reqVoterId]);

        res.status(201).json({ message: 'Vote cast successfully!', transactionHash });
    } catch (err) {
        res.status(500).json({ error: 'Failed to cast vote' });
    }
});

// Get candidates by position for the voting page
app.get('/api/ballot', async (req, res) => {
    try {
        const query = `
            SELECT
                p.name AS position_name,
                c.id AS candidate_id,
                c.name AS candidate_name,
                c.image_url,
                c.manifesto
            FROM
                candidates c
            JOIN
                positions p ON c.position_id = p.id
            ORDER BY
                p.id, c.id;
        `;
        const result = await pool.query(query);
        
        // Group candidates by position
        const positions = {};
        result.rows.forEach(row => {
            if (!positions[row.position_name]) {
                positions[row.position_name] = [];
            }
            positions[row.position_name].push({
                id: row.candidate_id,
                name: row.candidate_name,
                image_url: row.image_url,
                manifesto: row.manifesto
            });
        });
        
        const ballotData = Object.keys(positions).map(key => ({
            position: key,
            candidates: positions[key]
        }));
        
        res.json(ballotData);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get ballot data' });
    }
});

// Get election results
app.get('/api/results', async (req, res) => {
    try {
        const query = `
            SELECT
                p.name AS position_name,
                c.name AS candidate_name,
                COUNT(v.id) AS vote_count
            FROM
                votes v
            JOIN
                candidates c ON v.candidate_id = c.id
            JOIN
                positions p ON c.position_id = p.id
            GROUP BY
                p.name, c.name
            ORDER BY
                p.name, vote_count DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get results' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// API endpoint to set the election period
app.post('/api/election/set', authenticateAdminToken, async (req, res) => {
    try {
        const { name, start_time, end_time } = req.body;
        // Upsert: Try to update an existing election or insert a new one
        const query = `
            INSERT INTO elections (name, start_time, end_time)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO UPDATE SET
                start_time = EXCLUDED.start_time,
                end_time = EXCLUDED.end_time
            RETURNING *;
        `;
        const result = await pool.query(query, [name, start_time, end_time]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to set election period' });
    }
});

// API endpoint to get the election details
app.get('/api/election/get', authenticateAdminToken, async (req, res) => {
    try {
        const query = 'SELECT name, start_time, end_time FROM elections ORDER BY id DESC LIMIT 1';
        const result = await pool.query(query);
        res.json(result.rows[0] || null);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get election details' });
    }
});