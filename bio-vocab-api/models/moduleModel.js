const mongoose = require('mongoose');

const moduleSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a module name'],
      trim: true,
      unique: true
    },
    // Keep title for backward compatibility
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    gradeLevel: {
      type: String,
      required: true,
      enum: ['7', '8', '9', '10', '11', '12', 'college', '初一', '初二', '初三', '高一', '高二', '高三', '大学', '其他']
    },
    difficulty: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },
    category: {
      type: String,
      enum: ['植物学', '动物学', '生态学', '分子生物学', '人体解剖学', '遗传学', '综合', '其他'],
      default: '综合'
    },
    order: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    coverImage: {
      type: String,
      default: ''
    },
    assignedToGrades: [{
      type: String,
      enum: ['初一', '初二', '初三', '高一', '高二', '高三', '大学', '其他']
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Pre-save middleware to update the updatedAt timestamp and sync title/name
moduleSchema.pre('save', function(next) {
  // Sync title and name fields for backward compatibility
  if (this.isModified('name') && this.name) {
    this.title = this.name;
  } else if (this.isModified('title') && this.title) {
    this.name = this.title;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for better performance
moduleSchema.index({ name: 1 });
moduleSchema.index({ title: 1 });
moduleSchema.index({ gradeLevel: 1 });
moduleSchema.index({ category: 1 });
moduleSchema.index({ isActive: 1 });

module.exports = mongoose.model('Module', moduleSchema); 