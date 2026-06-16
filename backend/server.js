// Main server file with security enhancements
const express = require('express');
require('dotenv').config();
const connectDB = require('./db.js');
connectDB();
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
const http = require('http');
const socketIO = require('socket.io');

// Import models
const userModel = require('./models/user');
const taskModel = require('./models/task');
const teamModel = require('./models/team');
const submissionModel = require('./models/submission');
const chatModel = require('./models/chat');
const videoChatModel = require('./models/videoChat');
const notificationModel = require('./models/notification');
const badgeModel = require('./models/badge');
const teamChatModel = require('./models/teamChat');

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true
  }
});

// CORS configuration with credentials
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true
}));

// Secret key for JWT from environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';
const SALT_ROUNDS = 10;

// Middleware
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Please login first', requiresAuth: true });
  }
  
  try {
    const data = jwt.verify(token, JWT_SECRET);
    req.user = data;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.status(401).json({ error: 'Invalid token, please login again', requiresAuth: true });
  }
}

// Email domain validation function
function validateEmail(email, role) {
  const domain = email.split('@')[1];
  
  // Students must use @mnnit.ac.in email
  if (role === 'student') {
    if (domain !== 'mnnit.ac.in') {
      return { valid: false, error: 'Students must use @mnnit.ac.in email' };
    }
  }
  
  // Mentors can use any professional email
  if (role === 'mentor') {
    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com']; // Add more as needed
    // For mentors, we'll be lenient and allow most emails
    if (!email.includes('@')) {
      return { valid: false, error: 'Invalid email format' };
    }
  }
  
  return { valid: true };
}

// ========== SOCKET.IO CHAT IMPLEMENTATION ==========

// Store online users
const onlineUsers = new Map();

io.on('connection', (socket) => {

  // When user connects with userId
  socket.on('user-online', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('online-users-count', onlineUsers.size);
  });

  // User joins a task chat room
  socket.on('join-task-room', (taskId) => {
    if (!taskId) return;
    socket.join(`task-${taskId}`);
  });

  // Typing Indicator
  socket.on("typing", ({ taskId, userId }) => {
    if (!taskId || !userId) return;
    socket.broadcast.to(`task-${taskId}`).emit("show-typing", { userId });
  });

  // Send message inside a task room - with database storage
  socket.on('task-message', async (data) => {
    const { taskId, userId, userName, message, userRole } = data;

    // Message Validation
    if (!taskId) return;
    if (!message || typeof message !== "string") return;
    if (message.trim().length === 0) return;
    if (message.length > 500) return; // (optional) max length rule

    try {
      const chatModel = require('./models/chat');
      
      // Save message to database
      const savedMessage = await chatModel.create({
        taskId,
        senderId: userId,
        message: message.trim(),
        senderName: userName,
        senderRole: userRole || 'student',
        createdAt: new Date()
      });
      
      const messageData = {
        _id: savedMessage._id,
        userId,
        userName,
        message: message.trim(),
        timestamp: new Date(),
        taskId,
        userRole: userRole || 'student'
      };

      // Send message to everyone in the room
      io.to(`task-${taskId}`).emit('new-task-message', messageData);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // ========== TEAM CHAT Socket.io Handlers ==========

  // Join team chat room
  socket.on('join-team-room', (teamId) => {
    if (!teamId) return;
    socket.join(`team-${teamId}`);
    socket.broadcast.to(`team-${teamId}`).emit('team-user-joined', { teamId });
  });

  // Team typing indicator
  socket.on('team-user-typing', ({ teamId, userId, userName }) => {
    if (!teamId || !userId) return;
    socket.broadcast.to(`team-${teamId}`).emit('team-user-typing', { userId, userName });
  });

  // Stop typing in team
  socket.on('team-user-stopped-typing', ({ teamId, userId }) => {
    if (!teamId || !userId) return;
    socket.broadcast.to(`team-${teamId}`).emit('team-user-stopped-typing', { userId });
  });

  // Send team message - with database storage
  socket.on('team-message', async (data) => {
    const { teamId, userId, userName, message, userRole } = data;

    // Message Validation
    if (!teamId || !userId || !message) return;
    if (typeof message !== "string" || message.trim().length === 0) return;
    if (message.length > 500) return;

    try {
      // Save message to database
      const savedMessage = await teamChatModel.create({
        teamId,
        senderId: userId,
        message: message.trim(),
        senderName: userName,
        senderRole: userRole || 'student',
        messageType: 'text',
        createdAt: new Date()
      });
      
      const messageData = {
        _id: savedMessage._id,
        senderId: userId,
        senderName: userName,
        message: message.trim(),
        senderRole: userRole || 'student',
        createdAt: savedMessage.createdAt,
        teamId
      };

      // Send message to everyone in the team room
      io.to(`team-${teamId}`).emit('new-team-message', messageData);
    } catch (err) {
      console.error('Error saving team message:', err);
    }
  });

  // Leave team room
  socket.on('leave-team-room', (teamId) => {
    if (!teamId) return;
    socket.leave(`team-${teamId}`);
    socket.broadcast.to(`team-${teamId}`).emit('team-user-left', { teamId });
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('online-users-count', onlineUsers.size);
  });
});

// ========== AUTHENTICATION ROUTES ==========

// Signup route with bcrypt and email validation
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, githubUsername } = req.body;
    
    // Validate email domain
    const emailValidation = validateEmail(email, role);
    if (!emailValidation.valid) {
      return res.status(400).json({ error: emailValidation.error });
    }
    
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }
    
    // Hash password with bcrypt (10 rounds of salt)
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Create new user with hashed password
    const user = await userModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      githubUsername: githubUsername || '',
      bio: '',
      skills: [],
      education: '',
      company: '',
      expertise: []
    });
    
    // Generate JWT token with longer expiry for persistent session
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' } // 30 days for persistent session
    );
    
    // Set secure HTTP-only cookie
    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS in production
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    });
    
    res.json({ 
      success: true, 
      message: 'Signup successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed: ' + err.message });
  }
});

// Login route with bcrypt verification
app.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found with this email' });
    }
    
    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Incorrect password' });
    }
    
    // Check role matches
    if (user.role !== role) {
      return res.status(400).json({ error: 'Invalid role selected. Please select the correct role.' });
    }
    
    // Generate JWT token with longer expiry
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Set secure HTTP-only cookie
    res.cookie('token', token, { 
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    res.json({ 
      success: true,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Verify token route - for checking if user is still logged in after page reload
app.get('/verify-token', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).select('-password');
    if (!user) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'User not found', requiresAuth: true });
    }
    
    res.json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Logout route
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// ========== STUDENT PROFILE ROUTES ==========

// Get student profile
app.get('/student/profile', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }
    
    const user = await userModel.findById(req.user.id).select('-password');
    
    const tasksCompleted = await submissionModel.countDocuments({ studentId: req.user.id, status: 'reviewed' });
    const tasksActive = await submissionModel.countDocuments({ studentId: req.user.id, status: 'in-progress' });
    const badgesEarned = user.badges?.length || 0;
    
    const stats = {
      tasksCompleted,
      tasksActive,
      badgesEarned
    };
    
    res.json({ success: true, user, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update student profile
app.post('/student/profile/update', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }
    
    const { name, bio, skills, education, githubUrl, linkedinUrl } = req.body;
    
    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      {
        name,
        bio,
        skills,
        education,
        githubUrl,
        linkedinUrl
      },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get student dashboard data
app.get('/student/dashboard', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }
    
    // Get user's active tasks
    const submissions = await submissionModel
      .find({ studentId: req.user.id })
      .populate('taskId')
      .populate('teamId');
    
    // Calculate stats
    const completedTasks = submissions.filter(s => s.status === 'reviewed').length;
    const activeTasks = submissions.filter(s => s.status === 'pending' || s.status === 'submitted').length;
    
    res.json({
      success: true,
      stats: {
        tasksCompleted: completedTasks,
        tasksActive: activeTasks,
        badgesEarned: 3
      },
      activeTasks: submissions
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ========== TASK ROUTES ==========

// Get all tasks (for browsing)
app.get('/tasks', isLoggedIn, async (req, res) => {
  try {
    const tasks = await taskModel.find({ status: 'active' })
      .populate('mentorId', 'name company');
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task details
app.get('/tasks/:id', isLoggedIn, async (req, res) => {
  try {
    const task = await taskModel.findById(req.params.id)
      .populate('mentorId', 'name company jobRole');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Apply to a task
app.post('/tasks/:id/apply', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can apply to tasks' });
    }
    
    const taskId = req.params.id;
    const { githubUrl, teamId, applyAs } = req.body;
    
    // Validate GitHub Profile URL is provided
    if (!githubUrl || !githubUrl.trim()) {
      return res.status(400).json({ error: 'GitHub Profile URL is required to apply for a task' });
    }
    
    if (!githubUrl.startsWith('http')) {
      return res.status(400).json({ error: 'Please provide a valid GitHub Profile URL' });
    }
    
    const task = await taskModel.findById(taskId);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    // Check if already applied
    const existingSubmission = await submissionModel.findOne({
      taskId,
      studentId: req.user.id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already applied to this task' });
    }
    
    // Create submission with applicantGithubUrl and pending_approval status
    const submission = await submissionModel.create({
      taskId,
      studentId: req.user.id,
      teamId: applyAs === 'team' ? teamId : null,
      applicantGithubUrl: githubUrl,
      applyAs: applyAs || 'individual',
      status: 'pending_approval'
    });
    
    // Update task applicants count
    await taskModel.findByIdAndUpdate(taskId, {
      $inc: { applicants: 1 }
    });
    
    res.json({ success: true, message: 'Application submitted for mentor review', submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to apply: ' + err.message });
  }
});

// Submit work for a task
app.post('/tasks/:id/submit', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can submit work' });
    }
    
    const { githubUrl, demoUrl, notes } = req.body;
    
    const submission = await submissionModel.findOneAndUpdate(
      { taskId: req.params.id, studentId: req.user.id },
      {
        githubUrl,
        demoUrl,
        notes,
        status: 'submitted',
        submittedAt: new Date()
      },
      { new: true }
    );
    
    if (!submission) {
      return res.status(404).json({ error: 'Please apply to this task first' });
    }
    
    res.json({ success: true, message: 'Submitted successfully', submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit' });
  }
});

// ========== TASK COLLABORATION ROUTES ==========

// Get chat history for a task
app.get('/tasks/:id/chat-history', isLoggedIn, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const messages = await chatModel
      .find({ taskId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name email');
    
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Contact mentor about a task
app.post('/tasks/:id/contact-mentor', isLoggedIn, async (req, res) => {
  try {
    const { message, mentorId } = req.body;
    const taskId = req.params.id;
    
    if (!message || !mentorId) {
      return res.status(400).json({ error: 'Message and mentorId are required' });
    }
    
    const user = await userModel.findById(req.user.id);
    
    const chat = await chatModel.create({
      taskId,
      senderId: req.user.id,
      message,
      senderName: user.name,
      senderRole: req.user.role
    });
    
    // Emit to mentor via socket.io
    io.to(`task-${taskId}`).emit('mentor-message', {
      senderId: req.user.id,
      senderName: user.name,
      message,
      timestamp: new Date()
    });
    
    res.json({ success: true, message: 'Message sent to mentor', chat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Request video chat with mentor
app.post('/tasks/:id/request-video-chat', isLoggedIn, async (req, res) => {
  try {
    const { reason, mentorId } = req.body;
    const taskId = req.params.id;
    
    if (!reason || !mentorId) {
      return res.status(400).json({ error: 'Reason and mentorId are required' });
    }
    
    // Get student info for notification
    const student = await userModel.findById(req.user.id);
    const task = await taskModel.findById(taskId);
    
    // Generate unique session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    const videoRequest = await videoChatModel.create({
      taskId,
      studentId: req.user.id,
      mentorId,
      reason,
      sessionId,
      status: 'pending'
    });
    
    // Create notification in database for mentor
    const notification = await notificationModel.create({
      userId: mentorId,
      type: 'video_request',
      title: `Video chat request from ${student.name}`,
      message: `${student.name} has requested a video chat for "${task.title}"${reason ? `: ${reason}` : ''}`,
      relatedTaskId: taskId,
      relatedUserId: req.user.id,
      isRead: false
    });
    
    // Notify mentor via socket.io (real-time)
    io.to(`mentor-${mentorId}`).emit('video-chat-request', {
      videoRequestId: videoRequest._id,
      studentId: req.user.id,
      studentName: student.name,
      taskId,
      taskTitle: task.title,
      reason,
      timestamp: new Date(),
      notificationId: notification._id
    });
    
    res.json({ success: true, message: 'Video chat request sent', videoRequest });
  } catch (err) {
    res.status(500).json({ error: 'Failed to request video chat' });
  }
});

// Complete a video chat session
app.post('/video-chat/:sessionId/complete', isLoggedIn, async (req, res) => {
  try {
    const { duration } = req.body;
    const { sessionId } = req.params;
    
    // Find and update the video chat session
    const videoChat = await videoChatModel.findOneAndUpdate(
      { sessionId },
      {
        status: 'completed',
        duration: duration || 0,
        completedAt: new Date()
      },
      { new: true }
    );
    
    if (!videoChat) {
      return res.status(404).json({ error: 'Video chat session not found' });
    }
    
    // Emit completion notification
    io.to(`mentor-${videoChat.mentorId}`).emit('video-chat-completed', {
      sessionId,
      duration: duration || 0
    });
    
    io.to(`student-${videoChat.studentId}`).emit('video-chat-completed', {
      sessionId,
      duration: duration || 0
    });
    
    res.json({ success: true, message: 'Video chat completed', videoChat });
  } catch (err) {
    console.error('Video chat completion error:', err);
    res.status(500).json({ error: 'Failed to complete video chat' });
  }
});

// Complete a task (report completion)
app.post('/tasks/:id/complete', isLoggedIn, async (req, res) => {
  try {
    const { notes, githubUrl } = req.body;
    const taskId = req.params.id;
    
    if (!githubUrl || !githubUrl.trim()) {
      return res.status(400).json({ error: 'GitHub repository URL is required' });
    }
    
    const submission = await submissionModel.findOneAndUpdate(
      { taskId, studentId: req.user.id },
      {
        status: 'submitted',
        notes: notes || '',
        githubUrl: githubUrl,
        submittedAt: new Date()
      },
      { new: true }
    ).populate('taskId').populate('studentId');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Notify mentor
    const mentor = submission.taskId.mentorId;
    
    // Create notification in database
    const notification = await notificationModel.create({
      userId: mentor,
      type: 'task_completion',
      title: `Task submission from ${submission.studentId.name}`,
      message: `${submission.studentId.name} has completed "${submission.taskId.title}" and submitted their work`,
      relatedTaskId: taskId,
      relatedUserId: req.user.id,
      isRead: false
    });
    
    // Emit Socket.io event for real-time notification
    io.to(`mentor-${mentor}`).emit('task-completion-report', {
      submissionId: submission._id,
      studentId: req.user.id,
      studentName: submission.studentId.name,
      taskId,
      taskTitle: submission.taskId.title,
      notes,
      githubUrl,
      timestamp: new Date(),
      notificationId: notification._id
    });
    
    res.json({ success: true, message: 'Task completion reported', submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to report completion' });
  }
});

// ========== TEAM ROUTES ==========

// Create a team
app.post('/team/create', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can create teams' });
    }
    
    const { name } = req.body;
    
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const team = await teamModel.create({
      name,
      code,
      leaderId: req.user.id,
      members: [req.user.id]
    });
    
    await team.populate('members', 'name email');
    
    res.json({ success: true, message: 'Team created', team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Join a team
app.post('/team/join', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can join teams' });
    }
    
    const { code } = req.body;
    
    const team = await teamModel.findOne({ code });
    if (!team) {
      return res.status(404).json({ error: 'Invalid team code' });
    }
    
    if (team.members.includes(req.user.id)) {
      return res.status(400).json({ error: 'You are already a member of this team' });
    }
    
    team.members.push(req.user.id);
    await team.save();
    
    await team.populate('members', 'name email');
    
    res.json({ success: true, message: 'Joined team successfully', team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join team' });
  }
});

// ✅ my-team MUST be before /team/:id
app.get('/team/my-team', isLoggedIn, async (req, res) => {
  try {
    const team = await teamModel.findOne({ members: req.user.id })
      .populate('members', 'name email')
      .populate('leaderId', 'name email');
    
    if (!team) {
      return res.json({ success: true, team: null, message: 'No team found' });
    }
    
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get team details — /team/:id AFTER /team/my-team
app.get('/team/:id', isLoggedIn, async (req, res) => {
  try {
    const team = await teamModel.findById(req.params.id)
      .populate('members', 'name email')
      .populate('leaderId', 'name email');
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json({ success: true, team });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Leave team
app.post('/team/:id/leave', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can leave teams' });
    }
    
    const team = await teamModel.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    team.members = team.members.filter(m => m.toString() !== req.user.id);
    
    if (team.leaderId.toString() === req.user.id) {
      if (team.members.length > 0) {
        team.leaderId = team.members[0];
      } else {
        await teamModel.findByIdAndDelete(req.params.id);
        return res.json({ success: true, message: 'Team deleted as you were the last member' });
      }
    }
    
    await team.save();
    res.json({ success: true, message: 'Left team successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave team' });
  }
});
// ========== MENTOR ROUTES ==========

// Get mentor profile
app.get('/mentor/profile', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    const user = await userModel.findById(req.user.id).select('-password');
    
    const totalTasks = await taskModel.countDocuments({ mentorId: req.user.id });
    const mentorTasks = await taskModel.find({ mentorId: req.user.id }).select('_id');
    const taskIds = mentorTasks.map(t => t._id);
    const teamsMentored = await submissionModel.countDocuments({ 
      taskId: { $in: taskIds },
      status: { $in: ['in-progress', 'reviewed'] }
    });
    
    const stats = {
      totalTasks,
      teamsmentored: teamsMentored,
      studentsHelped: teamsMentored * 2
    };
    
    res.json({ success: true, user, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update mentor profile
app.post('/mentor/profile/update', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    const { name, bio, company, jobRole, expertise, yearsOfExperience } = req.body;
    
    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { name, bio, company, jobRole, expertise, yearsOfExperience },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create task (mentor only)
app.post('/mentor/task/create', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can create tasks' });
    }
    
    const { title, description, deadline, difficulty, tags, rubric } = req.body;
    
    const task = await taskModel.create({
      title,
      description,
      deadline,
      difficulty,
      tags,
      rubric,
      mentorId: req.user.id,
      status: 'active'
    });
    
    res.json({ success: true, message: 'Task created', task });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get mentor's tasks
app.get('/mentor/tasks', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    const tasks = await taskModel.find({ mentorId: req.user.id });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get submissions for review
app.get('/mentor/submissions', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    // Get all tasks created by this mentor
    const tasks = await taskModel.find({ mentorId: req.user.id });
    const taskIds = tasks.map(t => t._id);
    
    // Get submissions for these tasks
    const submissions = await submissionModel
      .find({ taskId: { $in: taskIds } })
      .populate('studentId', 'name email')
      .populate('taskId', 'title')
      .populate({
        path: 'teamId',
        select: 'name members',
        populate: {
          path: 'members',
          select: 'name email'
        }
      });
    
    res.json({ success: true, submissions });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get pending applications for mentor's tasks
app.get('/mentor/pending-applications', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    const tasks = await taskModel.find({ mentorId: req.user.id });
    const taskIds = tasks.map(t => t._id);
    
    const applications = await submissionModel
      .find({ taskId: { $in: taskIds }, status: 'pending_approval' })
      .populate('studentId', 'name email')
      .populate('taskId', 'title')
      .populate({
        path: 'teamId',
        select: 'name members',
        populate: {
          path: 'members',
          select: 'name email'
        }
      });
    
    res.json({ success: true, applications });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending applications' });
  }
});

// Approve application
app.post('/mentor/applications/:id/approve', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    const submission = await submissionModel.findById(req.params.id).populate('taskId');
    if (!submission) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (submission.taskId.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to approve this application' });
    }
    
    submission.status = 'in-progress';
    await submission.save();
    
    res.json({ success: true, message: 'Application approved successfully', submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Reject application
app.post('/mentor/applications/:id/reject', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }
    
    const submission = await submissionModel.findById(req.params.id).populate('taskId');
    if (!submission) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    if (submission.taskId.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to reject this application' });
    }
    
    submission.status = 'rejected';
    await submission.save();
    
    res.json({ success: true, message: 'Application rejected successfully', submission });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// ========== NOTIFICATIONS APIs ==========

// Get user notifications
app.get('/notifications', isLoggedIn, async (req, res) => {
  try {
    const notifications = await notificationModel.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notification as read
app.post('/notifications/:id/read', isLoggedIn, async (req, res) => {
  try {
    const notification = await notificationModel.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notification' });
  }
});

// ========== BADGES APIs ==========

// Get user badges
app.get('/badges', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate('badges');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get badge details
    const badges = await badgeModel.find({ _id: { $in: user.badges || [] } });
    
    res.json({ success: true, badges });
  } catch (err) {
    console.error('Get badges error:', err);
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

// ========== TEAM CHAT APIs ==========

// Get team chat history
app.get('/team/:id/chat-history', isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await teamChatModel.find({ teamId: id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    console.error('Get team chat history error:', err);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// ========== MENTOR ENHANCED APIs ==========



// ========== VIDEO CHAT HISTORY ==========

// Get video chat history for a task
app.get('/tasks/:id/video-chat-history', isLoggedIn, async (req, res) => {
  try {
    const taskId = req.params.id;
    
    const videoChatHistory = await videoChatModel
      .find({ taskId })
      .sort({ createdAt: -1 })
      .populate('studentId', 'name email')
      .populate('mentorId', 'name email');
    
    res.json({ success: true, videoChatHistory });
  } catch (err) {
    console.error('Get video chat history error:', err);
    res.status(500).json({ error: 'Failed to fetch video chat history' });
  }
});

// ========== MENTOR EVALUATION ==========

// Evaluate a submission
app.post('/mentor/evaluate/:submissionId', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can evaluate submissions' });
    }
    
    const { scores, feedback, totalScore } = req.body;
    
    const submission = await submissionModel.findById(req.params.submissionId)
      .populate('taskId');
    
    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    
    // Verify the task belongs to this mentor
    if (submission.taskId.mentorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only evaluate submissions for your own tasks' });
    }
    
    submission.scores = scores || {};
    submission.feedback = feedback || '';
    submission.totalScore = totalScore || 0;
    submission.status = 'reviewed';
    submission.reviewedAt = new Date();
    await submission.save();
    
    // Notify the student
    await notificationModel.create({
      userId: submission.studentId,
      type: 'submission_reviewed',
      title: 'Your submission has been reviewed',
      message: `Your submission for "${submission.taskId.title}" has been evaluated. Score: ${totalScore || 0}`,
      relatedTaskId: submission.taskId._id,
      relatedUserId: req.user.id,
      isRead: false
    });
    
    res.json({ success: true, message: 'Submission evaluated', submission });
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: 'Failed to evaluate submission' });
  }
});

// ========== FIREBASE GOOGLE AUTHENTICATION ==========

// Google Auth route - receives Firebase ID token, verifies it, creates/finds user
app.post('/auth/google', async (req, res) => {
  try {
    const { idToken, role } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }
    
    // Verify the Firebase ID token
    let firebaseAdmin;
    try {
      firebaseAdmin = require('./config/firebaseAdmin');
    } catch (err) {
      console.error('Firebase Admin not configured:', err.message);
      return res.status(500).json({ 
        error: 'Google authentication is not configured yet. Please set up Firebase credentials in .env' 
      });
    }
    
    let decodedToken;
    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken);
    } catch (err) {
      console.error('Firebase token verification failed:', err);
      return res.status(401).json({ error: 'Invalid Google authentication token' });
    }
    
    const { uid, email, name, picture } = decodedToken;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not available from Google account' });
    }
    
    // Check if user already exists
    let user = await userModel.findOne({ email });
    
    if (user) {
      // Existing user - update Google ID if not set
      if (!user.googleId) {
        user.googleId = uid;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        await user.save();
      }
    } else {
      // New user - create account
      const userRole = role || 'student';
      
      user = await userModel.create({
        name: name || email.split('@')[0],
        email,
        googleId: uid,
        authProvider: 'google',
        role: userRole,
        bio: '',
        skills: [],
        education: '',
        company: '',
        expertise: []
      });
    }
    
    // Generate JWT token (same as normal login)
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      message: 'Google authentication successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Google authentication failed: ' + err.message });
  }
});

// Get public profile by ID
app.get('/profile/:id', isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stats = {};
    if (user.role === 'mentor') {
      const totalTasks = await taskModel.countDocuments({ mentorId: user._id });
      const mentorTasks = await taskModel.find({ mentorId: user._id }).select('_id');
      const taskIds = mentorTasks.map(t => t._id);
      const teamsMentored = await submissionModel.countDocuments({ 
        taskId: { $in: taskIds },
        status: { $in: ['in-progress', 'reviewed'] }
      });
      stats = { totalTasks, teamsmentored: teamsMentored, studentsHelped: teamsMentored * 2 };
    } else {
      const tasksCompleted = await submissionModel.countDocuments({ studentId: user._id, status: 'reviewed' });
      const tasksActive = await submissionModel.countDocuments({ studentId: user._id, status: 'in-progress' });
      const badgesEarned = user.badges?.length || 0;
      stats = { tasksCompleted, tasksActive, badgesEarned };
    }

    res.json({ success: true, user, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch public profile' });
  }
});

// Start server with Socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running securely on port ${PORT}`);
  console.log(`🔐 JWT authentication enabled`);
  console.log(`🔒 Bcrypt password hashing active`);
  console.log(`💬 Socket.io chat enabled`);
  console.log(`🔥 Firebase Google Auth enabled`);
  console.log(`📡 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});