import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/peers', requireAuth, async (req, res) => {
  const { subject_id } = req.query;
  const { user_id } = req.user;

  if (!subject_id) return res.status(400).json({ error: 'subject_id required' });

  const [rows] = await pool.query(
    `SELECT u.user_id, u.name, u.bio
     FROM users u
     JOIN user_subjects us ON u.user_id = us.user_id
     WHERE us.subject_id = ? AND u.user_id <> ?`,
    [subject_id, user_id]
  );

  res.json(rows);
});

router.get('/overlap/:peerId', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { peerId } = req.params;

  const [a1] = await pool.query('SELECT day_of_week, start_time, end_time FROM availability WHERE user_id=?', [user_id]);
  const [a2] = await pool.query('SELECT day_of_week, start_time, end_time FROM availability WHERE user_id=?', [peerId]);

  for (const s1 of a1) {
    const sameDay = a2.filter(s2 => s2.day_of_week === s1.day_of_week);
    for (const s2 of sameDay) {
      const start = s1.start_time > s2.start_time ? s1.start_time : s2.start_time;
      const end = s1.end_time < s2.end_time ? s1.end_time : s2.end_time;
      if (start < end) {
        return res.json({ day_of_week: s1.day_of_week, start_time: start, end_time: end });
      }
    }
  }

  res.json({ message: 'No overlap found' });
});

export default router;
