const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'unizik_voting',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

const createTables = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Admins Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Voters Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS voters (
                id SERIAL PRIMARY KEY,
                student_id VARCHAR(255) UNIQUE NOT NULL,
                metamask_address VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                is_voted BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Positions Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS positions (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Candidates Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS candidates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                position_id INTEGER REFERENCES positions(id) ON DELETE CASCADE,
                image_url VARCHAR(255),
                manifesto TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Votes Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS votes (
                id SERIAL PRIMARY KEY,
                voter_id INTEGER REFERENCES voters(id) ON DELETE CASCADE,
                candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
                previous_hash VARCHAR(64) NOT NULL,
                transaction_hash VARCHAR(64) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(voter_id, candidate_id) -- Ensures a voter can only vote for a candidate once
            );
        `);

        // Elections Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS elections (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query('COMMIT');
        console.log('All tables created successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error creating tables', err);
        throw err;
    } finally {
        client.release();
    }
};

createTables().catch(err => {
    console.error('Database setup failed:', err);
    process.exit(1);
});
