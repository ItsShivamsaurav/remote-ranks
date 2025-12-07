import express from 'express';
import { pool } from '../models/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, bio } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const [exists] = await pool.query('SELECT user_id FROM users WHERE email=?', [email]);
    if (exists.length) return res.status(409).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

   

    
    console.log('Sending verification email to:', email);
    const verifyLink = `${process.env.CLIENT_URL}/verify.html?token=${token}`;
    try {
        await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your Peer Study account',
      html: `<p>Hello ${name},</p>
             <p>Please verify your account by clicking the link below:</p>
             <a href="${verifyLink}">${verifyLink}</a>`
    });
        
    } catch (error) {
      console.log("Error in nodemailer :", error);  
    }
    
    
    res.json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.get('/verify/:token', async (req, res) => {
  const { token } = req.params;
  console.log('Verifying token:', token);
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE verification_token=?', [token]);
    if (!rows.length) return res.status(400).json({ error: 'Invalid token' });

    await pool.query('UPDATE users SET is_verified=TRUE, verification_token=NULL WHERE verification_token=?', [token]);
    res.json({ message: 'Email verified successfully. You can now login.' });
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
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email before logging in.' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.user_id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { user_id: user.user_id, name: user.name, email: user.email, bio: user.bio } });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
