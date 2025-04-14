const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const logger = require('../controllers/logController');

// 保护路由中间件
exports.protect = async (req, res, next) => {
  let token;

  // 从请求头中获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    // 记录安全日志
    try {
      await logger.logSecurity('warning', '访问受保护路由无令牌', null, null, req.clientIp, {
        path: req.path,
        method: req.method
      });
    } catch (logErr) {
      console.error('记录安全日志失败:', logErr);
    }
    
    return res.status(401).json({ message: '无权访问，请先登录' });
  }

  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 检查用户是否存在
    const user = await User.findByPk(decoded.id);

    if (!user) {
      // 记录安全日志
      try {
        await logger.logSecurity('warning', '使用有效令牌但用户不存在', decoded.id, null, req.clientIp, {
          path: req.path,
          method: req.method
        });
      } catch (logErr) {
        console.error('记录安全日志失败:', logErr);
      }
      
      return res.status(401).json({ message: '用户不存在' });
    }

    // 检查账户是否被锁定
    if (user.isLocked) {
      // 记录安全日志
      try {
        await logger.logSecurity('warning', '锁定用户尝试访问', user.id, user.name, req.clientIp, {
          path: req.path,
          method: req.method
        });
      } catch (logErr) {
        console.error('记录安全日志失败:', logErr);
      }
      
      return res.status(403).json({ message: '您的账户已被锁定，请联系管理员' });
    }

    // 设置req.user为已验证的用户
    req.user = user;

    // 记录用户活动
    user.lastActivity = new Date();
    await user.save();

    next();
  } catch (error) {
    // 记录安全日志
    try {
      await logger.logSecurity('warning', `令牌验证失败: ${error.message}`, null, null, req.clientIp, {
        path: req.path,
        method: req.method,
        error: error.message
      });
    } catch (logErr) {
      console.error('记录安全日志失败:', logErr);
    }
    
    res.status(401).json({ message: '令牌无效或已过期' });
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