import { useState, useEffect } from 'react';
import { evaluateSubmission, getMentorSubmissions } from '../utils/api';

function MentorEvaluation({ setCurrentPage, submissionId }) {
  const [mark, setMark] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submission, setSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmission();
  }, []);

  const fetchSubmission = async () => {
    try {
      const response = await getMentorSubmissions();
      if (response.success) {
        // Find the first submission that needs review
        const pendingSubmissions = response.submissions.filter(s => s.status === 'submitted');
        const sub = pendingSubmissions[0] || null;
        setSubmission(sub);
      }
    } catch (err) {
      setError('Failed to load submission');
    } finally {
      setIsLoading(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const marksGiven = parseInt(mark) || 0;
    const taskTotalPoints = submission.taskId?.totalPoints || 100;
    const totalScore = (marksGiven / 10) * taskTotalPoints;

    try {
      const response = await evaluateSubmission(submission._id, {
        scores: { mark: marksGiven },
        feedback,
        totalScore
      });

      if (response.success) {
        alert('Evaluation submitted successfully!');
        setCurrentPage('mentor-dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-300">Loading submission...</div>
    </div>;
  }

  if (!submission) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4">No submissions to review</p>
        <button onClick={() => setCurrentPage('mentor-dashboard')}
          className="px-6 py-2 bg-gray-800 text-white rounded-lg">
          Back to Dashboard
        </button>
      </div>
    </div>;
  }


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setCurrentPage('mentor-dashboard')}
          className="mb-6 text-gray-600 hover:text-gray-800 dark:text-gray-100">
          ← Back to Dashboard
        </button>

        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">{submission.taskId?.title}</h1>
          <p className="text-gray-600 dark:text-gray-300">Student: {submission.studentId?.name}</p>
          {submission.githubUrl && (
            <div className="mt-2">
              <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-medium">View GitHub Repository</a>
            </div>
          )}
          {submission.notes && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Student's Completion Notes:</h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">{submission.notes}</p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Evaluation</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Score (Out of 10)</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-200">Overall Performance Rating</p>
                    <p className="text-sm text-gray-500">Task Points: {submission.taskId?.totalPoints || 0}</p>
                    {mark && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Student will be awarded: {((parseInt(mark) || 0) / 10) * (submission.taskId?.totalPoints || 100)} points
                      </p>
                    )}
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={mark}
                    onChange={(e) => setMark(e.target.value)}
                    className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-center"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Feedback *</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows="6"
                placeholder="Provide detailed feedback..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MentorEvaluation;