import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'server', 'database', 'booking.db'));

console.log('Creating test users...');

try {
  // Create test users
  const users = [
    ['user1', 'password123', 'User One', 'user1@example.com', 'user', 'default', 2],
    ['user2', 'password123', 'User Two', 'user2@example.com', 'user', 'default', 1],
    ['user3', 'password123', 'User Three', 'user3@example.com', 'user', 'default', 1],
  ];

  const stmt = db.prepare(`
    INSERT INTO users (username, password, fullname, email, role, group_name, max_concurrent_bookings)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach(([username, password, fullname, email, role, group_name, max_concurrent_bookings]) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    try {
      stmt.run(username, hashedPassword, fullname, email, role, group_name, max_concurrent_bookings);
      console.log(`Created user: ${username}`);
    } catch (error) {
      console.log(`User ${username} already exists or error:`, error.message);
    }
  });

  // Check final counts
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get();
  const totalComputers = db.prepare('SELECT COUNT(*) as count FROM computers').get();
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get();
  
  console.log('\nFinal counts:');
  console.log('Total users (non-admin):', totalUsers.count);
  console.log('Total computers:', totalComputers.count);
  console.log('Total bookings:', totalBookings.count);
  
} catch (error) {
  console.error('Error:', error);
} finally {
  db.close();
}
