import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Trophy, Clock, Lock, Unlock, Users, Github, CheckCircle, XCircle, Star, CheckCheck, Bell } from 'lucide-react';
import { getMentorTaskDetails, approveApplication, rejectApplication, toggleTaskApplications } from '../utils/api';
import TaskChat from './TaskChat';

function MentorTaskDetailPage({ setCurrentPage, userData }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [taskDetailTab, setTaskDetailTab] = useState('overview');
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [error, setError] = useState('');

  // Added notifications to match original
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({ unreadNotifications: 0 });

  useEffect(() => {
    if (id) {
      fetchTaskDetails();
    }
  }, [id]);

  const fetchTaskDetails = async () => {
    setIsLoadingDetails(true);
    setError('');
    try {
      const response = await getMentorTaskDetails(id);
      if (response.success) {
        setTaskDetails(response);
        setSelectedTask(response.task);
      } else {
        setError('Failed to load task details');
      }
    } catch (err) {
      setError('Failed to load task details');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleApprove = async (applicationId) => {
    try {
      const response = await approveApplication(applicationId);
      if (response.success) {
        alert('Application approved!');
        fetchTaskDetails(); // Refresh
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
        fetchTaskDetails();
      }
    } catch (err) {
      setError(err.message || 'Failed to reject');
    }
  };

  const handleToggleApplications = async (taskId) => {
    try {
      const response = await toggleTaskApplications(taskId);
      if (response.success) {
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

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'in-progress': return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">In Progress</span>;
      case 'submitted': return <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded text-xs font-medium">Submitted</span>;
      case 'reviewed': return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded text-xs font-medium">Reviewed</span>;
      case 'pending_approval': return <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded text-xs font-medium">Pending</span>;
      default: return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 rounded text-xs font-medium">{status}</span>;
    }
  };

  if (isLoadingDetails && !selectedTask) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 dark:border-gray-300 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!selectedTask) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>Task not found.</p>
          <button onClick={() => navigate('/mentor/dashboard')} className="mt-4 text-blue-600 hover:underline">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button onClick={() => navigate('/mentor/dashboard')} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mb-6 transition-colors">
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded flex items-center justify-between">
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
                  selectedTask.difficulty === 'Hard' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                  : selectedTask.difficulty === 'Medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                }`}>{selectedTask.difficulty}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                  <Trophy size={14} className="text-yellow-500" /> {selectedTask.totalPoints || 100} pts
                </span>
                <span className={`text-sm flex items-center gap-1 ${isDeadlinePassed(selectedTask.deadline) ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
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
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                }`}
              >
                {selectedTask.acceptingApplications !== false ? <Unlock size={16} /> : <Lock size={16} />}
                {selectedTask.acceptingApplications !== false ? 'Applications Open' : 'Applications Closed'}
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                selectedTask.status === 'active' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
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
          {['overview', 'requests', 'students'].map(tab => (
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
                : tab}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-sm dark:shadow-gray-900/30 p-6 transition-colors">
          {isLoadingDetails ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800 dark:border-gray-300 mx-auto mb-3"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading...</p>
            </div>
          ) : (
            <>
              {/* Overview */}
              {taskDetailTab === 'overview' && (
                <div className="space-y-6">
                  {/* Rubric */}
                  {selectedTask.rubric && selectedTask.rubric.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Evaluation Rubric</h3>
                      <div className="space-y-2">
                        {selectedTask.rubric.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="text-gray-700 dark:text-gray-300">{item.criteria}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.points} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Tags */}
                  {selectedTask.tags && selectedTask.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTask.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* All Students Summary */}
                  {taskDetails && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Activity Summary</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          ...taskDetails.inProgress?.map(s => ({ ...s, _status: 'in-progress' })) || [],
                          ...taskDetails.submitted?.map(s => ({ ...s, _status: 'submitted' })) || [],
                          ...taskDetails.reviewed?.map(s => ({ ...s, _status: 'reviewed' })) || []
                        ].map((sub, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                              {sub.studentId?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{sub.studentId?.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{sub.studentId?.email}</p>
                            </div>
                            {getStatusBadge(sub._status || sub.status)}
                            {sub.totalScore > 0 && (
                              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                                <Star size={12} /> {sub.totalScore}
                              </span>
                            )}
                          </div>
                        ))}
                        {(!taskDetails.inProgress?.length && !taskDetails.submitted?.length && !taskDetails.reviewed?.length) && (
                          <p className="col-span-2 text-gray-500 dark:text-gray-400 text-center py-4">No students working on this task yet</p>
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
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Pending Requests</h3>
                    <button
                      onClick={() => handleToggleApplications(selectedTask._id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium ${
                        selectedTask.acceptingApplications !== false ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
                      }`}
                    >
                      {selectedTask.acceptingApplications !== false ? <><Lock size={14} /> Close Applications</> : <><Unlock size={14} /> Open Applications</>}
                    </button>
                  </div>
                  {taskDetails?.pendingApplications?.length > 0 ? (
                    <div className="space-y-4">
                      {taskDetails.pendingApplications.map(app => (
                        <div key={app._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                {app.studentId?.profilePicture ? (
                                  <img src={app.studentId.profilePicture} alt={app.studentId.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                                    {app.studentId?.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <button onClick={() => setCurrentPage(`/profile/${app.studentId?._id}`)} className="font-semibold text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                                    {app.studentId?.name}
                                  </button>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{app.studentId?.email}</p>
                                </div>
                              </div>
                              {app.applicantGithubUrl && (
                                <a href={app.applicantGithubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mt-2">
                                  <Github size={14} /> {app.applicantGithubUrl}
                                </a>
                              )}
                              {app.message && (
                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-sm text-gray-700 dark:text-gray-300 italic">"{app.message}"</div>
                              )}
                              {app.applyAs === 'team' && app.teamId && (
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">
                                    Team: {app.teamId.name} ({app.teamId.members?.length} members)
                                  </p>
                                  <div className="flex flex-col gap-2">
                                    {app.teamId.members?.map(member => (
                                      <div key={member._id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2">
                                          {member.profilePicture ? (
                                            <img src={member.profilePicture} alt={member.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                          ) : (
                                            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">
                                              {member.name?.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                          <div>
                                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                          </div>
                                        </div>
                                        <button 
                                          onClick={() => setCurrentPage(`/profile/${member._id}`)}
                                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                          View Profile
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleApprove(app._id)} className="flex items-center gap-1 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/50 text-sm font-medium">
                                <CheckCircle size={16} /> Approve
                              </button>
                              <button onClick={() => handleReject(app._id)} className="flex items-center gap-1 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium">
                                <XCircle size={16} /> Reject
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
                    </div>
                  )}
                </div>
              )}

              {/* Students */}
              {taskDetailTab === 'students' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">All Students</h3>
                  {[
                    { title: 'In Progress', items: taskDetails?.inProgress || [], color: 'blue' },
                    { title: 'Submitted (Pending Review)', items: taskDetails?.submitted || [], color: 'orange' },
                    { title: 'Reviewed', items: taskDetails?.reviewed || [], color: 'green' }
                  ].map(group => group.items.length > 0 && (
                    <div key={group.title}>
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">{group.title} ({group.items.length})</h4>
                      <div className="space-y-2">
                        {group.items.map(sub => (
                          <div key={sub._id} className={`border-l-4 border-${group.color}-400 bg-${group.color}-50 dark:bg-${group.color}-900/10 rounded-r-lg p-4`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {sub.studentId?.profilePicture ? (
                                  <img src={sub.studentId.profilePicture} alt={sub.studentId.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-800 dark:bg-gray-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                    {sub.studentId?.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <button onClick={() => setCurrentPage(`/profile/${sub.studentId?._id}`)} className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline">
                                    {sub.studentId?.name}
                                  </button>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{sub.studentId?.email}</p>
                                  {sub.studentId?.skills?.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                      {sub.studentId.skills.slice(0, 3).map((s, i) => (
                                        <span key={i} className="px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">{s}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {sub.githubUrl && (
                                  <a href={sub.githubUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                                    <Github size={18} />
                                  </a>
                                )}
                                {sub.totalScore > 0 && (
                                  <span className="flex items-center gap-1 text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                                    <Star size={14} /> {sub.totalScore}
                                  </span>
                                )}
                                {group.title.includes('Submitted') && (
                                  <button onClick={() => navigate('/mentor/evaluation', { state: { submissionId: sub._id } })} className="px-3 py-1 bg-gray-800 dark:bg-gray-700 text-white rounded text-xs hover:bg-gray-700 dark:hover:bg-gray-600">
                                    Review
                                  </button>
                                )}
                              </div>
                            </div>
                            
                            {/* Team Members List */}
                            {sub.applyAs === 'team' && sub.teamId && (
                              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                  Team: {sub.teamId.name} ({sub.teamId.members?.length} members)
                                </p>
                                <div className="flex flex-col gap-2">
                                  {sub.teamId.members?.map(member => (
                                    <div key={member._id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700">
                                      <div className="flex items-center gap-2">
                                        {member.profilePicture ? (
                                          <img src={member.profilePicture} alt={member.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                        ) : (
                                          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 shrink-0">
                                            {member.name?.charAt(0).toUpperCase()}
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{member.name}</p>
                                          <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={() => setCurrentPage(`/profile/${member._id}`)}
                                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                      >
                                        View Profile
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {(!taskDetails?.inProgress?.length && !taskDetails?.submitted?.length && !taskDetails?.reviewed?.length) && (
                    <div className="text-center py-8">
                      <Users size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">No students yet</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Always render TaskChat component at the bottom on task details */}
      {selectedTask && (
        <TaskChat taskId={selectedTask._id} userData={userData} />
      )}
    </div>
  );
}

export default MentorTaskDetailPage;
