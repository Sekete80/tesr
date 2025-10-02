import React, { useState } from "react";

function Register() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    student_id: "", 
    password: "", 
    confirmPassword: "", 
    role: "student" 
  });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    // Validation
    if (form.password !== form.confirmPassword) {
      setMessage("❌ Passwords do not match");
      return;
    }

    if (form.role === 'student' && !form.student_id) {
      setMessage("❌ Student ID is required for student registration");
      return;
    }

    if (form.role !== 'student' && !form.email) {
      setMessage("❌ Email is required for lecturer/PRL/PL registration");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          student_id: form.student_id,
          password: form.password,
          role: form.role
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("✅ Registered successfully! You can now login.");
        setForm({ name: "", email: "", student_id: "", password: "", confirmPassword: "", role: "student" });
      } else {
        setMessage("❌ Registration failed: " + data.error);
      }
    } catch (err) {
      setMessage("❌ Network error: Could not connect to server");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">Register</h2>
              
              {message && (
                <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-control" 
                    placeholder="Enter your full name"
                    value={form.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select name="role" className="form-control" value={form.role} onChange={handleChange}>
                    <option value="student">Student</option>
                    <option value="lecturer">Lecturer</option>
                    <option value="prl">Program Leader (PRL)</option>
                    <option value="pl">Principal Lecturer (PL)</option>
                  </select>
                </div>

                {form.role === 'student' ? (
                  <div className="mb-3">
                    <label className="form-label">Student ID</label>
                    <input 
                      type="text" 
                      name="student_id" 
                      className="form-control" 
                      placeholder="e.g., 901019102"
                      value={form.student_id} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                ) : (
                  <div className="mb-3">
                    <label className="form-label">Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-control" 
                      placeholder="e.g., example@luct.co.ls"
                      value={form.email} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input 
                    type="password" 
                    name="password" 
                    className="form-control" 
                    placeholder="Enter password"
                    value={form.password} 
                    onChange={handleChange} 
                    required 
                    minLength="6"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirm Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    className="form-control" 
                    placeholder="Confirm password"
                    value={form.confirmPassword} 
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">Register</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;