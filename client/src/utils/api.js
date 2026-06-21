// API utility file for making backend calls
// Place this in: src/utils/api.js

const API_BASE_URL = 'http://localhost:5000';

// Helper function for making API calls
async function apiCall(endpoint, options = {}) {
  const config = {
    ...options,
    credentials: 'include', // Important for cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ========== AUTHENTICATION APIs ==========

export const signup = async (formData) => {
  return apiCall('/signup', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};

export const sendOtp = async (email, role) => {
  return apiCall('/send-otp', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
};

export const sendForgotPasswordOtp = async (email, role) => {
  return apiCall('/forgot-password-otp', {
    method: 'POST',
    body: JSON.stringify({ email, role }),
  });
};

export const resetPassword = async (email, otp, newPassword) => {
  return apiCall('/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, newPassword }),
  });
};

export const login = async (formData) => {
  return apiCall('/login', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
};

export const logout = async () => {
  return apiCall('/logout');
};

// Verify if user is still logged in (for page reload)
export const verifyToken = async () => {
  return apiCall('/verify-token');
};

// ========== STUDENT APIs ==========

export const getStudentProfile = async () => {
  return apiCall('/student/profile');
};

export const updateStudentProfile = async (profileData) => {
  return apiCall('/student/profile/update', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
};

export const getStudentDashboard = async () => {
  return apiCall('/student/dashboard');
};

// ========== TASK APIs ==========

export const getAllTasks = async () => {
  return apiCall('/tasks');
};

export const getTaskById = async (taskId) => {
  return apiCall(`/tasks/${taskId}`);
};

export const applyToTask = async (taskId, applicationData = {}) => {
  return apiCall(`/tasks/${taskId}/apply`, {
    method: 'POST',
    body: JSON.stringify(applicationData),
  });
};

export const submitTask = async (taskId, submissionData) => {
  return apiCall(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify(submissionData),
  });
};

// ========== TEAM APIs ==========

export const createTeam = async (teamName) => {
  return apiCall('/team/create', {
    method: 'POST',
    body: JSON.stringify({ name: teamName }),
  });
};

export const joinTeam = async (teamCode) => {
  return apiCall('/team/join', {
    method: 'POST',
    body: JSON.stringify({ code: teamCode }),
  });
};

export const getTeamDetails = async (teamId) => {
  return apiCall(`/team/${teamId}`);
};

export const getUserTeam = async () => {
  return apiCall('/team/my-team');
};

export const leaveTeam = async (teamId) => {
  return apiCall(`/team/${teamId}/leave`, {
    method: 'POST',
  });
};

// ========== TASK DETAIL & COLLABORATION APIs ==========

export const contactMentor = async (taskId, messageData) => {
  return apiCall(`/tasks/${taskId}/contact-mentor`, {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};

export const requestVideoChat = async (taskId, requestData) => {
  return apiCall(`/tasks/${taskId}/request-video-chat`, {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

export const completeTask = async (taskId, completionData) => {
  return apiCall(`/tasks/${taskId}/complete`, {
    method: 'POST',
    body: JSON.stringify(completionData),
  });
};

export const getChatHistory = async (taskId) => {
  return apiCall(`/tasks/${taskId}/chat-history`);
};

// ========== MENTOR APIs ==========

export const createTask = async (taskData) => {
  return apiCall('/mentor/task/create', {
    method: 'POST',
    body: JSON.stringify(taskData),
  });
};

export const getMentorTasks = async () => {
  return apiCall('/mentor/tasks');
};

export const getMentorSubmissions = async () => {
  return apiCall('/mentor/submissions');
};

export const getPendingApplications = async () => {
  return apiCall('/mentor/pending-applications');
};

export const approveApplication = async (applicationId) => {
  return apiCall(`/mentor/applications/${applicationId}/approve`, {
    method: 'POST',
  });
};

export const rejectApplication = async (applicationId) => {
  return apiCall(`/mentor/applications/${applicationId}/reject`, {
    method: 'POST',
  });
};

export const evaluateSubmission = async (submissionId, evaluationData) => {
  return apiCall(`/mentor/evaluate/${submissionId}`, {
    method: 'POST',
    body: JSON.stringify(evaluationData),
  });
};

export const getMentorProfile = async () => {
  return apiCall('/mentor/profile');
};

export const updateMentorProfile = async (profileData) => {
  return apiCall('/mentor/profile/update', {
    method: 'POST',
    body: JSON.stringify(profileData),
  });
};

// ========== NOTIFICATIONS APIs ==========

export const getNotifications = async () => {
  return apiCall('/notifications');
};

export const markNotificationRead = async (notificationId) => {
  return apiCall(`/notifications/${notificationId}/read`, {
    method: 'POST',
  });
};

// ========== BADGES APIs ==========

export const getBadges = async () => {
  return apiCall('/badges');
};

// ========== TEAM CHAT APIs ==========

export const getTeamChatHistory = async (teamId) => {
  return apiCall(`/team/${teamId}/chat-history`);
};

// ========== VIDEO CHAT APIs ==========

export const completeVideoChat = async (sessionId, data) => {
  return apiCall(`/video-chat/${sessionId}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const getVideoChatHistory = async (taskId) => {
  return apiCall(`/tasks/${taskId}/video-chat-history`);
};

// ========== GOOGLE AUTHENTICATION ==========

export const googleAuth = async (idToken, role) => {
  return apiCall('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken, role }),
  });
};

// ========== PUBLIC PROFILE ==========

export const getPublicProfile = async (id) => {
  return apiCall(`/profile/${id}`);
};

// ========== MENTOR STUDENTS APIs ==========

export const getMentorStudents = async () => {
  return apiCall('/mentor/students');
};

// ========== LEADERBOARD & POINTS APIs ==========

export const getLeaderboard = async () => {
  return apiCall('/leaderboard');
};

export const getStudentPointsBreakdown = async () => {
  return apiCall('/student/points-breakdown');
};

// ========== MARK ALL NOTIFICATIONS READ ==========

export const markAllNotificationsRead = async () => {
  return apiCall('/notifications/mark-all-read', {
    method: 'POST',
  });
};

// ========== ALUMNI NETWORK APIs ==========

export const getAlumniDirectory = async (searchQuery = '') => {
  const queryParam = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : '';
  return apiCall(`/alumni/directory${queryParam}`);
};

export const sendAlumniMessage = async (receiverId, message) => {
  return apiCall('/alumni/message', {
    method: 'POST',
    body: JSON.stringify({ receiverId, message }),
  });
};

export const getAlumniMessages = async (userId) => {
  return apiCall(`/alumni/messages/${userId}`);
};

export const getAlumniConversations = async () => {
  return apiCall('/alumni/conversations');
};

// ========== MENTOR TASK MANAGEMENT APIs ==========

export const getMentorTaskDetails = async (taskId) => {
  return apiCall(`/mentor/task/${taskId}/details`);
};

export const toggleTaskApplications = async (taskId) => {
  return apiCall(`/mentor/task/${taskId}/toggle-applications`, {
    method: 'POST',
  });
};

export const getExploreTasks = async () => {
  return apiCall('/tasks/explore');
};

export const submitWork = async (taskId, data) => {
  return apiCall(`/tasks/${taskId}/submit`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// ========== COMMUNITY FEED APIs ==========

export const getCommunityPosts = async () => {
  return apiCall('/community/posts');
};

export const createCommunityPost = async (postData) => {
  return apiCall('/community/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

export const likePost = async (postId) => {
  return apiCall(`/community/posts/${postId}/like`, {
    method: 'POST',
  });
};

export const commentOnPost = async (postId, text) => {
  return apiCall(`/community/posts/${postId}/comment`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
};

export const getTopPosts = async (userId) => {
  return apiCall(`/profile/${userId}/top-posts`);
};

export const getPostById = async (postId) => {
  return apiCall(`/community/posts/${postId}`);
};

export const deleteCommunityPost = async (postId) => {
  return apiCall(`/community/posts/${postId}`, { method: 'DELETE' });
};

export const deleteComment = async (postId, commentId) => {
  return apiCall(`/community/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
};

export const toggleFollow = async (userId) => {
  return apiCall(`/profile/${userId}/follow`, { method: 'POST' });
};