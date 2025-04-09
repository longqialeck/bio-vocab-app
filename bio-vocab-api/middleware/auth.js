const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 保护路由 - 确保用户已登录
exports.protect = async (req, res, next) => {
  let token;
  
  // 从请求头或cookie中获取token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // 检查token是否存在
  if (!token) {
    return res.status(401).json({ message: '未授权，请登录' });
  }
  
  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 获取用户信息
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: '无效的token，用户不存在' });
    }
    
    // 将用户信息附加到请求对象
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: '未授权，请登录' });
  }
};

// 管理员权限中间件
exports.admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: '权限不足，需要管理员权限' });
  }
}; 