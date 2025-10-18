import express from 'express';
import db from '../database/init.js';

const router = express.Router();

// Check if computer should be unlocked
router.post('/check-unlock', (req, res) => {
  try {
    const { computer_id } = req.body;

    if (!computer_id) {
      return res.status(400).json({ error: 'Computer ID required' });
    }

    // Find active booking for this computer
    const now = new Date().toISOString();
    
    const booking = db.prepare(`
      SELECT 
        b.*,
        u.fullname,
        s.unlock_code,
        s.status as session_status
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      LEFT JOIN sessions s ON s.booking_id = b.id
      WHERE b.computer_id = ?
      AND b.status IN ('booked', 'active')
      AND ? >= b.start_time
      AND ? <= b.end_time
      ORDER BY b.start_time
      LIMIT 1
    `).get(computer_id, now, now);

    if (!booking) {
      return res.json({ 
        shouldUnlock: false,
        message: 'No active booking found'
      });
    }

    // Check if session should be unlocked
    const startTime = new Date(booking.start_time);
    const endTime = new Date(booking.end_time);
    const currentTime = new Date(now);

    // Update booking status to active if it's booked and time has started
    if (booking.status === 'booked' && currentTime >= startTime) {
      db.prepare(`UPDATE bookings SET status = 'active' WHERE id = ?`).run(booking.id);
      booking.status = 'active'; // Update local object for response
    }

    const shouldUnlock = currentTime >= startTime && currentTime <= endTime;

    res.json({
      shouldUnlock,
      booking: {
        id: booking.id,
        user: booking.fullname,
        start_time: booking.start_time,
        end_time: booking.end_time,
        unlock_code: booking.unlock_code
      },
      message: shouldUnlock ? 'Computer is ready to use' : 'Booking time has not started yet'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock computer with code
router.post('/unlock', (req, res) => {
  try {
    const { computer_id, unlock_code } = req.body;

    if (!computer_id || !unlock_code) {
      return res.status(400).json({ error: 'Computer ID and unlock code required' });
    }

    const now = new Date().toISOString();

    const session = db.prepare(`
      SELECT 
        s.*,
        b.computer_id,
        b.start_time,
        b.end_time
      FROM sessions s
      JOIN bookings b ON s.booking_id = b.id
      WHERE b.computer_id = ?
      AND s.unlock_code = ?
      AND b.status = 'active'
      AND ? >= b.start_time
      AND ? <= b.end_time
    `).get(computer_id, unlock_code, now, now);

    if (!session) {
      return res.status(403).json({ error: 'Invalid unlock code or booking not active' });
    }

    // Update session to unlocked
    db.prepare(`
      UPDATE sessions 
      SET status = 'unlocked', unlocked_at = ?
      WHERE id = ?
    `).run(now, session.id);

    res.json({ 
      success: true,
      message: 'Computer unlocked successfully',
      end_time: session.end_time
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Lock computer (when time is up)
router.post('/lock', (req, res) => {
  try {
    const { computer_id } = req.body;

    if (!computer_id) {
      return res.status(400).json({ error: 'Computer ID required' });
    }

    const now = new Date().toISOString();

    // Update all expired bookings
    db.prepare(`
      UPDATE bookings 
      SET status = 'completed'
      WHERE computer_id = ?
      AND status = 'active'
      AND end_time <= ?
    `).run(computer_id, now);

    // Lock all sessions
    db.prepare(`
      UPDATE sessions 
      SET status = 'locked', locked_at = ?
      WHERE booking_id IN (
        SELECT id FROM bookings 
        WHERE computer_id = ? AND status = 'completed'
      )
    `).run(now, computer_id);

    res.json({ 
      success: true,
      message: 'Computer locked successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


