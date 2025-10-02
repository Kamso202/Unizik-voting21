
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to the database');
});

const createTables = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS voters (
      id SERIAL PRIMARY KEY,
      student_id VARCHAR(255) UNIQUE NOT NULL,
      metamask_address VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      is_voted BOOLEAN DEFAULT false
    );

    CREATE TABLE IF NOT EXISTS elections (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS positions (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      position_id INTEGER REFERENCES positions(id),
      image_url VARCHAR(255),
      manifesto TEXT,
      votes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      voter_id INTEGER REFERENCES voters(id),
      candidate_id INTEGER REFERENCES candidates(id),
      previous_hash VARCHAR(255),
      transaction_hash VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  try {
    await pool.query(queryText);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  createTables,
};
