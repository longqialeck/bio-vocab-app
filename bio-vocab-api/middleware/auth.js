const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const logger = require('../controllers/logController');

// 保护路由中间件
exports.protect = async (req, res, next) => {
  try {
    let token;
    
    // 记录请求头信息
    console.log('请求头:', {
      authorization: req.headers.authorization ? '存在' : '不存在',
      cookie: req.headers.cookie ? '存在' : '不存在'
    });

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      console.log('未找到token');
      return res.status(401).json({ message: '未授权访问' });
    }

    // 记录token信息
    console.log('Token信息:', {
      length: token.length,
      prefix: token.substring(0, 10) + '...',
      secret: process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 5) + '...' : '未设置'
    });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token验证成功:', {
        userId: decoded.id,
        exp: new Date(decoded.exp * 1000).toISOString()
      });
      
      const user = await User.findByPk(decoded.id);
      if (!user) {
        console.log('用户不存在:', decoded.id);
        return res.status(401).json({ message: '用户不存在' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      console.log('Token验证失败:', {
        error: error.message,
        name: error.name,
        stack: error.stack
      });
      return res.status(401).json({ message: '令牌无效或已过期' });
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    return res.status(500).json({ message: '服务器错误' });
  }
};

// 管理员权限中间件
exports.admin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    // 记录安全日志
    logger.logSecurity('warning', '非管理员尝试访问管理员资源', 
      req.user ? req.user.id : null, 
      req.user ? req.user.name : null, 
      req.clientIp, {
        path: req.path,
        method: req.method
      }).catch(err => console.error('记录安全日志失败:', err));
    
    return res.status(403).json({ message: '需要管理员权限' });
  }
  
  // 记录管理员活动（仅用于敏感操作）
  if (req.method !== 'GET') {
    logger.logSecurity('info', `管理员执行操作: ${req.method} ${req.path}`, 
      req.user.id, req.user.name, req.clientIp, {
        path: req.path,
        method: req.method,
        body: req.method === 'GET' ? null : req.body
      }).catch(err => console.error('记录管理员活动日志失败:', err));
  }
  
  next();
}; 