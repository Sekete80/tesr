import React, { useState, useEffect } from 'react';

function PrincipalLecturerForm() {
  const [activeTab, setActiveTab] = useState('reports');
  const [lecturerReports, setLecturerReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  
  // Courses Tab State
  const [coursesForm, setCoursesForm] = useState({
    course_name: '',
    course_code: '',
    program: '',
    responsible_lecturer: ''
  });

  // Classes Tab State
  const [classesForm, setClassesForm] = useState({
    lecturer_id: '',
    class_schedule: '',
    venue: '',
    observations: ''
  });

  // Reports Tab State
  const [reportsForm, setReportsForm] = useState({
    lecturer_report_id: '',
    prl_name: '',
    summary: '',
    recommendations: '',
    rating: ''
  });

  // Monitoring Tab State
  const [monitoringForm, setMonitoringForm] = useState({
    lecturer_id: '',
    quality_checks: '',
    observations: '',
    improvement_suggestions: ''
  });

  // Rating Tab State
  const [ratingForm, setRatingForm] = useState({
    lecturer_id: '',
    performance_rating: '',
    course_quality_rating: '',
    comments: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || '';

  // Tab navigation - ALL 5 FUNCTIONS
  const tabs = [
    { id: 'courses', label: 'Courses' },
    { id: 'classes', label: 'Classes' },
    { id: 'reports', label: 'Reports' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'rating', label: 'Rating' }
  ];

  // Fetch lecturer reports when Reports tab is activated
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchLecturerReports();
    }
  }, [activeTab]);

  // Function to fetch lecturer reports
  const fetchLecturerReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reports`);
      if (res.ok) {
        const reports = await res.json();
        setLecturerReports(reports);
      } else {
        alert('Error fetching lecturer reports');
      }
    } catch (err) {
      console.error('Error fetching lecturer reports:', err);
      alert('Error connecting to server');
    }
  };

  // Function to select a lecturer report
  const selectLecturerReport = (report) => {
    setSelectedReport(report);
    setReportsForm({
      ...reportsForm,
      lecturer_report_id: report.id,
      summary: `Reviewing report from ${report.lecturer_name} for ${report.course_name || 'course'} - Week ${report.week_of_reporting}`
    });
  };

  // Courses Tab Handler - FIXED ENDPOINT
  const handleCoursesSubmit = async (e) => {
    e.preventDefault();
    try {
      // Use pl_courses instead of prl_courses for Principal Lecturer
      const res = await fetch(`${API_URL}/api/pl_courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_name: coursesForm.program,
          course_code: coursesForm.course_code,
          course_name: coursesForm.course_name,
          prl_responsible: coursesForm.responsible_lecturer
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Course management updated successfully!');
        setCoursesForm({ course_name: '', course_code: '', program: '', responsible_lecturer: '' });
      } else {
        alert(`⚠️ Failed to update course management: ${result.error}`);
      }
    } catch (err) {
      console.error('Courses submission error:', err);
      alert('⚠️ Error connecting to server. Please check if the backend is running.');
    }
  };

  // Classes Tab Handler - FIXED ENDPOINT
  const handleClassesSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/pl_classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prl_id: classesForm.lecturer_id,
          class_details: `Schedule: ${classesForm.class_schedule}, Venue: ${classesForm.venue}`,
          oversight_notes: classesForm.observations
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Class monitoring data saved successfully!');
        setClassesForm({ lecturer_id: '', class_schedule: '', venue: '', observations: '' });
      } else {
        alert(`⚠️ Failed to save class monitoring data: ${result.error}`);
      }
    } catch (err) {
      console.error('Classes submission error:', err);
      alert('⚠️ Error connecting to server.');
    }
  };

  // Reports Tab Handler
  const handleReportsSubmit = async (e) => {
    e.preventDefault();
    if (!reportsForm.lecturer_report_id) {
      alert('Please select a lecturer report first');
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/prl_reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportsForm),
      });
      
      if (res.ok) {
        alert('✅ Report submitted to Program Leader!');
        setReportsForm({ lecturer_report_id: '', prl_name: '', summary: '', recommendations: '', rating: '' });
        setSelectedReport(null);
        fetchLecturerReports();
      } else {
        const errorData = await res.json();
        alert('⚠️ Failed to submit report: ' + (errorData.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      alert('⚠️ Error connecting to server');
    }
  };

  // Monitoring Tab Handler - FIXED ENDPOINT
  const handleMonitoringSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/pl_monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_quality_notes: monitoringForm.quality_checks,
          prl_performance_notes: monitoringForm.observations,
          overall_program_health: monitoringForm.improvement_suggestions
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Monitoring data saved successfully!');
        setMonitoringForm({ lecturer_id: '', quality_checks: '', observations: '', improvement_suggestions: '' });
      } else {
        alert(`⚠️ Failed to save monitoring data: ${result.error}`);
      }
    } catch (err) {
      console.error('Monitoring submission error:', err);
      alert('⚠️ Error saving monitoring data.');
    }
  };

  // Rating Tab Handler - FIXED ENDPOINT
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/pl_rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prl_id: ratingForm.lecturer_id,
          program_rating: ratingForm.performance_rating,
          prl_performance_rating: ratingForm.course_quality_rating,
          comments: ratingForm.comments
        }),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Rating submitted successfully!');
        setRatingForm({ lecturer_id: '', performance_rating: '', course_quality_rating: '', comments: '' });
      } else {
        alert(`⚠️ Failed to submit rating: ${result.error}`);
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      alert('⚠️ Error submitting rating.');
    }
  };

  const handleChange = (setter, form) => (e) => {
    setter({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h2>Principal Lecturer Dashboard</h2>
      
      {/* Tab Navigation - ALL 5 TABS */}
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

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div>
          <h4>Manage Courses</h4>
          <form onSubmit={handleCoursesSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="course_name" className="form-control" placeholder="Course Name"
                value={coursesForm.course_name} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="course_code" className="form-control" placeholder="Course Code"
                value={coursesForm.course_code} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="program" className="form-control" placeholder="Program"
                value={coursesForm.program} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="responsible_lecturer" className="form-control" placeholder="Responsible Lecturer"
                value={coursesForm.responsible_lecturer} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit">Update Course Management</button>
            </div>
          </form>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div>
          <h4>Monitor Lecturer Classes</h4>
          <form onSubmit={handleClassesSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="lecturer_id" className="form-control" placeholder="Lecturer ID"
                value={classesForm.lecturer_id} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="class_schedule" className="form-control" placeholder="Class Schedule"
                value={classesForm.class_schedule} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="venue" className="form-control" placeholder="Venue"
                value={classesForm.venue} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-12">
              <textarea name="observations" className="form-control" placeholder="Observations" rows="3"
                value={classesForm.observations} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-12">
              <button className="btn btn-warning" type="submit">Save Class Monitoring</button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <h4>Submit Report to Program Leader</h4>
          
          {/* Section 1: View Lecturer Reports */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Available Lecturer Reports</h5>
            </div>
            <div className="card-body">
              <button 
                type="button" 
                className="btn btn-outline-primary btn-sm mb-3"
                onClick={fetchLecturerReports}
              >
                Refresh Lecturer Reports
              </button>
              
              {lecturerReports.length === 0 ? (
                <p className="text-muted">No lecturer reports available. Submit some reports from the Lecturer form first.</p>
              ) : (
                <div className="row">
                  {lecturerReports.map(report => (
                    <div key={report.id} className="col-md-6 mb-3">
                      <div className={`card ${selectedReport?.id === report.id ? 'border-primary' : ''}`}>
                        <div className="card-body">
                          <h6 className="card-title">Report #{report.id}</h6>
                          <p className="card-text mb-1">
                            <strong>Lecturer:</strong> {report.lecturer_name}
                          </p>
                          <p className="card-text mb-1">
                            <strong>Course:</strong> {report.course_name || 'N/A'}
                          </p>
                          <p className="card-text mb-1">
                            <strong>Week:</strong> {report.week_of_reporting}
                          </p>
                          <p className="card-text mb-2">
                            <strong>Date:</strong> {report.date_of_lecture}
                          </p>
                          <button 
                            type="button" 
                            className={`btn btn-sm ${selectedReport?.id === report.id ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => selectLecturerReport(report)}
                          >
                            {selectedReport?.id === report.id ? 'Selected' : 'Select This Report'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: PRL Report Form */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Create PRL Report</h5>
            </div>
            <div className="card-body">
              {selectedReport && (
                <div className="alert alert-info">
                  <strong>Selected Report:</strong> #{selectedReport.id} by {selectedReport.lecturer_name} 
                  ({selectedReport.course_name}) - Week {selectedReport.week_of_reporting}
                </div>
              )}
              
              <form onSubmit={handleReportsSubmit} className="row g-3">
                <div className="col-md-6">
                  <input type="text" name="lecturer_report_id" className="form-control" placeholder="Lecturer Report ID"
                    value={reportsForm.lecturer_report_id} onChange={handleChange(setReportsForm, reportsForm)} required 
                    readOnly 
                  />
                </div>
                <div className="col-md-6">
                  <input type="text" name="prl_name" className="form-control" placeholder="PRL Name"
                    value={reportsForm.prl_name} onChange={handleChange(setReportsForm, reportsForm)} required />
                </div>
                <div className="col-12">
                  <textarea name="summary" className="form-control" placeholder="Summary of Lecturer Reports" rows="3"
                    value={reportsForm.summary} onChange={handleChange(setReportsForm, reportsForm)} required />
                </div>
                <div className="col-12">
                  <textarea name="recommendations" className="form-control" placeholder="Recommendations" rows="2"
                    value={reportsForm.recommendations} onChange={handleChange(setReportsForm, reportsForm)} />
                </div>
                <div className="col-md-6">
                  <input type="number" name="rating" className="form-control" placeholder="Rating (1-5)"
                    min="1" max="5" value={reportsForm.rating} onChange={handleChange(setReportsForm, reportsForm)} />
                </div>
                <div className="col-12">
                  <button 
                    className="btn btn-success" 
                    type="submit"
                    disabled={!reportsForm.lecturer_report_id}
                  >
                    Submit to Program Leader
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div>
          <h4>Quality Monitoring</h4>
          <form onSubmit={handleMonitoringSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="lecturer_id" className="form-control" placeholder="Lecturer ID"
                value={monitoringForm.lecturer_id} onChange={handleChange(setMonitoringForm, monitoringForm)} required />
            </div>
            <div className="col-12">
              <textarea name="quality_checks" className="form-control" placeholder="Quality Checks" rows="2"
                value={monitoringForm.quality_checks} onChange={handleChange(setMonitoringForm, monitoringForm)} required />
            </div>
            <div className="col-12">
              <textarea name="observations" className="form-control" placeholder="Observations" rows="2"
                value={monitoringForm.observations} onChange={handleChange(setMonitoringForm, monitoringForm)} />
            </div>
            <div className="col-12">
              <textarea name="improvement_suggestions" className="form-control" placeholder="Improvement Suggestions" rows="2"
                value={monitoringForm.improvement_suggestions} onChange={handleChange(setMonitoringForm, monitoringForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-info" type="submit">Save Monitoring Data</button>
            </div>
          </form>
        </div>
      )}

      {/* Rating Tab */}
      {activeTab === 'rating' && (
        <div>
          <h4>Rate Lecturers and Courses</h4>
          <form onSubmit={handleRatingSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="lecturer_id" className="form-control" placeholder="Lecturer ID"
                value={ratingForm.lecturer_id} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="performance_rating" className="form-control" placeholder="Performance Rating (1-5)"
                min="1" max="5" value={ratingForm.performance_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="course_quality_rating" className="form-control" placeholder="Course Quality Rating (1-5)"
                min="1" max="5" value={ratingForm.course_quality_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-12">
              <textarea name="comments" className="form-control" placeholder="Comments" rows="3"
                value={ratingForm.comments} onChange={handleChange(setRatingForm, ratingForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-danger" type="submit">Submit Rating</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default PrincipalLecturerForm;