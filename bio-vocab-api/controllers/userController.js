const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 生成JWT令牌
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// 用户登录
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('尝试登录:', { email, passwordLength: password?.length });
    
    // 查找用户
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('用户未找到:', email);
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    console.log('找到用户:', { 
      id: user._id, 
      name: user.name, 
      isAdmin: user.isAdmin,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });
    
    // 检查账户是否被锁定
    if (user.isAccountLocked()) {
      console.log('账户被锁定:', { 
        isLocked: user.isLocked, 
        failedAttempts: user.failedLoginAttempts, 
        lockUntil: user.lockUntil 
      });
      
      let remainingTime = 0;
      
      if (user.lockUntil) {
        remainingTime = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      }
      
      if (remainingTime > 0) {
        return res.status(401).json({ 
          message: `账户已被锁定，请${remainingTime}分钟后再试` 
        });
      } else {
        return res.status(401).json({ 
          message: '账户已被锁定，请联系管理员解锁' 
        });
      }
    }
    
    // 检查密码
    console.log('验证密码...');
    const isMatch = await user.matchPassword(password);
    console.log('密码验证结果:', isMatch);
    
    if (!isMatch) {
      // 增加失败尝试次数
      await user.incrementLoginAttempts();
      
      // 获取剩余尝试次数
      const remainingAttempts = 5 - user.failedLoginAttempts;
      console.log('密码不匹配，已增加失败尝试次数:', { 
        failedAttempts: user.failedLoginAttempts, 
        remainingAttempts 
      });
      
      if (remainingAttempts <= 0) {
        return res.status(401).json({ 
          message: '账户已被锁定，请联系管理员解锁' 
        });
      }
      
      return res.status(401).json({ 
        message: `邮箱或密码错误，还有${remainingAttempts}次尝试机会` 
      });
    }
    
    // 登录成功，重置失败尝试次数
    await user.resetLoginAttempts();
    
    // 更新最后登录时间
    user.lastLogin = Date.now();
    await user.save();
    
    console.log('登录成功，返回用户信息和token');
    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        gradeLevel: user.gradeLevel,
        isAdmin: user.isAdmin,
        progress: user.progress
      },
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('登录过程发生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gradeLevel: user.gradeLevel,
      isAdmin: user.isAdmin,
      progress: user.progress
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有用户 (管理员功能)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 新增用户 (管理员功能)
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, gradeLevel, isAdmin } = req.body;
    
    // 检查邮箱是否存在
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '此邮箱已注册' });
    }
    
    // 创建用户
    const user = await User.create({
      name,
      email,
      password,
      gradeLevel,
      isAdmin: isAdmin || false
    });
    
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gradeLevel: user.gradeLevel,
      isAdmin: user.isAdmin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新用户 (管理员功能)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.gradeLevel = req.body.gradeLevel || user.gradeLevel;
    
    if (req.body.isAdmin !== undefined) {
      user.isAdmin = req.body.isAdmin;
    }
    
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      gradeLevel: updatedUser.gradeLevel,
      isAdmin: updatedUser.isAdmin
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除用户 (管理员功能)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    await user.remove();
    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 重置用户密码 (管理员功能)
exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: '新密码至少需要6个字符' });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 设置新密码
    user.password = newPassword;
    await user.save();
    
    res.json({ message: '密码已重置' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 解锁用户账户 (管理员功能)
exports.unlockAccount = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 重置失败尝试次数并解锁
    await user.resetLoginAttempts();
    
    res.json({ message: '账户已解锁' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 