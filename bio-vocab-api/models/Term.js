const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const progressSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'learning', 'reviewing', 'mastered'],
    default: 'new'
  },
  correctCount: {
    type: Number,
    default: 0
  },
  incorrectCount: {
    type: Number,
    default: 0
  },
  lastReviewed: {
    type: Date
  },
  nextReviewDate: {
    type: Date
  }
}, { _id: false });

const termSchema = new Schema({
  english: {
    type: String,
    required: true,
    trim: true
  },
  chinese: {
    type: String,
    required: true,
    trim: true
  },
  pinyin: {
    type: String,
    trim: true
  },
  definition: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  examples: [
    {
      sentence: {
        type: String,
        trim: true
      },
      translation: {
        type: String,
        trim: true
      }
    }
  ],
  imageUrl: {
    type: String,
    trim: true
  },
  audioUrl: {
    type: String,
    trim: true
  },
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  difficultyLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  tags: [
    {
      type: String,
      trim: true
    }
  ],
  learningProgress: [progressSchema],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to update the updatedAt timestamp
termSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for efficient queries
termSchema.index({ moduleId: 1 });
termSchema.index({ english: 1, moduleId: 1 }, { unique: true });
termSchema.index({ chinese: 1 });
termSchema.index({ tags: 1 });

// Instance method to update a user's learning progress
termSchema.methods.updateProgress = async function(userId, status, isCorrect) {
  const progressIndex = this.learningProgress.findIndex(
    p => p.userId.toString() === userId.toString()
  );
  
  if (progressIndex === -1) {
    // Create new progress record
    this.learningProgress.push({
      userId,
      status,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
      lastReviewed: new Date(),
      nextReviewDate: calculateNextReviewDate(status, 0)
    });
  } else {
    // Update existing progress
    const progress = this.learningProgress[progressIndex];
    progress.status = status;
    progress.lastReviewed = new Date();
    
    if (isCorrect) {
      progress.correctCount += 1;
    } else {
      progress.incorrectCount += 1;
    }
    
    // Calculate spaced repetition for next review
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    progress.nextReviewDate = calculateNextReviewDate(status, totalAttempts);
  }
  
  await this.save();
  return this;
};

// Calculate next review date based on spaced repetition algorithm
function calculateNextReviewDate(status, attempts) {
  const now = new Date();
  let daysToAdd = 0;
  
  switch (status) {
    case 'new':
      daysToAdd = 1;
      break;
    case 'learning':
      daysToAdd = attempts > 3 ? 2 : 1;
      break;
    case 'reviewing':
      // Exponential backoff based on attempts
      daysToAdd = Math.min(Math.pow(2, Math.floor(attempts / 2)), 14);
      break;
    case 'mastered':
      daysToAdd = 30; // Review mastered terms once a month
      break;
    default:
      daysToAdd = 1;
  }
  
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysToAdd);
  return nextDate;
}

// Static method to get terms due for review for a specific user
termSchema.statics.getDueForReview = async function(userId) {
  const now = new Date();
  
  return this.find({
    learningProgress: {
      $elemMatch: {
        userId,
        nextReviewDate: { $lte: now },
        status: { $ne: 'mastered' }
      }
    }
  }).limit(20).sort('learningProgress.nextReviewDate');
};

// Static method to get user's mastery statistics for all terms
termSchema.statics.getUserStats = async function(userId) {
  const totalTerms = await this.countDocuments();
  
  const stats = await this.aggregate([
    {
      $unwind: {
        path: '$learningProgress',
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $match: {
        'learningProgress.userId': mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$learningProgress.status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Convert the results into a more usable format
  const result = {
    totalTerms,
    mastered: 0,
    reviewing: 0,
    learning: 0,
    new: 0,
    notStarted: totalTerms
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.notStarted -= stat.count;
  });
  
  return result;
};

const Term = mongoose.model('Term', termSchema);

module.exports = Term; 