// User model for both students and mentors
const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  // Basic info
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() { return this.authProvider === 'local'; }
    // Only required for local (email/password) signups
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'mentor'],
    default: 'student'
  },
  
  // Profile info (common)
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  githubUrl: {
    type: String,
    default: ''
  },
  linkedinUrl: {
    type: String,
    default: ''
  },
  socialLinks: [{
    platform: String,
    url: String
  }],
  
  // Student-specific fields
  skills: {
    type: [String],
    default: []
  },
  education: {
    type: String,
    default: ''
  },
  githubUsername: {
    type: String,
    default: ''
  },
  badges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  
  // Mentor-specific fields
  company: {
    type: String,
    default: ''
  },
  jobRole: {
    type: String,
    default: ''
  },
  expertise: {
    type: [String],
    default: []
  },
  yearsOfExperience: {
    type: String,
    default: ''
  },
  
  // Points & Ranking (for students)
  totalPoints: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Follow System
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('User', userSchema);