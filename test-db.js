import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'server', 'database', 'booking.db'));

console.log('Testing database queries...');

try {
  // Test users count
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get();
  console.log('Total users (non-admin):', totalUsers.count);
  
  // Test all users
  const allUsers = db.prepare('SELECT id, username, role FROM users').all();
  console.log('All users:', allUsers);
  
  // Test computers count
  const totalComputers = db.prepare('SELECT COUNT(*) as count FROM computers').get();
  console.log('Total computers:', totalComputers.count);
  
  // Test all computers
  const allComputers = db.prepare('SELECT id, name, status FROM computers').all();
  console.log('All computers:', allComputers);
  
  // Test bookings count
  const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get();
  console.log('Total bookings:', totalBookings.count);
  
  // Test all bookings
  const allBookings = db.prepare('SELECT id, user_id, computer_id, start_time, end_time, status FROM bookings').all();
  console.log('All bookings:', allBookings);
  
} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}
