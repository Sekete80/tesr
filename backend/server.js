require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'luct-reporting-secret-key-2024';

// Create MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'luct_reporting',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}
testConnection();

// Authentication middleware
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

// ========== AUTHENTICATION ENDPOINTS ==========

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'LUCT Reporting System API is running',
    timestamp: new Date().toISOString()
  });
});

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, student_id, password, role } = req.body;
    console.log('Registration attempt:', { name, email, student_id, role });

    // Validate role-based requirements
    if (role === 'student') {
      if (!student_id) {
        return res.status(400).json({ error: 'Student ID is required for student registration' });
      }
      if (!/^\d{9}$/.test(student_id)) {
        return res.status(400).json({ error: 'Student ID must be 9 digits (e.g., 901019102)' });
      }
    } else {
      if (!email) {
        return res.status(400).json({ error: 'Email is required for lecturer/PRL/PL registration' });
      }
      if (!email.endsWith('@luct.co.ls')) {
        return res.status(400).json({ error: 'Email must be a valid LUCT email address (e.g., example@luct.co.ls)' });
      }
    }

    if (!name || !password) {
      return res.status(400).json({ error: 'Name and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    let checkQuery = '';
    let checkParams = [];
    
    if (role === 'student') {
      checkQuery = 'SELECT * FROM users WHERE student_id = ? OR email = ?';
      checkParams = [student_id, email || ''];
    } else {
      checkQuery = 'SELECT * FROM users WHERE email = ? OR student_id = ?';
      checkParams = [email, student_id || ''];
    }

    const [existingUsers] = await pool.execute(checkQuery, checkParams);
    if (existingUsers.length > 0) {
      const existing = existingUsers[0];
      if (role === 'student' && existing.student_id === student_id) {
        return res.status(400).json({ error: 'Student ID already registered' });
      }
      if (existing.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, student_id, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email || null, student_id || null, hashedPassword, role]
    );

    console.log('User registered successfully:', result.insertId);

    res.status(201).json({ 
      success: true,
      message: 'User registered successfully',
      user: { 
        id: result.insertId, 
        name, 
        role,
        email: email || null,
        student_id: student_id || null
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    console.log('Login attempt:', { identifier, role });

    if (!identifier || !password || !role) {
      return res.status(400).json({ error: 'Identifier, password, and role are required' });
    }

    // Determine if identifier is email or student_id based on role
    let query = '';
    let queryParams = [];
    
    if (role === 'student') {
      query = 'SELECT * FROM users WHERE student_id = ? AND role = ?';
      queryParams = [identifier, role];
    } else {
      query = 'SELECT * FROM users WHERE email = ? AND role = ?';
      queryParams = [identifier, role];
    }

    const [users] = await pool.execute(query, queryParams);
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials - user not found' });
    }

    const user = users[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials - wrong password' });
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

    console.log('Login successful for user:', user.name);

    res.json({
      success: true,
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
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// ========== COURSE ENDPOINTS ==========

// Create course
app.post('/api/courses', async (req, res) => {
  try {
    const { faculty_name, class_name, course_name, course_code, venue, scheduled_time, total_registered } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO courses (faculty_name, class_name, course_name, course_code, venue, scheduled_time, total_registered) VALUES (?,?,?,?,?,?,?)',
      [faculty_name, class_name, course_name, course_code, venue, scheduled_time, total_registered || 0]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// List courses
app.get('/api/courses', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM courses ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ========== LECTURER REPORT ENDPOINTS ==========

// Create report (Lecturer reports)
app.post('/api/reports', async (req, res) => {
  try {
    const {
      course_id,
      lecturer_name,
      week_of_reporting,
      date_of_lecture,
      topic_taught,
      learning_outcomes,
      lecturer_recommendations,
      actual_present
    } = req.body;
    const [result] = await pool.execute(
      `INSERT INTO reports (course_id, lecturer_name, week_of_reporting, date_of_lecture, topic_taught, learning_outcomes, lecturer_recommendations, actual_present) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [course_id, lecturer_name, week_of_reporting, date_of_lecture, topic_taught, learning_outcomes, lecturer_recommendations, actual_present]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// List reports (with course info)
app.get('/api/reports', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, c.course_name, c.course_code, c.faculty_name, c.class_name
       FROM reports r
       LEFT JOIN courses c ON r.course_id = c.id
       ORDER BY r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get report by ID
app.get('/api/reports/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT r.*, c.course_name, c.course_code, c.faculty_name, c.class_name
       FROM reports r
       LEFT JOIN courses c ON r.course_id = c.id
       WHERE r.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ========== LECTURER MONITORING ENDPOINTS ==========

// Lecturer Monitoring endpoint
app.post('/api/lecturer_monitoring', async (req, res) => {
  try {
    const {
      course_id,
      monitoring_notes,
      student_performance_notes,
      discipline_issues
    } = req.body;
    
    console.log('Received lecturer monitoring data:', req.body);
    
    const [result] = await pool.execute(
      `INSERT INTO lecturer_monitoring (course_id, monitoring_notes, student_performance_notes, discipline_issues) 
       VALUES (?, ?, ?, ?)`,
      [course_id, monitoring_notes, student_performance_notes, discipline_issues]
    );
    
    res.json({ 
      id: result.insertId, 
      message: 'Monitoring data saved successfully' 
    });
  } catch (err) {
    console.error('Lecturer monitoring error:', err);
    res.status(500).json({ error: 'Failed to save monitoring data: ' + err.message });
  }
});

// Get lecturer monitoring data
app.get('/api/lecturer_monitoring', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT lm.*, c.course_name, c.course_code 
      FROM lecturer_monitoring lm
      LEFT JOIN courses c ON lm.course_id = c.id
      ORDER BY lm.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get lecturer monitoring error:', err);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
});


// ========== LECTURER RATING ENDPOINT ==========

// Lecturer Rating endpoint
app.post('/api/lecturer_rating', async (req, res) => {
  try {
    const {
      course_id,
      student_rating,
      course_structure_rating,
      overall_rating,
      comments
    } = req.body;
    
    console.log('Received lecturer rating data:', req.body);
    
    const [result] = await pool.execute(
      `INSERT INTO lecturer_rating (course_id, student_rating, course_structure_rating, overall_rating, comments) 
       VALUES (?, ?, ?, ?, ?)`,
      [course_id, student_rating, course_structure_rating, overall_rating, comments]
    );
    
    res.json({ 
      id: result.insertId, 
      message: 'Rating submitted successfully' 
    });
  } catch (err) {
    console.error('Lecturer rating error:', err);
    res.status(500).json({ error: 'Failed to submit rating: ' + err.message });
  }
});

// Get lecturer ratings
app.get('/api/lecturer_rating', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT lr.*, c.course_name, c.course_code 
      FROM lecturer_rating lr
      LEFT JOIN courses c ON lr.course_id = c.id
      ORDER BY lr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get lecturer rating error:', err);
    res.status(500).json({ error: 'Failed to fetch rating data' });
  }
});

// ========== PRL REPORTS ENDPOINTS ==========

app.post('/api/prl_reports', async (req, res) => {
  try {
    const { lecturer_report_id, prl_name, summary, recommendations, rating } = req.body;
    console.log('Received PRL report data:', req.body);
    
    const [result] = await pool.execute(
      "INSERT INTO prl_reports (lecturer_report_id, prl_name, summary, recommendations, rating) VALUES (?, ?, ?, ?, ?)",
      [lecturer_report_id, prl_name, summary, recommendations, rating || null]
    );
    res.json({ id: result.insertId, message: 'PRL report submitted successfully' });
  } catch (err) {
    console.error('Error in PRL reports endpoint:', err);
    res.status(500).json({ error: 'DB error - check if prl_reports table exists: ' + err.message });
  }
});

app.get('/api/prl_reports', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pr.*, r.lecturer_name, r.week_of_reporting, c.course_name 
      FROM prl_reports pr 
      LEFT JOIN reports r ON pr.lecturer_report_id = r.id 
      LEFT JOIN courses c ON r.course_id = c.id
      ORDER BY pr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get PRL report by ID
app.get('/api/prl_reports/:id', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pr.*, r.lecturer_name, r.week_of_reporting, c.course_name 
      FROM prl_reports pr 
      LEFT JOIN reports r ON pr.lecturer_report_id = r.id 
      LEFT JOIN courses c ON r.course_id = c.id
      WHERE pr.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'PRL report not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});


// ========== PRINCIPAL LECTURER (PL) ENDPOINTS ==========

// PL Courses endpoint
app.post('/api/pl_courses', async (req, res) => {
  try {
    const { program_name, course_code, course_name, prl_responsible } = req.body;
    console.log('Received PL course data:', req.body);
    
    const [result] = await pool.execute(
      'INSERT INTO pl_courses (program_name, course_code, course_name, prl_responsible) VALUES (?, ?, ?, ?)',
      [program_name, course_code, course_name, prl_responsible]
    );
    res.json({ id: result.insertId, message: 'Program courses updated successfully' });
  } catch (err) {
    console.error('PL courses error:', err);
    res.status(500).json({ error: 'Failed to update program courses: ' + err.message });
  }
});

// PL Classes endpoint
app.post('/api/pl_classes', async (req, res) => {
  try {
    const { prl_id, class_details, oversight_notes } = req.body;
    console.log('Received PL class data:', req.body);
    
    const [result] = await pool.execute(
      'INSERT INTO pl_classes (prl_id, class_details, oversight_notes) VALUES (?, ?, ?)',
      [prl_id, class_details, oversight_notes]
    );
    res.json({ id: result.insertId, message: 'Class oversight data saved successfully' });
  } catch (err) {
    console.error('PL classes error:', err);
    res.status(500).json({ error: 'Failed to save class oversight data: ' + err.message });
  }
});

// PL Monitoring endpoint
app.post('/api/pl_monitoring', async (req, res) => {
  try {
    const { program_quality_notes, prl_performance_notes, overall_program_health } = req.body;
    console.log('Received PL monitoring data:', req.body);
    
    const [result] = await pool.execute(
      'INSERT INTO pl_monitoring (program_quality_notes, prl_performance_notes, overall_program_health) VALUES (?, ?, ?)',
      [program_quality_notes, prl_performance_notes, overall_program_health]
    );
    res.json({ id: result.insertId, message: 'Program monitoring data saved successfully' });
  } catch (err) {
    console.error('PL monitoring error:', err);
    res.status(500).json({ error: 'Failed to save program monitoring data: ' + err.message });
  }
});

// PL Rating endpoint
app.post('/api/pl_rating', async (req, res) => {
  try {
    const { prl_id, program_rating, prl_performance_rating, comments } = req.body;
    console.log('Received PL rating data:', req.body);
    
    const [result] = await pool.execute(
      'INSERT INTO pl_rating (prl_id, program_rating, prl_performance_rating, comments) VALUES (?, ?, ?, ?)',
      [prl_id, program_rating, prl_performance_rating, comments]
    );
    res.json({ id: result.insertId, message: 'Rating submitted successfully' });
  } catch (err) {
    console.error('PL rating error:', err);
    res.status(500).json({ error: 'Failed to submit rating: ' + err.message });
  }
});

// ========== PL (PROGRAM LEADER) ENDPOINTS ==========

// PL Courses endpoint
app.post('/api/pl_courses', authenticateToken, async (req, res) => {
  try {
    const { program_name, course_code, course_name, prl_responsible } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO pl_courses (program_name, course_code, course_name, prl_responsible) VALUES (?, ?, ?, ?)',
      [program_name, course_code, course_name, prl_responsible]
    );
    res.json({ id: result.insertId, message: 'Program courses updated successfully' });
  } catch (err) {
    console.error('PL courses error:', err);
    res.status(500).json({ error: 'Failed to update program courses' });
  }
});

// PL Classes endpoint
app.post('/api/pl_classes', authenticateToken, async (req, res) => {
  try {
    const { prl_id, class_details, oversight_notes } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO pl_classes (prl_id, class_details, oversight_notes) VALUES (?, ?, ?)',
      [prl_id, class_details, oversight_notes]
    );
    res.json({ id: result.insertId, message: 'Class oversight data saved successfully' });
  } catch (err) {
    console.error('PL classes error:', err);
    res.status(500).json({ error: 'Failed to save class oversight data' });
  }
});

// PL Reports endpoint
app.post('/api/pl_reports', authenticateToken, async (req, res) => {
  try {
    const { prl_report_id, pl_name, program_summary, overall_assessment, rating } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO pl_reports (prl_report_id, pl_name, program_summary, overall_assessment, rating) VALUES (?, ?, ?, ?, ?)',
      [prl_report_id, pl_name, program_summary, overall_assessment, rating || null]
    );
    res.json({ id: result.insertId, message: 'Program report finalized successfully' });
  } catch (err) {
    console.error('PL reports error:', err);
    res.status(500).json({ error: 'Failed to finalize program report' });
  }
});

// PL Monitoring endpoint
app.post('/api/pl_monitoring', authenticateToken, async (req, res) => {
  try {
    const { program_quality_notes, prl_performance_notes, overall_program_health } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO pl_monitoring (program_quality_notes, prl_performance_notes, overall_program_health) VALUES (?, ?, ?)',
      [program_quality_notes, prl_performance_notes, overall_program_health]
    );
    res.json({ id: result.insertId, message: 'Program monitoring data saved successfully' });
  } catch (err) {
    console.error('PL monitoring error:', err);
    res.status(500).json({ error: 'Failed to save program monitoring data' });
  }
});

// PL Rating endpoint
app.post('/api/pl_rating', authenticateToken, async (req, res) => {
  try {
    const { prl_id, program_rating, prl_performance_rating, comments } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO pl_rating (prl_id, program_rating, prl_performance_rating, comments) VALUES (?, ?, ?, ?)',
      [prl_id, program_rating, prl_performance_rating, comments]
    );
    res.json({ id: result.insertId, message: 'Rating submitted successfully' });
  } catch (err) {
    console.error('PL rating error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

// Get PL reports
app.get('/api/pl_reports', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT pl.*, pr.prl_name, r.lecturer_name, c.course_name 
      FROM pl_reports pl
      LEFT JOIN prl_reports pr ON pl.prl_report_id = pr.id
      LEFT JOIN reports r ON pr.lecturer_report_id = r.id
      LEFT JOIN courses c ON r.course_id = c.id
      ORDER BY pl.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get PL reports error:', err);
    res.status(500).json({ error: 'Failed to fetch PL reports' });
  }
});

// ========== STUDENT FUNCTIONALITY ENDPOINTS ==========

app.post('/api/student_monitoring', async (req, res) => {
  try {
    const { student_id, course_id, attendance_status, participation_notes, issues_observed } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO student_monitoring (student_id, course_id, attendance_status, participation_notes, issues_observed) VALUES (?, ?, ?, ?, ?)",
      [student_id, course_id, attendance_status, participation_notes, issues_observed]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/student_monitoring', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT sm.*, u.name as student_name, c.course_name 
      FROM student_monitoring sm
      LEFT JOIN users u ON sm.student_id = u.id
      LEFT JOIN courses c ON sm.course_id = c.id
      ORDER BY sm.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/student_ratings', async (req, res) => {
  try {
    const { student_id, course_id, lecturer_rating, course_rating, comments } = req.body;
    const [result] = await pool.execute(
      "INSERT INTO student_ratings (student_id, course_id, lecturer_rating, course_rating, comments) VALUES (?, ?, ?, ?, ?)",
      [student_id, course_id, lecturer_rating, course_rating, comments]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/api/student_ratings', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT sr.*, u.name as student_name, c.course_name 
      FROM student_ratings sr
      LEFT JOIN users u ON sr.student_id = u.id
      LEFT JOIN courses c ON sr.course_id = c.id
      ORDER BY sr.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ========== EXPORT ENDPOINTS WITH EXCEL GENERATION ==========

// Helper function to create Excel workbook
const createExcelWorkbook = (data, sheetName, columns) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  // Add headers
  worksheet.columns = columns;

  // Style headers
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6E6FA' }
  };

  // Add data
  if (data && data.length > 0) {
    data.forEach(item => {
      worksheet.addRow(item);
    });
  }

  // Auto-fit columns
  worksheet.columns.forEach(column => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, cell => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  return workbook;
};

// Export PRL reports to Excel
app.get('/api/export/prl-reports', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        pr.id as "Report ID",
        pr.prl_name as "PRL Name",
        pr.summary as "Summary",
        pr.recommendations as "Recommendations",
        pr.rating as "Rating",
        pr.created_at as "Created Date",
        r.lecturer_name as "Lecturer Name",
        r.week_of_reporting as "Week of Reporting",
        r.date_of_lecture as "Lecture Date",
        r.topic_taught as "Topic Taught",
        r.learning_outcomes as "Learning Outcomes",
        r.lecturer_recommendations as "Lecturer Recommendations",
        r.actual_present as "Actual Present",
        c.course_name as "Course Name",
        c.course_code as "Course Code",
        c.faculty_name as "Faculty Name",
        c.class_name as "Class Name"
      FROM prl_reports pr 
      LEFT JOIN reports r ON pr.lecturer_report_id = r.id 
      LEFT JOIN courses c ON r.course_id = c.id
      ORDER BY pr.created_at DESC`
    );

    const columns = [
      { header: 'Report ID', key: 'Report ID', width: 10 },
      { header: 'PRL Name', key: 'PRL Name', width: 20 },
      { header: 'Lecturer Name', key: 'Lecturer Name', width: 20 },
      { header: 'Course Name', key: 'Course Name', width: 25 },
      { header: 'Course Code', key: 'Course Code', width: 15 },
      { header: 'Faculty Name', key: 'Faculty Name', width: 20 },
      { header: 'Week of Reporting', key: 'Week of Reporting', width: 20 },
      { header: 'Lecture Date', key: 'Lecture Date', width: 15 },
      { header: 'Topic Taught', key: 'Topic Taught', width: 30 },
      { header: 'Learning Outcomes', key: 'Learning Outcomes', width: 30 },
      { header: 'Summary', key: 'Summary', width: 40 },
      { header: 'Recommendations', key: 'Recommendations', width: 40 },
      { header: 'Lecturer Recommendations', key: 'Lecturer Recommendations', width: 40 },
      { header: 'Rating', key: 'Rating', width: 10 },
      { header: 'Actual Present', key: 'Actual Present', width: 15 },
      { header: 'Created Date', key: 'Created Date', width: 20 }
    ];

    const workbook = createExcelWorkbook(rows, 'PRL Reports', columns);

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=prl-reports-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export PRL reports error:', err);
    res.status(500).json({ error: 'Failed to export PRL reports data' });
  }
});

// Export program reports to Excel
app.get('/api/export/program-reports', authenticateToken, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: PL Reports
    let plReports = [];
    try {
      const [plRows] = await pool.execute(`
        SELECT 
          pl.id as "Report ID",
          pl.pl_name as "Program Leader Name",
          pl.program_summary as "Program Summary",
          pl.overall_assessment as "Overall Assessment",
          pl.rating as "Rating",
          pl.created_at as "Created Date",
          pr.prl_name as "PRL Name",
          r.lecturer_name as "Lecturer Name",
          c.course_name as "Course Name"
        FROM pl_reports pl
        LEFT JOIN prl_reports pr ON pl.prl_report_id = pr.id
        LEFT JOIN reports r ON pr.lecturer_report_id = r.id
        LEFT JOIN courses c ON r.course_id = c.id
        ORDER BY pl.created_at DESC`
      );
      plReports = plRows;
    } catch (error) {
      console.log('PL reports table might not exist yet');
    }

    if (plReports.length > 0) {
      const plWorksheet = workbook.addWorksheet('Program Leader Reports');
      plWorksheet.columns = [
        { header: 'Report ID', key: 'Report ID', width: 10 },
        { header: 'Program Leader Name', key: 'Program Leader Name', width: 20 },
        { header: 'PRL Name', key: 'PRL Name', width: 20 },
        { header: 'Lecturer Name', key: 'Lecturer Name', width: 20 },
        { header: 'Course Name', key: 'Course Name', width: 25 },
        { header: 'Program Summary', key: 'Program Summary', width: 40 },
        { header: 'Overall Assessment', key: 'Overall Assessment', width: 40 },
        { header: 'Rating', key: 'Rating', width: 10 },
        { header: 'Created Date', key: 'Created Date', width: 20 }
      ];
      
      plWorksheet.getRow(1).font = { bold: true };
      plWorksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };
      
      plReports.forEach(report => {
        plWorksheet.addRow(report);
      });
    }

    // Sheet 2: Courses
    const [courses] = await pool.execute(`
      SELECT 
        id as "Course ID",
        faculty_name as "Faculty Name",
        class_name as "Class Name",
        course_name as "Course Name",
        course_code as "Course Code",
        venue as "Venue",
        scheduled_time as "Scheduled Time",
        total_registered as "Total Registered",
        created_at as "Created Date"
      FROM courses ORDER BY created_at DESC`
    );

    const courseWorksheet = workbook.addWorksheet('Courses');
    courseWorksheet.columns = [
      { header: 'Course ID', key: 'Course ID', width: 10 },
      { header: 'Faculty Name', key: 'Faculty Name', width: 20 },
      { header: 'Class Name', key: 'Class Name', width: 20 },
      { header: 'Course Name', key: 'Course Name', width: 25 },
      { header: 'Course Code', key: 'Course Code', width: 15 },
      { header: 'Venue', key: 'Venue', width: 20 },
      { header: 'Scheduled Time', key: 'Scheduled Time', width: 20 },
      { header: 'Total Registered', key: 'Total Registered', width: 15 },
      { header: 'Created Date', key: 'Created Date', width: 20 }
    ];
    
    courseWorksheet.getRow(1).font = { bold: true };
    courseWorksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
    
    courses.forEach(course => {
      courseWorksheet.addRow(course);
    });

    // Sheet 3: Summary
    const summaryWorksheet = workbook.addWorksheet('Summary');
    summaryWorksheet.columns = [
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Count', key: 'count', width: 15 }
    ];

    summaryWorksheet.getRow(1).font = { bold: true };
    summaryWorksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    const [courseCount] = await pool.execute('SELECT COUNT(*) as count FROM courses');
    const [reportCount] = await pool.execute('SELECT COUNT(*) as count FROM reports');
    const [prlReportCount] = await pool.execute('SELECT COUNT(*) as count FROM prl_reports');
    
    let plReportCount = 0;
    try {
      const [plCount] = await pool.execute('SELECT COUNT(*) as count FROM pl_reports');
      plReportCount = plCount[0].count;
    } catch (error) {
      console.log('PL reports table might not exist yet');
    }

    const summaryData = [
      { category: 'Total Courses', count: courseCount[0].count },
      { category: 'Total Lecturer Reports', count: reportCount[0].count },
      { category: 'Total PRL Reports', count: prlReportCount[0].count },
      { category: 'Total PL Reports', count: plReportCount }
    ];

    summaryData.forEach(item => {
      summaryWorksheet.addRow(item);
    });

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=program-reports-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export program reports error:', err);
    res.status(500).json({ error: 'Failed to export program reports data' });
  }
});

// Export all data for Principal Lecturer
app.get('/api/export/all-data', authenticateToken, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();

    // Add multiple sheets with different data
    const sheets = [
      { name: 'Courses', query: 'SELECT * FROM courses ORDER BY created_at DESC' },
      { name: 'Lecturer Reports', query: `SELECT r.*, c.course_name, c.course_code FROM reports r LEFT JOIN courses c ON r.course_id = c.id ORDER BY r.created_at DESC` },
      { name: 'PRL Reports', query: `SELECT pr.*, r.lecturer_name, c.course_name FROM prl_reports pr LEFT JOIN reports r ON pr.lecturer_report_id = r.id LEFT JOIN courses c ON r.course_id = c.id ORDER BY pr.created_at DESC` },
      { name: 'Student Monitoring', query: 'SELECT * FROM student_monitoring ORDER BY created_at DESC' },
      { name: 'Student Ratings', query: 'SELECT * FROM student_ratings ORDER BY created_at DESC' }
    ];

    // Try to add PL Reports sheet if table exists
    try {
      sheets.push({ name: 'PL Reports', query: 'SELECT * FROM pl_reports ORDER BY created_at DESC' });
    } catch (error) {
      console.log('PL reports table might not exist yet');
    }

    for (const sheet of sheets) {
      try {
        const [rows] = await pool.execute(sheet.query);
        if (rows.length > 0) {
          const worksheet = workbook.addWorksheet(sheet.name);
          
          // Get column headers from the first row
          const columns = Object.keys(rows[0]).map(key => ({
            header: key.replace(/_/g, ' ').toUpperCase(),
            key: key,
            width: 20
          }));

          worksheet.columns = columns;
          
          // Style headers
          worksheet.getRow(1).font = { bold: true };
          worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6E6FA' }
          };

          // Add data
          rows.forEach(row => {
            worksheet.addRow(row);
          });

          // Auto-fit columns
          worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
              const columnLength = cell.value ? cell.value.toString().length : 10;
              if (columnLength > maxLength) {
                maxLength = columnLength;
              }
            });
            column.width = Math.min(maxLength + 2, 50);
          });
        }
      } catch (error) {
        console.log(`Skipping sheet ${sheet.name}:`, error.message);
      }
    }

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=luct-all-data-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export all data error:', err);
    res.status(500).json({ error: 'Failed to export all system data' });
  }
});

// Export summary data
app.get('/api/export/summary', authenticateToken, async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Summary Report');

    // Get counts
    const [courseCount] = await pool.execute('SELECT COUNT(*) as count FROM courses');
    const [reportCount] = await pool.execute('SELECT COUNT(*) as count FROM reports');
    const [prlReportCount] = await pool.execute('SELECT COUNT(*) as count FROM prl_reports');
    const [studentMonitoringCount] = await pool.execute('SELECT COUNT(*) as count FROM student_monitoring');
    const [studentRatingCount] = await pool.execute('SELECT COUNT(*) as count FROM student_ratings');

    // Get average ratings
    const [avgPrlRating] = await pool.execute('SELECT AVG(rating) as avg_rating FROM prl_reports WHERE rating IS NOT NULL');
    const [avgStudentRating] = await pool.execute('SELECT AVG(lecturer_rating) as avg_lecturer_rating, AVG(course_rating) as avg_course_rating FROM student_ratings');

    let plReportCount = 0;
    let avgPlRating = 0;
    try {
      const [plCount] = await pool.execute('SELECT COUNT(*) as count FROM pl_reports');
      const [plAvgRating] = await pool.execute('SELECT AVG(rating) as avg_rating FROM pl_reports WHERE rating IS NOT NULL');
      plReportCount = plCount[0].count;
      avgPlRating = plAvgRating[0].avg_rating || 0;
    } catch (error) {
      console.log('PL reports table might not exist yet');
    }

    // Add summary data
    worksheet.columns = [
      { header: 'METRIC', key: 'metric', width: 35 },
      { header: 'VALUE', key: 'value', width: 20 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    const summaryData = [
      { metric: 'TOTAL COURSES', value: courseCount[0].count },
      { metric: 'TOTAL LECTURER REPORTS', value: reportCount[0].count },
      { metric: 'TOTAL PRL REPORTS', value: prlReportCount[0].count },
      { metric: 'TOTAL PL REPORTS', value: plReportCount },
      { metric: 'TOTAL STUDENT MONITORING RECORDS', value: studentMonitoringCount[0].count },
      { metric: 'TOTAL STUDENT RATINGS', value: studentRatingCount[0].count },
      { metric: 'AVERAGE PRL RATING', value: Math.round((avgPrlRating[0].avg_rating || 0) * 100) / 100 },
      { metric: 'AVERAGE PL RATING', value: Math.round(avgPlRating * 100) / 100 },
      { metric: 'AVERAGE STUDENT LECTURER RATING', value: Math.round((avgStudentRating[0].avg_lecturer_rating || 0) * 100) / 100 },
      { metric: 'AVERAGE STUDENT COURSE RATING', value: Math.round((avgStudentRating[0].avg_course_rating || 0) * 100) / 100 },
      { metric: 'REPORT GENERATED ON', value: new Date().toLocaleString() }
    ];

    summaryData.forEach(item => {
      worksheet.addRow(item);
    });

    // Set response headers for Excel file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=luct-summary-${new Date().toISOString().split('T')[0]}.xlsx`);

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Export summary error:', err);
    res.status(500).json({ error: 'Failed to export summary data' });
  }
});

// ========== DASHBOARD & ANALYTICS ENDPOINTS ==========

// Get dashboard statistics
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [courseCount] = await pool.execute('SELECT COUNT(*) as count FROM courses');
    const [reportCount] = await pool.execute('SELECT COUNT(*) as count FROM reports');
    const [prlReportCount] = await pool.execute('SELECT COUNT(*) as count FROM prl_reports');
    const [userCount] = await pool.execute('SELECT COUNT(*) as count FROM users');
    
    res.json({
      courses: courseCount[0].count,
      reports: reportCount[0].count,
      prl_reports: prlReportCount[0].count,
      users: userCount[0].count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Get reports by faculty
app.get('/api/analytics/reports-by-faculty', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.faculty_name, COUNT(r.id) as report_count
      FROM courses c
      LEFT JOIN reports r ON c.id = r.course_id
      GROUP BY c.faculty_name
      ORDER BY report_count DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ========== USER MANAGEMENT ENDPOINTS ==========

// Get all users (admin functionality)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, name, email, student_id, role, created_at FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Update user role
app.put('/api/users/:id/role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const [result] = await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User role updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LUCT Reporting Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`👤 Available roles: student, lecturer, prl, pl`);
  console.log(`📥 Excel export endpoints are now available!`);
});