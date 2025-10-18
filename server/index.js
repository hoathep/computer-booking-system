import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import computerRoutes from './routes/computers.js';
import bookingRoutes from './routes/bookings.js';
import adminRoutes from './routes/admin.js';
import clientRoutes from './routes/client.js';
import aiRoutes from './routes/ai.js';
import { initDatabase } from './database/init.js';
import schedule from 'node-schedule';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/computers', computerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API endpoint: http://localhost:${PORT}/api`);
});

// --- Booking status management job ---
// Every minute: update booking statuses and handle no-shows
import db from './database/init.js';
schedule.scheduleJob('* * * * *', () => {
  try {
    const nowIso = new Date().toISOString();
    
    // 1. Update booked bookings to active if start time has passed
    const activatedBookings = db.prepare(`
      UPDATE bookings 
      SET status = 'active'
      WHERE status = 'booked'
      AND start_time <= ? AND end_time > ?
    `).run(nowIso, nowIso);
    
    if (activatedBookings.changes > 0) {
      console.log(`🔄 Activated ${activatedBookings.changes} bookings`);
    }
    
    // 2. Update expired active bookings to completed
    const expiredActive = db.prepare(`
      UPDATE bookings 
      SET status = 'completed'
      WHERE status = 'active'
      AND end_time <= ?
    `).run(nowIso);
    
    if (expiredActive.changes > 0) {
      console.log(`✅ Completed ${expiredActive.changes} expired bookings`);
    }
    
    // 3. Handle no-show cancellations
    const candidates = db.prepare(`
      SELECT b.id, b.user_id, b.start_time, gl.no_show_minutes
      FROM bookings b
      JOIN users u ON u.id = b.user_id
      LEFT JOIN group_limits gl ON gl.group_name = u.group_name
      WHERE b.status = 'booked'
      AND b.start_time <= ?
    `).all(nowIso);

    const staleIds = [];
    for (const c of candidates) {
      const minutes = (c.no_show_minutes ?? 15);
      const cutoff = new Date(new Date(c.start_time).getTime() + minutes * 60 * 1000);
      if (new Date(nowIso) >= cutoff) {
        // still booked and not unlocked?
        const sess = db.prepare('SELECT unlocked_at FROM sessions WHERE booking_id = ?').get(c.id);
        if (!sess || !sess.unlocked_at) {
          staleIds.push(c.id);
        }
      }
    }
    if (staleIds.length > 0) {
      const placeholders = staleIds.map(() => '?').join(',');
      db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id IN (${placeholders})`).run(...staleIds);
      db.prepare(`UPDATE sessions SET status = 'locked', locked_at = ? WHERE booking_id IN (${placeholders})`).run(nowIso, ...staleIds);
      console.log(`⏰ Auto-cancelled no-show bookings: ${staleIds.join(', ')}`);
    }
  } catch (err) {
    console.error('Booking status job error:', err.message);
  }
});


