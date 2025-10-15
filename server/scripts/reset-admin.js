import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'database', 'booking.db'));

const username = 'admin';
const password = 'admin123';

const hashed = bcrypt.hashSync(password, 10);

const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
if (!user) {
  db.prepare(`
    INSERT INTO users (username, password, fullname, email, role, group_name, max_concurrent_bookings, banned)
    VALUES (?, ?, 'Administrator', null, 'admin', 'default', 999, 0)
  `).run(username, hashed);
  console.log('Created admin user with default password');
} else {
  db.prepare(`
    UPDATE users SET password = ?, role = 'admin', banned = 0 WHERE username = ?
  `).run(hashed, username);
  console.log('Reset admin password and unbanned account');
}

db.close();


