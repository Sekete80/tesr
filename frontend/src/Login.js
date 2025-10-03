import React, { useState } from "react";

function Login({ onLogin }) {
  const [form, setForm] = useState({ identifier: "", password: "", role: "student" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || '';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage(""); // Clear message when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      console.log('Attempting login...', form);
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(form)
      });

      console.log('Response status:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("✅ Login successful!");
        setTimeout(() => onLogin(data.user.role, data.user), 1000);
      } else {
        setMessage("❌ " + (data.error || 'Login failed'));
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage("❌ Network error: Could not connect to server. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceholder = () => {
    return form.role === 'student' 
      ? "Enter your Student ID (e.g., 901019102)" 
      : "Enter your LUCT email (e.g., example@luct.co.ls)";
  };

  const getLabel = () => {
    return form.role === 'student' ? 'Student ID' : 'Email Address';
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow">
            <div className="card-header bg-primary text-white text-center">
              <h4 className="mb-0">LUCT Reporting System</h4>
              <small>Login to your account</small>
            </div>
            <div className="card-body p-4">
              {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
                  {message}
                  <button type="button" className="btn-close" onClick={() => setMessage("")}></button>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold">I am a:</label>
                  <select 
                    name="role" 
                    className="form-select" 
                    value={form.role} 
                    onChange={handleChange}
                  >
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="prl">Program Leader (PRL)</option>
                    <option value="pl">Principal Lecturer (PL)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">{getLabel()}</label>
                  <input 
                    name="identifier" 
                    className="form-control" 
                    placeholder={getPlaceholder()}
                    value={form.identifier} 
                    onChange={handleChange} 
                    required 
                    disabled={isLoading}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-control" 
                    placeholder="Enter your password"
                    value={form.password} 
                    onChange={handleChange} 
                    required 
                    disabled={isLoading}
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 py-2"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <div className="text-center mt-3">
                <small className="text-muted">
                  Demo: Students use Student ID, Staff use LUCT email
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;