const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const connectDB = require('./config/db');

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

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/terms', require('./routes/terms'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/vocabulary', require('./routes/vocabularyRoutes'));

// 主页
app.get('/', (req, res) => {
  res.json({ message: 'BioVocab API 服务已启动' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 启动服务器
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
}); 