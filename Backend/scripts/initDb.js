import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from '../src/config/db.js';
import { hashPassword } from '../src/routes/auth.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');
    await pool.query(sql);
    console.log('Schema created successfully');

    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    await query(
      `INSERT INTO users (username, password_hash, name, role) VALUES ($1, $2, $3, $4)`,
      ['admin', hashPassword(adminPassword), 'Administrador', 'admin']
    );
    console.log('Admin user seeded (username: admin)');

    console.log('Database initialized successfully (empty tables)');
  } catch (err) {
    console.error('Error initializing database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

init();
