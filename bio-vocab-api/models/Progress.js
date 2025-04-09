const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  completedTerms: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Term'
  }],
  progress: {
    type: Number,
    default: 0
  },
  lastStudied: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Progress', ProgressSchema); 