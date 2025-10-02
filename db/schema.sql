-- SQL schema for LUCT Lecturer Reporting (MySQL)
CREATE DATABASE IF NOT EXISTS luct_reporting;
USE luct_reporting;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(150) UNIQUE,
  role ENUM('student','lecturer','prl','pl') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  faculty_name VARCHAR(150),
  class_name VARCHAR(150),
  course_name VARCHAR(150),
  course_code VARCHAR(50),
  venue VARCHAR(100),
  scheduled_time VARCHAR(50),
  total_registered INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lecturer Reports
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT,
  lecturer_name VARCHAR(150),
  week_of_reporting VARCHAR(50),
  date_of_lecture DATE,
  topic_taught TEXT,
  learning_outcomes TEXT,
  lecturer_recommendations TEXT,
  actual_present INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- ================= New Tables =================

-- Student Reports
CREATE TABLE IF NOT EXISTS student_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  studentId VARCHAR(50),
  name VARCHAR(100),
  course VARCHAR(50),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Program Leader Reports
CREATE TABLE IF NOT EXISTS program_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  leaderName VARCHAR(100),
  program VARCHAR(100),
  reportSummary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Principal Lecturer Reports
CREATE TABLE IF NOT EXISTS principal_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  principalName VARCHAR(100),
  overallRemarks TEXT,
  recommendations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========== NEW TABLES FOR ENHANCED SYSTEM ==========

-- PRL Reports (links to lecturer reports)
CREATE TABLE IF NOT EXISTS prl_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_report_id INT,
  prl_name VARCHAR(150),
  summary TEXT,
  recommendations TEXT,
  rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lecturer_report_id) REFERENCES reports(id) ON DELETE SET NULL
);

-- PL Reports (links to PRL reports)
CREATE TABLE IF NOT EXISTS pl_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prl_report_id INT,
  pl_name VARCHAR(150),
  program_summary TEXT,
  overall_assessment TEXT,
  rating INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (prl_report_id) REFERENCES prl_reports(id) ON DELETE SET NULL
);

-- PRL Courses Management
CREATE TABLE IF NOT EXISTS prl_courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(150),
  course_code VARCHAR(50),
  program VARCHAR(100),
  responsible_lecturer VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRL Classes Monitoring
CREATE TABLE IF NOT EXISTS prl_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT,
  class_schedule VARCHAR(100),
  venue VARCHAR(100),
  observations TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRL Monitoring
CREATE TABLE IF NOT EXISTS prl_monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT,
  quality_checks TEXT,
  observations TEXT,
  improvement_suggestions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRL Rating
CREATE TABLE IF NOT EXISTS prl_rating (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT,
  performance_rating INT,
  course_quality_rating INT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PL Courses Management
CREATE TABLE IF NOT EXISTS pl_courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_name VARCHAR(100),
  course_code VARCHAR(50),
  course_name VARCHAR(150),
  prl_responsible VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PL Classes Oversight
CREATE TABLE IF NOT EXISTS pl_classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prl_id INT,
  class_details TEXT,
  oversight_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PL Monitoring
CREATE TABLE IF NOT EXISTS pl_monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  program_quality_notes TEXT,
  prl_performance_notes TEXT,
  overall_program_health TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PL Rating
CREATE TABLE IF NOT EXISTS pl_rating (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prl_id INT,
  program_rating INT,
  prl_performance_rating INT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Monitoring
CREATE TABLE IF NOT EXISTS student_monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  course_id INT,
  attendance_status ENUM('present','absent','late'),
  participation_notes TEXT,
  issues_observed TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Student Rating
CREATE TABLE IF NOT EXISTS student_ratings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  course_id INT,
  lecturer_rating INT CHECK (lecturer_rating >= 1 AND lecturer_rating <= 5),
  course_rating INT CHECK (course_rating >= 1 AND course_rating <= 5),
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lecturer Monitoring
CREATE TABLE IF NOT EXISTS lecturer_monitoring (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT,
  course_id INT,
  monitoring_notes TEXT,
  student_performance_notes TEXT,
  discipline_issues TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lecturer Rating
CREATE TABLE IF NOT EXISTS lecturer_rating (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lecturer_id INT,
  course_id INT,
  student_rating INT,
  course_structure_rating INT,
  overall_rating INT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Enhanced users table with authentication
ALTER TABLE users 
ADD COLUMN password VARCHAR(255) NOT NULL,
ADD COLUMN student_id VARCHAR(50) UNIQUE,
MODIFY COLUMN email VARCHAR(150) UNIQUE;

-- Create an index for better performance
CREATE INDEX idx_user_identifier ON users(email, student_id);