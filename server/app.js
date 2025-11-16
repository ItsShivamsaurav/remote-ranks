import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './models/db.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import subjectRoutes from './routes/subjects.js';
import availabilityRoutes from './routes/availability.js';
import matchRoutes from './routes/match.js';
import sessionRoutes from './routes/sessions.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/sessions', sessionRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
