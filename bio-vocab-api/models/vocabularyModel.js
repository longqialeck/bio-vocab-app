const mongoose = require('mongoose');

const vocabularySchema = mongoose.Schema(
  {
    term: {
      type: String,
      required: [true, 'Please add a term'],
      trim: true
    },
    definition: {
      type: String,
      required: [true, 'Please add a definition'],
      trim: true
    },
    foreignTerm: {
      type: String,
      default: '',
      trim: true
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium'
    },
    tags: [String]
  },
  {
    timestamps: true
  }
);

// Indexes for better performance
vocabularySchema.index({ term: 1, moduleId: 1 }, { unique: true });
vocabularySchema.index({ moduleId: 1 });

module.exports = mongoose.model('Vocabulary', vocabularySchema); 