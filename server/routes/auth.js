import express from 'express';
import { pool } from '../models/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { name, email, password, bio } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [exists] = await pool.query('SELECT user_id FROM users WHERE email=?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already in use' });
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, bio) VALUES (?, ?, ?, ?)',
      [name, email, hash, bio || null]
    );
    const token = jwt.sign({ user_id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { user_id: result.insertId, name, email, bio } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, bio: user.bio } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
