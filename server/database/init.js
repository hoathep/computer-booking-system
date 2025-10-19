import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const db = new Database(path.join(__dirname, 'booking.db'));

export function initDatabase() {
  // Ensure new columns exist for existing databases (simple migrations)
  try {
    const usersCols = db.prepare(`PRAGMA table_info(users)`).all();
    const hasBanned = usersCols.some(c => c.name === 'banned');
    if (!hasBanned) {
      db.prepare(`ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0`).run();
    }
    const hasResetToken = usersCols.some(c => c.name === 'reset_token');
    if (!hasResetToken) {
      db.prepare(`ALTER TABLE users ADD COLUMN reset_token TEXT`).run();
    }
    const hasResetTokenExpiry = usersCols.some(c => c.name === 'reset_token_expiry');
    if (!hasResetTokenExpiry) {
      db.prepare(`ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME`).run();
    }
  } catch (e) {
    // ignore
  }
  try {
    const groupCols = db.prepare(`PRAGMA table_info(group_limits)`).all();
    const hasNoShow = groupCols.some(c => c.name === 'no_show_minutes');
    if (!hasNoShow) {
      db.prepare(`ALTER TABLE group_limits ADD COLUMN no_show_minutes INTEGER DEFAULT 15`).run();
    }
  } catch (e) {
    // ignore
  }
  try {
    const compCols = db.prepare(`PRAGMA table_info(computers)`).all();
    const hasPreferred = compCols.some(c => c.name === 'preferred_group');
    if (!hasPreferred) {
      db.prepare(`ALTER TABLE computers ADD COLUMN preferred_group TEXT`).run();
    }
    const hasMemory = compCols.some(c => c.name === 'memory_gb');
    if (!hasMemory) {
      db.prepare(`ALTER TABLE computers ADD COLUMN memory_gb INTEGER`).run();
    }
    const hasSoftware = compCols.some(c => c.name === 'recommended_software');
    if (!hasSoftware) {
      db.prepare(`ALTER TABLE computers ADD COLUMN recommended_software TEXT`).run();
    }
    const hasRating = compCols.some(c => c.name === 'rating');
    if (!hasRating) {
      db.prepare(`ALTER TABLE computers ADD COLUMN rating REAL DEFAULT 0`).run();
    }
    const hasRatingCount = compCols.some(c => c.name === 'rating_count');
    if (!hasRatingCount) {
      db.prepare(`ALTER TABLE computers ADD COLUMN rating_count INTEGER DEFAULT 0`).run();
    }
  } catch (e) {
    // ignore
  }
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
      banned INTEGER DEFAULT 0,
      reset_token TEXT,
      reset_token_expiry DATETIME,
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
      preferred_group TEXT,
      memory_gb INTEGER,
      recommended_software TEXT,
      rating REAL DEFAULT 0,
      rating_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      computer_id INTEGER NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      status TEXT DEFAULT 'booked',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (computer_id) REFERENCES computers(id)
    );

    CREATE TABLE IF NOT EXISTS group_limits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_name TEXT UNIQUE NOT NULL,
      max_concurrent_bookings INTEGER DEFAULT 1,
      no_show_minutes INTEGER DEFAULT 15,
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

    CREATE TABLE IF NOT EXISTS booking_ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      computer_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (computer_id) REFERENCES computers(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(booking_id)
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      variables TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

  // Insert default email templates if not exist
  const templatesExist = db.prepare('SELECT COUNT(*) as count FROM email_templates').get();
  
  if (templatesExist.count === 0) {
    const defaultTemplates = [
      {
        name: 'booking_confirmation',
        subject: 'Xác nhận đặt máy - {{computer_name}}',
        body: `Xin chào {{user_name}},

Bạn đã đặt máy thành công!

Thông tin đặt máy:
- Máy tính: {{computer_name}}
- Thời gian bắt đầu: {{start_time}}
- Thời gian kết thúc: {{end_time}}
- Mã mở khóa: {{unlock_code}}

Vui lòng đến đúng giờ và sử dụng mã mở khóa để truy cập máy tính.

Trân trọng,
Hệ thống đặt máy`,
        variables: JSON.stringify(['user_name', 'computer_name', 'start_time', 'end_time', 'unlock_code'])
      },
      {
        name: 'booking_cancellation',
        subject: 'Hủy đặt máy - {{computer_name}}',
        body: `Xin chào {{user_name}},

Đặt máy của bạn đã được hủy.

Thông tin đặt máy đã hủy:
- Máy tính: {{computer_name}}
- Thời gian bắt đầu: {{start_time}}
- Thời gian kết thúc: {{end_time}}

Cảm ơn bạn đã sử dụng dịch vụ.

Trân trọng,
Hệ thống đặt máy`,
        variables: JSON.stringify(['user_name', 'computer_name', 'start_time', 'end_time'])
      },
      {
        name: 'booking_reminder',
        subject: 'Nhắc nhở đặt máy - {{computer_name}}',
        body: `Xin chào {{user_name}},

Nhắc nhở: Bạn có đặt máy sắp bắt đầu!

Thông tin đặt máy:
- Máy tính: {{computer_name}}
- Thời gian bắt đầu: {{start_time}}
- Thời gian kết thúc: {{end_time}}
- Mã mở khóa: {{unlock_code}}

Vui lòng đến đúng giờ.

Trân trọng,
Hệ thống đặt máy`,
        variables: JSON.stringify(['user_name', 'computer_name', 'start_time', 'end_time', 'unlock_code'])
      },
      {
        name: 'welcome_email',
        subject: 'Chào mừng đến với hệ thống đặt máy',
        body: `Xin chào {{user_name}},

Chào mừng bạn đến với hệ thống đặt máy!

Tài khoản của bạn đã được tạo thành công:
- Tên đăng nhập: {{username}}
- Email: {{email}}

Bạn có thể bắt đầu đặt máy ngay bây giờ.

Trân trọng,
Hệ thống đặt máy`,
        variables: JSON.stringify(['user_name', 'username', 'email'])
      },
      {
        name: 'password_reset',
        subject: 'Đặt lại mật khẩu',
        body: `Xin chào {{user_name}},

Bạn đã yêu cầu đặt lại mật khẩu.

Mật khẩu mới của bạn: {{new_password}}

Vui lòng đăng nhập và thay đổi mật khẩu ngay.

Trân trọng,
Hệ thống đặt máy`,
        variables: JSON.stringify(['user_name', 'new_password'])
      }
    ];

    for (const template of defaultTemplates) {
      db.prepare(`
        INSERT INTO email_templates (name, subject, body, variables)
        VALUES (?, ?, ?, ?)
      `).run(template.name, template.subject, template.body, template.variables);
    }
    
    console.log('✅ Default email templates created');
  }

  // Ensure banned column exists and backfill nulls to 0
  try {
    db.prepare("UPDATE users SET banned = 0 WHERE banned IS NULL").run();
  } catch (e) {
    // ignore if column not present; creation above ensures column exists now
  }

  // Insert default group
  const defaultGroup = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get('default');
  if (!defaultGroup) {
    db.prepare(`
      INSERT INTO group_limits (group_name, max_concurrent_bookings)
      VALUES (?, ?)
    `).run('default', 1);
  }

  // Backfill no_show_minutes for existing rows if column exists and is NULL
  try {
    db.prepare("UPDATE group_limits SET no_show_minutes = 15 WHERE no_show_minutes IS NULL").run();
  } catch (e) {
    // ignore if column not present (older schema); creation above ensures it now exists
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


