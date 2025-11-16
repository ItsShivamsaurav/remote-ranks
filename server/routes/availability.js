import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const [rows] = await pool.query(
    'SELECT availability_id, day_of_week, start_time, end_time FROM availability WHERE user_id=? ORDER BY FIELD(day_of_week,"Mon","Tue","Wed","Thu","Fri","Sat","Sun"), start_time',
    [user_id]
  );
  res.json(rows);
});

router.post('/me', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { day_of_week, start_time, end_time } = req.body;
  await pool.query(
    'INSERT INTO availability (user_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)',
    [user_id, day_of_week, start_time, end_time]
  );
  res.json({ success: true });
});

router.delete('/me/:availability_id', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { availability_id } = req.params;
  await pool.query('DELETE FROM availability WHERE availability_id=? AND user_id=?', [availability_id, user_id]);
  res.json({ success: true });
});

export default router;
