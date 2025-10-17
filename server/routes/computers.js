import express from 'express';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get hot computers (most booked) - MUST be before /:id route
router.get('/hot', authenticateToken, (req, res) => {
  try {
    const computers = db.prepare(`
      SELECT c.*, 
             COUNT(b.id) as booking_count,
             COALESCE(c.rating, 0) as rating,
             COALESCE(c.rating_count, 0) as rating_count,
             (
               SELECT COUNT(*) 
               FROM bookings b2 
               WHERE b2.computer_id = c.id 
               AND b2.status = 'active'
               AND datetime('now') BETWEEN b2.start_time AND b2.end_time
             ) as is_currently_in_use,
             (
               SELECT COUNT(*) 
               FROM bookings b3 
               WHERE b3.computer_id = c.id 
               AND b3.status = 'pending'
               AND datetime('now') < b3.start_time
             ) as is_booked_future
      FROM computers c
      LEFT JOIN bookings b ON c.id = b.computer_id
      GROUP BY c.id
      ORDER BY booking_count DESC, rating DESC
    `).all();

    // Add computed status for easier frontend handling
    const computersWithStatus = computers.map(computer => ({
      ...computer,
      status: computer.is_currently_in_use > 0 ? 'in_use' : 
              computer.is_booked_future > 0 ? 'booked' : 
              computer.status === 'maintenance' ? 'maintenance' :
              computer.status === 'disabled' ? 'disabled' : 'available'
    }));

    res.json(computersWithStatus);
  } catch (error) {
    console.error('Hot computers error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all computers with availability status
router.get('/', authenticateToken, (req, res) => {
  try {
    const now = new Date().toISOString();
    
    const computers = db.prepare(`
      SELECT 
        c.*,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status = 'active'
          AND datetime('now') BETWEEN b.start_time AND b.end_time
        ) as is_currently_in_use,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status = 'pending'
          AND datetime('now') < b.start_time
        ) as is_booked_future,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('pending', 'active')
          AND datetime('now') BETWEEN b.start_time AND b.end_time
        ) as is_currently_booked
      FROM computers c
      ORDER BY c.name
    `).all();

    // Add computed status for easier frontend handling
    const computersWithStatus = computers.map(computer => ({
      ...computer,
      status: computer.status === 'maintenance' ? 'maintenance' :
              computer.status === 'disabled' ? 'disabled' :
              computer.is_currently_in_use > 0 ? 'in_use' : 
              computer.is_booked_future > 0 ? 'booked' : 'available'
    }));

    res.json(computersWithStatus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get computer by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(req.params.id);
    
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }

    res.json(computer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get computer bookings (for calendar view)
router.get('/:id/bookings', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let query = `
      SELECT 
        b.*,
        u.username,
        u.fullname
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.computer_id = ?
      AND b.status IN ('pending', 'active', 'completed')
    `;
    
    const params = [req.params.id];
    
    if (start_date && end_date) {
      query += ` AND b.start_time >= ? AND b.end_time <= ?`;
      params.push(start_date, end_date);
    }
    
    query += ` ORDER BY b.start_time`;
    
    const bookings = db.prepare(query).all(...params);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto cleanup expired bookings and update status
router.post('/cleanup-expired', authenticateToken, (req, res) => {
  try {
    const now = new Date().toISOString();
    
    // Update pending bookings to active if start time has passed
    const activatedBookings = db.prepare(`
      UPDATE bookings 
      SET status = 'active'
      WHERE status = 'pending'
      AND start_time <= ? AND end_time > ?
    `).run(now, now);

    // Update expired active bookings to completed
    const expiredActive = db.prepare(`
      UPDATE bookings 
      SET status = 'completed'
      WHERE status = 'active'
      AND end_time <= ?
    `).run(now);

    // Update expired pending bookings to cancelled (if start time passed but end time also passed)
    const expiredPending = db.prepare(`
      UPDATE bookings 
      SET status = 'cancelled'
      WHERE status = 'pending'
      AND start_time < ? AND end_time <= ?
    `).run(now, now);

    res.json({
      message: 'Status update completed successfully',
      activatedBookings: activatedBookings.changes,
      expiredActive: expiredActive.changes,
      expiredPending: expiredPending.changes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Rate a computer
router.post('/:id/rate', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { rating, bookingId } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (!bookingId) {
      return res.status(400).json({ error: 'Booking ID is required' });
    }

    // Check if user has completed this specific booking
    const booking = db.prepare(`
      SELECT * FROM bookings 
      WHERE id = ? AND user_id = ? AND computer_id = ? AND status = 'completed'
    `).get(bookingId, userId, id);

    if (!booking) {
      return res.status(400).json({ error: 'You can only rate completed bookings' });
    }

    // Check if booking is within 5 days of completion
    const bookingEndTime = new Date(booking.end_time);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    if (bookingEndTime < fiveDaysAgo) {
      return res.status(400).json({ error: 'Rating period has expired (5 days limit)' });
    }

    // Check if this booking already has a rating
    const existingRating = db.prepare(`
      SELECT rating FROM booking_ratings 
      WHERE booking_id = ?
    `).get(bookingId);

    let newCount, newRating;
    
    if (existingRating) {
      // Update existing rating
      const computer = db.prepare('SELECT rating, rating_count FROM computers WHERE id = ?').get(id);
      const oldRating = existingRating.rating;
      const currentTotal = (computer.rating || 0) * (computer.rating_count || 0);
      const newTotal = currentTotal - oldRating + rating;
      
      newCount = computer.rating_count || 0;
      newRating = newTotal / newCount;

      // Update booking rating
      db.prepare(`
        UPDATE booking_ratings 
        SET rating = ?, updated_at = CURRENT_TIMESTAMP
        WHERE booking_id = ?
      `).run(rating, bookingId);
    } else {
      // Add new rating
      const computer = db.prepare('SELECT rating, rating_count FROM computers WHERE id = ?').get(id);
      const currentTotal = (computer.rating || 0) * (computer.rating_count || 0);
      const newTotal = currentTotal + rating;
      
      newCount = (computer.rating_count || 0) + 1;
      newRating = newTotal / newCount;

      // Insert booking rating
      db.prepare(`
        INSERT INTO booking_ratings (booking_id, computer_id, user_id, rating, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(bookingId, id, userId, rating);
    }

    // Update computer rating
    db.prepare(`
      UPDATE computers 
      SET rating = ?, rating_count = ? 
      WHERE id = ?
    `).run(newRating, newCount, id);

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;


