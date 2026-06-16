// Task model for projects posted by mentors
const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
  // Task details
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  totalPoints: {
    type: Number,
    default: 100
  },
  
  // Tags for filtering
  tags: {
    type: [String],
    default: []
  },
  
  // Difficulty level
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  
  // Rubric for evaluation
  rubric: [{
    criteria: String,
    points: Number
  }],
  
  // Mentor who created the task
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Task status
  status: {
    type: String,
    enum: ['active', 'closed', 'draft'],
    default: 'active'
  },
  
  // Stats
  applicants: {
    type: Number,
    default: 0
  },
  activeTeams: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);