import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({connectionString: process.env.NEON_DB_URI,
    ssl:{
        rejectUnauthorized: false,
    }
});

export const initDatabase = async () =>{
    try{

        await pool.query(`SELECT NOW()`)
        console.log('Database connected successfully');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS messages(
            id SERIAL PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `)

        console.log('Message table created successfully');
    }
    catch(error){
        console.error('Error initializing database:', error);
        throw error;
    }
}

export const saveMessage = async (username: string, message: string) =>{

    const result = await pool.query(`
        INSERT INTO messages (username, message) VALUES ($1, $2) RETURNING *
    `, [username, message]);

    return result.rows[0];
}


export const getRecentMessages = async (limit: number = 20) =>{
    const result = await pool.query(`
        SELECT * FROM messages ORDER BY created_at DESC LIMIT $1
    `, [limit]);

    return result.rows.reverse();
}