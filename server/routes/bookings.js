import express from 'express';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all bookings with optional date filter (for calendar view)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        b.*,
        c.name as computer_name,
        c.location,
        c.description,
        u.username,
        u.fullname
      FROM bookings b
      JOIN computers c ON b.computer_id = c.id
      JOIN users u ON b.user_id = u.id
    `;
    
    const params = [];
    
    if (start_date && end_date) {
      query += ` WHERE b.start_time >= ? AND b.end_time <= ?`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY b.start_time ASC`;
    
    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's bookings
router.get('/my-bookings', authenticateToken, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.*,
        c.name as computer_name,
        c.location,
        c.description
      FROM bookings b
      JOIN computers c ON b.computer_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.start_time DESC
    `).all(req.user.id);

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active bookings for current user
router.get('/active', authenticateToken, (req, res) => {
  try {
    const activeBookings = db.prepare(`
      SELECT 
        b.*,
        c.name as computer_name,
        c.location
      FROM bookings b
      JOIN computers c ON b.computer_id = c.id
      WHERE b.user_id = ?
      AND b.status IN ('pending', 'active')
      AND datetime('now') < b.end_time
    `).all(req.user.id);

    res.json(activeBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new booking
router.post('/', authenticateToken, (req, res) => {
  try {
    const { computer_id, start_time, end_time } = req.body;
    const user_id = req.user.id;

    if (!computer_id || !start_time || !end_time) {
      return res.status(400).json({ error: 'Computer ID, start time, and end time required' });
    }

    // Validate time
    const startDateTime = new Date(start_time);
    const endDateTime = new Date(end_time);
    const now = new Date();

    if (startDateTime < now) {
      return res.status(400).json({ error: 'Start time cannot be in the past' });
    }

    if (endDateTime <= startDateTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    // Check if computer exists
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(computer_id);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    // Check for conflicting bookings on this computer
    const conflict = db.prepare(`
      SELECT * FROM bookings
      WHERE computer_id = ?
      AND status IN ('pending', 'active')
      AND (
        (start_time <= ? AND end_time > ?)
        OR (start_time < ? AND end_time >= ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `).get(computer_id, start_time, start_time, end_time, end_time, start_time, end_time);

    if (conflict) {
      return res.status(409).json({ error: 'Computer is already booked for this time slot' });
    }

    // Get user's max concurrent bookings
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    let maxBookings = user.max_concurrent_bookings;

    // If user limit is null or 0, check group limit
    if (!maxBookings || maxBookings === 0) {
      const groupLimit = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get(user.group_name);
      maxBookings = groupLimit ? groupLimit.max_concurrent_bookings : 1;
    }

    // Check current concurrent bookings for this user
    const currentBookings = db.prepare(`
      SELECT COUNT(*) as count FROM bookings
      WHERE user_id = ?
      AND status IN ('pending', 'active')
      AND (
        (start_time <= ? AND end_time > ?)
        OR (start_time < ? AND end_time >= ?)
        OR (start_time >= ? AND end_time <= ?)
      )
    `).get(user_id, start_time, start_time, end_time, end_time, start_time, end_time);

    if (currentBookings.count >= maxBookings) {
      return res.status(403).json({ 
        error: `You can only book ${maxBookings} computer(s) at the same time. You currently have ${currentBookings.count} active booking(s) for this time slot.` 
      });
    }

    // Create booking
    const result = db.prepare(`
      INSERT INTO bookings (user_id, computer_id, start_time, end_time, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).run(user_id, computer_id, start_time, end_time);

    // Create session with unlock code
    const unlockCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    db.prepare(`
      INSERT INTO sessions (booking_id, unlock_code, status)
      VALUES (?, ?, 'locked')
    `).run(result.lastInsertRowid, unlockCode);

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.lastInsertRowid,
      unlockCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cancel booking
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(req.params.id);

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


