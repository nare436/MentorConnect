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
    setSelectedTask(task);
    setTaskDetailTab('overview');
    setIsLoadingDetails(true);
    try {
      const response = await getMentorTaskDetails(task._id);
      if (response.success) {
        setTaskDetails(response);
      }
    } catch (err) {
      setError('Failed to load task details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const closeTaskDetail = () => {
    setSelectedTask(null);
    setTaskDetails(null);
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

  // ========== INDIVIDUAL TASK DETAIL VIEW ==========
  if (selectedTask) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button onClick={closeTaskDetail} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </button>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError('')}><X size={18} /></button>
            </div>
          )}

          {/* Task Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/30 p-6 mb-6 transition-colors">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{selectedTask.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedTask.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedTask.difficulty === 'Hard' ? 'bg-red-100 text-red-800'
                    : selectedTask.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                  }`}>{selectedTask.difficulty}</span>
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Trophy size={14} className="text-yellow-500" /> {selectedTask.totalPoints || 100} pts
                  </span>
                  <span className={`text-sm flex items-center gap-1 ${isDeadlinePassed(selectedTask.deadline) ? 'text-red-600' : 'text-gray-600'}`}>
                    <Clock size={14} /> Deadline: {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : 'None'}
                    {isDeadlinePassed(selectedTask.deadline) && ' (Passed)'}
                  </span>
                </div>
              </div>

              {/* Application Toggle */}
              <div className="flex flex-col gap-2 items-end">
                <button
                  onClick={() => handleToggleApplications(selectedTask._id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    selectedTask.acceptingApplications !== false
                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {selectedTask.acceptingApplications !== false ? <Unlock size={16} /> : <Lock size={16} />}
                  {selectedTask.acceptingApplications !== false ? 'Applications Open' : 'Applications Closed'}
                </button>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedTask.status === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>{selectedTask.status}</span>
              </div>
            </div>
          </div>

          {/* Task Stats */}
          {taskDetails && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 text-center transition-colors">
                <p className="text-2xl font-bold text-yellow-600">{taskDetails.pendingApplications?.length || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Requests</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 text-center transition-colors">
                <p className="text-2xl font-bold text-blue-600">{taskDetails.inProgress?.length || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 text-center transition-colors">
                <p className="text-2xl font-bold text-orange-600">{taskDetails.submitted?.length || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm dark:shadow-gray-900/30 text-center transition-colors">
                <p className="text-2xl font-bold text-green-600">{taskDetails.reviewed?.length || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reviewed</p>
              </div>
            </div>
          )}

          {/* Sub-Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg px-4 py-3 overflow-x-auto transition-colors">
            {['overview', 'requests', 'students', 'chat', 'notifications'].map(tab => (
              <button
                key={tab}
                onClick={() => setTaskDetailTab(tab)}
                className={`pb-2 px-4 font-medium border-b-2 transition-colors whitespace-nowrap text-sm ${
                  taskDetailTab === tab ? 'border-gray-800 dark:border-gray-300 text-gray-800 dark:text-gray-100' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'overview' ? 'Overview' 
                  : tab === 'requests' ? `Requests (${taskDetails?.pendingApplications?.length || 0})`
                  : tab === 'students' ? `Students (${taskDetails?.totalStudents || 0})`
                  : tab === 'chat' ? 'Chat'
                  : 'Notifications'}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm dark:shadow-gray-900/30 p-6 transition-colors">
            {isLoadingDetails ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : (
              <>
                {/* Overview */}
                {taskDetailTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Rubric */}
                    {selectedTask.rubric && selectedTask.rubric.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Evaluation Rubric</h3>
                        <div className="space-y-2">
                          {selectedTask.rubric.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-700">{item.criteria}</span>
                              <span className="font-semibold text-gray-800">{item.points} pts</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Tags */}
                    {selectedTask.tags && selectedTask.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedTask.tags.map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{tag}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* All Students Summary */}
                    {taskDetails && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Activity Summary</h3>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            ...taskDetails.inProgress?.map(s => ({ ...s, _status: 'in-progress' })) || [],
                            ...taskDetails.submitted?.map(s => ({ ...s, _status: 'submitted' })) || [],
                            ...taskDetails.reviewed?.map(s => ({ ...s, _status: 'reviewed' })) || []
                          ].map((sub, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {sub.studentId?.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm truncate">{sub.studentId?.name}</p>
                                <p className="text-xs text-gray-500">{sub.studentId?.email}</p>
                              </div>
                              {getStatusBadge(sub._status || sub.status)}
                              {sub.totalScore > 0 && (
                                <span className="text-xs font-semibold text-yellow-600 flex items-center gap-1">
                                  <Star size={12} /> {sub.totalScore}
                                </span>
                              )}
                            </div>
                          ))}
                          {(!taskDetails.inProgress?.length && !taskDetails.submitted?.length && !taskDetails.reviewed?.length) && (
                            <p className="col-span-2 text-gray-500 text-center py-4">No students working on this task yet</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Requests */}
                {taskDetailTab === 'requests' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Pending Requests</h3>
                      <button
                        onClick={() => handleToggleApplications(selectedTask._id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${
                          selectedTask.acceptingApplications !== false ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {selectedTask.acceptingApplications !== false ? <><Lock size={14} /> Close Applications</> : <><Unlock size={14} /> Open Applications</>}
                      </button>
                    </div>
                    {taskDetails?.pendingApplications?.length > 0 ? (
                      <div className="space-y-4">
                        {taskDetails.pendingApplications.map(app => (
                          <div key={app._id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                                    {app.studentId?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <button onClick={() => setCurrentPage(`/profile/${app.studentId?._id}`)} className="font-semibold text-gray-800 hover:text-blue-600 hover:underline">
                                      {app.studentId?.name}
                                    </button>
                                    <p className="text-sm text-gray-500">{app.studentId?.email}</p>
                                  </div>
                                </div>
                                {app.applicantGithubUrl && (
                                  <a href={app.applicantGithubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-2">
                                    <Github size={14} /> {app.applicantGithubUrl}
                                  </a>
                                )}
                                {app.message && (
                                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-700 italic">"{app.message}"</div>
                                )}
                                {app.applyAs === 'team' && app.teamId && (
                                  <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800">
                                    Team: {app.teamId.name} ({app.teamId.members?.length} members)
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleApprove(app._id)} className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 text-sm font-medium">
                                  <CheckCircle size={16} /> Approve
                                </button>
                                <button onClick={() => handleReject(app._id)} className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm font-medium">
                                  <XCircle size={16} /> Reject
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No pending requests</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Students */}
                {taskDetailTab === 'students' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">All Students</h3>
                    {[
                      { title: 'In Progress', items: taskDetails?.inProgress || [], color: 'blue' },
                      { title: 'Submitted (Pending Review)', items: taskDetails?.submitted || [], color: 'orange' },
                      { title: 'Reviewed', items: taskDetails?.reviewed || [], color: 'green' }
                    ].map(group => group.items.length > 0 && (
                      <div key={group.title}>
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">{group.title} ({group.items.length})</h4>
                        <div className="space-y-2">
                          {group.items.map(sub => (
                            <div key={sub._id} className={`border-l-4 border-${group.color}-400 bg-${group.color}-50 rounded-r-lg p-4`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {sub.studentId?.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <button onClick={() => setCurrentPage(`/profile/${sub.studentId?._id}`)} className="font-medium text-gray-800 hover:text-blue-600 hover:underline">
                                      {sub.studentId?.name}
                                    </button>
                                    <p className="text-xs text-gray-500">{sub.studentId?.email}</p>
                                    {sub.studentId?.skills?.length > 0 && (
                                      <div className="flex gap-1 mt-1">
                                        {sub.studentId.skills.slice(0, 3).map((s, i) => (
                                          <span key={i} className="px-1.5 py-0.5 bg-white text-gray-600 rounded text-xs">{s}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {sub.githubUrl && (
                                    <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700">
                                      <Github size={18} />
                                    </a>
                                  )}
                                  {sub.totalScore > 0 && (
                                    <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
                                      <Star size={14} /> {sub.totalScore}
                                    </span>
                                  )}
                                  {group.title.includes('Submitted') && (
                                    <button onClick={() => setCurrentPage('mentor-evaluation')} className="px-3 py-1 bg-gray-800 text-white rounded text-xs hover:bg-gray-700">
                                      Review
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {(!taskDetails?.inProgress?.length && !taskDetails?.submitted?.length && !taskDetails?.reviewed?.length) && (
                      <div className="text-center py-8">
                        <Users size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No students yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Chat */}
                {taskDetailTab === 'chat' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Chat</h3>
                    <TaskChat taskId={selectedTask._id} userData={userData} inline={true} />
                  </div>
                )}

                {/* Notifications */}
                {taskDetailTab === 'notifications' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
                      {stats.unreadNotifications > 0 && (
                        <button onClick={handleMarkAllAsRead} className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded text-xs text-gray-700 hover:bg-gray-200 font-medium">
                          <CheckCheck size={14} /> Mark All Read
                        </button>
                      )}
                    </div>
                    {notifications.length > 0 ? (
                      <div className="space-y-3">
                        {notifications.map(n => (
                          <div key={n._id} className={`border rounded-lg p-3 flex items-start gap-3 ${n.isRead ? 'bg-white opacity-70' : 'bg-blue-50 border-blue-200'}`}>
                            <Bell size={16} className="text-gray-500 mt-1 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800">{n.message}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</span>
                                {!n.isRead && (
                                  <button onClick={() => handleMarkAsRead(n._id)} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    <CheckCheck size={12} /> Read
                                  </button>
                                )}
                              </div>
                            </div>
                            {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Bell size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-500">No notifications</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {activeChatTaskId && (
          <TaskChat taskId={activeChatTaskId} userData={userData} onClose={() => setActiveChatTaskId(null)} />
        )}
      </div>
    );
  }

  // ========== MAIN DASHBOARD VIEW ==========
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Welcome back, {userData?.name || 'Mentor'}!</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your tasks, review applications, and monitor student progress</p>
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

              {tasks.length > 0 ? (
                <div className="space-y-4">
                  {tasks.map(task => (
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
                <div className="text-center py-12">
                  <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">You haven't created any tasks yet</p>
                  <button onClick={() => setCurrentPage('mentor-create-task')} className="mt-4 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
                    Create Your First Task
                  </button>
                </div>
              )}
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
                              <button onClick={() => setCurrentPage(`/profile/${task.mentorId?._id}`)} className="text-blue-600 hover:underline font-medium">
                                {task.mentorId?.name || 'Mentor'}
                              </button>
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
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                        idx === 0 ? 'bg-yellow-400 text-yellow-900' : idx === 1 ? 'bg-gray-300 text-gray-800' : idx === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-600'
                      }`}>{idx + 1}</div>
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
