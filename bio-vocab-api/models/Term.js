const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Term = sequelize.define('Term', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  english: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供英文词汇' }
    }
  },
  chinese: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供中文词汇' }
    }
  },
  pinyin: {
    type: DataTypes.STRING,
    allowNull: true
  },
  definition: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  examples: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  audioUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  moduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Modules',
      key: 'id'
    }
  },
  difficultyLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    validate: {
      min: { args: [1], msg: '难度最小为1' },
      max: { args: [5], msg: '难度最大为5' }
    }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['moduleId'] },
    { fields: ['english', 'moduleId'], unique: true },
    { fields: ['chinese'] }
  ]
});

// 实例方法：更新用户学习进度
Term.prototype.updateProgress = async function(userId, status, isCorrect) {
  const TermProgress = require('./TermProgress');
  
  // 查找或创建进度记录
  const [progress, created] = await TermProgress.findOrCreate({
    where: { 
      termId: this.id,
      userId: userId
    },
    defaults: {
      status: status,
      correctCount: isCorrect ? 1 : 0,
      incorrectCount: isCorrect ? 0 : 1,
      lastReviewed: new Date(),
      nextReviewDate: calculateNextReviewDate(status, 0)
    }
  });
  
  // 如果进度记录已存在，则更新
  if (!created) {
    progress.status = status;
    progress.lastReviewed = new Date();
    
    if (isCorrect) {
      progress.correctCount += 1;
    } else {
      progress.incorrectCount += 1;
    }
    
    const totalAttempts = progress.correctCount + progress.incorrectCount;
    progress.nextReviewDate = calculateNextReviewDate(status, totalAttempts);
    
    await progress.save();
  }
  
  return this;
};

// 静态方法：获取待复习的词汇
Term.getDueForReview = async function(userId) {
  const TermProgress = require('./TermProgress');
  const { Op } = require('sequelize');
  
  const now = new Date();
  
  const dueTerms = await Term.findAll({
    include: [{
      model: TermProgress,
      where: {
        userId: userId,
        nextReviewDate: { [Op.lte]: now },
        status: { [Op.ne]: 'mastered' }
      },
      required: true
    }],
    limit: 20,
    order: [[TermProgress, 'nextReviewDate', 'ASC']]
  });
  
  return dueTerms;
};

// 静态方法：获取用户学习统计
Term.getUserStats = async function(userId) {
  const TermProgress = require('./TermProgress');
  const { Op } = require('sequelize');
  
  // 获取总词汇数
  const totalTerms = await this.count();
  
  // 获取用户学习状态统计
  const stats = await TermProgress.findAll({
    where: { userId },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('status')), 'count']
    ],
    group: ['status']
  });
  
  // 处理统计结果
  const result = {
    totalTerms,
    mastered: 0,
    reviewing: 0,
    learning: 0,
    new: 0,
    notStarted: totalTerms
  };
  
  stats.forEach(stat => {
    result[stat.status] = parseInt(stat.getDataValue('count'), 10);
    result.notStarted -= parseInt(stat.getDataValue('count'), 10);
  });
  
  return result;
};

// 计算下次复习日期的辅助函数
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

module.exports = Term; 