import { useState, useEffect } from 'react';
import { BookOpen, Users, Award, Bell, MessageCircle, Clock, X, MessageSquare, Star, Trophy, CheckCheck, TrendingUp, Github, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { getStudentDashboard, getNotifications, markNotificationRead, markAllNotificationsRead, submitWork } from '../utils/api';
import TaskChat from './TaskChat';

// Student Dashboard with backend integration
function StudentDashboard({ setCurrentPage, userData }) {
  const [activeChatTaskId, setActiveChatTaskId] = useState(null);
  // State for dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {
      tasksCompleted: 0,
      tasksActive: 0,
      badgesEarned: 0,
      teamMembers: 0
    },
    activeTasks: []
  });
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSubmitId, setExpandedSubmitId] = useState(null);
  const [submitGithubUrl, setSubmitGithubUrl] = useState('');
  const [submitNotes, setSubmitNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch dashboard data and notifications on component mount
  useEffect(() => {
    fetchDashboard();
    fetchNotifications();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await getStudentDashboard();
      if (response.success) {
        setDashboardData(response);
      }
    } catch (err) {
      setError('Failed to load dashboard');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      if (response.success) {
        setNotifications(response.notifications || []);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setNotifications([]);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error('Failed to mark notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications:', err);
    }
  };

  const handleSubmitWork = async (taskId) => {
    if (!submitGithubUrl.trim()) {
      setError('Please enter a GitHub repo URL');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      const response = await submitWork(taskId, {
        githubUrl: submitGithubUrl.trim(),
        notes: submitNotes.trim()
      });
      if (response.success) {
        alert('Work submitted successfully!');
        setExpandedSubmitId(null);
        setSubmitGithubUrl('');
        setSubmitNotes('');
        fetchDashboard();
      }
    } catch (err) {
      setError(err.message || 'Failed to submit work');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusProgress = (status) => {
    switch(status) {
      case 'pending_approval': return { width: '15%', label: 'Pending Approval', color: 'bg-yellow-500' };
      case 'in-progress': return { width: '50%', label: 'In Progress', color: 'bg-blue-500' };
      case 'submitted': return { width: '80%', label: 'Submitted', color: 'bg-indigo-500' };
      case 'reviewed': return { width: '100%', label: 'Reviewed', color: 'bg-green-500' };
      default: return { width: '10%', label: status, color: 'bg-gray-400' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {userData?.name || 'Student'}!
          </h1>
          <p className="text-gray-600 mt-2">Here's what's happening with your projects</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completed Tasks</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.stats.tasksCompleted}</p>
              </div>
              <BookOpen className="text-gray-400" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Tasks</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.stats.tasksActive}</p>
              </div>
              <TrendingUp className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Badges Earned</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.stats.badgesEarned}</p>
              </div>
              <Award className="text-yellow-400" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Team Members</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.stats.teamMembers || 0}</p>
              </div>
              <Users className="text-gray-400" size={32} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Active Tasks Section */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Active Tasks</h2>
                <button 
                  onClick={() => setCurrentPage('browse-tasks')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Browse All
                </button>
              </div>

              <div className="space-y-4">
                {dashboardData.activeTasks && dashboardData.activeTasks.length > 0 ? (
                  dashboardData.activeTasks.map(submission => {
                    const progress = getStatusProgress(submission.status);
                    return (
                      <div key={submission._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">
                              {submission.taskId?.title || 'Task'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Mentor:{' '}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentPage(`/profile/${submission.taskId?.mentorId?._id}`);
                                }}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {submission.taskId?.mentorId?.name || 'Mentor'}
                              </button>
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            submission.status === 'submitted' 
                              ? 'bg-blue-100 text-blue-800' 
                              : submission.status === 'reviewed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {submission.status}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>{progress.label}</span>
                            {submission.totalScore > 0 && (
                              <span className="flex items-center gap-1 text-yellow-600 font-medium">
                                <Star size={12} /> {submission.totalScore} pts
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className={`${progress.color} h-2 rounded-full transition-all duration-500`} style={{ width: progress.width }}></div>
                          </div>
                        </div>
                        
                        {/* Team badge */}
                        {submission.applyAs === 'team' && submission.teamId && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded w-fit">
                            <Users size={12} />
                            Team: {submission.teamId?.name || 'Team Project'}
                          </div>
                        )}
                        
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {/* Submit Work button - only for in-progress tasks */}
                          {submission.status === 'in-progress' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedSubmitId(expandedSubmitId === submission._id ? null : submission._id);
                                setSubmitGithubUrl(submission.githubUrl || '');
                                setSubmitNotes('');
                              }}
                              className="flex items-center gap-1 text-sm px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 font-medium"
                            >
                              <Github size={16} />
                              Submit Work
                              {expandedSubmitId === submission._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                          )}
                          <button 
                            onClick={() => setActiveChatTaskId(submission.taskId._id)}
                            className="flex items-center gap-1 text-sm px-3 py-2 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                          >
                            <MessageSquare size={16} />
                            Chat
                          </button>
                          <button 
                            onClick={() => setCurrentPage(`/task/${submission.taskId._id}/details`)}
                            className="flex-1 text-sm px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                          >
                            View Details
                          </button>
                        </div>

                        {/* Expandable Submit Form */}
                        {expandedSubmitId === submission._id && submission.status === 'in-progress' && (
                          <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                              <Github size={16} />
                              Submit Your Work
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">GitHub Repo / Collaboration Link *</label>
                                <input
                                  type="url"
                                  value={submitGithubUrl}
                                  onChange={(e) => setSubmitGithubUrl(e.target.value)}
                                  placeholder="https://github.com/username/repo"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800 text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
                                <textarea
                                  value={submitNotes}
                                  onChange={(e) => setSubmitNotes(e.target.value)}
                                  placeholder="Any additional notes for the mentor..."
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => handleSubmitWork(submission.taskId._id)}
                                disabled={isSubmitting || !submitGithubUrl.trim()}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                              >
                                <Send size={16} />
                                {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No active tasks</p>
                    <button 
                      onClick={() => setCurrentPage('browse-tasks')}
                      className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
                    >
                      Browse Tasks
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="text-gray-600" size={20} />
                  <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    All Read
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map(notification => {
                    const getTypeColor = (type) => {
                      switch(type) {
                        case 'task_assignment': return 'bg-blue-100 text-blue-800';
                        case 'submission_reviewed': return 'bg-green-100 text-green-800';
                        case 'team_invite': return 'bg-purple-100 text-purple-800';
                        case 'task_update': return 'bg-yellow-100 text-yellow-800';
                        default: return 'bg-gray-100 text-gray-800';
                      }
                    };
                    
                    const formatDate = (dateString) => {
                      const date = new Date(dateString);
                      const now = new Date();
                      const diffMs = now - date;
                      const diffMins = Math.floor(diffMs / 60000);
                      const diffHours = Math.floor(diffMins / 60);
                      const diffDays = Math.floor(diffHours / 24);
                      
                      if (diffMins < 60) return `${diffMins}m ago`;
                      if (diffHours < 24) return `${diffHours}h ago`;
                      return `${diffDays}d ago`;
                    };
                    
                    return (
                      <div key={notification._id} className={`border-b border-gray-200 pb-4 last:border-b-0 ${notification.isRead ? 'opacity-60' : ''}`}>
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(notification.type)}`}>
                            {notification.type?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mt-2">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">{formatDate(notification.createdAt)}</p>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                              <CheckCheck size={12} />
                              Read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm">No notifications yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => setCurrentPage('browse-tasks')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-left"
                >
                  Find New Tasks
                </button>
                <button 
                  onClick={() => setCurrentPage('team-management')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-left"
                >
                  Manage Team
                </button>
                <button 
                  onClick={() => setCurrentPage('student-profile')}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-left"
                >
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Global Task Chat Overlay */}
    {activeChatTaskId && (
      <TaskChat taskId={activeChatTaskId} userData={userData} onClose={() => setActiveChatTaskId(null)} />
    )}
    </>
  );
}

export default StudentDashboard;