import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createTask } from '../utils/api';

function MentorTaskCreate({ setCurrentPage }) {
  const [taskData, setTaskData] = useState({
    title: '',
    description: '',
    deadline: '',
    difficulty: 'Medium',
    tags: [],
    newTag: '',
    rubricItems: [{ criteria: '', points: 0 }]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setTaskData({ ...taskData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleAddTag = () => {
    if (taskData.newTag.trim() && taskData.tags.length < 5) {
      setTaskData({
        ...taskData,
        tags: [...taskData.tags, taskData.newTag.trim()],
        newTag: ''
      });
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTaskData({
      ...taskData,
      tags: taskData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleAddRubricItem = () => {
    setTaskData({
      ...taskData,
      rubricItems: [...taskData.rubricItems, { criteria: '', points: 0 }]
    });
  };

  const handleRemoveRubricItem = (index) => {
    const newItems = taskData.rubricItems.filter((_, i) => i !== index);
    setTaskData({ ...taskData, rubricItems: newItems });
  };

  const handleRubricChange = (index, field, value) => {
    const newItems = [...taskData.rubricItems];
    newItems[index][field] = value;
    setTaskData({ ...taskData, rubricItems: newItems });
  };

  const totalPoints = taskData.rubricItems.reduce((sum, item) => sum + (parseInt(item.points) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!taskData.title.trim() || !taskData.description.trim() || !taskData.deadline) {
      setError('Please fill all required fields');
      return;
    }

    // Validate deadline is today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(taskData.deadline);
    if (deadlineDate < today) {
      setError('Deadline must be today or a future date. Please select a valid date.');
      return;
    }

    if (taskData.rubricItems.some(item => !item.criteria.trim())) {
      setError('Please fill in all rubric criteria');
      return;
    }

    setIsLoading(true);

    try {
      const response = await createTask({
        title: taskData.title,
        description: taskData.description,
        deadline: taskData.deadline,
        difficulty: taskData.difficulty,
        tags: taskData.tags,
        rubric: taskData.rubricItems
      });

      if (response.success) {
        alert('Task created successfully!');
        setCurrentPage('mentor-dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">Create New Task</h1>
          <p className="text-gray-600 dark:text-gray-300">Post a new project for students to work on</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Task Title *</label>
            <input
              type="text"
              name="title"
              value={taskData.title}
              onChange={handleChange}
              placeholder="e.g., Build a REST API with Node.js"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Description *</label>
            <textarea
              name="description"
              value={taskData.description}
              onChange={handleChange}
              rows="5"
              placeholder="Describe what students need to build..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Deadline *</label>
              <input
                type="date"
                name="deadline"
                value={taskData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Difficulty Level</label>
              <select
                name="difficulty"
                value={taskData.difficulty}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                disabled={isLoading}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Technology Tags (Max 5)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {taskData.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-gray-800 text-white rounded-full text-sm flex items-center gap-2">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-300"
                    disabled={isLoading}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>

            {taskData.tags.length < 5 && (
              <div className="flex gap-2">
                <input
                  type="text"
                  name="newTag"
                  value={taskData.newTag}
                  onChange={handleChange}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="e.g., React, Node.js"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
                  disabled={isLoading}
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Evaluation Rubric *</label>
              <button
                type="button"
                onClick={handleAddRubricItem}
                className="flex items-center gap-1 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50"
                disabled={isLoading}
              >
                <Plus size={16} />
                Add Criteria
              </button>
            </div>

            <div className="space-y-3">
              {taskData.rubricItems.map((item, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <input
                    type="text"
                    value={item.criteria}
                    onChange={(e) => handleRubricChange(index, 'criteria', e.target.value)}
                    placeholder="Evaluation criteria"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                    required
                    disabled={isLoading}
                  />
                  <input
                    type="number"
                    value={item.points}
                    onChange={(e) => handleRubricChange(index, 'points', e.target.value)}
                    placeholder="Points"
                    min="0"
                    className="w-24 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-gray-800"
                    required
                    disabled={isLoading}
                  />
                  {taskData.rubricItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRubricItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-between">
              <span className="font-medium text-gray-700 dark:text-gray-200">Total Points:</span>
              <span className="text-xl font-bold text-gray-800 dark:text-gray-100">{totalPoints}</span>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage('mentor-dashboard')}
              className="flex-1 py-3 bg-white dark:bg-gray-800 text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-100 font-medium"
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MentorTaskCreate;