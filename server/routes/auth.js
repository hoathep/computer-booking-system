import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Login
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'Account is banned' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role: user.role,
        fullname: user.fullname,
        group_name: user.group_name,
        max_concurrent_bookings: user.max_concurrent_bookings
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        fullname: user.fullname,
        role: user.role,
        group_name: user.group_name,
        max_concurrent_bookings: user.max_concurrent_bookings
      }
    });
  } catch (error) {
    console.error('Auth /login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register
router.post('/register', (req, res) => {
  try {
    const { username, password, fullname, email } = req.body;

    if (!username || !password || !fullname) {
      return res.status(400).json({ error: 'Username, password, and fullname required' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (username, password, fullname, email)
      VALUES (?, ?, ?, ?)
    `).run(username, hashedPassword, fullname, email || null);

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Auth /register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id, username, fullname, email, role, group_name, max_concurrent_bookings FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User self change password
router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (currentPassword && !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

