import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/init.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import nodemailer from 'nodemailer';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// All admin routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// --- USER MANAGEMENT ---
// --- SMTP SETTINGS ---
// Reuse settings table to store SMTP config as JSON under key 'smtpConfig'
router.get('/settings', (req, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
    const row = db.prepare(`SELECT value FROM settings WHERE key = 'maxAdvanceDays'`).get();
    const smtpRow = db.prepare(`SELECT value FROM settings WHERE key = 'smtpConfig'`).get();
    res.json({
      maxAdvanceDays: row ? parseInt(row.value) : 7,
      smtpConfig: smtpRow ? JSON.parse(smtpRow.value) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/smtp', (req, res) => {
  try {
    const { host, port, secure, authUser, authPass, fromEmail } = req.body;
    if (!host || !port || !authUser || !authPass || !fromEmail) {
      return res.status(400).json({ error: 'SMTP host, port, user, pass, and fromEmail are required' });
    }
    const config = { host, port: Number(port), secure: !!secure, authUser, authPass, fromEmail };
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
    db.prepare(`INSERT INTO settings (key, value) VALUES ('smtpConfig', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(JSON.stringify(config));
    res.json({ message: 'SMTP settings saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- FOOTER SETTINGS ---
router.get('/settings/footer', (req, res) => {
  try {
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
    const row = db.prepare(`SELECT value FROM settings WHERE key = 'footerConfig'`).get();
    const v = row ? JSON.parse(row.value) : {};
    res.json({
      supportEmail: v.supportEmail || '',
      phone: v.phone || '',
      teamsLink: v.teamsLink || ''
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/settings/footer', (req, res) => {
  try {
    const { supportEmail, phone, teamsLink } = req.body;
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
    const config = { supportEmail: supportEmail || '', phone: phone || '', teamsLink: teamsLink || '' };
    db.prepare(`INSERT INTO settings (key, value) VALUES ('footerConfig', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).run(JSON.stringify(config));
    res.json({ message: 'Footer settings saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, fullname, email, role, group_name, max_concurrent_bookings, banned, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create user
router.post('/users', (req, res) => {
  try {
    const { username, password, fullname, email, role, group_name, max_concurrent_bookings } = req.body;

    if (!username || !password || !fullname) {
      return res.status(400).json({ error: 'Username, password, and fullname required' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (username, password, fullname, email, role, group_name, max_concurrent_bookings)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(username, hashedPassword, fullname, email || null, role || 'user', group_name || 'default', max_concurrent_bookings || null);

    res.status(201).json({ 
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/users/:id', (req, res) => {
  try {
    const { fullname, email, role, group_name, max_concurrent_bookings, banned } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users 
      SET fullname = ?, email = ?, role = ?, group_name = ?, max_concurrent_bookings = ?, banned = COALESCE(?, banned)
      WHERE id = ?
    `).run(
      fullname || user.fullname,
      email || user.email,
      role || user.role,
      group_name || user.group_name,
      max_concurrent_bookings !== undefined ? max_concurrent_bookings : user.max_concurrent_bookings,
      banned,
      req.params.id
    );

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change user password
router.post('/users/:id/password', (req, res) => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, req.params.id);
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ban user
router.post('/users/:id/ban', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ error: 'Cannot ban admin user' });
    db.prepare('UPDATE users SET banned = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'User banned' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unban user
router.post('/users/:id/unban', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    db.prepare('UPDATE users SET banned = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'User unbanned' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Cannot delete admin user' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export users (JSON)
router.get('/users/export', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, fullname, email, role, group_name, max_concurrent_bookings, banned, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="users-export.json"');
    res.send(JSON.stringify({ users }, null, 2));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import users (JSON body: { users: [...] })
router.post('/users/import', (req, res) => {
  try {
    const { users = [], overwrite = false } = req.body || {};
    if (!Array.isArray(users)) return res.status(400).json({ error: 'Invalid payload: users must be an array' });

    let created = 0;
    let updated = 0;
    for (const u of users) {
      if (!u || !u.username || !u.fullname) continue;
      // If payload includes a raw password, hash it; otherwise keep existing password when overwriting
      const existing = db.prepare('SELECT * FROM users WHERE username = ?').get(u.username);
      if (existing) {
        if (!overwrite) continue;
        const newPassword = u.password ? bcrypt.hashSync(u.password, 10) : existing.password;
        db.prepare(`
          UPDATE users SET fullname = ?, email = ?, role = ?, group_name = ?, max_concurrent_bookings = ?, banned = ?, password = ?
          WHERE username = ?
        `).run(
          u.fullname,
          u.email || null,
          u.role || existing.role || 'user',
          u.group_name || existing.group_name || 'default',
          u.max_concurrent_bookings ?? existing.max_concurrent_bookings ?? null,
          u.banned ? 1 : 0,
          newPassword,
          u.username
        );
        updated += 1;
      } else {
        const hashed = bcrypt.hashSync(u.password || 'password123', 10);
        db.prepare(`
          INSERT INTO users (username, password, fullname, email, role, group_name, max_concurrent_bookings, banned)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          u.username,
          hashed,
          u.fullname,
          u.email || null,
          u.role || 'user',
          u.group_name || 'default',
          u.max_concurrent_bookings ?? null,
          u.banned ? 1 : 0
        );
        created += 1;
      }
    }
    res.json({ message: 'Import completed', created, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMPUTER MANAGEMENT ---

// Get all computers
router.get('/computers', (req, res) => {
  try {
  const computers = db.prepare('SELECT * FROM computers ORDER BY name').all();
    res.json(computers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create computer
router.post('/computers', (req, res) => {
  try {
    const { name, description, location, ip_address, mac_address, preferred_group, memory_gb, recommended_software } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Computer name required' });
    }

    const normalizedPref = Array.isArray(preferred_group)
      ? preferred_group.join(',')
      : (preferred_group || null);
    console.log('ADMIN create computer body:', req.body);
    const result = db.prepare(`
      INSERT INTO computers (name, description, location, ip_address, mac_address, preferred_group, memory_gb, recommended_software)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, description || null, location || null, ip_address || null, mac_address || null, normalizedPref, memory_gb ?? null, recommended_software ?? null);

    res.status(201).json({ 
      message: 'Computer created successfully',
      computerId: result.lastInsertRowid
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update computer
router.put('/computers/:id', (req, res) => {
  try {
    const { name, description, location, status, ip_address, mac_address, preferred_group, memory_gb, recommended_software } = req.body;
    
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(req.params.id);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    const normalizedPrefUpd = Array.isArray(preferred_group)
      ? preferred_group.join(',')
      : preferred_group;
    console.log('ADMIN update computer body:', req.body);
    db.prepare(`
      UPDATE computers 
      SET name = ?, description = ?, location = ?, status = ?, ip_address = ?, mac_address = ?, preferred_group = ?, memory_gb = ?, recommended_software = ?
      WHERE id = ?
    `).run(
      name || computer.name, 
      description !== undefined ? description : computer.description,
      location !== undefined ? location : computer.location,
      status || computer.status,
      ip_address !== undefined ? ip_address : computer.ip_address,
      mac_address !== undefined ? mac_address : computer.mac_address,
      normalizedPrefUpd !== undefined ? normalizedPrefUpd : computer.preferred_group,
      memory_gb !== undefined ? memory_gb : computer.memory_gb,
      recommended_software !== undefined ? recommended_software : computer.recommended_software,
      req.params.id
    );

    res.json({ message: 'Computer updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete computer
router.delete('/computers/:id', (req, res) => {
  try {
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(req.params.id);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    db.prepare('DELETE FROM computers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Computer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export computers
router.get('/computers/export', (req, res) => {
  try {
    const computers = db.prepare(`
      SELECT id, name, description, location, status, ip_address, mac_address, preferred_group, memory_gb, recommended_software
      FROM computers
      ORDER BY id DESC
    `).all();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="computers-export.json"');
    res.send(JSON.stringify({ computers }, null, 2));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import computers (JSON body: { computers: [...], overwrite?: boolean })
router.post('/computers/import', (req, res) => {
  try {
    const { computers = [], overwrite = false } = req.body || {};
    if (!Array.isArray(computers)) return res.status(400).json({ error: 'Invalid payload: computers must be an array' });
    let created = 0; let updated = 0;
    for (const c of computers) {
      if (!c || !c.name) continue;
      const existing = db.prepare('SELECT * FROM computers WHERE name = ?').get(c.name);
      if (existing) {
        if (!overwrite) continue;
        db.prepare(`
          UPDATE computers SET description = ?, location = ?, status = ?, ip_address = ?, mac_address = ?, preferred_group = ?, memory_gb = ?, recommended_software = ?
          WHERE id = ?
        `).run(
          c.description || existing.description || null,
          c.location || existing.location || null,
          c.status || existing.status || 'available',
          c.ip_address || existing.ip_address || null,
          c.mac_address || existing.mac_address || null,
          Array.isArray(c.preferred_group) ? c.preferred_group.join(',') : (c.preferred_group || existing.preferred_group || null),
          c.memory_gb ?? existing.memory_gb ?? null,
          c.recommended_software || existing.recommended_software || null,
          existing.id
        );
        updated += 1;
      } else {
        db.prepare(`
          INSERT INTO computers (name, description, location, status, ip_address, mac_address, preferred_group, memory_gb, recommended_software)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          c.name,
          c.description || null,
          c.location || null,
          c.status || 'available',
          c.ip_address || null,
          c.mac_address || null,
          Array.isArray(c.preferred_group) ? c.preferred_group.join(',') : (c.preferred_group || null),
          c.memory_gb ?? null,
          c.recommended_software || null
        );
        created += 1;
      }
    }
    res.json({ message: 'Import completed', created, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- GROUP LIMITS ---

// Get all groups
router.get('/groups', (req, res) => {
  try {
    const groups = db.prepare('SELECT * FROM group_limits ORDER BY group_name').all();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update group
router.post('/groups', (req, res) => {
  try {
    const { group_name, max_concurrent_bookings, no_show_minutes } = req.body;

    if (!group_name || max_concurrent_bookings === undefined) {
      return res.status(400).json({ error: 'Group name and max concurrent bookings required' });
    }

    const existing = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get(group_name);
    
    if (existing) {
      db.prepare(`
        UPDATE group_limits 
        SET max_concurrent_bookings = ?, no_show_minutes = COALESCE(?, no_show_minutes)
        WHERE group_name = ?
      `).run(max_concurrent_bookings, no_show_minutes, group_name);
      res.json({ message: 'Group updated successfully' });
    } else {
      db.prepare(`
        INSERT INTO group_limits (group_name, max_concurrent_bookings, no_show_minutes)
        VALUES (?, ?, COALESCE(?, 15))
      `).run(group_name, max_concurrent_bookings, no_show_minutes);
      res.status(201).json({ message: 'Group created successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a group and reassign its users to 'default'
router.delete('/groups/:groupName', (req, res) => {
  try {
    const groupName = req.params.groupName;
    if (!groupName || groupName === 'default') {
      return res.status(400).json({ error: 'Invalid group name' });
    }

    const existing = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get(groupName);
    if (!existing) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Reassign users
    db.prepare(`UPDATE users SET group_name = 'default' WHERE group_name = ?`).run(groupName);
    // Delete group limit
    db.prepare('DELETE FROM group_limits WHERE group_name = ?').run(groupName);

    res.json({ message: 'Group deleted and users reassigned to default' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export groups to CSV
router.get('/groups/export', (req, res) => {
  try {
    const groups = db.prepare('SELECT * FROM group_limits ORDER BY group_name').all();
    
    // Create CSV content
    const csvHeader = 'group_name,max_concurrent_bookings,no_show_minutes\n';
    const csvRows = groups.map(group => 
      `${group.group_name},${group.max_concurrent_bookings},${group.no_show_minutes || 15}`
    ).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="groups_export.csv"');
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Import groups from CSV
router.post('/groups/import', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const csvContent = file.buffer.toString('utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file must have at least a header and one data row' });
    }

    // Skip header row
    const dataLines = lines.slice(1);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const line of dataLines) {
      if (!line.trim()) continue;
      
      const [group_name, max_concurrent_bookings, no_show_minutes] = line.split(',').map(field => field.trim());
      
      if (!group_name || !max_concurrent_bookings) {
        errors.push(`Invalid data: ${line}`);
        errorCount++;
        continue;
      }

      try {
        const existing = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get(group_name);
        
        if (existing) {
          // Update existing group
          db.prepare(`
            UPDATE group_limits 
            SET max_concurrent_bookings = ?, no_show_minutes = COALESCE(?, no_show_minutes)
            WHERE group_name = ?
          `).run(parseInt(max_concurrent_bookings), parseInt(no_show_minutes) || 15, group_name);
        } else {
          // Create new group
          db.prepare(`
            INSERT INTO group_limits (group_name, max_concurrent_bookings, no_show_minutes)
            VALUES (?, ?, COALESCE(?, 15))
          `).run(group_name, parseInt(max_concurrent_bookings), parseInt(no_show_minutes) || 15);
        }
        successCount++;
      } catch (error) {
        errors.push(`Error processing ${group_name}: ${error.message}`);
        errorCount++;
      }
    }

    res.json({ 
      message: `Import completed. ${successCount} groups processed successfully, ${errorCount} errors.`,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error.message === 'Only CSV files are allowed') {
    return res.status(400).json({ error: 'Only CSV files are allowed' });
  }
  next(error);
});

// --- BOOKING MANAGEMENT ---

// Get all bookings
router.get('/bookings', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.*,
        u.username,
        u.fullname,
        c.name as computer_name,
        c.location
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN computers c ON b.computer_id = c.id
      ORDER BY b.start_time DESC
      LIMIT 500
    `).all();
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete booking (also remove related session records)
router.delete('/bookings/:id', (req, res) => {
  try {
    const id = req.params.id;
    const booking = db.prepare('SELECT id FROM bookings WHERE id = ?').get(id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Remove dependent session rows first to avoid FK issues
    try {
      db.prepare('DELETE FROM sessions WHERE booking_id = ?').run(id);
    } catch (e) {
      // ignore if sessions table not present
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    return res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get statistics
router.get('/stats', (req, res) => {
  try {
    // Count total users (excluding admin)
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role != 'admin'").get();
    
    // Count total computers
    const totalComputers = db.prepare('SELECT COUNT(*) as count FROM computers').get();
    
    // Count active bookings (currently running)
    const activeBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE status IN ('pending', 'active')
      AND datetime('now') >= start_time 
      AND datetime('now') <= end_time
    `).get();
    
    // Count today's bookings
    const todayBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE date(start_time) = date('now')
    `).get();

    console.log('Stats query results:', {
      totalUsers: totalUsers.count,
      totalComputers: totalComputers.count,
      activeBookings: activeBookings.count,
      todayBookings: todayBookings.count
    });

    res.json({
      totalUsers: totalUsers.count,
      totalComputers: totalComputers.count,
      activeBookings: activeBookings.count,
      todayBookings: todayBookings.count
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- REPORTS ---
// Usage report: total booked hours, used hours, and no-show hours per user
router.get('/reports/usage', (req, res) => {
  try {
    const { from, to } = req.query;

    // Build time filter
    let timeFilter = '';
    const params = [];
    if (from) {
      timeFilter += ' AND b.start_time >= ?';
      params.push(from);
    }
    if (to) {
      timeFilter += ' AND b.end_time <= ?';
      params.push(to);
    }

    // Fetch bookings with sessions and user info in the window
    const rows = db.prepare(`
      SELECT 
        b.id as booking_id,
        b.user_id,
        b.start_time,
        b.end_time,
        b.status,
        u.username,
        u.fullname,
        s.unlocked_at,
        s.locked_at,
        s.status as session_status
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN sessions s ON s.booking_id = b.id
      WHERE 1=1 ${timeFilter}
      ORDER BY b.start_time DESC
    `).all(...params);

    const now = new Date();
    const perUser = new Map();

    for (const r of rows) {
      const start = new Date(r.start_time);
      const end = new Date(r.end_time);
      const bookedMs = Math.max(0, end - start);

      // Compute used duration based on unlocked_at and locked_at within booking window
      let usedMs = 0;
      if (r.unlocked_at) {
        const unlockedAt = new Date(r.unlocked_at);
        const lockedAt = r.locked_at ? new Date(r.locked_at) : now;
        const sessionStart = unlockedAt < start ? start : unlockedAt;
        const sessionEnd = lockedAt > end ? end : lockedAt;
        usedMs = Math.max(0, sessionEnd - sessionStart);
      }

      const noShowMs = Math.max(0, bookedMs - usedMs);

      const key = r.user_id;
      if (!perUser.has(key)) {
        perUser.set(key, {
          userId: r.user_id,
          username: r.username,
          fullname: r.fullname,
          bookings: 0,
          bookedMs: 0,
          usedMs: 0,
          noShowMs: 0
        });
      }
      const agg = perUser.get(key);
      agg.bookings += 1;
      agg.bookedMs += bookedMs;
      agg.usedMs += usedMs;
      agg.noShowMs += noShowMs;
    }

    function msToHours(ms) { return +(ms / (1000 * 60 * 60)).toFixed(2); }

    const users = Array.from(perUser.values()).map(u => ({
      userId: u.userId,
      username: u.username,
      fullname: u.fullname,
      bookings: u.bookings,
      bookedHours: msToHours(u.bookedMs),
      usedHours: msToHours(u.usedMs),
      noShowHours: msToHours(u.noShowMs)
    }));

    const totals = users.reduce((acc, u) => {
      acc.bookings += u.bookings;
      acc.bookedHours = +(acc.bookedHours + u.bookedHours).toFixed(2);
      acc.usedHours = +(acc.usedHours + u.usedHours).toFixed(2);
      acc.noShowHours = +(acc.noShowHours + u.noShowHours).toFixed(2);
      return acc;
    }, { bookings: 0, bookedHours: 0, usedHours: 0, noShowHours: 0 });

    res.json({
      range: { from: from || null, to: to || null },
      totals,
      users
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- TRANSLATIONS MANAGEMENT ---

function getLocalePaths() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const root = path.resolve(__dirname, '..', '..'); // project root
  return {
    en: path.resolve(root, 'client', 'src', 'i18n', 'locales', 'en.json'),
    vi: path.resolve(root, 'client', 'src', 'i18n', 'locales', 'vi.json'),
    ja: path.resolve(root, 'client', 'src', 'i18n', 'locales', 'ja.json')
  };
}

function readJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('Translations read error at', filePath, e.message);
    return {};
  }
}

function writeJson(filePath, data) {
  // simple backup
  try {
    if (fs.existsSync(filePath)) {
      const backup = filePath + '.' + Date.now() + '.bak';
      fs.copyFileSync(filePath, backup);
    }
  } catch {}
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function setNested(obj, keyPath, value) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {};
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function deleteNested(obj, keyPath) {
  const parts = keyPath.split('.');
  const stack = [];
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (typeof cur[p] !== 'object' || cur[p] === null) return;
    stack.push({ parent: cur, key: p });
    cur = cur[p];
  }
  delete cur[parts[parts.length - 1]];
  // Clean empty objects upwards
  for (let i = stack.length - 1; i >= 0; i--) {
    const { parent, key } = stack[i];
    if (parent[key] && typeof parent[key] === 'object' && Object.keys(parent[key]).length === 0) {
      delete parent[key];
    }
  }
}

function flatten(obj, prefix = '') {
  return Object.keys(obj).reduce((acc, k) => {
    const val = obj[k];
    const key = prefix ? `${prefix}.${k}` : k;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      acc.push(...flatten(val, key));
    } else {
      acc.push({ key, value: String(val) });
    }
    return acc;
  }, []);
}

// GET all translations flattened by key with values per language
router.get('/translations', (req, res) => {
  try {
    const paths = getLocalePaths();
    const en = readJson(paths.en);
    const vi = readJson(paths.vi);
    const ja = readJson(paths.ja);
    const enFlat = flatten(en);
    const viFlat = flatten(vi);
    const jaFlat = flatten(ja);
    const map = new Map();
    const add = (arr, lang) => arr.forEach(({ key, value }) => {
      if (!map.has(key)) map.set(key, {});
      map.get(key)[lang] = value;
    });
    add(enFlat, 'en'); add(viFlat, 'vi'); add(jaFlat, 'ja');
    const rows = Array.from(map.entries()).map(([key, vals]) => ({ key, en: vals.en || '', vi: vals.vi || '', ja: vals.ja || '' }));
    res.json({ rows });
  } catch (error) {
    console.error('GET /translations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// UPSERT a translation key values: { key, en, vi, ja }
router.post('/translations', (req, res) => {
  try {
    const { key, en: enVal, vi: viVal, ja: jaVal } = req.body;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    const paths = getLocalePaths();
    const en = readJson(paths.en);
    const vi = readJson(paths.vi);
    const ja = readJson(paths.ja);
    if (enVal !== undefined) setNested(en, key, enVal);
    if (viVal !== undefined) setNested(vi, key, viVal);
    if (jaVal !== undefined) setNested(ja, key, jaVal);
    writeJson(paths.en, en);
    writeJson(paths.vi, vi);
    writeJson(paths.ja, ja);
    res.json({ message: 'Saved' });
  } catch (error) {
    console.error('POST /translations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE a translation key across all locales
router.delete('/translations/:key', (req, res) => {
  try {
    const key = req.params.key;
    if (!key) return res.status(400).json({ error: 'Key is required' });
    const paths = getLocalePaths();
    const en = readJson(paths.en);
    const vi = readJson(paths.vi);
    const ja = readJson(paths.ja);
    deleteNested(en, key);
    deleteNested(vi, key);
    deleteNested(ja, key);
    writeJson(paths.en, en);
    writeJson(paths.vi, vi);
    writeJson(paths.ja, ja);
    res.json({ message: 'Deleted' });
  } catch (error) {
    console.error('DELETE /translations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// EXPORT locales as a single payload
router.get('/translations/export', (req, res) => {
  try {
    const paths = getLocalePaths();
    const payload = {
      en: readJson(paths.en),
      vi: readJson(paths.vi),
      ja: readJson(paths.ja)
    };
    res.json(payload);
  } catch (error) {
    console.error('GET /translations/export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// IMPORT locales: body { en, vi, ja, mode: 'merge' | 'overwrite' }
router.post('/translations/import', (req, res) => {
  try {
    const { en: enBody, vi: viBody, ja: jaBody, mode = 'merge' } = req.body || {};
    const paths = getLocalePaths();
    const en = readJson(paths.en);
    const vi = readJson(paths.vi);
    const ja = readJson(paths.ja);

    function deepMerge(target, source) {
      if (!source || typeof source !== 'object') return target;
      for (const k of Object.keys(source)) {
        if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
          target[k] = deepMerge(target[k] || {}, source[k]);
        } else {
          target[k] = source[k];
        }
      }
      return target;
    }

    const newEn = mode === 'overwrite' ? (enBody || {}) : deepMerge({ ...en }, enBody || {});
    const newVi = mode === 'overwrite' ? (viBody || {}) : deepMerge({ ...vi }, viBody || {});
    const newJa = mode === 'overwrite' ? (jaBody || {}) : deepMerge({ ...ja }, jaBody || {});

    writeJson(paths.en, newEn);
    writeJson(paths.vi, newVi);
    writeJson(paths.ja, newJa);
    res.json({ message: 'Imported', mode });
  } catch (error) {
    console.error('POST /translations/import error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS: BOOKING WINDOW ---
// Get settings
router.get('/settings', (req, res) => {
  try {
    const row = db.prepare(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `).run();
    const days = db.prepare(`SELECT value FROM settings WHERE key = 'maxAdvanceDays'`).get();
    res.json({ maxAdvanceDays: days ? parseInt(days.value) : 7 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update settings
router.post('/settings', (req, res) => {
  try {
    const { maxAdvanceDays } = req.body;
    if (maxAdvanceDays === undefined || maxAdvanceDays < 0 || maxAdvanceDays > 365) {
      return res.status(400).json({ error: 'Invalid maxAdvanceDays' });
    }
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
    db.prepare(`INSERT INTO settings (key, value) VALUES ('maxAdvanceDays', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`).run(String(maxAdvanceDays));
    res.json({ message: 'Settings saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Usage report aggregated by group
router.get('/reports/usage-by-group', (req, res) => {
  try {
    const { from, to } = req.query;

    let timeFilter = '';
    const params = [];
    if (from) {
      timeFilter += ' AND b.start_time >= ?';
      params.push(from);
    }
    if (to) {
      timeFilter += ' AND b.end_time <= ?';
      params.push(to);
    }

    const rows = db.prepare(`
      SELECT 
        b.id as booking_id,
        b.start_time,
        b.end_time,
        b.status,
        u.group_name,
        s.unlocked_at,
        s.locked_at,
        s.status as session_status
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN sessions s ON s.booking_id = b.id
      WHERE 1=1 ${timeFilter}
      ORDER BY b.start_time DESC
    `).all(...params);

    const now = new Date();
    const perGroup = new Map();

    for (const r of rows) {
      const start = new Date(r.start_time);
      const end = new Date(r.end_time);
      const bookedMs = Math.max(0, end - start);

      let usedMs = 0;
      if (r.unlocked_at) {
        const unlockedAt = new Date(r.unlocked_at);
        const lockedAt = r.locked_at ? new Date(r.locked_at) : now;
        const sessionStart = unlockedAt < start ? start : unlockedAt;
        const sessionEnd = lockedAt > end ? end : lockedAt;
        usedMs = Math.max(0, sessionEnd - sessionStart);
      }

      const noShowMs = Math.max(0, bookedMs - usedMs);

      const key = r.group_name || 'default';
      if (!perGroup.has(key)) {
        perGroup.set(key, {
          groupName: key,
          bookings: 0,
          bookedMs: 0,
          usedMs: 0,
          noShowMs: 0
        });
      }
      const agg = perGroup.get(key);
      agg.bookings += 1;
      agg.bookedMs += bookedMs;
      agg.usedMs += usedMs;
      agg.noShowMs += noShowMs;
    }

    function msToHours(ms) { return +(ms / (1000 * 60 * 60)).toFixed(2); }

    const groups = Array.from(perGroup.values()).map(g => ({
      groupName: g.groupName,
      bookings: g.bookings,
      bookedHours: msToHours(g.bookedMs),
      usedHours: msToHours(g.usedMs),
      noShowHours: msToHours(g.noShowMs)
    }));

    const totals = groups.reduce((acc, g) => {
      acc.bookings += g.bookings;
      acc.bookedHours = +(acc.bookedHours + g.bookedHours).toFixed(2);
      acc.usedHours = +(acc.usedHours + g.usedHours).toFixed(2);
      acc.noShowHours = +(acc.noShowHours + g.noShowHours).toFixed(2);
      return acc;
    }, { bookings: 0, bookedHours: 0, usedHours: 0, noShowHours: 0 });

    res.json({
      range: { from: from || null, to: to || null },
      totals,
      groups
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Time-series report: aggregate bookings over time by user, group, or computer
// Query params: mode=user|group|computer, bucket=day|week|month|year, from, to
router.get('/reports/usage-timeseries', (req, res) => {
  try {
    const { mode = 'user', bucket = 'day', from, to } = req.query;

    const validMode = ['group', 'computer'].includes(mode) ? mode : 'user';
    const validBucket = ['day', 'week', 'month', 'year'].includes(bucket) ? bucket : 'day';

    let timeFilter = '';
    const params = [];
    if (from) {
      timeFilter += ' AND b.start_time >= ?';
      params.push(from);
    }
    if (to) {
      timeFilter += ' AND b.end_time <= ?';
      params.push(to);
    }

    // SQLite date truncation
    const bucketExpr =
      validBucket === 'day'
        ? "date(b.start_time)"
        : validBucket === 'week'
        ? "strftime('%Y-%W', b.start_time)" // year-week
        : validBucket === 'month'
        ? "strftime('%Y-%m', b.start_time)" // month
        : "strftime('%Y', b.start_time)"; // year

    const labelSelect =
      validMode === 'group'
        ? 'u.group_name as label'
        : validMode === 'computer'
        ? 'c.name as label'
        : 'u.username as label';

    const joinComputer = validMode === 'computer' ? 'JOIN computers c ON c.id = b.computer_id' : '';

    const rows = db.prepare(`
      SELECT ${bucketExpr} as bucket, ${labelSelect}, COUNT(b.id) as bookings
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      ${joinComputer}
      WHERE 1=1 ${timeFilter}
      GROUP BY bucket, label
      ORDER BY bucket ASC
    `).all(...params);

    // Structure: { buckets: [..], series: [{label, data: [..]}] }
    const bucketSet = new Set(rows.map(r => r.bucket));
    const buckets = Array.from(bucketSet).sort();

    const seriesMap = new Map();
    for (const r of rows) {
      if (!seriesMap.has(r.label)) seriesMap.set(r.label, new Map());
      seriesMap.get(r.label).set(r.bucket, r.bookings);
    }

    const series = Array.from(seriesMap.entries()).map(([label, m]) => ({
      label,
      data: buckets.map(b => m.get(b) || 0)
    }));

    res.json({
      mode: validMode,
      bucket: validBucket,
      buckets,
      series
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export timeseries report to Excel
// Accepts same query params as usage-timeseries
router.get('/reports/export-timeseries', async (req, res) => {
  try {
    const { mode = 'user', bucket = 'day', from, to } = req.query;

    const validMode = ['group', 'computer'].includes(mode) ? mode : 'user';
    const validBucket = ['day', 'week', 'month', 'year'].includes(bucket) ? bucket : 'day';

    let timeFilter = '';
    const params = [];
    if (from) { timeFilter += ' AND b.start_time >= ?'; params.push(from); }
    if (to) { timeFilter += ' AND b.end_time <= ?'; params.push(to); }

    const bucketExpr =
      validBucket === 'day'
        ? "date(b.start_time)"
        : validBucket === 'week'
        ? "strftime('%Y-%W', b.start_time)"
        : validBucket === 'month'
        ? "strftime('%Y-%m', b.start_time)"
        : "strftime('%Y', b.start_time)";

    const labelSelect =
      validMode === 'group'
        ? 'u.group_name as label'
        : validMode === 'computer'
        ? 'c.name as label'
        : 'u.username as label';
    const joinComputer = validMode === 'computer' ? 'JOIN computers c ON c.id = b.computer_id' : '';

    const rows = db.prepare(`
      SELECT ${bucketExpr} as bucket, ${labelSelect}, COUNT(b.id) as bookings
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      ${joinComputer}
      WHERE 1=1 ${timeFilter}
      GROUP BY bucket, label
      ORDER BY bucket ASC
    `).all(...params);

    const bucketSet = new Set(rows.map(r => r.bucket));
    const buckets = Array.from(bucketSet).sort();
    const seriesMap = new Map();
    for (const r of rows) {
      if (!seriesMap.has(r.label)) seriesMap.set(r.label, new Map());
      seriesMap.get(r.label).set(r.bucket, r.bookings);
    }
    const labels = Array.from(seriesMap.keys());

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Timeseries');

    // Header row
    ws.addRow(['Bucket', ...labels]);
    // Data rows
    for (const b of buckets) {
      const row = [b, ...labels.map(l => seriesMap.get(l).get(b) || 0)];
      ws.addRow(row);
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="report_${validMode}_${validBucket}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export summary reports to Excel (user or group mode)
router.get('/reports/export-summary', async (req, res) => {
  try {
    const { mode = 'user', from, to } = req.query;
    const validMode = mode === 'group' ? 'group' : 'user';

    let timeFilter = '';
    const params = [];
    if (from) { timeFilter += ' AND b.start_time >= ?'; params.push(from); }
    if (to) { timeFilter += ' AND b.end_time <= ?'; params.push(to); }

    let query, headers;
    if (validMode === 'group') {
      query = `
        SELECT 
          u.group_name as groupName,
          COUNT(b.id) as bookings,
          ROUND(SUM((julianday(b.end_time) - julianday(b.start_time)) * 24), 2) as bookedHours,
          ROUND(SUM(CASE WHEN b.status = 'completed' THEN (julianday(b.end_time) - julianday(b.start_time)) * 24 ELSE 0 END), 2) as usedHours,
          ROUND(SUM(CASE WHEN b.status = 'cancelled' THEN (julianday(b.end_time) - julianday(b.start_time)) * 24 ELSE 0 END), 2) as noShowHours
        FROM bookings b
        JOIN users u ON u.id = b.user_id
        WHERE 1=1 ${timeFilter}
        GROUP BY u.group_name
        ORDER BY bookings DESC
      `;
      headers = ['Group', 'Bookings', 'Booked Hours', 'Used Hours', "Don't use time"];
    } else {
      query = `
        SELECT 
          u.username,
          u.fullname,
          COUNT(b.id) as bookings,
          ROUND(SUM((julianday(b.end_time) - julianday(b.start_time)) * 24), 2) as bookedHours,
          ROUND(SUM(CASE WHEN b.status = 'completed' THEN (julianday(b.end_time) - julianday(b.start_time)) * 24 ELSE 0 END), 2) as usedHours,
          ROUND(SUM(CASE WHEN b.status = 'cancelled' THEN (julianday(b.end_time) - julianday(b.start_time)) * 24 ELSE 0 END), 2) as noShowHours
        FROM bookings b
        JOIN users u ON u.id = b.user_id
        WHERE 1=1 ${timeFilter}
        GROUP BY u.id, u.username, u.fullname
        ORDER BY bookings DESC
      `;
      headers = ['Username', 'Full Name', 'Bookings', 'Booked Hours', 'Used Hours', "Don't use time"];
    }

    const rows = db.prepare(query).all(...params);

    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Summary Report');

    // Add headers
    ws.addRow(headers);
    
    // Add data rows
    for (const row of rows) {
      const values = Object.values(row);
      ws.addRow(values);
    }

    // Style headers
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE5E7EB' }
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="summary_report_${validMode}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint to check database data
router.get('/debug', (req, res) => {
  try {
    const users = db.prepare('SELECT id, username, role FROM users').all();
    const computers = db.prepare('SELECT id, name, status FROM computers').all();
    const bookings = db.prepare('SELECT id, user_id, computer_id, start_time, end_time, status FROM bookings').all();
    
    res.json({
      users,
      computers,
      bookings,
      counts: {
        totalUsers: users.length,
        totalComputers: computers.length,
        totalBookings: bookings.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple test endpoint
router.get('/test', (req, res) => {
  try {
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const computerCount = db.prepare('SELECT COUNT(*) as count FROM computers').get();
    const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get();
    
    res.json({
      message: 'Admin API is working',
      counts: {
        users: userCount.count,
        computers: computerCount.count,
        bookings: bookingCount.count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

