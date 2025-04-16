const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const { connectDB, sequelize } = require('./config/db');
const models = require('./models');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

// 初始化Express应用
const app = express();

// 中间件
app.use(express.json());
app.use(cors());
app.use(helmet());

// 日志
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 静态文件
app.use('/uploads', express.static('uploads'));

// 数据库同步（开发环境）
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: true }).then(() => {
    console.log('数据库表已同步');
    
    // 确保logs表存在（手动创建防止Sequelize自动同步可能的问题）
    sequelize.query(`
      CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        type VARCHAR(20),
        level VARCHAR(15),
        message VARCHAR(500),
        userId INT,
        userName VARCHAR(50),
        ip VARCHAR(45),
        details TEXT,
        INDEX logs_timestamp_idx (timestamp),
        INDEX logs_type_idx (type),
        INDEX logs_level_idx (level)
      )
    `).then(() => {
      console.log('日志表已准备就绪');
    }).catch(err => {
      console.error('创建日志表失败:', err);
    });
    
    // 初始化设置表
    const settingsController = require('./controllers/settingsController');
    settingsController.initSettingsTable().catch(err => {
      console.error('初始化设置表失败:', err);
    });
  }).catch(err => {
    console.error('数据库同步出错:', err);
  });
}

// 引入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const moduleRoutes = require('./routes/modules');
const termRoutes = require('./routes/terms');
const progressRoutes = require('./routes/progress');
const vocabRoutes = require('./routes/vocabularyRoutes');
const logRoutes = require('./routes/logs');
const settingsRoutes = require('./routes/settings');

// 引入日志控制器
const logger = require('./controllers/logController');

// 创建IP地址获取中间件
app.use((req, res, next) => {
  // 获取客户端IP地址
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  req.clientIp = ip;
  next();
});

// API根路由
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Bio Vocab API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV
  });
});

// 注册API路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/terms', termRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/vocabulary', vocabRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/settings', settingsRoutes);

// 主页
app.get('/', (req, res) => {
  res.json({ message: 'BioVocab API 服务已启动' });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // 记录错误日志
  logger.logSystem('error', `服务器错误: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.clientIp
  }).catch(logErr => {
    console.error('记录错误日志失败:', logErr);
  });
  
  res.status(500).json({
    message: '服务器内部错误'
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 