const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'unizik_voting',
    password: '2004', // Replace with your password
    port: 5432,
});

async function checkConnection() {
    try {
        const client = await pool.connect();
        console.log('✅ Database connected successfully!');
        client.release();
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
    } finally {
        pool.end();
    }
}

checkConnection();