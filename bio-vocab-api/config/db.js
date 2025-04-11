const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// 确保加载环境变量
dotenv.config();

// 打印连接信息 (开发调试用)
console.log('数据库连接信息:', {
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306
});

// 创建 Sequelize 实例
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// 测试数据库连接
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL 数据库连接成功');
  } catch (error) {
    console.error(`MySQL 数据库连接错误: ${error.message}`);
    // 不要退出进程，允许应用程序继续运行
    // process.exit(1);
  }
};

module.exports = { sequelize, connectDB }; 