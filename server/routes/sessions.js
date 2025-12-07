import express from 'express';
import { pool } from '../models/db.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();

router.get('/me', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const [rows] = await pool.query(
    `SELECT s.session_id, s.user1_id, s.user2_id, s.subject_id, s.scheduled_time, s.duration_minutes, s.meeting_link, s.status, u1.name AS user1_name, u2.name AS user2_name, subj.subject_name
     FROM sessions s
     JOIN users u1 ON s.user1_id=u1.user_id
     JOIN users u2 ON s.user2_id=u2.user_id
     JOIN subjects subj ON s.subject_id=subj.subject_id
     WHERE s.user1_id=? OR s.user2_id=?
     ORDER BY s.scheduled_time DESC`,
    [user_id, user_id]
  );
  res.json(rows);
});

router.post('/propose', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { peer_id, subject_id, scheduled_time, duration_minutes } = req.body;
  if (!peer_id || !subject_id || !scheduled_time) return res.status(400).json({ error: 'Missing fields' });

  const roomName = `peerstudy-${crypto.randomBytes(6).toString('hex')}`;
  const meetingLink = `https://meet.jit.si/${roomName}`;

  await pool.query(
    `INSERT INTO sessions (user1_id, user2_id, subject_id, scheduled_time, duration_minutes, status, meeting_link)
     VALUES (?, ?, ?, ?, ?, 'proposed', ?)`,
    [user_id, peer_id, subject_id, scheduled_time, duration_minutes || 60, meetingLink]
  );

  res.json({ success: true, meetingLink });
});

router.put('/:session_id/status', requireAuth, async (req, res) => {
  const { user_id } = req.user;
  const { session_id } = req.params;
  const { status } = req.body; 
  console.log("session status: ", status);

  const [[session]] = await pool.query('SELECT * FROM sessions WHERE session_id=?', [session_id]);
  if (!session) return res.status(404).json({ error: 'Not found' });
  if (session.user2_id !== user_id && session.user1_id !== user_id) return res.status(403).json({ error: 'Not your session' });

  await pool.query('UPDATE sessions SET status=? WHERE session_id=?', [status, session_id]);
  if(status != 'confirmed') {
    await pool.query('UPDATE sessions SET meeting_link=NULL WHERE session_id=?', [session_id]);
  }
  res.json({ success: true });
});

export default router;
