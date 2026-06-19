import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Github, 
  MessageSquare, 
  CheckCircle, 
  User,
  Clock,
  Users,
  FileText,
  Share2,
  Zap
} from 'lucide-react';
import { getTaskById, contactMentor, completeTask } from '../utils/api';
import TaskChat from './TaskChat';
import TeamChat from './TeamChat';

function TaskDetail({ setCurrentPage, userData }) {
  const { id: taskId } = useParams();
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showMentorContact, setShowMentorContact] = useState(false);
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  
  // Form states
  const [contactMessage, setContactMessage] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [repoName, setRepoName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const response = await getTaskById(taskId);
      if (response.success) {
        setTask(response.task);
      }
    } catch (err) {
      setError('Failed to load task details');
      console.error('Task fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContactMentor = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await contactMentor(taskId, {
        message: contactMessage,
        mentorId: task.mentorId?._id || task.mentorId
      });
      
      if (response.success) {
        setSuccess('Message sent to mentor successfully!');
        setContactMessage('');
        setShowMentorContact(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskCompletion = async (e) => {
    e.preventDefault();
    
    if (!repoName.trim() || !repoName.startsWith('http')) {
      setError('Please provide a valid GitHub repository URL');
      return;
    }
    
    setIsSubmitting(true);
    setError('');

    try {
      const response = await completeTask(taskId, {
        notes: completionNotes,
        githubUrl: repoName
      });
      
      if (response.success) {
        setSuccess('Task completion reported successfully!');
        setCompletionNotes('');
        setRepoName('');
        setShowCompletionForm(false);
        fetchTask();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError(err.message || 'Failed to report task completion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubCollaboration = async () => {
    if (!repoName.trim()) {
      setError('Please enter repository name');
      return;
    }
    
    try {
      const githubAuthUrl = `https://github.com/new?name=${encodeURIComponent(repoName)}&description=${encodeURIComponent(task.title)}`;
      window.open(githubAuthUrl, '_blank');
      setSuccess('Opened GitHub. Create a new repository and come back to share the link!');
    } catch (err) {
      setError('Failed to initialize GitHub');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={() => setCurrentPage(userData?.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-100 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 dark:text-gray-300">Task not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <button 
          onClick={() => setCurrentPage(userData?.role === 'mentor' ? '/mentor/dashboard' : '/student/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 dark:text-gray-100 mb-6"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {/* Task Overview Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">{task.title}</h1>
              <p className="text-gray-600 dark:text-gray-300">{task.description}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              task.difficulty === 'Hard' 
                ? 'bg-red-100 text-red-800'
                : task.difficulty === 'Medium'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {task.difficulty || 'Medium'} Difficulty
            </span>
          </div>

          {/* Task Meta Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Mentor</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">
                {task.mentorId?.name || 'Assigned Mentor'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Points</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1">
                {task.totalPoints || 100} points
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Deadline</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 flex items-center gap-2">
                <Clock size={16} />
                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mt-1 flex items-center gap-2">
                <CheckCircle size={16} className="text-blue-600" />
                {task.status || 'Active'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <FileText size={18} className="inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('collaboration')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'collaboration'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Share2 size={18} className="inline mr-2" />
            Collaboration
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <MessageSquare size={18} className="inline mr-2" />
            Task Chat
          </button>
          <button
            onClick={() => setActiveTab('team-chat')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'team-chat'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Team Chat
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Task Details</h2>
                <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-200">
                  <p>{task.description}</p>
                </div>
              </div>

              {task.rubric && task.rubric.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Evaluation Rubric</h3>
                  <div className="space-y-2">
                    {task.rubric.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <span className="text-gray-700 dark:text-gray-200">{item.criteria}</span>
                        <span className="font-semibold text-gray-800 dark:text-gray-100">{item.points} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 dark:text-gray-200 rounded-full text-sm">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowCompletionForm(!showCompletionForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                  >
                    <CheckCircle size={20} />
                    Report Completion
                  </button>
                  <button
                    onClick={() => setShowMentorContact(!showMentorContact)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                  >
                    <MessageSquare size={20} />
                    Contact Mentor
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Collaboration Tab */}
          {activeTab === 'collaboration' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">GitHub Collaboration</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Push your code to GitHub and collaborate with your team members.
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                        Repository Name
                      </label>
                      <input
                        type="text"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        placeholder="my-awesome-project"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                      />
                    </div>
                    
                    <button
                      onClick={handleGithubCollaboration}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      <Github size={20} />
                      Create Repository on GitHub
                    </button>
                  </div>
                </div>

                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
                  <p className="text-sm text-blue-900">
                    <strong>Tip:</strong> Make sure your repository is public so your mentor can review your code. 
                    Add a README.md with project description and setup instructions.
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Team Members</h3>
                <div className="space-y-3">
                  {task.teamMembers && task.teamMembers.length > 0 ? (
                    task.teamMembers.map((member, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="w-10 h-10 bg-gray-800 text-white rounded-full flex items-center justify-center font-bold">
                          {member.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-gray-100">{member.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{member.email}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 dark:text-gray-300">You're working on this task individually</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Tab - Inline */}
          {activeTab === 'chat' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Task Discussion</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Chat with your mentor and other students working on this task</p>
              <TaskChat taskId={taskId} userData={userData} inline={true} />
            </div>
          )}

          {/* Team Chat Tab */}
          {activeTab === 'team-chat' && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Team Communication</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">Connect and collaborate with your team members</p>
              {task.teamMembers && task.teamMembers.length > 1 ? (
                <TeamChat 
                  teamId={task.teamId || task._id} 
                  taskId={taskId} 
                  userData={userData}
                  isOpen={true}
                />
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
                  <Users size={40} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 dark:text-gray-300">Team chat is available when you have team members</p>
                  <p className="text-sm text-gray-500 mt-2">Add team members in the Collaboration tab to start team chat</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Mentor Form */}
        {showMentorContact && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Contact Mentor</h3>
            <form onSubmit={handleContactMentor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Message
                </label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows="4"
                  placeholder="Type your question or concern here..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMentorContact(false);
                    setContactMessage('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Task Completion Form */}
        {showCompletionForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Report Task Completion</h3>
            <form onSubmit={handleTaskCompletion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  GitHub Repository URL <span className="text-red-600">*Required</span>
                </label>
                <input
                  type="url"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Share your GitHub repository link so your mentor can review your code
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Completion Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows="4"
                  placeholder="Describe what you've completed, challenges faced, and lessons learned..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Completion Report'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCompletionForm(false);
                    setCompletionNotes('');
                  }}
                  className="px-6 py-2 bg-gray-200 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default TaskDetail;
