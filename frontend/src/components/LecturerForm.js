import React, { useState, useEffect } from 'react';

function LecturerForm() {
  const [activeTab, setActiveTab] = useState('classes');
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Classes Tab State
  const [classForm, setClassForm] = useState({
    faculty_name: '',
    class_name: '',
    course_name: '',
    course_code: '',
    venue: '',
    scheduled_time: '',
    total_registered: ''
  });

  // Reports Tab State
  const [reportForm, setReportForm] = useState({
    course_id: '',
    lecturer_name: '',
    week_of_reporting: '',
    date_of_lecture: '',
    topic_taught: '',
    learning_outcomes: '',
    lecturer_recommendations: '',
    actual_present: ''
  });

  // Monitoring Tab State
  const [monitoringForm, setMonitoringForm] = useState({
    course_id: '',
    monitoring_notes: '',
    student_performance_notes: '',
    discipline_issues: ''
  });

  // Rating Tab State
  const [ratingForm, setRatingForm] = useState({
    course_id: '',
    student_rating: '',
    course_structure_rating: '',
    overall_rating: '',
    comments: ''
  });

  // Fetch available courses on component mount
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/courses');
        if (res.ok) {
          const courses = await res.json();
          setAvailableCourses(courses);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCourses();
  }, []);

  // Tab navigation
  const tabs = [
    { id: 'classes', label: 'Classes', icon: '' },
    { id: 'reports', label: 'Reports', icon: '' },
    { id: 'monitoring', label: 'Monitoring', icon: '' },
    { id: 'rating', label: 'Rating', icon: '' }
  ];

  // Classes Tab Handler
  const handleClassSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classForm),
      });
      if (res.ok) {
        alert('✅ Course created successfully!');
        setClassForm({
          faculty_name: '', class_name: '', course_name: '', course_code: '',
          venue: '', scheduled_time: '', total_registered: ''
        });
        // Refresh courses list
        const coursesRes = await fetch('http://localhost:5000/api/courses');
        if (coursesRes.ok) {
          const courses = await coursesRes.json();
          setAvailableCourses(courses);
        }
      } else {
        const errorData = await res.json();
        alert(`⚠️ Failed to create course: ${errorData.error}`);
      }
    } catch (err) {
      alert('⚠️ Could not connect to server.');
    }
  };

  // Reports Tab Handler
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportForm),
      });
      if (res.ok) {
        alert('✅ Report submitted to PRL!');
        setReportForm({
          course_id: '', lecturer_name: '', week_of_reporting: '', date_of_lecture: '',
          topic_taught: '', learning_outcomes: '', lecturer_recommendations: '', actual_present: ''
        });
      } else {
        const errorData = await res.json();
        alert(`⚠️ Failed to submit report: ${errorData.error}`);
      }
    } catch (err) {
      alert('⚠️ Error submitting report.');
    }
  };

  // Monitoring Tab Handler - FIXED ENDPOINT
  const handleMonitoringSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/lecturer_monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoringForm),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Monitoring data saved successfully!');
        setMonitoringForm({
          course_id: '', monitoring_notes: '', student_performance_notes: '', discipline_issues: ''
        });
      } else {
        alert(`⚠️ Failed to save monitoring data: ${result.error}`);
      }
    } catch (err) {
      console.error('Monitoring submission error:', err);
      alert('⚠️ Error connecting to server. Please check if the backend is running.');
    }
  };

  // Rating Tab Handler - FIXED ENDPOINT
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/lecturer_rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingForm),
      });
      
      const result = await res.json();
      
      if (res.ok) {
        alert('✅ Rating submitted successfully!');
        setRatingForm({
          course_id: '', student_rating: '', course_structure_rating: '', overall_rating: '', comments: ''
        });
      } else {
        alert(`⚠️ Failed to submit rating: ${result.error}`);
      }
    } catch (err) {
      console.error('Rating submission error:', err);
      alert('⚠️ Error connecting to server. Please check if the backend is running.');
    }
  };

  const handleChange = (setter, form) => (e) => {
    setter({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h2> Lecturer Dashboard</h2>
      
      {/* Tab Navigation */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map(tab => (
          <li key={tab.id} className="nav-item">
            <button
              className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon} {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div>
          <h4> Manage Classes</h4>
          <form onSubmit={handleClassSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="faculty_name" className="form-control" placeholder="Faculty Name"
                value={classForm.faculty_name} onChange={handleChange(setClassForm, classForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="class_name" className="form-control" placeholder="Class Name"
                value={classForm.class_name} onChange={handleChange(setClassForm, classForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="course_name" className="form-control" placeholder="Course Name"
                value={classForm.course_name} onChange={handleChange(setClassForm, classForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="course_code" className="form-control" placeholder="Course Code (e.g., BIOP21)"
                value={classForm.course_code} onChange={handleChange(setClassForm, classForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="venue" className="form-control" placeholder="Venue"
                value={classForm.venue} onChange={handleChange(setClassForm, classForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="scheduled_time" className="form-control" placeholder="Scheduled Time"
                value={classForm.scheduled_time} onChange={handleChange(setClassForm, classForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="total_registered" className="form-control" placeholder="Total Registered"
                value={classForm.total_registered} onChange={handleChange(setClassForm, classForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit">Create Course</button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <h4> Submit Report to PRL</h4>
          <form onSubmit={handleReportSubmit} className="row g-3">
            <div className="col-md-6">
              <select 
                name="course_id" 
                className="form-control" 
                value={reportForm.course_id} 
                onChange={handleChange(setReportForm, reportForm)} 
                required
              >
                <option value="">Select Course Code</option>
                {availableCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <input type="text" name="lecturer_name" className="form-control" placeholder="Lecturer Name"
                value={reportForm.lecturer_name} onChange={handleChange(setReportForm, reportForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="week_of_reporting" className="form-control" placeholder="Week of Reporting"
                value={reportForm.week_of_reporting} onChange={handleChange(setReportForm, reportForm)} required />
            </div>
            <div className="col-md-6">
              <input type="date" name="date_of_lecture" className="form-control"
                value={reportForm.date_of_lecture} onChange={handleChange(setReportForm, reportForm)} required />
            </div>
            <div className="col-12">
              <textarea name="topic_taught" className="form-control" placeholder="Topic Taught" rows="2"
                value={reportForm.topic_taught} onChange={handleChange(setReportForm, reportForm)} required />
            </div>
            <div className="col-12">
              <textarea name="learning_outcomes" className="form-control" placeholder="Learning Outcomes" rows="2"
                value={reportForm.learning_outcomes} onChange={handleChange(setReportForm, reportForm)} required />
            </div>
            <div className="col-12">
              <textarea name="lecturer_recommendations" className="form-control" placeholder="Recommendations" rows="2"
                value={reportForm.lecturer_recommendations} onChange={handleChange(setReportForm, reportForm)} />
            </div>
            <div className="col-md-6">
              <input type="number" name="actual_present" className="form-control" placeholder="Actual Present"
                value={reportForm.actual_present} onChange={handleChange(setReportForm, reportForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-success" type="submit">Submit to PRL</button>
            </div>
          </form>
        </div>
      )}

      {/* Monitoring Tab */}
      {activeTab === 'monitoring' && (
        <div>
          <h4> Class Monitoring</h4>
          <form onSubmit={handleMonitoringSubmit} className="row g-3">
            <div className="col-md-6">
              <select 
                name="course_id" 
                className="form-control" 
                value={monitoringForm.course_id} 
                onChange={handleChange(setMonitoringForm, monitoringForm)} 
                required
              >
                <option value="">Select Course Code</option>
                {availableCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-12">
              <textarea name="monitoring_notes" className="form-control" placeholder="Monitoring Notes" rows="3"
                value={monitoringForm.monitoring_notes} onChange={handleChange(setMonitoringForm, monitoringForm)} required />
            </div>
            <div className="col-12">
              <textarea name="student_performance_notes" className="form-control" placeholder="Student Performance Notes" rows="2"
                value={monitoringForm.student_performance_notes} onChange={handleChange(setMonitoringForm, monitoringForm)} />
            </div>
            <div className="col-12">
              <textarea name="discipline_issues" className="form-control" placeholder="Discipline Issues" rows="2"
                value={monitoringForm.discipline_issues} onChange={handleChange(setMonitoringForm, monitoringForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-warning" type="submit">Save Monitoring Data</button>
            </div>
          </form>
        </div>
      )}

      {/* Rating Tab */}
      {activeTab === 'rating' && (
        <div>
          <h4> Rate Students & Course</h4>
          <form onSubmit={handleRatingSubmit} className="row g-3">
            <div className="col-md-6">
              <select 
                name="course_id" 
                className="form-control" 
                value={ratingForm.course_id} 
                onChange={handleChange(setRatingForm, ratingForm)} 
                required
              >
                <option value="">Select Course Code</option>
                {availableCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_code} - {course.course_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <input type="number" name="student_rating" className="form-control" placeholder="Student Rating (1-5)"
                min="1" max="5" value={ratingForm.student_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="course_structure_rating" className="form-control" placeholder="Course Structure Rating (1-5)"
                min="1" max="5" value={ratingForm.course_structure_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="overall_rating" className="form-control" placeholder="Overall Rating (1-5)"
                min="1" max="5" value={ratingForm.overall_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-12">
              <textarea name="comments" className="form-control" placeholder="Comments" rows="3"
                value={ratingForm.comments} onChange={handleChange(setRatingForm, ratingForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-info" type="submit">Submit Rating</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default LecturerForm;