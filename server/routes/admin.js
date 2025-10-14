import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/init.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken, isAdmin);

// --- USER MANAGEMENT ---

// Get all users
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, username, fullname, email, role, group_name, max_concurrent_bookings, created_at
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
    const { fullname, email, role, group_name, max_concurrent_bookings } = req.body;
    
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users 
      SET fullname = ?, email = ?, role = ?, group_name = ?, max_concurrent_bookings = ?
      WHERE id = ?
    `).run(fullname || user.fullname, email || user.email, role || user.role, group_name || user.group_name, max_concurrent_bookings !== undefined ? max_concurrent_bookings : user.max_concurrent_bookings, req.params.id);

    res.json({ message: 'User updated successfully' });
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
    const { name, description, location, ip_address, mac_address } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Computer name required' });
    }

    const result = db.prepare(`
      INSERT INTO computers (name, description, location, ip_address, mac_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, description || null, location || null, ip_address || null, mac_address || null);

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
    const { name, description, location, status, ip_address, mac_address } = req.body;
    
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(req.params.id);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    db.prepare(`
      UPDATE computers 
      SET name = ?, description = ?, location = ?, status = ?, ip_address = ?, mac_address = ?
      WHERE id = ?
    `).run(
      name || computer.name, 
      description !== undefined ? description : computer.description,
      location !== undefined ? location : computer.location,
      status || computer.status,
      ip_address !== undefined ? ip_address : computer.ip_address,
      mac_address !== undefined ? mac_address : computer.mac_address,
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
    const { group_name, max_concurrent_bookings } = req.body;

    if (!group_name || max_concurrent_bookings === undefined) {
      return res.status(400).json({ error: 'Group name and max concurrent bookings required' });
    }

    const existing = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get(group_name);
    
    if (existing) {
      db.prepare(`
        UPDATE group_limits 
        SET max_concurrent_bookings = ?
        WHERE group_name = ?
      `).run(max_concurrent_bookings, group_name);
      res.json({ message: 'Group updated successfully' });
    } else {
      db.prepare(`
        INSERT INTO group_limits (group_name, max_concurrent_bookings)
        VALUES (?, ?)
      `).run(group_name, max_concurrent_bookings);
      res.status(201).json({ message: 'Group created successfully' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
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

// Delete booking
router.delete('/bookings/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

