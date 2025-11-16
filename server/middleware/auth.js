import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { user_id, email }
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}
