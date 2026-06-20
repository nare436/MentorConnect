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
const mongoose = require('mongoose');

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
const alumniMessageModel = require('./models/alumniMessage');
const postModel = require('./models/post');

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
        role: user.role,
        profilePicture: user.profilePicture
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
    
    const { name, bio, skills, education, githubUrl, linkedinUrl, profilePicture } = req.body;
    
    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      {
        name,
        bio,
        skills,
        education,
        githubUrl,
        linkedinUrl,
        profilePicture
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
    
    // Get user's direct submissions
    const directSubmissions = await submissionModel
      .find({ studentId: req.user.id })
      .populate({
        path: 'taskId',
        populate: { path: 'mentorId', select: 'name company profilePicture' }
      })
      .populate('teamId');
    
    // Also get submissions where user is a team member (but not the original applicant)
    const userTeam = await teamModel.findOne({ members: req.user.id });
    let teamSubmissions = [];
    if (userTeam) {
      teamSubmissions = await submissionModel
        .find({ teamId: userTeam._id, studentId: { $ne: req.user.id } })
        .populate({
          path: 'taskId',
          populate: { path: 'mentorId', select: 'name company profilePicture' }
        })
        .populate('teamId');
    }
    
    // Merge and deduplicate by taskId
    const seenTasks = new Set();
    const allSubmissions = [];
    for (const sub of directSubmissions) {
      const tid = sub.taskId?._id?.toString();
      if (tid && !seenTasks.has(tid)) {
        seenTasks.add(tid);
        allSubmissions.push(sub);
      }
    }
    for (const sub of teamSubmissions) {
      const tid = sub.taskId?._id?.toString();
      if (tid && !seenTasks.has(tid)) {
        seenTasks.add(tid);
        allSubmissions.push({ ...sub.toObject(), isTeamTask: true });
      }
    }
    
    // Calculate stats
    const completedTasks = allSubmissions.filter(s => s.status === 'reviewed').length;
    const activeTasks = allSubmissions.filter(s => ['in-progress', 'submitted', 'pending_approval'].includes(s.status)).length;
    
    const user = await userModel.findById(req.user.id).select('badges');
    
    res.json({
      success: true,
      stats: {
        tasksCompleted: completedTasks,
        tasksActive: activeTasks,
        badgesEarned: user?.badges?.length || 0,
        teamMembers: userTeam?.members?.length || 0
      },
      activeTasks: allSubmissions
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ========== TASK ROUTES ==========

// Get all tasks (for browsing)
app.get('/tasks', isLoggedIn, async (req, res) => {
  try {
    const tasks = await taskModel.find({ status: 'active' })
      .populate('mentorId', 'name company profilePicture');
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Explore tasks from all mentors (read-only browse)
app.get('/tasks/explore', isLoggedIn, async (req, res) => {
  try {
    const tasks = await taskModel
      .find({ status: 'active' })
      .populate('mentorId', 'name email company expertise profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task details
app.get('/tasks/:id', isLoggedIn, async (req, res) => {
  try {
    const task = await taskModel.findById(req.params.id)
      .populate('mentorId', 'name company jobRole profilePicture');
    
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
    
    // Check if task is accepting applications
    if (task.acceptingApplications === false) {
      return res.status(400).json({ error: 'This task is no longer accepting applications' });
    }
    
    // Check if deadline has passed
    if (task.deadline && new Date(task.deadline) < new Date()) {
      return res.status(400).json({ error: 'The application deadline for this task has passed' });
    }
    
    // Check if already applied
    const existingSubmission = await submissionModel.findOne({
      taskId,
      studentId: req.user.id
    });
    
    if (existingSubmission) {
      return res.status(400).json({ error: 'You have already applied to this task' });
    }
    
    // If applying as a team, create submissions for ALL team members
    if (applyAs === 'team' && teamId) {
      const team = await teamModel.findById(teamId).populate('members', '_id name');
      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }
      
      // Check if any team member already applied
      const memberIds = team.members.map(m => m._id);
      const existingTeamSubmissions = await submissionModel.find({
        taskId,
        studentId: { $in: memberIds }
      });
      if (existingTeamSubmissions.length > 0) {
        return res.status(400).json({ error: 'A team member has already applied to this task' });
      }
      
      // Create a SINGLE submission for the team (linked to leader)
      const submission = await submissionModel.create({
        taskId,
        studentId: req.user.id,
        teamId: team._id,
        applicantGithubUrl: githubUrl,
        applyAs: 'team',
        status: 'pending_approval'
      });
      
      // Update task applicants count
      await taskModel.findByIdAndUpdate(taskId, {
        $inc: { applicants: 1 }
      });
      
      return res.json({ success: true, message: `Application submitted for team "${team.name}" (${team.members.length} members)`, submission });
    }
    
    // Individual application
    const submission = await submissionModel.create({
      taskId,
      studentId: req.user.id,
      teamId: null,
      applicantGithubUrl: githubUrl,
      applyAs: 'individual',
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
    
    // Allow any team member to submit on behalf of the team
    const userTeam = await teamModel.findOne({ members: req.user.id });
    const query = { taskId: req.params.id };
    if (userTeam) {
      query.$or = [{ studentId: req.user.id }, { teamId: userTeam._id }];
    } else {
      query.studentId = req.user.id;
    }
    
    const submission = await submissionModel.findOneAndUpdate(
      query,
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
    
    const leaderIdStr = team.leaderId?._id?.toString() || team.leaderId?.toString();
    const isLeader = leaderIdStr === req.user.id;
    
    res.json({ success: true, team, isLeader });
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
    
    const { name, bio, company, jobRole, expertise, yearsOfExperience, profilePicture } = req.body;
    
    const user = await userModel.findByIdAndUpdate(
      req.user.id,
      { name, bio, company, jobRole, expertise, yearsOfExperience, profilePicture },
      { new: true }
    ).select('-password');
    
    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Create task (mentor only) — deadline must be today or in the future
app.post('/mentor/task/create', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Only mentors can create tasks' });
    }
    
    const { title, description, deadline, difficulty, tags, totalPoints } = req.body;
    
    // Validate deadline is not in the past
    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      return res.status(400).json({ error: 'Deadline must be today or a future date' });
    }
    
    const task = await taskModel.create({
      title,
      description,
      deadline,
      difficulty,
      tags,
      rubric: [],
      totalPoints: parseInt(totalPoints) || 10,
      mentorId: req.user.id,
      status: 'active',
      acceptingApplications: true
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
    
    const tasks = await taskModel.find({ mentorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get detailed info for a single mentor task (applications, students, submissions)
app.get('/mentor/task/:taskId/details', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const task = await taskModel.findById(req.params.taskId).populate('mentorId', 'name email');
    if (!task) return res.status(404).json({ error: 'Task not found' });
    
    // Get all submissions for this task
    const submissions = await submissionModel
      .find({ taskId: task._id })
      .populate('studentId', 'name email skills education githubUrl totalPoints profilePicture')
      .populate({
        path: 'teamId',
        select: 'name members',
        populate: { path: 'members', select: 'name email profilePicture' }
      })
      .sort({ createdAt: -1 });
    
    // Group by status
    const pendingApplications = submissions.filter(s => s.status === 'pending_approval');
    const inProgress = submissions.filter(s => s.status === 'in-progress');
    const submitted = submissions.filter(s => s.status === 'submitted');
    const reviewed = submissions.filter(s => s.status === 'reviewed');
    
    res.json({
      success: true,
      task,
      pendingApplications,
      inProgress,
      submitted,
      reviewed,
      totalStudents: submissions.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task details' });
  }
});

// Toggle applications open/close for a task
app.post('/mentor/task/:taskId/toggle-applications', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const task = await taskModel.findOne({ _id: req.params.taskId, mentorId: req.user.id });
    if (!task) return res.status(404).json({ error: 'Task not found or not yours' });
    
    task.acceptingApplications = !task.acceptingApplications;
    await task.save();
    
    res.json({
      success: true,
      acceptingApplications: task.acceptingApplications,
      message: task.acceptingApplications ? 'Applications are now open' : 'Applications are now closed'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle applications' });
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
    
    // If team application, approve all team members' submissions
    if (submission.applyAs === 'team' && submission.teamId) {
      await submissionModel.updateMany(
        { taskId: submission.taskId._id, teamId: submission.teamId },
        { $set: { status: 'in-progress' } }
      );
    } else {
      submission.status = 'in-progress';
      await submission.save();
    }
    
    // Update active teams count
    await taskModel.findByIdAndUpdate(submission.taskId._id, {
      $inc: { activeTeams: 1 }
    });
    
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

// Mark all notifications as read
app.post('/notifications/mark-all-read', isLoggedIn, async (req, res) => {
  try {
    await notificationModel.updateMany(
      { userId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications' });
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

// Get all students working on mentor's tasks
app.get('/mentor/students', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'mentor') {
      return res.status(403).json({ error: 'Access denied. Mentors only.' });
    }

    const tasks = await taskModel.find({ mentorId: req.user.id });
    const taskIds = tasks.map(t => t._id);

    const submissions = await submissionModel
      .find({ 
        taskId: { $in: taskIds }, 
        status: { $in: ['in-progress', 'submitted', 'reviewed'] }
      })
      .populate('studentId', 'name email education skills githubUrl totalPoints')
      .populate('taskId', 'title difficulty totalPoints')
      .populate({
        path: 'teamId',
        select: 'name members',
        populate: { path: 'members', select: 'name email' }
      });

    // Group by task
    const taskStudentMap = {};
    for (const sub of submissions) {
      const taskKey = sub.taskId?._id?.toString();
      if (!taskKey) continue;
      if (!taskStudentMap[taskKey]) {
        taskStudentMap[taskKey] = {
          task: sub.taskId,
          students: []
        };
      }
      taskStudentMap[taskKey].students.push({
        student: sub.studentId,
        status: sub.status,
        appliedAt: sub.appliedAt,
        submittedAt: sub.submittedAt,
        totalScore: sub.totalScore,
        team: sub.teamId,
        applyAs: sub.applyAs
      });
    }

    const taskStudents = Object.values(taskStudentMap);
    const totalStudents = new Set(submissions.map(s => s.studentId?._id?.toString())).size;

    res.json({ success: true, taskStudents, totalStudents });
  } catch (err) {
    console.error('Get mentor students error:', err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// ========== LEADERBOARD ==========

// Get student leaderboard
app.get('/leaderboard', isLoggedIn, async (req, res) => {
  try {
    const students = await userModel
      .find({ role: 'student' })
      .select('name email education skills totalPoints profilePicture')
      .sort({ totalPoints: -1 })
      .limit(50);

    // Add rank and tasks completed count
    const leaderboard = [];
    for (let i = 0; i < students.length; i++) {
      const tasksCompleted = await submissionModel.countDocuments({ 
        studentId: students[i]._id, 
        status: 'reviewed' 
      });
      leaderboard.push({
        ...students[i].toObject(),
        rank: i + 1,
        tasksCompleted
      });
    }

    res.json({ success: true, leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get student points breakdown
app.get('/student/points-breakdown', isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Students only.' });
    }

    const reviewed = await submissionModel
      .find({ studentId: req.user.id, status: 'reviewed' })
      .populate('taskId', 'title difficulty totalPoints')
      .sort({ reviewedAt: -1 });

    const breakdown = reviewed.map(s => ({
      taskTitle: s.taskId?.title || 'Unknown Task',
      difficulty: s.taskId?.difficulty || 'Medium',
      maxPoints: s.taskId?.totalPoints || 100,
      earnedPoints: s.totalScore || 0,
      reviewedAt: s.reviewedAt,
      feedback: s.feedback
    }));

    // Get rank
    const user = await userModel.findById(req.user.id).select('totalPoints');
    const rank = await userModel.countDocuments({ 
      role: 'student', 
      totalPoints: { $gt: user.totalPoints } 
    }) + 1;

    res.json({ 
      success: true, 
      breakdown, 
      totalPoints: user.totalPoints, 
      rank 
    });
  } catch (err) {
    console.error('Points breakdown error:', err);
    res.status(500).json({ error: 'Failed to fetch points breakdown' });
  }
});



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
    
    // Add points to student's totalPoints
    if (totalScore > 0) {
      let userIdsToUpdate = [submission.studentId];
      
      if (submission.applyAs === 'team' && submission.teamId) {
        const team = await teamModel.findById(submission.teamId);
        if (team && team.members && team.members.length > 0) {
          userIdsToUpdate = team.members;
        }
      }

      const pointsPerPerson = Math.floor(totalScore / userIdsToUpdate.length);

      await userModel.updateMany(
        { _id: { $in: userIdsToUpdate } },
        { $inc: { totalPoints: pointsPerPerson } }
      );
      
      // Recalculate ranks for all students
      const rankedStudents = await userModel
        .find({ role: 'student' })
        .sort({ totalPoints: -1 })
        .select('_id');
      
      const bulkOps = rankedStudents.map((student, index) => ({
        updateOne: {
          filter: { _id: student._id },
          update: { rank: index + 1 }
        }
      }));
      if (bulkOps.length > 0) {
        await userModel.bulkWrite(bulkOps);
      }
      
      // --- Badge Auto-Awarding Logic for all involved users ---
      for (const userId of userIdsToUpdate) {
        const studentUser = await userModel.findById(userId);
        if (!studentUser) continue;
        
        // Count how many tasks this user has completed
        // For teams, we need to count individual + team submissions
        const userTeams = await teamModel.find({ members: userId }).select('_id');
        const teamIds = userTeams.map(t => t._id);
        
        const completedCount = await submissionModel.countDocuments({
          $or: [
            { studentId: userId, applyAs: 'individual', status: 'reviewed' },
            { teamId: { $in: teamIds }, status: 'reviewed' }
          ]
        });
        
        const newBadges = [];
        const awardBadge = async (name, description, icon, type, threshold) => {
          let badge = await badgeModel.findOne({ name });
          if (!badge) {
            badge = await badgeModel.create({ 
              name, 
              description, 
              icon,
              criteria: { type, threshold }
            });
          }
          if (!studentUser.badges.includes(badge._id)) {
            studentUser.badges.push(badge._id);
            newBadges.push(badge.name);
          }
        };

        if (completedCount >= 1) await awardBadge('First Steps', 'Completed your first task', 'star', 'first_task', 1);
        if (completedCount >= 3) await awardBadge('Rising Star', 'Completed 3 tasks', 'flame', 'tasks_completed', 3);
        if (completedCount >= 5) await awardBadge('Task Master', 'Completed 5 tasks', 'trophy', 'tasks_completed', 5);
        if (studentUser.totalPoints >= 100) await awardBadge('Century Club', 'Earned 100+ points', 'award', 'mentor_score', 100);
        if (studentUser.totalPoints >= 500) await awardBadge('Point Prodigy', 'Earned 500+ points', 'crown', 'mentor_score', 500);
        
        if (newBadges.length > 0) {
          await studentUser.save();
          for (const bName of newBadges) {
            await notificationModel.create({
              userId: studentUser._id,
              type: 'badge_earned',
              title: 'New Badge Earned!',
              message: `Congratulations! You've earned the "${bName}" badge.`,
              isRead: false
            });
          }
        }
        
        // Notify the student
        await notificationModel.create({
          userId: studentUser._id,
          type: 'submission_reviewed',
          title: 'Your submission has been reviewed',
          message: `Your submission for "${submission.taskId.title}" has been evaluated. Score: ${pointsPerPerson}. Points added to your profile!`,
          relatedTaskId: submission.taskId._id,
          relatedUserId: req.user.id,
          isRead: false
        });
      }
    }
    

    
    res.json({ success: true, message: 'Submission evaluated', submission });
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate submission' });
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
      let modified = false;
      if (!user.googleId) {
        user.googleId = uid;
        user.authProvider = user.authProvider === 'local' ? 'local' : 'google';
        modified = true;
      }
      if (picture && !user.profilePicture) {
        user.profilePicture = picture;
        modified = true;
      }
      if (modified) {
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
        profilePicture: picture || '',
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

// Get user's top posts (ordered by likes)
app.get('/profile/:id/top-posts', isLoggedIn, async (req, res) => {
  try {
    const posts = await postModel.aggregate([
      { $match: { authorId: new mongoose.Types.ObjectId(req.params.id) } },
      { $addFields: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate author info if needed, though we already have it from profile
    await postModel.populate(posts, { path: 'authorId', select: 'name profilePicture role company jobRole education' });
    
    res.json({ success: true, posts });
  } catch (err) {
    console.error('Failed to fetch top posts:', err);
    res.status(500).json({ error: 'Failed to fetch top posts' });
  }
});

// ========== ALUMNI NETWORK APIs ==========

// Get alumni directory (all mentors)
app.get('/alumni/directory', isLoggedIn, async (req, res) => {
  try {
    const { q } = req.query;
    let filter = { role: 'mentor' };
    
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      filter = {
        role: 'mentor',
        $or: [
          { name: searchRegex },
          { company: searchRegex },
          { expertise: { $elemMatch: searchRegex } },
          { bio: searchRegex },
          { jobRole: searchRegex }
        ]
      };
    }
    
    const alumni = await userModel
      .find(filter)
      .select('name email company jobRole expertise bio yearsOfExperience linkedinUrl githubUrl createdAt')
      .sort({ name: 1 });
    
    // Get task counts for each mentor
    const alumniWithStats = await Promise.all(alumni.map(async (mentor) => {
      const taskCount = await taskModel.countDocuments({ mentorId: mentor._id });
      const taskIds = (await taskModel.find({ mentorId: mentor._id }).select('_id')).map(t => t._id);
      const studentsHelped = await submissionModel.countDocuments({
        taskId: { $in: taskIds },
        status: { $in: ['in-progress', 'reviewed'] }
      });
      return {
        ...mentor.toObject(),
        taskCount,
        studentsHelped
      };
    }));
    
    res.json({ success: true, alumni: alumniWithStats });
  } catch (err) {
    console.error('Alumni directory error:', err);
    res.status(500).json({ error: 'Failed to fetch alumni directory' });
  }
});

// Send a direct message to another user
app.post('/alumni/message', isLoggedIn, async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    
    if (!receiverId || !message || !message.trim()) {
      return res.status(400).json({ error: 'Receiver and message are required' });
    }
    
    const receiver = await userModel.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const savedMessage = await alumniMessageModel.create({
      senderId: req.user.id,
      receiverId,
      message: message.trim()
    });
    
    // Send real-time notification
    const sender = await userModel.findById(req.user.id).select('name');
    io.to(`user-${receiverId}`).emit('new-direct-message', {
      _id: savedMessage._id,
      senderId: req.user.id,
      senderName: sender.name,
      message: message.trim(),
      createdAt: savedMessage.createdAt
    });
    
    res.json({ success: true, message: 'Message sent', data: savedMessage });
  } catch (err) {
    console.error('Send alumni message error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get messages with a specific user
app.get('/alumni/messages/:userId', isLoggedIn, async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    
    const messages = await alumniMessageModel
      .find({
        $or: [
          { senderId: req.user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: req.user.id }
        ]
      })
      .sort({ createdAt: 1 })
      .limit(100);
    
    // Mark received messages as read
    await alumniMessageModel.updateMany(
      { senderId: otherUserId, receiverId: req.user.id, isRead: false },
      { isRead: true }
    );
    
    res.json({ success: true, messages });
  } catch (err) {
    console.error('Get alumni messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get list of conversations (users you've messaged with)
app.get('/alumni/conversations', isLoggedIn, async (req, res) => {
  try {
    const sent = await alumniMessageModel.distinct('receiverId', { senderId: req.user.id });
    const received = await alumniMessageModel.distinct('senderId', { receiverId: req.user.id });
    
    const uniqueUserIds = [...new Set([...sent.map(String), ...received.map(String)])];
    
    const users = await userModel
      .find({ _id: { $in: uniqueUserIds } })
      .select('name email company jobRole role');
    
    const conversations = await Promise.all(users.map(async (user) => {
      const lastMessage = await alumniMessageModel
        .findOne({
          $or: [
            { senderId: req.user.id, receiverId: user._id },
            { senderId: user._id, receiverId: req.user.id }
          ]
        })
        .sort({ createdAt: -1 });
      
      const unreadCount = await alumniMessageModel.countDocuments({
        senderId: user._id,
        receiverId: req.user.id,
        isRead: false
      });
      
      return {
        user: user.toObject(),
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          createdAt: lastMessage.createdAt,
          isMine: lastMessage.senderId.toString() === req.user.id
        } : null,
        unreadCount
      };
    }));
    
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || 0;
      const bTime = b.lastMessage?.createdAt || 0;
      return new Date(bTime) - new Date(aTime);
    });
    
    res.json({ success: true, conversations });
  } catch (err) {
    console.error('Get conversations error:', err);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

/* ---------------- COMMUNITY FEED ROUTES ---------------- */

// Get all posts
app.get('/community/posts', isLoggedIn, async (req, res) => {
  try {
    const posts = await postModel
      .find()
      .populate('authorId', 'name email profilePicture role company jobRole education')
      .populate('comments.userId', 'name profilePicture')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, posts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post by ID
app.get('/community/posts/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id)
      .populate('authorId', 'name email profilePicture role company jobRole education')
      .populate('comments.userId', 'name profilePicture');
      
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json({ success: true, post });
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create a new post
app.post('/community/posts', isLoggedIn, async (req, res) => {
  try {
    const { content, image, codeSnippet, category } = req.body;
    
    if (!content && !image && !codeSnippet) {
      return res.status(400).json({ error: 'Post must contain some content' });
    }
    
    const newPost = await postModel.create({
      authorId: req.user.id,
      content,
      image,
      codeSnippet,
      category: category || 'General'
    });
    
    const populatedPost = await postModel.findById(newPost._id)
      .populate('authorId', 'name email profilePicture role company jobRole education');
      
    res.json({ success: true, post: populatedPost });
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ error: err.message || 'Failed to create post' });
  }
});

// Like/Unlike a post
app.post('/community/posts/:id/like', isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id); // Like
    } else {
      post.likes.splice(index, 1); // Unlike
    }
    
    await post.save();
    res.json({ success: true, likes: post.likes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Comment on a post
app.post('/community/posts/:id/comment', isLoggedIn, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
    
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.comments.push({
      userId: req.user.id,
      text: text.trim()
    });
    
    await post.save();
    
    // Return populated post to update UI
    const updatedPost = await postModel.findById(post._id)
      .populate('authorId', 'name email profilePicture role company jobRole education')
      .populate('comments.userId', 'name profilePicture');
      
    res.json({ success: true, post: updatedPost });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a post
app.delete('/community/posts/:id', isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Check if the current user is the author
    if (post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }
    
    await postModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Delete a comment
app.delete('/community/posts/:postId/comments/:commentId', isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    // Allow if user is the comment author or the post author
    if (comment.userId.toString() !== req.user.id && post.authorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }
    
    // Remove the comment
    post.comments.pull(req.params.commentId);
    await post.save();
    
    // Return populated post
    const updatedPost = await postModel.findById(post._id)
      .populate('authorId', 'name email profilePicture role company jobRole education')
      .populate('comments.userId', 'name profilePicture');
      
    res.json({ success: true, post: updatedPost });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
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
