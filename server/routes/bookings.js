import express from 'express';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

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
        c.description,
        c.ip_address,
        br.rating as existing_rating,
        s.unlock_code
      FROM bookings b
      JOIN computers c ON b.computer_id = c.id
      LEFT JOIN booking_ratings br ON b.id = br.booking_id
      LEFT JOIN sessions s ON b.id = s.booking_id
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
        c.location,
        c.ip_address
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

    // Enforce advance window based on settings
    try {
      db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
      const row = db.prepare(`SELECT value FROM settings WHERE key = 'maxAdvanceDays'`).get();
      const maxDays = row ? parseInt(row.value) : 7;
      const maxAllowed = new Date();
      maxAllowed.setDate(maxAllowed.getDate() + maxDays);
      if (startDateTime > maxAllowed || endDateTime > maxAllowed) {
        return res.status(400).json({ error: `Bookings allowed up to ${maxDays} days in advance` });
      }
    } catch (e) {
      // ignore settings read error -> fallback already enforced
    }

    // Check if computer exists
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(computer_id);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    // Check for conflicting bookings on this computer for the same time slot
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
      return res.status(409).json({ 
        error: 'Computer is already booked for this time slot',
        conflict: {
          id: conflict.id,
          start_time: conflict.start_time,
          end_time: conflict.end_time,
          status: conflict.status
        }
      });
    }

    // Get user's max concurrent bookings
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
    let maxBookings = user.max_concurrent_bookings;

    // If user limit is null or 0, check group limit
    if (!maxBookings || maxBookings === 0) {
      const groupLimit = db.prepare('SELECT * FROM group_limits WHERE group_name = ?').get(user.group_name);
      maxBookings = groupLimit ? groupLimit.max_concurrent_bookings : 1;
    }

    // Calculate total time slots for this booking (in 30-minute blocks)
    const bookingDuration = (new Date(end_time) - new Date(start_time)) / (30 * 60 * 1000); // Convert to 30-min slots
    const totalSlots = Math.ceil(bookingDuration);

    // Get all current bookings for this user
    const currentBookings = db.prepare(`
      SELECT start_time, end_time
      FROM bookings
      WHERE user_id = ?
      AND status IN ('pending', 'active')
    `).all(user_id);

    // Calculate total slots from current bookings
    let currentTotalSlots = 0;
    for (const booking of currentBookings) {
      const duration = (new Date(booking.end_time) - new Date(booking.start_time)) / (30 * 60 * 1000);
      currentTotalSlots += Math.ceil(duration);
    }

    const maxSlots = maxBookings * 2; // Convert max computers to max slots (assuming 1 computer = 2 slots per hour)

    if (currentTotalSlots + totalSlots > maxSlots) {
      return res.status(403).json({ 
        error: `You can only book ${maxBookings} computer(s) worth of time slots. You currently have ${currentTotalSlots} slot(s) booked and trying to book ${totalSlots} more slot(s).` 
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

  // Attempt to send email with unlock code if SMTP is configured and user has email
  try {
    const user = db.prepare('SELECT email, username, fullname FROM users WHERE id = ?').get(user_id);
    const settingsRow = db.prepare(`SELECT value FROM settings WHERE key = 'smtpConfig'`).get();
    if (user?.email && settingsRow?.value) {
      const cfg = JSON.parse(settingsRow.value);
      const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: { user: cfg.authUser, pass: cfg.authPass }
      });
      const mailOptions = {
        from: cfg.fromEmail,
        to: user.email,
        subject: 'Your booking unlock code',
        text: `Hello ${user.fullname || user.username},\n\nYour unlock code for the booking is: ${unlockCode}.\nStart: ${start_time}\nEnd: ${end_time}\n\nThank you.`,
      };
      // Fire and forget; don't block response if sending fails
      transporter.sendMail(mailOptions).catch(() => {});
    }
  } catch (e) {
    // ignore email errors
  }

    res.status(201).json({
      message: 'Booking created successfully',
      bookingId: result.lastInsertRowid,
      unlockCode
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Debug: Get all bookings for a computer in time range
router.get('/debug/:computerId', authenticateToken, (req, res) => {
  try {
    const { computerId } = req.params;
    const { start_time, end_time } = req.query;
    
    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'start_time and end_time required' });
    }

    const bookings = db.prepare(`
      SELECT id, start_time, end_time, status, user_id
      FROM bookings
      WHERE computer_id = ?
      AND (
        (start_time <= ? AND end_time > ?)
        OR (start_time < ? AND end_time >= ?)
        OR (start_time >= ? AND end_time <= ?)
      )
      ORDER BY start_time
    `).all(computerId, start_time, start_time, end_time, end_time, start_time, end_time);

    res.json({ bookings, requested: { start_time, end_time } });
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


