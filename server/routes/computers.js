import express from 'express';
import db from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all computers with availability status
router.get('/', authenticateToken, (req, res) => {
  try {
    const computers = db.prepare(`
      SELECT 
        c.*,
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

    res.json(computers);
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

export default router;


