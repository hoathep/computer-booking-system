import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'booking.db'));

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullname TEXT NOT NULL,
      email TEXT,
      role TEXT DEFAULT 'user',
      group_name TEXT DEFAULT 'default',
      max_concurrent_bookings INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS computers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      location TEXT,
      status TEXT DEFAULT 'available',
      ip_address TEXT,
      mac_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      computer_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (computer_id) REFERENCES computers(id)
    );

    CREATE TABLE IF NOT EXISTS group_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT UNIQUE NOT NULL,
      max_concurrent_bookings INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      unlock_code TEXT NOT NULL,
      unlocked_at DATETIME,
      locked_at DATETIME,
      status TEXT DEFAULT 'locked',
      FOREIGN KEY (booking_id) REFERENCES bookings(id)
    );
  `);

  // Insert default admin user if not exists
  const adminExists = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
  
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, password, fullname, role, max_concurrent_bookings)
      VALUES (?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, 'Administrator', 'admin', 999);
    
    console.log('✅ Default admin user created (username: admin, password: admin123)');
  }

  // Insert default group
  const defaultGroup = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get('default');
  if (!defaultGroup) {
    db.prepare(`
      INSERT INTO group_limits (group_name, max_concurrent_bookings)
      VALUES (?, ?)
    `).run('default', 1);
  }

  // Insert sample computers if not exists
  const computerCount = db.prepare('SELECT COUNT(*) as count FROM computers').get();
  if (computerCount.count === 0) {
    const computers = [
      ['Computer-01', 'Máy tính số 1', 'Phòng A', 'available', '192.168.1.101', '00:11:22:33:44:01'],
      ['Computer-02', 'Máy tính số 2', 'Phòng A', 'available', '192.168.1.102', '00:11:22:33:44:02'],
      ['Computer-03', 'Máy tính số 3', 'Phòng A', 'available', '192.168.1.103', '00:11:22:33:44:03'],
      ['Computer-04', 'Máy tính số 4', 'Phòng B', 'available', '192.168.1.104', '00:11:22:33:44:04'],
      ['Computer-05', 'Máy tính số 5', 'Phòng B', 'available', '192.168.1.105', '00:11:22:33:44:05'],
      ['Computer-06', 'Máy tính số 6', 'Phòng B', 'available', '192.168.1.106', '00:11:22:33:44:06'],
    ];

    const stmt = db.prepare(`
      INSERT INTO computers (name, description, location, status, ip_address, mac_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    computers.forEach(comp => stmt.run(...comp));
    console.log('✅ Sample computers created');
  }

  console.log('✅ Database initialized');
}

export default db;


