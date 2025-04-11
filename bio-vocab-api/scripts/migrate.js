require('dotenv').config();
const { sequelize } = require('../config/db');
const models = require('../models');

const migrate = async () => {
  try {
    console.log('开始数据库迁移...');
    
    // 同步数据库结构（强制创建所有表）
    await sequelize.sync({ force: true });
    
    console.log('数据库迁移完成！所有表已创建');
    process.exit(0);
  } catch (error) {
    console.error('数据库迁移出错:', error.message);
    process.exit(1);
  }
};

migrate(); 