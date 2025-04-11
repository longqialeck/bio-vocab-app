const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Module = sequelize.define('Module', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: '请提供模块名称' }
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  gradeLevel: {
    type: DataTypes.ENUM('7', '8', '9', '10', '11', '12', 'college', '初一', '初二', '初三', '高一', '高二', '高三', '大学', '其他'),
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供年级水平' }
    }
  },
  difficulty: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: '难度最小为1' },
      max: { args: [5], msg: '难度最大为5' }
    }
  },
  category: {
    type: DataTypes.ENUM('植物学', '动物学', '生态学', '分子生物学', '人体解剖学', '遗传学', '综合', '其他'),
    defaultValue: '综合'
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdById: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assignedToGrades: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (module) => {
      if (module.changed('name') && module.name) {
        module.title = module.name;
      } else if (module.changed('title') && module.title) {
        module.name = module.title;
      }
    }
  },
  indexes: [
    { fields: ['name'], unique: true },
    { fields: ['title'] },
    { fields: ['gradeLevel'] },
    { fields: ['difficulty'] },
    { fields: ['category'] },
    { fields: ['isActive'] }
  ]
});

// 静态方法
Module.getModulesWithTermCounts = async function(filter = {}) {
  const Term = require('./Term');
  
  const whereClause = { ...filter };
  
  // 查询所有符合条件的模块
  const modules = await this.findAll({
    where: whereClause,
    raw: true
  });
  
  // 如果没有找到模块，返回空数组
  if (!modules.length) return [];
  
  // 获取每个模块的词汇数量
  const termCounts = await sequelize.query(`
    SELECT moduleId, COUNT(*) as count
    FROM Terms
    WHERE moduleId IN (${modules.map(m => m.id).join(',')})
    GROUP BY moduleId
  `, { type: sequelize.QueryTypes.SELECT });
  
  // 创建模块ID到词汇数量的映射
  const countMap = {};
  termCounts.forEach(item => {
    countMap[item.moduleId] = item.count;
  });
  
  // 为每个模块添加词汇数量
  modules.forEach(module => {
    module.termCount = countMap[module.id] || 0;
  });
  
  return modules;
};

// 实例方法
Module.prototype.getStats = async function() {
  const Term = require('./Term');
  const TermProgress = require('./TermProgress');
  const User = require('./User');
  
  // 获取该模块的词汇总数
  const termCount = await Term.count({ where: { moduleId: this.id } });
  
  // 获取该模块的学习进度统计
  const progressStats = await User.findAll({
    attributes: ['id', 'name'],
    include: [{
      model: TermProgress,
      required: true,
      include: [{
        model: Term,
        required: true,
        where: { moduleId: this.id },
        attributes: []
      }],
      attributes: ['status']
    }],
    raw: false
  });
  
  // 处理统计数据
  const userStats = [];
  for (const user of progressStats) {
    const statuses = {};
    let totalReviewed = 0;
    
    for (const progress of user.TermProgresses) {
      const status = progress.status;
      statuses[status] = (statuses[status] || 0) + 1;
      totalReviewed++;
    }
    
    userStats.push({
      userId: user.id,
      username: user.name,
      statuses: Object.entries(statuses).map(([status, count]) => ({ status, count })),
      totalReviewed,
      completionPercentage: termCount > 0 ? (totalReviewed / termCount) * 100 : 0
    });
  }
  
  return {
    termCount,
    userProgress: userStats
  };
};

module.exports = Module; 