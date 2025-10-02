const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const pool = require('../config/database'); // You'll need to create this

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Registration endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, student_id, password, role } = req.body;

    // Validate role-based requirements
    if (role === 'student' && !student_id) {
      return res.status(400).json({ error: 'Student ID is required for student registration' });
    }
    
    if (role !== 'student' && !email) {
      return res.status(400).json({ error: 'Email is required for lecturer/PRL/PL registration' });
    }

    // Check if user already exists
    let checkQuery = '';
    let checkParams = [];
    
    if (role === 'student') {
      checkQuery = 'SELECT * FROM users WHERE student_id = ?';
      checkParams = [student_id];
    } else {
      checkQuery = 'SELECT * FROM users WHERE email = ?';
      checkParams = [email];
    }

    const [existingUsers] = await pool.execute(checkQuery, checkParams);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, student_id, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, student_id, hashedPassword, role]
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      user: { id: result.insertId, name, role }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password || !role) {
      return res.status(400).json({ error: 'Identifier, password, and role are required' });
    }

    // Determine if identifier is email or student_id based on role
    let query = '';
    if (role === 'student') {
      query = 'SELECT * FROM users WHERE student_id = ? AND role = ?';
    } else {
      query = 'SELECT * FROM users WHERE email = ? AND role = ?';
    }

    const [users] = await pool.execute(query, [identifier, role]);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name, 
        role: user.role,
        email: user.email,
        student_id: user.student_id
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        student_id: user.student_id
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { router, authenticateToken };