import { Menu, X, User, LogOut, Bell, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { logout, getNotifications } from '../utils/api';

// Navigation bar component that shows different options based on login status
function Navbar({ isLoggedIn, userRole, setCurrentPage, onLogout }) {
  // State to handle mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification count when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotificationCount();
      // Poll every 30 seconds
      const interval = setInterval(fetchNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchNotificationCount = async () => {
    try {
      const response = await getNotifications();
      if (response.success) {
        const unread = (response.notifications || []).filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      // Silently fail
    }
  };

  // Handle logout with API call
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      onLogout(); // Call parent's logout handler
    } catch (err) {
      console.error('Logout error:', err);
      // Still logout on frontend even if API fails
      onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand Name */}
          <div 
            className="text-xl font-bold text-gray-800 cursor-pointer"
            onClick={() => setCurrentPage(isLoggedIn ? (userRole === 'student' ? 'student-dashboard' : 'mentor-dashboard') : 'home')}
          >
            Obsidian Circle
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn ? (
              <>
                {/* Student Navigation */}
                {userRole === 'student' && (
                  <>
                    <button 
                      onClick={() => setCurrentPage('student-dashboard')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => setCurrentPage('browse-tasks')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Browse Tasks
                    </button>
                    <button 
                      onClick={() => setCurrentPage('team-management')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      My Team
                    </button>
                    <button 
                      onClick={() => setCurrentPage('alumni-network')}
                      className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      <Users size={16} />
                      Alumni
                    </button>
                    <button 
                      onClick={() => setCurrentPage('student-profile')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Profile
                    </button>
                  </>
                )}

                {/* Mentor Navigation */}
                {userRole === 'mentor' && (
                  <>
                    <button 
                      onClick={() => setCurrentPage('mentor-dashboard')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => setCurrentPage('mentor-create-task')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Create Task
                    </button>
                    <button 
                      onClick={() => setCurrentPage('alumni-network')}
                      className="text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                      <Users size={16} />
                      Alumni
                    </button>
                    <button 
                      onClick={() => setCurrentPage('mentor-profile')}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Profile
                    </button>
                  </>
                )}

                {/* Notification Bell */}
                <button 
                  onClick={() => setCurrentPage(userRole === 'student' ? 'student-dashboard' : 'mentor-dashboard')}
                  className="relative text-gray-600 hover:text-gray-800"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  disabled={isLoggingOut}
                >
                  <LogOut size={18} />
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                {/* Not logged in navigation */}
                <button 
                  onClick={() => setCurrentPage('login')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Login
                </button>
                <button 
                  onClick={() => setCurrentPage('signup')}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                >
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden flex items-center gap-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {/* Mobile notification indicator */}
            {isLoggedIn && unreadCount > 0 && (
              <span className="bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {isLoggedIn ? (
              <div className="flex flex-col gap-3">
                {userRole === 'student' && (
                  <>
                    <button 
                      onClick={() => {
                        setCurrentPage('student-dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('browse-tasks');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Browse Tasks
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('team-management');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      My Team
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('alumni-network');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Users size={16} />
                      Alumni Network
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('student-profile');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Profile
                    </button>
                  </>
                )}
                
                {userRole === 'mentor' && (
                  <>
                    <button 
                      onClick={() => {
                        setCurrentPage('mentor-dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Dashboard
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('mentor-create-task');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Create Task
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('alumni-network');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Users size={16} />
                      Alumni Network
                    </button>
                    <button 
                      onClick={() => {
                        setCurrentPage('mentor-profile');
                        setMobileMenuOpen(false);
                      }}
                      className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                      Profile
                    </button>
                  </>
                )}
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 mx-4 disabled:opacity-50"
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setCurrentPage('login');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Login
                </button>
                <button 
                  onClick={() => {
                    setCurrentPage('signup');
                    setMobileMenuOpen(false);
                  }}
                  className="text-left px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 mx-4"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;