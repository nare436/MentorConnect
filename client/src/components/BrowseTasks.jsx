import { useState, useEffect } from 'react';
import { Search, Calendar, Tag, X, Video, HelpCircle } from 'lucide-react';
import { getAllTasks, applyToTask } from '../utils/api';

// Browse Tasks Component with backend integration
function BrowseTasks({ setCurrentPage }) {
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [applyingTask, setApplyingTask] = useState(null);
  
  // Modal state for applying with GitHub URL
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedTaskForApply, setSelectedTaskForApply] = useState(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [applyAs, setApplyAs] = useState('individual');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await getAllTasks();
      if (response.success) {
        setTasks(response.tasks);
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Tasks error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter tasks based on search and difficulty
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = selectedDifficulty === 'all' || task.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  // Handle apply to task with API call
  const handleApplyClick = (taskId) => {
    setSelectedTaskForApply(taskId);
    setShowApplyModal(true);
    setGithubUrl('');
    setApplyAs('individual');
    setError('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    
    if (!githubUrl || !githubUrl.trim()) {
      setError('Please provide your GitHub Profile URL');
      return;
    }
    
    if (!githubUrl.startsWith('http')) {
      setError('Please provide a valid GitHub Profile URL (starting with http)');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await applyToTask(selectedTaskForApply, { githubUrl, applyAs, message });
      
      if (response.success) {
        alert('Application submitted! The mentor will review your profile and request.');
        // Refresh tasks to update applicant count
        fetchTasks();
        setShowApplyModal(false);
        setGithubUrl('');
        setApplyAs('individual');
        setMessage('');
      }
    } catch (err) {
      setError(err.message || 'Failed to apply to task');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Browse Tasks</h1>
          <p className="text-gray-600">Find and apply to tasks that match your skills</p>
        </div>

        {/* Video Call Feature Info Banner */}
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <Video size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-gray-800">💬 Need Help? Request a Video Call</p>
            <p className="text-sm text-gray-700 mt-1">Once you apply to a task and start working, you can request a video call with your mentor anytime for guidance, code reviews, or discussions. Just click <span className="font-medium">"Request Call"</span> on your dashboard!</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
              />
            </div>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
            >
              <option value="all">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {filteredTasks.map(task => (
            <div key={task._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
              
              {/* Task Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{task.title}</h3>
                  <p className="text-gray-600 mb-3">{task.description}</p>
                  
                  {/* Mentor Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>👨‍🏫 {task.mentorId?.name || 'Mentor'}</span>
                    <span>🏢 {task.mentorId?.company || 'Company'}</span>
                  </div>
                </div>

                {/* Difficulty Badge */}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  task.difficulty === 'Easy' 
                    ? 'bg-green-100 text-green-800' 
                    : task.difficulty === 'Medium'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {task.difficulty}
                </span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {task.tags && task.tags.map((tag, index) => (
                  <span key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    <Tag size={14} />
                    {tag}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Deadline: {new Date(task.deadline).toLocaleDateString()}
                  </span>
                  <span>{task.applicants || 0} teams applied</span>
                </div>

                <button
                  onClick={() => handleApplyClick(task._id)}
                  className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          ))}

          {/* No Results */}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No tasks found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Apply Modal */}
        {showApplyModal && selectedTaskForApply && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Apply to Task</h2>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Please provide your GitHub Profile URL so the mentor can review your experience.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleApplySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apply As <span className="text-red-600">*</span>
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="applyAs" 
                        value="individual"
                        checked={applyAs === 'individual'}
                        onChange={(e) => setApplyAs(e.target.value)}
                        className="text-gray-800 focus:ring-gray-800"
                      />
                      <span className="text-sm text-gray-700">Individual</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="applyAs" 
                        value="team"
                        checked={applyAs === 'team'}
                        onChange={(e) => setApplyAs(e.target.value)}
                        className="text-gray-800 focus:ring-gray-800"
                      />
                      <span className="text-sm text-gray-700">Team</span>
                    </label>
                  </div>
                </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GitHub Profile URL <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Provide your profile link so the mentor can review your past projects
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Why are you capable of doing this task? <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly explain your relevant experience and why you are a good fit..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-800"
                    rows="3"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Applying...' : 'Apply'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseTasks;