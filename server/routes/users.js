import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const [[user]] = await pool.query('SELECT user_id, name, email, bio FROM users WHERE user_id=?', [user_id]);
  const [subjects] = await pool.query(
    'SELECT s.subject_id, s.subject_name FROM subjects s JOIN user_subjects us ON s.subject_id=us.subject_id WHERE us.user_id=?',
    [user_id]
  );
  const [availability] = await pool.query(
    'SELECT availability_id, day_of_week, start_time, end_time FROM availability WHERE user_id=?',
    [user_id]
  );
  res.json({ user, subjects, availability });
});

router.put('/me', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { name, bio } = req.body;
  await pool.query('UPDATE users SET name=?, bio=? WHERE user_id=?', [name, bio, user_id]);
  res.json({ success: true });
});

export default router;
