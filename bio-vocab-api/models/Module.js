const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moduleSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  gradeLevel: {
    type: String,
    required: true,
    enum: ['7', '8', '9', '10', '11', '12', 'college']
  },
  difficulty: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  category: {
    type: String,
    required: true,
    enum: ['植物学', '动物学', '生态学', '分子生物学', '人体解剖学', '遗传学', '综合', '其他'],
    default: '综合'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedToGrades: [{
    type: String,
    enum: ['初一', '初二', '初三', '高一', '高二', '高三', '大学', '其他']
  }],
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
moduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create index for efficient queries
moduleSchema.index({ name: 1 }, { unique: true });
moduleSchema.index({ gradeLevel: 1 });
moduleSchema.index({ difficulty: 1 });
moduleSchema.index({ category: 1 });
moduleSchema.index({ isActive: 1 });

// Static method to get modules with term counts
moduleSchema.statics.getModulesWithTermCounts = async function(filter = {}) {
  const Term = mongoose.model('Term');
  
  // First get all modules matching the filter
  const modules = await this.find(filter).lean();
  
  // Get term counts for all modules in a single query
  const termCounts = await Term.aggregate([
    {
      $match: {
        moduleId: { 
          $in: modules.map(m => m._id) 
        }
      }
    },
    {
      $group: {
        _id: '$moduleId',
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Create a map of module ID to term count for efficient lookup
  const countMap = {};
  termCounts.forEach(item => {
    countMap[item._id.toString()] = item.count;
  });
  
  // Add term count to each module
  modules.forEach(module => {
    module.termCount = countMap[module._id.toString()] || 0;
  });
  
  return modules;
};

// Method to get module statistics
moduleSchema.methods.getStats = async function() {
  const Term = mongoose.model('Term');
  
  const termCount = await Term.countDocuments({ moduleId: this._id });
  
  // Get user progress stats for this module
  const progressStats = await Term.aggregate([
    {
      $match: { moduleId: this._id }
    },
    {
      $unwind: {
        path: '$learningProgress',
        preserveNullAndEmptyArrays: false
      }
    },
    {
      $group: {
        _id: {
          userId: '$learningProgress.userId',
          status: '$learningProgress.status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.userId',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalReviewed: { $sum: '$count' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        username: '$user.username',
        statuses: 1,
        totalReviewed: 1,
        completionPercentage: {
          $multiply: [
            { $divide: ['$totalReviewed', termCount] },
            100
          ]
        }
      }
    }
  ]);
  
  return {
    termCount,
    userProgress: progressStats
  };
};

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module; 