import express from 'express';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get computer availability stats for current date
router.get('/availability-stats', authenticateToken, (req, res) => {
  try {
    const { date } = req.query;
    
    // If no date provided, use current date
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Count total computers (excluding maintenance and disabled)
    const totalComputers = db.prepare(`
      SELECT COUNT(*) as count FROM computers 
      WHERE status NOT IN ('maintenance', 'disabled')
    `).get();
    
  // Count available computers using the same logic as the main endpoint
  const computers = db.prepare(`
      SELECT c.*,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('booked', 'active')
          AND DATE(b.start_time) = DATE(?)
        ) as has_bookings_on_date,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('booked', 'active')
          AND b.start_time <= datetime('now') AND b.end_time >= datetime('now')
        ) as is_currently_in_use,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status = 'booked'
          AND b.start_time > datetime('now')
          AND DATE(b.start_time) = DATE(?)
        ) as is_booked_future_on_date,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('booked', 'active')
          AND b.start_time <= ? AND b.end_time >= ?
        ) as has_active_bookings_in_timeframe
      FROM computers c
      WHERE c.status NOT IN ('maintenance', 'disabled')
      ORDER BY c.name
    `).all(targetDate, targetDate, `${targetDate} 00:00:00`, `${targetDate} 23:59:59`);

    // Calculate status for each computer and count available ones
    let availableCount = 0;
    let partiallyAvailableCount = 0;
    let bookedCount = 0;
    let inUseCount = 0;

    computers.forEach(computer => {
      let status;
      
      if (computer.is_currently_in_use > 0) {
        status = 'in_use';
        inUseCount++;
      } else if (computer.has_active_bookings_in_timeframe > 0) {
        status = 'partially_available';
        partiallyAvailableCount++;
      } else if (computer.is_booked_future_on_date > 0) {
        status = 'booked';
        bookedCount++;
      } else if (computer.has_bookings_on_date > 0) {
        status = 'partially_available';
        partiallyAvailableCount++;
      } else {
        status = 'available';
        availableCount++;
      }
    });

    res.json({
      totalComputers: totalComputers.count,
      availableComputers: availableCount,
      partiallyAvailableComputers: partiallyAvailableCount,
      bookedComputers: bookedCount,
      inUseComputers: inUseCount,
      date: targetDate
    });
  } catch (error) {
    console.error('Availability stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get hot computers (most booked) - MUST be before /:id route
router.get('/hot', authenticateToken, (req, res) => {
  try {
    const computers = db.prepare(`
      SELECT c.*, 
             COUNT(CASE WHEN b.status = 'completed' THEN b.id END) as booking_count,
             COALESCE(c.rating, 0) as rating,
             COALESCE(c.rating_count, 0) as rating_count,
             (
               SELECT COUNT(*) 
               FROM bookings b2 
               WHERE b2.computer_id = c.id 
               AND b2.status = 'active'
               AND datetime('now') >= datetime(b2.start_time) 
               AND datetime('now') <= datetime(b2.end_time)
             ) as is_currently_in_use,
             (
               SELECT COUNT(*) 
               FROM bookings b3 
               WHERE b3.computer_id = c.id 
               AND b3.status = 'booked'
               AND datetime('now') < datetime(b3.start_time)
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
    const { date } = req.query;
    
    // If no date provided, use current date
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    // Get start and end of the target date
    const startOfDay = `${targetDate} 00:00:00`;
    const endOfDay = `${targetDate} 23:59:59`;
    
    const computers = db.prepare(`
      SELECT c.*,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('booked', 'active')
          AND DATE(b.start_time) = DATE(?)
        ) as has_bookings_on_date,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('booked', 'active')
          AND b.start_time <= datetime('now') AND b.end_time >= datetime('now')
        ) as is_currently_in_use,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status = 'booked'
          AND b.start_time > datetime('now')
          AND DATE(b.start_time) = DATE(?)
        ) as is_booked_future_on_date,
        (
          SELECT COUNT(*) 
          FROM bookings b 
          WHERE b.computer_id = c.id 
          AND b.status IN ('booked', 'active')
          AND b.start_time <= ? AND b.end_time >= ?
        ) as has_active_bookings_in_timeframe
      FROM computers c
      ORDER BY c.name
    `).all(targetDate, targetDate, startOfDay, endOfDay);

    // Calculate status for each computer
    const computersWithStatus = computers.map(computer => {
      let status;
      
      if (computer.status === 'maintenance') {
        status = 'maintenance';
      } else if (computer.status === 'disabled') {
        status = 'disabled';
      } else if (computer.is_currently_in_use > 0) {
        // Machine is currently being used
        status = 'in_use';
      } else if (computer.has_active_bookings_in_timeframe > 0) {
        // Machine has active bookings in the selected timeframe
        status = 'partially_available';
      } else if (computer.is_booked_future_on_date > 0) {
        // Machine has future bookings on this date
        status = 'booked';
      } else if (computer.has_bookings_on_date > 0) {
        // Machine has some bookings on this date but not currently in use
        status = 'partially_available';
      } else {
        // No bookings on this date
        status = 'available';
      }
      
      return {
        ...computer,
        status,
        has_bookings_on_date: computer.has_bookings_on_date > 0,
        is_currently_in_use: computer.is_currently_in_use > 0,
        is_booked_future_on_date: computer.is_booked_future_on_date > 0,
        has_active_bookings_in_timeframe: computer.has_active_bookings_in_timeframe > 0
      };
    });

    res.json(computersWithStatus);
  } catch (error) {
    console.error('Get computers error:', error);
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
      AND b.status IN ('booked', 'active', 'completed')
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

// Get available time slots for a computer on a specific date
router.get('/:id/available-slots', authenticateToken, (req, res) => {
  try {
    const { date } = req.query;
    const computerId = req.params.id;
    
    if (!date) {
      return res.status(400).json({ error: 'Date parameter is required' });
    }
    
    // Get computer info
    const computer = db.prepare('SELECT * FROM computers WHERE id = ?').get(computerId);
    if (!computer) {
      return res.status(404).json({ error: 'Computer not found' });
    }
    
    // Generate all possible 30-minute slots for the day (8 AM to 10 PM)
    const slots = [];
    const startHour = 8;
    const endHour = 22;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60000); // Add 30 minutes
        
        // Check if this slot is available
        const existingBooking = db.prepare(`
          SELECT COUNT(*) as count FROM bookings 
          WHERE computer_id = ? 
          AND status IN ('booked', 'active')
          AND start_time < ? AND end_time > ?
        `).get(computerId, slotEnd.toISOString(), slotStart.toISOString());
        
        const isAvailable = existingBooking.count === 0;
        
        slots.push({
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
          available: isAvailable,
          display_time: slotStart.toLocaleTimeString('vi-VN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        });
      }
    }
    
    // Get existing bookings for this computer on this date
    const bookings = db.prepare(`
      SELECT b.*, u.username, u.fullname
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.computer_id = ?
      AND b.status IN ('booked', 'active')
      AND DATE(b.start_time) = ?
      ORDER BY b.start_time
    `).all(computerId, date);
    
    res.json({
      computer: {
        id: computer.id,
        name: computer.name,
        location: computer.location
      },
      date,
      slots,
      bookings
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Auto cleanup expired bookings and update status
router.post('/cleanup-expired', authenticateToken, (req, res) => {
  try {
    const now = new Date().toISOString();
    
    // Update booked bookings to active if start time has passed
    const activatedBookings = db.prepare(`
      UPDATE bookings 
      SET status = 'active'
      WHERE status = 'booked'
      AND start_time <= ? AND end_time > ?
    `).run(now, now);

    // Update expired active bookings to completed
    const expiredActive = db.prepare(`
      UPDATE bookings 
      SET status = 'completed'
      WHERE status = 'active'
      AND end_time <= ?
    `).run(now);

    // Update expired booked bookings to cancelled (if start time passed but end time also passed)
    const expiredBooked = db.prepare(`
      UPDATE bookings 
      SET status = 'cancelled'
      WHERE status = 'booked'
      AND start_time < ? AND end_time <= ?
    `).run(now, now);

    res.json({
      message: 'Status update completed successfully',
      activatedBookings: activatedBookings.changes,
      expiredActive: expiredActive.changes,
      expiredBooked: expiredBooked.changes
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


