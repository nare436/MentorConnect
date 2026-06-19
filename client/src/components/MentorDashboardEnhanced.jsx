import { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, XCircle, Eye, Send, Bell, Github, AlertCircle, MessageCircle, X, MessageSquare, Trophy, Star, ChevronDown, ChevronUp, CheckCheck, Mail, BookOpen, ArrowLeft, Lock, Unlock, Search, ExternalLink } from 'lucide-react';
import { getMentorTasks, getNotifications, getMentorStudents, getLeaderboard, markNotificationRead, markAllNotificationsRead, getMentorTaskDetails, approveApplication, rejectApplication, toggleTaskApplications, getExploreTasks } from '../utils/api';
import TaskChat from './TaskChat';

function MentorDashboardEnhanced({ setCurrentPage, userData }) {
  const [tasks, setTasks] = useState([]);
  const [activeChatTaskId, setActiveChatTaskId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('my-tasks');
  const [leaderboard, setLeaderboard] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);

  // Individual task drill-down state
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [taskDetailTab, setTaskDetailTab] = useState('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Explore state
  const [exploreTasks, setExploreTasks] = useState([]);
  const [exploreSearch, setExploreSearch] = useState('');
  const [isLoadingExplore, setIsLoadingExplore] = useState(false);

  const [stats, setStats] = useState({
    activeTasks: 0,
    totalStudents: 0,
    unreadNotifications: 0
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const tasksResponse = await getMentorTasks();
      if (tasksResponse.success) {
        setTasks(tasksResponse.tasks || []);
        setStats(prev => ({
          ...prev,
          activeTasks: (tasksResponse.tasks || []).filter(t => t.status === 'active').length
        }));
      }

      try {
        const studentsResponse = await getMentorStudents();
        if (studentsResponse.success) {
          setTotalStudents(studentsResponse.totalStudents || 0);
          setStats(prev => ({ ...prev, totalStudents: studentsResponse.totalStudents || 0 }));
        }
      } catch (e) { /* ignore */ }

      try {
        const leaderboardResponse = await getLeaderboard();
        if (leaderboardResponse.success) {
          setLeaderboard(leaderboardResponse.leaderboard || []);
        }
      } catch (e) { /* ignore */ }

      const notificationsResponse = await getNotifications();
      if (notificationsResponse.success) {
        const allNotifications = notificationsResponse.notifications || [];
        setNotifications(allNotifications);
        setStats(prev => ({ ...prev, unreadNotifications: allNotifications.filter(n => !n.isRead).length }));
      }
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Open individual task detail
  const openTaskDetail = async (task) => {
    setCurrentPage(`/mentor/task/${task._id}`);
  };

  const handleApprove = async (applicationId) => {
    try {
      const response = await approveApplication(applicationId);
      if (response.success) {
        alert('Application approved!');
        openTaskDetail(selectedTask); // Refresh
      }
    } catch (err) {
      setError(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (applicationId) => {
    if (!window.confirm('Reject this application?')) return;
    try {
      const response = await rejectApplication(applicationId);
      if (response.success) {
        alert('Application rejected');
        openTaskDetail(selectedTask);
      }
    } catch (err) {
      setError(err.message || 'Failed to reject');
    }
  };

  const handleToggleApplications = async (taskId) => {
    try {
      const response = await toggleTaskApplications(taskId);
      if (response.success) {
        // Update local task data
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, acceptingApplications: response.acceptingApplications } : t));
        if (selectedTask && selectedTask._id === taskId) {
          setSelectedTask(prev => ({ ...prev, acceptingApplications: response.acceptingApplications }));
          if (taskDetails) {
            setTaskDetails(prev => ({
              ...prev,
              task: { ...prev.task, acceptingApplications: response.acceptingApplications }
            }));
          }
        }
      }
    } catch (err) {
      setError('Failed to toggle applications');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      setStats(prev => ({ ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) }));
    } catch (err) { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setStats(prev => ({ ...prev, unreadNotifications: 0 }));
    } catch (err) { /* ignore */ }
  };

  const fetchExploreTasks = async () => {
    setIsLoadingExplore(true);
    try {
      const response = await getExploreTasks();
      if (response.success) {
        setExploreTasks(response.tasks || []);
      }
    } catch (err) {
      setError('Failed to load explore tasks');
    } finally {
      setIsLoadingExplore(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in-progress': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">In Progress</span>;
      case 'submitted': return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Submitted</span>;
      case 'reviewed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Reviewed</span>;
      case 'pending_approval': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Pending</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">{status}</span>;
    }
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ========== MAIN DASHBOARD VIEW ==========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          {userData?.profilePicture ? (
            <img 
              src={userData.profilePicture} 
              alt={userData.name} 
              className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-800 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-sm">
              {(userData?.name || 'M').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome back, {userData?.name || 'Mentor'}!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your tasks, review applications, and monitor student progress</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')}><X size={18} /></button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <p className="text-gray-600 dark:text-gray-400 text-sm">My Tasks</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100 mt-1">{tasks.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Active Tasks</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{stats.activeTasks}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Students</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{totalStudents}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 transition-colors">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Notifications</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-2xl font-bold text-red-600">{stats.unreadNotifications}</p>
              <Bell size={20} className="text-red-600" />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg px-6 py-4 overflow-x-auto transition-colors">
          {[
            { key: 'my-tasks', label: 'My Tasks' },
            { key: 'explore', label: 'Explore Tasks' },
            { key: 'leaderboard', label: 'Leaderboard' },
            { key: 'notifications', label: 'Notifications' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === 'explore' && exploreTasks.length === 0) fetchExploreTasks();
              }}
              className={`pb-2 px-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key ? 'border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-100' : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.key === 'notifications' && stats.unreadNotifications > 0 && (
                <span className="ml-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5">{stats.unreadNotifications}</span>
              )}
              {tab.key === 'my-tasks' && (
                <span className="ml-2 text-xs text-gray-400">({tasks.length})</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm dark:shadow-gray-900/30 p-6 transition-colors">

          {/* My Tasks Tab */}
          {activeTab === 'my-tasks' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">My Tasks</h2>
                <button
                  onClick={() => setCurrentPage('mentor-create-task')}
                  className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium transition-colors"
                >
                  + Create New Task
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">No tasks yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Create your first task to start mentoring students</p>
                  <button
                    onClick={() => setCurrentPage('mentor-create-task')}
                    className="px-4 py-2 bg-gray-800 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-sm font-medium"
                  >
                    Create Task
                  </button>
                </div>
              ) : (() => {
                const activeTasksList = tasks.filter(t => !isDeadlinePassed(t.deadline) && t.acceptingApplications !== false && t.status === 'active');
                const closedTasksList = tasks.filter(t => isDeadlinePassed(t.deadline) || t.acceptingApplications === false || t.status !== 'active');
                
                return (
                  <div className="space-y-8">
                    {/* Active Tasks */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b pb-2">Active Tasks ({activeTasksList.length})</h3>
                      {activeTasksList.length > 0 ? (
                        <div className="space-y-4">
                          {activeTasksList.map(task => (
                    <div key={task._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all cursor-pointer"
                      onClick={() => openTaskDetail(task)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg">{task.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              task.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                            }`}>{task.status}</span>
                            {task.acceptingApplications === false && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                                <Lock size={10} /> Closed
                              </span>
                            )}
                            {isDeadlinePassed(task.deadline) && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Deadline Passed</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Users size={14} /> {task.applicants || 0} applicants</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> {task.activeTeams || 0} active</span>
                            <span className="flex items-center gap-1"><Trophy size={14} /> {task.totalPoints || 100} pts</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                          </div>
                          {task.tags && task.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {task.tags.map((tag, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleApplications(task._id); }}
                            className={`p-2 rounded-lg transition-colors ${
                              task.acceptingApplications !== false ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title={task.acceptingApplications !== false ? 'Close Applications' : 'Open Applications'}
                          >
                            {task.acceptingApplications !== false ? <Unlock size={18} /> : <Lock size={18} />}
                          </button>
                          <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                            <Eye size={18} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No active tasks.</p>
                      )}
                    </div>
                    
                    {/* Closed Tasks */}
                    {closedTasksList.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 border-b pb-2">Closed / Past Tasks ({closedTasksList.length})</h3>
                        <div className="space-y-4 opacity-80">
                          {closedTasksList.map(task => (
                            <div key={task._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all cursor-pointer bg-gray-50 dark:bg-gray-800/50"
                              onClick={() => openTaskDetail(task)}>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-gray-600 dark:text-gray-300 text-lg line-through decoration-gray-400">{task.title}</h3>
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      task.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>{task.status}</span>
                                    {task.acceptingApplications === false && (
                                      <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs flex items-center gap-1">
                                        <Lock size={10} /> Closed
                                      </span>
                                    )}
                                    {isDeadlinePassed(task.deadline) && (
                                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">Deadline Passed</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Users size={14} /> {task.applicants || 0} applicants</span>
                                    <span className="flex items-center gap-1"><Clock size={14} /> {task.activeTeams || 0} active</span>
                                    <span className="flex items-center gap-1"><Trophy size={14} /> {task.totalPoints || 100} pts</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleApplications(task._id); }}
                                    className={`p-2 rounded-lg transition-colors ${
                                      task.acceptingApplications !== false ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'
                                    }`}
                                    title={task.acceptingApplications !== false ? 'Close Applications' : 'Open Applications'}
                                  >
                                    {task.acceptingApplications !== false ? <Unlock size={18} /> : <Lock size={18} />}
                                  </button>
                                  <div className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                                    <Eye size={18} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Explore Tab */}
          {activeTab === 'explore' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Explore Other Mentors' Tasks</h2>
              </div>
              
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  value={exploreSearch}
                  onChange={(e) => setExploreSearch(e.target.value)}
                  placeholder="Search tasks by title, description, or tags..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
                />
              </div>

              {isLoadingExplore ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-3"></div>
                  <p className="text-gray-500">Loading tasks...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exploreTasks
                    .filter(t => t.mentorId?._id !== userData?.id) // Exclude own tasks
                    .filter(t => {
                      if (!exploreSearch) return true;
                      const q = exploreSearch.toLowerCase();
                      return t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.tags?.some(tag => tag.toLowerCase().includes(q));
                    })
                    .map(task => (
                      <div key={task._id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">{task.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              By{' '}
                              <span className="inline-flex items-center gap-1.5 ml-1">
                                {task.mentorId?.profilePicture ? (
                                  <img src={task.mentorId.profilePicture} alt={task.mentorId.name} className="w-5 h-5 rounded-full object-cover grayscale opacity-70" />
                                ) : null}
                                <button onClick={() => setCurrentPage(`/profile/${task.mentorId?._id}`)} className="text-blue-600 hover:underline font-medium">
                                  {task.mentorId?.name || 'Mentor'}
                                </button>
                              </span>
                              {task.mentorId?.company && <span className="text-gray-400"> • {task.mentorId.company}</span>}
                            </p>
                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{task.description}</p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                task.difficulty === 'Hard' ? 'bg-red-100 text-red-800'
                                : task.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                              }`}>{task.difficulty}</span>
                              <span className="flex items-center gap-1"><Trophy size={14} /> {task.totalPoints || 100} pts</span>
                              <span className="flex items-center gap-1"><Clock size={14} /> {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                              <span className="flex items-center gap-1"><Users size={14} /> {task.applicants || 0} applicants</span>
                            </div>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {task.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium flex items-center gap-1 ml-4 shrink-0">
                            <Eye size={14} /> View Only
                          </span>
                        </div>
                      </div>
                    ))}
                  {exploreTasks.filter(t => t.mentorId?._id !== userData?.id).length === 0 && !isLoadingExplore && (
                    <div className="text-center py-8">
                      <Search size={40} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500">No other tasks found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Trophy size={24} className="text-yellow-500" />
                Student Leaderboard
              </h2>
              {leaderboard.length > 0 ? (
                <div className="space-y-2">
                  {leaderboard.map((student, idx) => (
                    <div key={student._id} className={`flex items-center gap-4 p-4 rounded-lg transition-all ${idx < 3 ? 'bg-gray-50 shadow-sm' : 'bg-white'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-600'
                        }`}>{idx + 1}</div>
                        {student.profilePicture ? (
                          <img src={student.profilePicture} alt={student.name} className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <button onClick={() => setCurrentPage(`/profile/${student._id}`)} className="font-semibold text-gray-800 hover:text-blue-600 hover:underline">
                          {student.name}
                        </button>
                        <p className="text-xs text-gray-500">{student.education || student.email}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600">{student.tasksCompleted} tasks</span>
                        <span className="font-bold text-gray-800 flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {student.totalPoints} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No leaderboard data yet</p>
                </div>
              )}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Bell size={24} /> Notifications
                </h2>
                {stats.unreadNotifications > 0 && (
                  <button onClick={handleMarkAllAsRead} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    <CheckCheck size={16} /> Mark All Read
                  </button>
                )}
              </div>
              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map(n => (
                    <div key={n._id} className={`border rounded-lg p-4 flex items-start gap-3 ${n.isRead ? 'bg-white opacity-70' : 'bg-blue-50 border-blue-200'}`}>
                      <Bell size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{n.message}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                          {!n.isRead && (
                            <button onClick={() => handleMarkAsRead(n._id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                              <CheckCheck size={12} /> Mark Read
                            </button>
                          )}
                        </div>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full mt-2"></span>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No notifications</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <button onClick={() => setCurrentPage('mentor-create-task')} className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 text-left transition-colors">
              <p className="font-semibold text-gray-800">Create New Task</p>
              <p className="text-sm text-gray-600 mt-1">Post a new project for students</p>
            </button>
            <button onClick={() => setCurrentPage('mentor-evaluation')} className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 text-left transition-colors">
              <p className="font-semibold text-gray-800">Review Submissions</p>
              <p className="text-sm text-gray-600 mt-1">Evaluate pending work</p>
            </button>
            <button onClick={() => setCurrentPage('mentor-profile')} className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 text-left transition-colors">
              <p className="font-semibold text-gray-800">Edit Profile</p>
              <p className="text-sm text-gray-600 mt-1">Update your information</p>
            </button>
          </div>
        </div>
      </div>

      {activeChatTaskId && (
        <TaskChat taskId={activeChatTaskId} userData={userData} onClose={() => setActiveChatTaskId(null)} />
      )}
    </div>
  );
}

export default MentorDashboardEnhanced;
