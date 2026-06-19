// App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Menu, X } from 'lucide-react';
import { verifyToken } from './utils/api';

// Import components
import Navbar from './components/Navbar';
import Signup from './components/Signup';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import MentorDashboardEnhanced from './components/MentorDashboardEnhanced';
import StudentProfile from './components/StudentProfile';
import MentorProfile from './components/MentorProfile';
import BrowseTasks from './components/BrowseTasks';
import TeamManagement from './components/TeamManagement';
import TaskSubmission from './components/TaskSubmission';
import MentorTaskCreate from './components/MentorTaskCreate';
import MentorEvaluation from './components/MentorEvaluation';
import MentorTaskDetailPage from './components/MentorTaskDetailPage';
import TaskChat from './components/TaskChat';
import TaskDetail from './components/TaskDetail';
import PublicProfile from './components/PublicProfile';
import AlumniNetwork from './components/AlumniNetwork';
import CommunityFeed from './components/CommunityFeed';

/* ----------------- HomePage (keeps your Tailwind & props) ----------------- */
function HomePage({ setCurrentPage }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            The Obsidian Circle
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Connect with alumni mentors, work on real-world projects, and build your career
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setCurrentPage('signup')}
              className="px-8 py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Get Started
            </button>
            <button
              onClick={() => setCurrentPage('login')}
              className="px-8 py-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border-2 border-gray-800 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Login
            </button>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">For Students</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Work on real projects, collaborate in teams, and get mentorship from industry professionals
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">For Mentors</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Post tasks, evaluate submissions, and help students grow with your expertise
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Track Progress</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Monitor contributions, earn badges, and build a portfolio of completed work
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------ App (inside Router) ------------------ */
function AppInner() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userData, setUserData] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await verifyToken();
      if (response && response.success) {
        setIsLoggedIn(true);
        setUserRole(response.user.role);
        setUserData(response.user);
      } else {
        // not logged in
        setIsLoggedIn(false);
        setUserRole("");
        setUserData(null);
      }
    } catch (err) {
      setIsLoggedIn(false);
      setUserRole("");
      setUserData(null);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // ----------------- Compatibility adapter for existing components that call setCurrentPage('some-string') -----------------
  // This maps your previous page keys to real routes, so you won't need to modify Navbar or other components.
  const mapPageToPath = (page) => {
    switch (page) {
      case 'home': return '/';
      case 'signup': return '/signup';
      case 'login': return '/login';
      case 'student-dashboard': return '/student/dashboard';
      case 'mentor-dashboard': return '/mentor/dashboard';
      case 'student-profile': return '/student/profile';
      case 'mentor-profile': return '/mentor/profile';
      case 'browse-tasks': return '/tasks';
      case 'team-management': return '/team-management';
      case 'task-submission': return '/task-submission';
      case 'mentor-create-task': return '/mentor/task/create';
      case 'mentor-evaluation': return '/mentor/evaluation';
      case 'alumni-network': return '/alumni';
      case 'community': return '/community';
      default: return '/';
    }
  };

  // This function is passed to child components as setCurrentPage(...) to preserve backward compatibility.
  const setCurrentPage = (pageOrPath, params = {}) => {
    // allow both full paths or page keys
    if (typeof pageOrPath !== 'string') return;
    if (pageOrPath.startsWith('/')) {
      navigate(pageOrPath);
    } else {
      const basePath = mapPageToPath(pageOrPath);
      // For team management, pass action as URL param
      if (pageOrPath === 'team-management' && params.action) {
        navigate(`${basePath}?action=${params.action}`);
      } else if (params.id) {
        navigate(`${basePath}/${params.id}`);
      } else {
        navigate(basePath);
      }
    }
  };

  // ----------------- Login / Logout handlers -----------------
  const handleLogin = (role, data) => {
    setIsLoggedIn(true);
    setUserRole(role);
    setUserData(data);

    // navigate to the proper dashboard
    if (role === 'student') navigate('/student/dashboard');
    else if (role === 'mentor') navigate('/mentor/dashboard');
    else navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole('');
    setUserData(null);
    // clear cookies/sessions should be done by calling your logout API (not shown here)
    navigate('/');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Pass the old API (setCurrentPage) to Navbar so it keeps working */}
      <Navbar
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        setCurrentPage={setCurrentPage}
        onLogout={handleLogout}
      />


      <div className="pt-16">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage setCurrentPage={setCurrentPage} />} />
          <Route
            path="/signup"
            element={isLoggedIn ? <Navigate to={`/${userRole}/dashboard`} /> : <Signup setCurrentPage={setCurrentPage} onLogin={handleLogin} />}
          />
          <Route
            path="/login"
            element={isLoggedIn ? <Navigate to={`/${userRole}/dashboard`} /> : <Login setCurrentPage={setCurrentPage} onLogin={handleLogin} />}
          />

          {/* Student Protected */}
          <Route
            path="/student/dashboard"
            element={
              isLoggedIn && userRole === 'student' ? (
                <StudentDashboard setCurrentPage={setCurrentPage} userData={userData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/student/profile"
            element={
              isLoggedIn && userRole === 'student' ? (
                <StudentProfile setCurrentPage={setCurrentPage} userData={userData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Mentor Protected */}
          <Route
            path="/mentor/dashboard"
            element={
              isLoggedIn && userRole === 'mentor' ? (
                <MentorDashboardEnhanced setCurrentPage={setCurrentPage} userData={userData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/mentor/profile"
            element={
              isLoggedIn && userRole === 'mentor' ? (
                <MentorProfile setCurrentPage={setCurrentPage} userData={userData} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Tasks & other pages (you can add setCurrentPage prop to those that expect it) */}
          <Route path="/tasks" element={<BrowseTasks setCurrentPage={setCurrentPage} />} />
          <Route path="/task/:id" element={<TaskSubmission setCurrentPage={setCurrentPage} userData={userData} />} />
          <Route path="/task/:id/details" element={<TaskDetail setCurrentPage={setCurrentPage} userData={userData} />} />
          <Route path="/profile/:id" element={isLoggedIn ? <PublicProfile /> : <Navigate to="/login" />} />

          {/* Team management, Mentor create/eval routes — add or adjust as needed */}
          <Route path="/team-management" element={<TeamManagement setCurrentPage={setCurrentPage} userData={userData} />} />
          <Route path="/mentor/task/create" element={<MentorTaskCreate setCurrentPage={setCurrentPage} />} />
          <Route path="/mentor/task/:id" element={<MentorTaskDetailPage setCurrentPage={setCurrentPage} userData={userData} />} />
          <Route path="/mentor/evaluation" element={<MentorEvaluation setCurrentPage={setCurrentPage} />} />
          <Route path="/alumni" element={isLoggedIn ? <AlumniNetwork setCurrentPage={setCurrentPage} userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/community" element={isLoggedIn ? <CommunityFeed userData={userData} /> : <Navigate to="/login" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

/* ------------------ Export wrapper that provides Router context ------------------ */
export default function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}
