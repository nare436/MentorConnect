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
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);