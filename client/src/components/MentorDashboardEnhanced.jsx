import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle, Eye, Send, Bell, Github, AlertCircle, MessageCircle, Video, X, MessageSquare } from 'lucide-react';
import { getMentorTasks, getMentorSubmissions, getNotifications, getPendingApplications, approveApplication, rejectApplication } from '../utils/api';
import TaskChat from './TaskChat';

// Enhanced Mentor Dashboard - Merged with all features + Notifications
function MentorDashboardEnhanced({ setCurrentPage, userData }) {
  const [tasks, setTasks] = useState([]);
  const [activeChatTaskId, setActiveChatTaskId] = useState(null);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [inProgressWork, setInProgressWork] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, applications, progress, reviews, calls, notifications
  const [videoCallRequests, setVideoCallRequests] = useState([]);
  const [ongoingCall, setOngoingCall] = useState(null);
  const [stats, setStats] = useState({
    activeTasks: 0,
    totalTeams: 0,
    pendingReviews: 0,
    completedReviews: 0,
    inProgressCount: 0,
    pendingVideoRequests: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch mentor's tasks
      const tasksResponse = await getMentorTasks();
      if (tasksResponse.success) {
        setTasks(tasksResponse.tasks || []);
        const activeTasks = tasksResponse.tasks.filter(t => t.status === 'active').length;
        const totalTeams = tasksResponse.tasks.reduce((sum, task) => sum + (task.activeTeams || 0), 0);
        setStats(prev => ({ ...prev, activeTasks, totalTeams }));
      }

      // Fetch submissions (pending, in-progress, reviewed)
      const submissionsResponse = await getMentorSubmissions();
      if (submissionsResponse.success) {
        const pending = submissionsResponse.submissions.filter(s => s.status === 'submitted');
        const inProgress = submissionsResponse.submissions.filter(s => s.status === 'in-progress');
        setPendingReviews(pending);
        setInProgressWork(inProgress);
        setStats(prev => ({
          ...prev,
          pendingReviews: pending.length,
          completedReviews: submissionsResponse.submissions.filter(s => s.status === 'reviewed').length,
          inProgressCount: inProgress.length
        }));
      }

      // Fetch pending applications
      const pendingAppsResponse = await getPendingApplications();
      if (pendingAppsResponse.success) {
        setPendingRequests(pendingAppsResponse.applications || []);
      }

      // Fetch notifications
      const notificationsResponse = await getNotifications();
      if (notificationsResponse.success) {
        const allNotifications = notificationsResponse.notifications || [];
        setNotifications(allNotifications);
        
        // Extract video call requests
        const videoRequests = allNotifications.filter(n => n.type === 'video_request');
        setVideoCallRequests(videoRequests);
        
        const unreadCount = allNotifications.filter(n => !n.isRead).length;
        const pendingVideoCount = videoRequests.filter(n => !n.isRead).length;
        setStats(prev => ({ ...prev, unreadNotifications: unreadCount, pendingVideoRequests: pendingVideoCount }));
      }
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveApplication = async (applicationId) => {
    try {
      const response = await approveApplication(applicationId);
      if (response.success) {
        alert('Application approved!');
        fetchAllData(); // refresh data
      }
    } catch (err) {
      setError(err.message || 'Failed to approve application');
    }
  };

  const handleRejectApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    try {
      const response = await rejectApplication(applicationId);
      if (response.success) {
        alert('Application rejected!');
        fetchAllData(); // refresh data
      }
    } catch (err) {
      setError(err.message || 'Failed to reject application');
    }
  };

  const handleAcceptVideoCall = (request) => {
    setOngoingCall(request);
    alert(`Starting video call with ${request.studentName || 'Student'}...`);
    // In real app: start WebRTC connection, open video interface
  };

  const handleDeclineVideoCall = (requestId) => {
    setVideoCallRequests(videoCallRequests.filter(r => r._id !== requestId));
    alert('Video call declined');
  };

  const handleEndCall = () => {
    alert('Video call ended');
    setOngoingCall(null);
    setVideoCallRequests(videoCallRequests.filter(r => r._id !== ongoingCall._id));
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'video_request':
        return <Video size={18} className="text-purple-600" />;
      case 'task_completion':
        return <CheckCircle size={18} className="text-green-600" />;
      case 'team_invite':
        return <Users size={18} className="text-blue-600" />;
      case 'mentor_message':
        return <MessageCircle size={18} className="text-gray-600" />;
      default:
        return <Bell size={18} className="text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'video_request':
        return 'bg-purple-50 border-purple-200';
      case 'task_completion':
        return 'bg-green-50 border-green-200';
      case 'team_invite':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {userData?.name || 'Mentor'}!</h1>
            <p className="text-gray-600 mt-2">Manage tasks, review applications, and monitor student progress</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-700 hover:text-red-900">
              <X size={20} />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm">Active Tasks</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.activeTasks}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm">Total Teams</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{stats.totalTeams}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgressCount}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm">Pending Reviews</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingReviews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm">Completed Reviews</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.completedReviews}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-gray-600 text-sm">Notifications</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-red-600">{stats.unreadNotifications}</p>
              <Bell size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 bg-white rounded-t-lg px-6 py-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'applications'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'progress'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            In Progress ({stats.inProgressCount})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-2 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            Pending Reviews
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`pb-2 px-4 font-medium border-b-2 transition-colors relative ${
              activeTab === 'calls'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Video size={18} />
              Video Calls
              {stats.pendingVideoRequests > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5 ml-1">
                  {stats.pendingVideoRequests}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2 px-4 font-medium border-b-2 transition-colors relative ${
              activeTab === 'notifications'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              Notifications
              {stats.unreadNotifications > 0 && (
                <span className="bg-red-600 text-white text-xs rounded-full px-2 py-0.5">
                  {stats.unreadNotifications}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-lg shadow-sm p-6">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* My Tasks */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <AlertCircle size={24} />
                  My Tasks
                </h2>
                <div className="space-y-3">
                  {tasks.length > 0 ? (
                    tasks.map(task => (
                      <button
                        key={task._id}
                        onClick={() => {
                          setSelectedTask(task);
                          setActiveTab('applications');
                        }}
                        className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
                      >
                        <p className="font-semibold text-gray-800">{task.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Users size={14} />
                            {task.applicants || 0} applicants
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            {task.activeTeams || 0} active
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No tasks created yet</p>
                      <button
                        onClick={() => setCurrentPage('mentor-create-task')}
                        className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm"
                      >
                        Create Task
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <CheckCircle size={24} />
                  Quick Summary
                </h2>
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900">Work In Progress</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgressCount} teams</p>
                    <p className="text-xs text-blue-700 mt-2">Currently working on your tasks</p>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-orange-900">Pending Reviews</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingReviews} submissions</p>
                    <p className="text-xs text-orange-700 mt-2">Waiting for your evaluation</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-purple-900">New Notifications</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">{stats.unreadNotifications} unread</p>
                    <p className="text-xs text-purple-700 mt-2">Video calls and messages</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Users size={24} />
                Pending Applications ({pendingRequests.length})
              </h2>
              
              {pendingRequests.length > 0 ? (
                <div className="space-y-4">
                  {pendingRequests.map(app => (
                    <div key={app._id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-all bg-white">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{app.taskId?.title}</h3>
                          <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Applicant:</span>{' '}
                              <button 
                                onClick={() => setCurrentPage(`/profile/${app.studentId?._id}`)}
                                className="text-blue-600 hover:underline font-medium"
                              >
                                {app.studentId?.name}
                              </button>{' '}
                              ({app.studentId?.email})
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">Applying As:</span> <span className="capitalize">{app.applyAs || 'Individual'}</span>
                            </p>
                            {app.applyAs === 'team' && app.teamId && (
                              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Team Members ({app.teamId.name})</p>
                                <ul className="space-y-1">
                                  {app.teamId.members?.map(member => (
                                    <li key={member._id} className="text-sm text-gray-700 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                                      <button 
                                        onClick={() => setCurrentPage(`/profile/${member._id}`)}
                                        className="text-blue-600 hover:underline font-medium"
                                      >
                                        {member.name}
                                      </button>
                                      <span className="text-gray-500">({member.email})</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="text-sm text-gray-600">
                              <span className="font-semibold">GitHub Profile:</span>{' '}
                              <a 
                                href={app.applicantGithubUrl || app.githubUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                <Github size={14} />
                                {app.applicantGithubUrl || app.githubUrl || 'Not provided'}
                              </a>
                            </p>
                            {app.message && (
                              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Student Pitch</p>
                                <p className="text-sm text-gray-700 italic">"{app.message}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-3 shrink-0">
                          <button
                            onClick={() => handleApproveApplication(app._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 font-medium text-sm"
                          >
                            <CheckCircle size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectApplication(app._id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 font-medium text-sm"
                          >
                            <XCircle size={16} />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No pending applications right now.</p>
                </div>
              )}
            </div>
          )}

          {/* In Progress Tab */}
          {activeTab === 'progress' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Eye size={24} />
                In Progress Work ({stats.inProgressCount})
              </h2>
              {inProgressWork.length > 0 ? (
                <div className="space-y-4">
                  {inProgressWork.map(work => (
                    <div key={work._id} className="border border-blue-200 bg-blue-50 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{work.taskId?.title || 'Task'}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Team:{' '}
                            <button 
                              onClick={() => setCurrentPage(`/profile/${work.studentId?._id}`)}
                              className="text-blue-600 hover:underline font-medium"
                            >
                              {work.studentId?.name || 'Student'}
                            </button>
                          </p>
                          {work.applyAs === 'team' && work.teamId && (
                            <div className="mt-3 p-3 bg-white bg-opacity-60 border border-blue-200 rounded-lg">
                              <p className="text-xs text-blue-800 font-semibold uppercase mb-2">Team Members ({work.teamId.name})</p>
                              <ul className="space-y-1">
                                {work.teamId.members?.map(member => (
                                  <li key={member._id} className="text-sm text-gray-700 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                                    <button 
                                      onClick={() => setCurrentPage(`/profile/${member._id}`)}
                                      className="text-blue-600 hover:underline font-medium"
                                    >
                                      {member.name}
                                    </button>
                                    <span className="text-gray-500">({member.email})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium self-start shrink-0">In Progress</span>
                      </div>

                      {work.githubUrl && (
                        <div className="mb-3 p-3 bg-white rounded border border-blue-200">
                          <p className="text-xs text-gray-600 font-medium uppercase mb-1">GitHub Repository</p>
                          <a 
                            href={work.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all flex items-center gap-2"
                          >
                            <Github size={16} />
                            View Repository
                          </a>
                        </div>
                      )}

                      {work.notes && (
                        <div className="mb-3 p-3 bg-white rounded border border-blue-200">
                          <p className="text-xs text-gray-600 font-medium uppercase mb-1">Progress Notes</p>
                          <p className="text-sm text-gray-700">{work.notes}</p>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Started: {new Date(work.createdAt).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setActiveChatTaskId(work.taskId._id)}
                            className="px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-medium flex items-center gap-1"
                          >
                            <MessageSquare size={14} />
                            Chat
                          </button>
                          <button className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Eye size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No work in progress yet</p>
                </div>
              )}
            </div>
          )}

          {/* Pending Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CheckCircle size={24} />
                Pending Reviews ({stats.pendingReviews})
              </h2>
              {pendingReviews.length > 0 ? (
                <div className="space-y-4">
                  {pendingReviews.map(review => (
                    <div key={review._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-800">{review.taskId?.title || 'Task'}</h3>
                        <p className="text-sm text-gray-600 mt-1">Student: {review.studentId?.name || 'Student'}</p>
                      </div>

                      {review.githubUrl && (
                        <div className="mb-3 p-3 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs text-gray-600 font-medium uppercase mb-1">GitHub Repository</p>
                          <a 
                            href={review.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline break-all flex items-center gap-2"
                          >
                            <Github size={16} />
                            {review.githubUrl}
                          </a>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Submitted: {new Date(review.submittedAt).toLocaleDateString()}</span>
                        <button 
                          onClick={() => setCurrentPage('mentor-evaluation')}
                          className="px-4 py-1 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm font-medium"
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No pending reviews</p>
                </div>
              )}
            </div>
          )}

          {/* Video Calls Tab */}
          {activeTab === 'calls' && (
            <div>
              {ongoingCall ? (
                // Active Call Interface - Simple & Clean
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-8">
                  <div className="text-center mb-8">
                    <div className="w-24 h-24 rounded-full bg-purple-200 mx-auto mb-4 flex items-center justify-center">
                      <Video size={48} className="text-purple-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">{ongoingCall.studentName || 'Student'}</h2>
                    <p className="text-gray-600 mt-2">{ongoingCall.taskName || 'Task Discussion'}</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                      <span className="text-green-700 font-semibold">Call in Progress</span>
                    </div>
                  </div>

                  {/* Call Controls */}
                  <div className="flex gap-4 justify-center mb-8">
                    <button className="p-4 bg-gray-600 text-white rounded-full hover:bg-gray-700 transition-all" title="Mute/Unmute">
                      <MessageCircle size={24} />
                    </button>
                    <button className="p-4 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-all" title="Video On/Off">
                      <Video size={24} />
                    </button>
                    <button className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all" title="Share Screen">
                      <Eye size={24} />
                    </button>
                    <button 
                      onClick={handleEndCall}
                      className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-all"
                      title="End Call"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Call Info */}
                  <div className="bg-white rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-gray-600 font-medium uppercase mb-2">Call Details</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student:</span>
                        <span className="font-semibold text-gray-800">{ongoingCall.studentName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Task:</span>
                        <span className="font-semibold text-gray-800">{ongoingCall.taskName || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Topic:</span>
                        <span className="font-semibold text-gray-800">{ongoingCall.topic || 'General Help'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : videoCallRequests.length > 0 ? (
                // Incoming Call Requests - Simple & Prominent
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Video size={28} className="text-purple-600" />
                    Video Call Requests ({videoCallRequests.length})
                  </h2>

                  {videoCallRequests.map(request => (
                    <div
                      key={request._id}
                      className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Student Avatar & Name */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-purple-300 flex items-center justify-center">
                              <Users size={24} className="text-purple-700" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-800 text-lg">{request.studentName || 'Student'}</h3>
                              <p className="text-sm text-gray-600">{request.studentEmail || 'email@example.com'}</p>
                            </div>
                          </div>

                          {/* Request Details */}
                          <div className="bg-white rounded-lg p-3 mb-4 space-y-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase">Task</p>
                              <p className="text-gray-800 font-medium">{request.taskName || 'Task Discussion'}</p>
                            </div>
                            {request.topic && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase">Topic</p>
                                <p className="text-gray-800">{request.topic}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase">Requested</p>
                              <p className="text-gray-800">{new Date(request.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        {/* Accept/Decline Buttons */}
                        <div className="flex flex-col gap-3 min-w-max">
                          <button
                            onClick={() => handleAcceptVideoCall(request)}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold flex items-center gap-2 transition-all whitespace-nowrap"
                          >
                            <Video size={18} />
                            Accept Call
                          </button>
                          <button
                            onClick={() => handleDeclineVideoCall(request._id)}
                            className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-bold transition-all whitespace-nowrap"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // No Calls
                <div className="text-center py-16">
                  <Video size={64} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 text-xl font-medium">No video call requests</p>
                  <p className="text-gray-400 mt-2">Students will request calls here when they need help</p>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Bell size={24} />
                All Notifications ({notifications.length})
              </h2>
              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <div 
                      key={notification._id} 
                      className={`border rounded-lg p-4 flex items-start gap-4 ${
                        notification.isRead ? 'bg-white opacity-75' : getNotificationColor(notification.type)
                      }`}
                    >
                      <div className="flex-shrink-0 pt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                            <p className="text-sm text-gray-700 mt-1">{notification.message}</p>
                          </div>
                          {!notification.isRead && (
                            <span className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2"></span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-xs text-gray-500">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                          {notification.type === 'video_request' && (
                            <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                              Accept Call
                            </button>
                          )}
                          {notification.type === 'task_completion' && (
                            <button className="text-xs text-green-600 hover:text-green-700 font-medium">
                              Review Work
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No notifications yet</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Quick Actions Footer */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button 
              onClick={() => setCurrentPage('mentor-task-create')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 text-left transition-colors"
            >
              <p className="font-semibold text-gray-800">Create New Task</p>
              <p className="text-sm text-gray-600 mt-1">Post a new project for students</p>
            </button>
            
            <button 
              onClick={() => setActiveTab('reviews')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 text-left transition-colors"
            >
              <p className="font-semibold text-gray-800">Review Submissions</p>
              <p className="text-sm text-gray-600 mt-1">Evaluate pending work</p>
            </button>
            
            <button 
              onClick={() => setCurrentPage('mentor-profile')}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 text-left transition-colors"
            >
              <p className="font-semibold text-gray-800">Edit Profile</p>
              <p className="text-sm text-gray-600 mt-1">Update your information</p>
            </button>
          </div>
        </div>
      </div>

      {/* Global Task Chat Overlay */}
      {activeChatTaskId && (
        <TaskChat taskId={activeChatTaskId} userData={userData} />
      )}
    </div>
  );
}

export default MentorDashboardEnhanced;
