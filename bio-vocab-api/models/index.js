const { sequelize } = require('../config/db');
const Sequelize = require('sequelize');

// 直接导入模型（模型已在各自文件中定义）
const User = require('./User');
const Module = require('./Module');
const Term = require('./Term');
const TermProgress = require('./TermProgress');
const Progress = require('./Progress');
const Log = require('./Log');

// Define associations
// User - Module associations
User.hasMany(Module, { foreignKey: 'createdById' });
Module.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// User - Progress associations
User.hasMany(Progress, { foreignKey: 'userId' });
Progress.belongsTo(User, { foreignKey: 'userId' });

// Module - Term associations
Module.hasMany(Term, { foreignKey: 'moduleId' });
Term.belongsTo(Module, { foreignKey: 'moduleId' });

// Module - Progress associations  
Module.hasMany(Progress, { foreignKey: 'moduleId' });
Progress.belongsTo(Module, { foreignKey: 'moduleId' });

// User - TermProgress associations
User.hasMany(TermProgress, { foreignKey: 'userId' });
TermProgress.belongsTo(User, { foreignKey: 'userId' });

// Term - TermProgress associations
Term.hasMany(TermProgress, { foreignKey: 'termId' });
TermProgress.belongsTo(Term, { foreignKey: 'termId' });

// User - Term associations (creator)
User.hasMany(Term, { foreignKey: 'createdById' });
Term.belongsTo(User, { foreignKey: 'createdById', as: 'createdBy' });

// 确保从Log到User的外键关联正确设置
Log.belongsTo(User, { foreignKey: 'userId', constraints: false });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Module,
  Term,
  TermProgress,
  Progress,
  Log
}; 