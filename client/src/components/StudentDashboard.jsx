import { useState, useEffect } from 'react';
import { BookOpen, Users, Award, Bell, Video, MessageCircle, Clock, X, MessageSquare } from 'lucide-react';
import { getStudentDashboard, getNotifications } from '../utils/api';
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
  const [videoCallModal, setVideoCallModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [videoCallData, setVideoCallData] = useState({
    topic: '',
    description: ''
  });
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

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

  const handleVideoCallRequest = async (e) => {
    e.preventDefault();
    
    if (!videoCallData.topic.trim()) {
      setError('Please specify a discussion topic');
      return;
    }

    setIsSubmittingCall(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/tasks/${selectedTask._id}/request-video-chat`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: videoCallData.topic + (videoCallData.description ? ` - ${videoCallData.description}` : ''),
          mentorId: selectedTask.mentorId?._id || selectedTask.mentorId
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert('Video call request sent to mentor! They will respond shortly.');
        setVideoCallModal(false);
        setVideoCallData({ topic: '', description: '' });
      } else {
        setError(data.error || 'Failed to send video call request');
      }
    } catch (err) {
      setError('Failed to send video call request');
      console.error('Error:', err);
    } finally {
      setIsSubmittingCall(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

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
              <BookOpen className="text-gray-400" size={32} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Badges Earned</p>
                <p className="text-3xl font-bold text-gray-800">{dashboardData.stats.badgesEarned}</p>
              </div>
              <Award className="text-gray-400" size={32} />
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
                  dashboardData.activeTasks.map(submission => (
                    <div key={submission._id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-400 cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {submission.taskId?.title || 'Task'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Status: {submission.status}
                          </p>
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
                      <div className="mt-3 flex gap-2">
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
                        <button 
                          onClick={() => {
                            setSelectedTask(submission.taskId);
                            setVideoCallData({ topic: '', description: '' });
                            setVideoCallModal(true);
                          }}
                          className="flex items-center gap-1 text-sm px-3 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                        >
                          <Video size={16} />
                          Call
                        </button>
                      </div>
                    </div>
                  ))
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
              <div className="flex items-center gap-2 mb-6">
                <Bell className="text-gray-600" size={20} />
                <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
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
                      <div key={notification._id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start gap-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded ${getTypeColor(notification.type)}`}>
                            {notification.type?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mt-2">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{formatDate(notification.createdAt)}</p>
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

    {/* Video Call Request Modal */}
    {videoCallModal && selectedTask && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Video size={24} className="text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800">Request Video Call</h2>
            </div>
            <button 
              onClick={() => setVideoCallModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleVideoCallRequest} className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Task</p>
              <p className="text-gray-800 font-semibold">{selectedTask.title}</p>
              <p className="text-xs text-gray-600 mt-1">Mentor: {selectedTask.mentorId?.name || 'Your Mentor'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discussion Topic <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={videoCallData.topic}
                onChange={(e) => setVideoCallData({ ...videoCallData, topic: e.target.value })}
                placeholder="e.g., Code review, debugging, design feedback"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                required
                disabled={isSubmittingCall}
              />
              <p className="text-xs text-gray-500 mt-1">What would you like to discuss?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details (Optional)
              </label>
              <textarea
                value={videoCallData.description}
                onChange={(e) => setVideoCallData({ ...videoCallData, description: e.target.value })}
                placeholder="Any specific issues or questions you'd like to prepare for..."
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-600"
                disabled={isSubmittingCall}
              />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <p className="text-sm text-purple-800">
                <span className="font-semibold">💡 Tip:</span> Your mentor will receive this request and can accept or schedule a time that works for both of you.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50"
                disabled={isSubmittingCall}
              >
                {isSubmittingCall ? 'Sending...' : 'Send Request'}
              </button>
              <button
                type="button"
                onClick={() => setVideoCallModal(false)}
                className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                disabled={isSubmittingCall}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
    {/* Global Task Chat Overlay */}
    {activeChatTaskId && (
      <TaskChat taskId={activeChatTaskId} userData={userData} />
    )}
    </>
  );
}

export default StudentDashboard;