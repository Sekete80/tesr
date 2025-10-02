import React, { useState, useEffect } from 'react';

function ProgramLeaderForm() {
  const [activeTab, setActiveTab] = useState('courses');
  const [prlReports, setPrlReports] = useState([]);
  const [selectedPrlReport, setSelectedPrlReport] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  
  // Courses Tab State
  const [coursesForm, setCoursesForm] = useState({
    program_name: '',
    course_code: '',
    course_name: '',
    prl_responsible: ''
  });

  // Classes Tab State
  const [classesForm, setClassesForm] = useState({
    prl_id: '',
    class_details: '',
    oversight_notes: ''
  });

  // Reports Tab State
  const [reportsForm, setReportsForm] = useState({
    prl_report_id: '',
    pl_name: '',
    program_summary: '',
    overall_assessment: '',
    rating: ''
  });

  // Monitoring Tab State
  const [monitoringForm, setMonitoringForm] = useState({
    program_quality_notes: '',
    prl_performance_notes: '',
    overall_program_health: ''
  });

  // Rating Tab State
  const [ratingForm, setRatingForm] = useState({
    prl_id: '',
    program_rating: '',
    prl_performance_rating: '',
    comments: ''
  });

  // Tab navigation
  const tabs = [
    { id: 'courses', label: 'Courses' },
    { id: 'classes', label: 'Classes' },
    { id: 'reports', label: 'Reports' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'rating', label: 'Rating' }
  ];

  // Fetch PRL reports when Reports tab is activated
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchPrlReports();
    }
  }, [activeTab]);

  // Function to fetch PRL reports
  const fetchPrlReports = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/prl_reports');
      if (res.ok) {
        const reports = await res.json();
        setPrlReports(reports);
      } else {
        alert('Error fetching PRL reports');
      }
    } catch (err) {
      console.error('Error fetching PRL reports:', err);
      alert('Error connecting to server');
    }
  };

  // Function to select a PRL report
  const selectPrlReport = (report) => {
    setSelectedPrlReport(report);
    setReportsForm({
      ...reportsForm,
      prl_report_id: report.id,
      program_summary: `Reviewing PRL report from ${report.prl_name} regarding lecturer report`
    });
  };

  // Export function for PRL reports
  const handleExportPrlReports = async () => {
    setExportLoading(true);
    setExportMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/export/prl-reports', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        // Get filename from content-disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `prl-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setExportMessage('✅ PRL reports exported successfully!');
      } else {
        const errorData = await response.json();
        setExportMessage(`❌ Export failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage('❌ Network error during export');
    } finally {
      setExportLoading(false);
    }
  };

  // Export function for Program Reports
  const handleExportProgramReports = async () => {
    setExportLoading(true);
    setExportMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/export/program-reports', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `program-reports-${new Date().toISOString().split('T')[0]}.xlsx`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setExportMessage('✅ Program reports exported successfully!');
      } else {
        const errorData = await response.json();
        setExportMessage(`❌ Export failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportMessage('❌ Network error during export');
    } finally {
      setExportLoading(false);
    }
  };

  // Courses Tab Handler
  const handleCoursesSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/pl_courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coursesForm),
      });
      if (res.ok) {
        alert('Program courses updated!');
        setCoursesForm({ program_name: '', course_code: '', course_name: '', prl_responsible: '' });
      }
    } catch (err) {
      alert('Error updating program courses.');
    }
  };

  // Classes Tab Handler
  const handleClassesSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/pl_classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(classesForm),
      });
      if (res.ok) {
        alert('Class oversight data saved!');
        setClassesForm({ prl_id: '', class_details: '', oversight_notes: '' });
      }
    } catch (err) {
      alert('Error saving class oversight data.');
    }
  };

  // Reports Tab Handler
  const handleReportsSubmit = async (e) => {
    e.preventDefault();
    if (!reportsForm.prl_report_id) {
      alert('Please select a PRL report first');
      return;
    }
    
    try {
      const res = await fetch('http://localhost:5000/api/pl_reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportsForm),
      });
      if (res.ok) {
        alert('Program report finalized!');
        setReportsForm({ prl_report_id: '', pl_name: '', program_summary: '', overall_assessment: '', rating: '' });
        setSelectedPrlReport(null);
        fetchPrlReports(); // Refresh the list
      }
    } catch (err) {
      alert('Error finalizing program report.');
    }
  };

  // Monitoring Tab Handler
  const handleMonitoringSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/pl_monitoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(monitoringForm),
      });
      if (res.ok) {
        alert('Program monitoring data saved!');
        setMonitoringForm({ program_quality_notes: '', prl_performance_notes: '', overall_program_health: '' });
      }
    } catch (err) {
      alert('Error saving program monitoring data.');
    }
  };

  // Rating Tab Handler
  const handleRatingSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/pl_rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ratingForm),
      });
      if (res.ok) {
        alert('Rating submitted!');
        setRatingForm({ prl_id: '', program_rating: '', prl_performance_rating: '', comments: '' });
      }
    } catch (err) {
      alert('Error submitting rating.');
    }
  };

  const handleChange = (setter, form) => (e) => {
    setter({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h2>Program Leader Dashboard</h2>
      
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

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div>
          <h4>Manage Program Courses</h4>
          <form onSubmit={handleCoursesSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="program_name" className="form-control" placeholder="Program Name"
                value={coursesForm.program_name} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="course_code" className="form-control" placeholder="Course Code"
                value={coursesForm.course_code} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="course_name" className="form-control" placeholder="Course Name"
                value={coursesForm.course_name} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="prl_responsible" className="form-control" placeholder="Responsible PRL"
                value={coursesForm.prl_responsible} onChange={handleChange(setCoursesForm, coursesForm)} required />
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit">Update Program Courses</button>
            </div>
          </form>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div>
          <h4>Oversee Classes</h4>
          <form onSubmit={handleClassesSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="prl_id" className="form-control" placeholder="PRL ID"
                value={classesForm.prl_id} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-md-6">
              <input type="text" name="class_details" className="form-control" placeholder="Class Details"
                value={classesForm.class_details} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-12">
              <textarea name="oversight_notes" className="form-control" placeholder="Oversight Notes" rows="3"
                value={classesForm.oversight_notes} onChange={handleChange(setClassesForm, classesForm)} required />
            </div>
            <div className="col-12">
              <button className="btn btn-warning" type="submit">Save Class Oversight</button>
            </div>
          </form>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div>
          <h4>Finalize Program Report</h4>
          
          {/* Export Section */}
          <div className="card mb-4">
            <div className="card-header bg-success text-white">
              <h5 className="mb-0">📊 Export Reports to Excel</h5>
            </div>
            <div className="card-body">
              {exportMessage && (
                <div className={`alert ${exportMessage.includes('✅') ? 'alert-success' : 'alert-danger'} mb-3`}>
                  {exportMessage}
                </div>
              )}
              
              <div className="row">
                <div className="col-md-6">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-success"
                      onClick={handleExportPrlReports}
                      disabled={exportLoading}
                    >
                      {exportLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Exporting...
                        </>
                      ) : (
                        '📥 Download PRL Reports (Excel)'
                      )}
                    </button>
                    <small className="text-muted">Download all PRL reports data</small>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary"
                      onClick={handleExportProgramReports}
                      disabled={exportLoading}
                    >
                      {exportLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Exporting...
                        </>
                      ) : (
                        '📥 Download Program Reports (Excel)'
                      )}
                    </button>
                    <small className="text-muted">Download program-level reports</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: View PRL Reports */}
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Available PRL Reports</h5>
            </div>
            <div className="card-body">
              <button 
                type="button" 
                className="btn btn-outline-primary btn-sm mb-3"
                onClick={fetchPrlReports}
              >
                Refresh PRL Reports
              </button>
              
              {prlReports.length === 0 ? (
                <p className="text-muted">No PRL reports available.</p>
              ) : (
                <div className="row">
                  {prlReports.map(report => (
                    <div key={report.id} className="col-md-6 mb-3">
                      <div className={`card ${selectedPrlReport?.id === report.id ? 'border-primary' : ''}`}>
                        <div className="card-body">
                          <h6 className="card-title">PRL Report #{report.id}</h6>
                          <p className="card-text mb-1">
                            <strong>PRL:</strong> {report.prl_name}
                          </p>
                          <p className="card-text mb-1">
                            <strong>Lecturer Report ID:</strong> {report.lecturer_report_id}
                          </p>
                          <p className="card-text mb-1">
                            <strong>Summary:</strong> {report.summary?.substring(0, 100)}...
                          </p>
                          <p className="card-text mb-2">
                            <strong>Rating:</strong> {report.rating || 'Not rated'}
                          </p>
                          <button 
                            type="button" 
                            className={`btn btn-sm ${selectedPrlReport?.id === report.id ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => selectPrlReport(report)}
                          >
                            {selectedPrlReport?.id === report.id ? 'Selected' : 'Select This Report'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: PL Report Form */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Finalize Program Report</h5>
            </div>
            <div className="card-body">
              {selectedPrlReport && (
                <div className="alert alert-info">
                  <strong>Selected PRL Report:</strong> #{selectedPrlReport.id} by {selectedPrlReport.prl_name}
                </div>
              )}
              
              <form onSubmit={handleReportsSubmit} className="row g-3">
                <div className="col-md-6">
                  <input type="text" name="prl_report_id" className="form-control" placeholder="PRL Report ID"
                    value={reportsForm.prl_report_id} onChange={handleChange(setReportsForm, reportsForm)} required 
                    readOnly 
                  />
                </div>
                <div className="col-md-6">
                  <input type="text" name="pl_name" className="form-control" placeholder="Program Leader Name"
                    value={reportsForm.pl_name} onChange={handleChange(setReportsForm, reportsForm)} required />
                </div>
                <div className="col-12">
                  <textarea name="program_summary" className="form-control" placeholder="Program Summary" rows="3"
                    value={reportsForm.program_summary} onChange={handleChange(setReportsForm, reportsForm)} required />
                </div>
                <div className="col-12">
                  <textarea name="overall_assessment" className="form-control" placeholder="Overall Assessment" rows="2"
                    value={reportsForm.overall_assessment} onChange={handleChange(setReportsForm, reportsForm)} required />
                </div>
                <div className="col-md-6">
                  <input type="number" name="rating" className="form-control" placeholder="Overall Rating (1-5)"
                    min="1" max="5" value={reportsForm.rating} onChange={handleChange(setReportsForm, reportsForm)} />
                </div>
                <div className="col-12">
                  <button 
                    className="btn btn-success" 
                    type="submit"
                    disabled={!reportsForm.prl_report_id}
                  >
                    Finalize Program Report
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
          <h4>Program Quality Monitoring</h4>
          <form onSubmit={handleMonitoringSubmit} className="row g-3">
            <div className="col-12">
              <textarea name="program_quality_notes" className="form-control" placeholder="Program Quality Notes" rows="2"
                value={monitoringForm.program_quality_notes} onChange={handleChange(setMonitoringForm, monitoringForm)} required />
            </div>
            <div className="col-12">
              <textarea name="prl_performance_notes" className="form-control" placeholder="PRL Performance Notes" rows="2"
                value={monitoringForm.prl_performance_notes} onChange={handleChange(setMonitoringForm, monitoringForm)} />
            </div>
            <div className="col-12">
              <textarea name="overall_program_health" className="form-control" placeholder="Overall Program Health" rows="2"
                value={monitoringForm.overall_program_health} onChange={handleChange(setMonitoringForm, monitoringForm)} />
            </div>
            <div className="col-12">
              <button className="btn btn-info" type="submit">Save Program Monitoring</button>
            </div>
          </form>
        </div>
      )}

      {/* Rating Tab */}
      {activeTab === 'rating' && (
        <div>
          <h4>Rate PRLs and Program</h4>
          <form onSubmit={handleRatingSubmit} className="row g-3">
            <div className="col-md-6">
              <input type="text" name="prl_id" className="form-control" placeholder="PRL ID"
                value={ratingForm.prl_id} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="program_rating" className="form-control" placeholder="Program Rating (1-5)"
                min="1" max="5" value={ratingForm.program_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
            </div>
            <div className="col-md-6">
              <input type="number" name="prl_performance_rating" className="form-control" placeholder="PRL Performance Rating (1-5)"
                min="1" max="5" value={ratingForm.prl_performance_rating} onChange={handleChange(setRatingForm, ratingForm)} required />
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

export default ProgramLeaderForm;