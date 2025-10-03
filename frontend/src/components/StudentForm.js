import React, { useState } from 'react';

function StudentForm() {
  const [activeTab, setActiveTab] = useState('monitoring');
  
  // Monitoring Tab State
  const [monitoringForm, setMonitoringForm] = useState({
    student_id: '',
    course_id: '',
    attendance_status: 'present',
    participation_notes: '',
    issues_observed: ''
  });

  // Rating Tab State
  const [ratingForm, setRatingForm] = useState({
    student_id: '',
    course_id: '',
    lecturer_rating: '',
    course_rating: '',
    comments: ''
  });

  // Attendance State
  const [attendanceRecorded, setAttendanceRecorded] = useState(false);
  const [attendanceTime, setAttendanceTime] = useState('');

  // Tab navigation
  const tabs = [
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'rating', label: 'Rating' }
  ];

  // Quick Attendance Sign-in Handler
  const handleQuickAttendance = async () => {
    if (!monitoringForm.student_id || !monitoringForm.course_id) {
      alert('Please enter both Student ID and Course ID first.');
      return;
    }

    try {
      const currentTime = new Date().toLocaleString();
      const attendanceData = {
        ...monitoringForm,
        sign_in_time: currentTime
      };

      const res = await fetch('http://localhost:5000/api/student_monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceData),
      });
      
      if (res.ok) {
        setAttendanceRecorded(true);
        setAttendanceTime(currentTime);
        alert(`Attendance recorded successfully at ${currentTime}`);
        
        // Reset only the attendance-related fields, keep student_id and course_id
        setMonitoringForm(prev => ({
          ...prev,
          attendance_status: 'present',
          participation_notes: '',
          issues_observed: ''
        }));
      }
    } catch (err) {
      alert('Error recording attendance.');
    }
  };

  // Monitoring Tab Handler
  const handleMonitoringSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/student_monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoringForm),
      });
      if (res.ok) {
        alert('Monitoring data saved successfully!');
        setMonitoringForm({
          student_id: '', course_id: '', attendance_status: 'present',
          participation_notes: '', issues_observed: ''
        });
        setAttendanceRecorded(false);
        setAttendanceTime('');
      }
    } catch (err) {
      alert('Error saving monitoring data.');
    }
  };

  // Rating Tab Handler
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/student_ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingForm),
      });
      if (res.ok) {
        alert('Rating submitted successfully!');
        setRatingForm({
          student_id: '', course_id: '', lecturer_rating: '', course_rating: '', comments: ''
        });
      }
    } catch (err) {
      alert('Error submitting rating.');
    }
  };

  const handleChange = (setter, form) => (e) => {
    setter({ ...form, [e.target.name]: e.target.value });
    
    // Reset attendance status when student_id or course_id changes
    if (e.target.name === 'student_id' || e.target.name === 'course_id') {
      setAttendanceRecorded(false);
      setAttendanceTime('');
    }
  };

  return (
    <div>
      <h2>Student Dashboard</h2>
      
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map(tab => (
          <li key={tab.id} className="nav-item">
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div>
          <h4>Class Monitoring & Attendance</h4>
          
          {/* Detailed Monitoring Form */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Detailed Monitoring Notes</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleMonitoringSubmit}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Attendance Status</label>
                    <select 
                      name="attendance_status" 
                      className="form-control"
                      value={monitoringForm.attendance_status} 
                      onChange={handleChange(setMonitoringForm, monitoringForm)}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Participation Notes</label>
                    <textarea 
                      name="participation_notes" 
                      className="form-control" 
                      placeholder="How was the student's participation in class?" 
                      rows="2"
                      value={monitoringForm.participation_notes} 
                      onChange={handleChange(setMonitoringForm, monitoringForm)} 
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Issues Observed</label>
                    <textarea 
                      name="issues_observed" 
                      className="form-control" 
                      placeholder="Any issues or concerns observed during class" 
                      rows="2"
                      value={monitoringForm.issues_observed} 
                      onChange={handleChange(setMonitoringForm, monitoringForm)} 
                    />
                  </div>
                  <div className="col-12">
                    <button className="btn btn-primary" type="submit">
                      Save Detailed Monitoring Data
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rating Tab - Unchanged */}
      {activeTab === 'rating' && (
        <div>
          <h4>Rate Lecturer and Course</h4>
          <form onSubmit={handleRatingSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="student_id" className="form-control" placeholder="Student ID"
                value={ratingForm.student_id} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="course_id" className="form-control" placeholder="Course ID"
                value={ratingForm.course_id} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="lecturer_rating" className="form-control" placeholder="Lecturer Rating (1-5)"
                min="1" max="5" value={ratingForm.lecturer_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="course_rating" className="form-control" placeholder="Course Rating (1-5)"
                min="1" max="5" value={ratingForm.course_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-12">
              <textarea name="comments" className="form-control" placeholder="Additional Comments" rows="3"
                value={ratingForm.comments} onChange={handleChange(setRatingForm, ratingForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-success" type="submit">Submit Rating</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default StudentForm;