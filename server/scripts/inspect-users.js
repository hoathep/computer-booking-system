import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database(new URL('../database/booking.db', import.meta.url));

const users = db.prepare('SELECT id, username, password, role FROM users').all();
console.log(JSON.stringify(users.map(u => ({ id: u.id, username: u.username, role: u.role, passwordHashPrefix: u.password?.slice(0, 10) })), null, 2));

const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (admin) {
  console.log('admin password matches admin123:', bcrypt.compareSync('admin123', admin.password));
} else {
  console.log('admin user not found');
}


