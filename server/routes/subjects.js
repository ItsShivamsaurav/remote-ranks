import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  const [rows] = await pool.query('SELECT subject_id, subject_name FROM subjects ORDER BY subject_name');
  res.json(rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { subject_name } = req.body;
  if (!subject_name) return res.status(400).json({ error: 'subject_name required' });
  try {
    await pool.query('INSERT INTO subjects (subject_name) VALUES (?)', [subject_name]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/assign', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { subject_id } = req.body;
  await pool.query('INSERT IGNORE INTO user_subjects (user_id, subject_id) VALUES (?, ?)', [user_id, subject_id]);
  res.json({ success: true });
});

router.delete('/assign/:subject_id', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { subject_id } = req.params;
  await pool.query('DELETE FROM user_subjects WHERE user_id=? AND subject_id=?', [user_id, subject_id]);
  res.json({ success: true });
});

export default router;
