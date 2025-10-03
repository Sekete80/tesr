import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Login from "./Login";
import Register from "./Register";
import LecturerForm from './components/LecturerForm';
import StudentForm from './components/StudentForm';
import ProgramLeaderForm from './components/ProgramLeaderForm';
import PrincipalLecturerForm from './components/PrincipalLecturerForm';
import './styles.css';
function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUserRole(userData.role);
        setUser(userData);
        setCurrentView('dashboard');
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (role, userData) => {
    setUserRole(role);
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUserRole(null);
    setUser(null);
    setCurrentView('login');
  };

  const switchToRegister = () => {
    setCurrentView('register');
  };

  const switchToLogin = () => {
    setCurrentView('login');
  };

  const renderDashboard = () => {
    switch(userRole) {
      case 'student':
        return <StudentForm user={user} />;
      case 'lecturer':
        return <LecturerForm user={user} />;
      case 'prl':
        return <ProgramLeaderForm user={user} />;
      case 'pl':
        return <PrincipalLecturerForm user={user} />;
      default:
        return (
          <div className="alert alert-danger">
            Invalid user role: {userRole}
          </div>
        );
    }
  };

  // Render login or register based on currentView
  if (currentView === 'login') {
    return (
      <div>
        <Login onLogin={handleLogin} />
        <div className="container mt-3">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="text-center">
                <button className="btn btn-link" onClick={switchToRegister}>
                  Register here
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer>&copy;2025 Limkokwing University of Creative Technology | All Rights Reserved</footer>
      </div>
    );
  }

  if (currentView === 'register') {
    return (
      <div>
        <Register onSwitchToLogin={switchToLogin} />
        <div className="container mt-3">
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="text-center">
                <button 
                  className="btn btn-link" 
                  onClick={switchToLogin}
                >
                  Login here
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer>&copy;2025 Limkokwing University of Creative Technology | All Rights Reserved</footer>
      </div>
    );
  }

  // Dashboard view
  return (
    <div className="container-fluid">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <span className="navbar-brand">LUCT Reporting System</span>
          <div className="navbar-nav ms-auto">
            <span className="navbar-text me-3">
              Welcome, <strong>{user?.name}</strong> ({userRole})
            </span>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>
      

      {/* Main Content */}
      <div className="container mt-4">
        {renderDashboard()}
      </div>
      <footer className='footer'>&copy;2025 Limkokwing University of Creative Technology | All Rights Reserved</footer>
    </div>
    
  );
}

export default App;