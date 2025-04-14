const { User, Progress } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const logger = require('./logController');

// Calculate user learning streak
const calculateStreak = async (userId) => {
  try {
    // Get all progress entries sorted by lastStudied date
    const progresses = await Progress.findAll({
      where: { userId },
      order: [['lastStudied', 'DESC']]
    });
    
    if (!progresses || progresses.length === 0) {
      return 0;
    }
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the most recent study date
    const mostRecent = new Date(progresses[0].lastStudied);
    mostRecent.setHours(0, 0, 0, 0);
    
    // If user hasn't studied today or yesterday, streak is 0
    if ((today - mostRecent) / (1000 * 60 * 60 * 24) > 1) {
      return 0;
    }
    
    // Count consecutive study days
    let streak = 1;
    let currentDate = mostRecent;
    
    // If most recent is today, start checking from yesterday
    if (today.getTime() === currentDate.getTime()) {
      currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Group study dates by day
    const studyDates = new Set();
    progresses.forEach(progress => {
      const date = new Date(progress.lastStudied);
      date.setHours(0, 0, 0, 0);
      studyDates.add(date.getTime());
    });
    
    // Check consecutive days backwards
    while (true) {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      
      if (studyDates.has(prevDate.getTime())) {
        streak++;
        currentDate = prevDate;
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

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
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log('用户未找到:', email);
      return res.status(401).json({ message: '邮箱或密码错误' });
    }
    
    console.log('找到用户:', { 
      id: user.id, 
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
    await user.update({ lastLogin: new Date() });
    
    console.log('登录成功，返回用户信息和token');
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        gradeLevel: user.gradeLevel,
        isAdmin: user.isAdmin,
        progress: {
          wordsLearned: user.progressWordsLearned,
          totalWords: user.progressTotalWords,
          dailyGoal: user.progressDailyGoal,
          streak: user.progressStreak,
          quizCompletion: user.progressQuizCompletion || 0
        }
      },
      token: generateToken(user.id)
    });
  } catch (error) {
    console.error('登录过程发生错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      gradeLevel: user.gradeLevel,
      isAdmin: user.isAdmin,
      progress: {
        wordsLearned: user.progressWordsLearned,
        totalWords: user.progressTotalWords,
        dailyGoal: user.progressDailyGoal,
        streak: user.progressStreak,
        quizCompletion: user.progressQuizCompletion || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取当前登录用户的信息 (/users/me 端点)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      gradeLevel: user.gradeLevel,
      isAdmin: user.isAdmin,
      progress: {
        wordsLearned: user.progressWordsLearned,
        totalWords: user.progressTotalWords,
        dailyGoal: user.progressDailyGoal,
        streak: user.progressStreak,
        quizCompletion: user.progressQuizCompletion || 0
      }
    });
  } catch (error) {
    console.error('获取当前用户信息失败:', error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取所有用户 (管理员功能)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll();
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
    const userExists = await User.findOne({ where: { email } });
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
    
    // 记录管理操作日志
    logger.logUser('info', `管理员创建了新用户: ${user.name} (${user.email})`, 
      req.user.id, req.user.name, req.clientIp, {
        newUserId: user.id,
        isAdmin: user.isAdmin
      }).catch(err => console.error('记录日志失败:', err));
    
    res.status(201).json({
      id: user.id,
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
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.gradeLevel) updateData.gradeLevel = req.body.gradeLevel;
    if (req.body.isAdmin !== undefined) updateData.isAdmin = req.body.isAdmin;
    if (req.body.password) updateData.password = req.body.password;
    
    await user.update(updateData);
    
    const updatedUser = await User.findByPk(req.params.id);
    
    res.json({
      id: updatedUser.id,
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
    const user = await User.findByPk(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    await user.destroy();
    
    // 记录管理操作日志
    logger.logUser('warning', `管理员删除了用户: ${user.name} (${user.email})`, 
      req.user.id, req.user.name, req.clientIp, {
        deletedUserId: user.id,
        wasAdmin: user.isAdmin
      }).catch(err => console.error('记录日志失败:', err));
    
    res.json({ message: '用户已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户学习记录
exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 确保用户存在
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 获取用户的学习进度
    const stats = {
      wordsLearned: user.progressWordsLearned || 0,
      totalWords: user.progressTotalWords || 0,
      dailyGoal: user.progressDailyGoal || 5,
      streak: user.progressStreak || 0
    };
    
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 用户密码更新
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findByPk(req.user.id);
    
    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: '当前密码不正确' });
    }
    
    // 更新密码
    user.password = newPassword;
    await user.save();
    
    res.json({ message: '密码更新成功' });
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
    
    // 记录安全日志
    logger.logSecurity('warning', `管理员重置了用户密码: ${user.name} (${user.email})`, 
      req.user.id, req.user.name, req.clientIp, {
        targetUserId: user.id
      }).catch(err => console.error('记录日志失败:', err));
    
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
    
    // 记录安全日志
    logger.logSecurity('info', `管理员解锁了用户账户: ${user.name} (${user.email})`, 
      req.user.id, req.user.name, req.clientIp, {
        targetUserId: user.id,
        previousAttempts: user.failedLoginAttempts
      }).catch(err => console.error('记录日志失败:', err));
    
    res.json({ message: '账户已解锁' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取管理员仪表盘统计数据
exports.getDashboardStats = async (req, res) => {
  try {
    // 验证调用者是否是管理员
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: '无权访问此资源' });
    }
    
    // 获取用户统计数据
    const totalUsers = await User.count();
    
    // 获取今日活跃用户数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: today
        }
      }
    });
    
    // 获取本周新增用户数
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const newThisWeek = await User.count({
      where: {
        createdAt: {
          [Op.gte]: startOfWeek
        }
      }
    });
    
    // 获取模块和词汇统计
    const { Term, Module } = require('../models');
    const totalModules = await Module.count();
    const totalTerms = await Term.count();
    
    // 获取本月新增词汇数
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const newTermsThisMonth = await Term.count({
      where: {
        createdAt: {
          [Op.gte]: startOfMonth
        }
      }
    });
    
    // 获取学习统计
    const { Progress } = require('../models');
    
    // 计算已学习词汇数（通过所有用户的进度记录）
    const progresses = await Progress.findAll();
    let uniqueTermsLearned = new Set();
    
    progresses.forEach(progress => {
      if (progress.completedTermIds && Array.isArray(progress.completedTermIds)) {
        progress.completedTermIds.forEach(termId => {
          uniqueTermsLearned.add(termId);
        });
      }
    });
    
    const termsLearned = uniqueTermsLearned.size;
    
    // 获取今日学习的词汇数
    const todayProgresses = await Progress.findAll({
      where: {
        lastStudied: {
          [Op.gte]: today
        }
      }
    });
    
    let todayTermsLearned = new Set();
    todayProgresses.forEach(progress => {
      if (progress.completedTermIds && Array.isArray(progress.completedTermIds)) {
        progress.completedTermIds.forEach(termId => {
          todayTermsLearned.add(termId);
        });
      }
    });
    
    const learnedToday = todayTermsLearned.size;
    
    // 计算平均完成率
    const moduleCount = await Module.count();
    const userCount = await User.count();
    
    // 如果没有模块或用户，设置为0
    let avgCompletionRate = 0;
    
    if (moduleCount > 0 && userCount > 0) {
      // 获取所有进度记录
      const allProgress = await Progress.findAll();
      
      // 计算所有进度的总和
      let totalProgress = 0;
      let progressCount = 0;
      
      allProgress.forEach(progress => {
        totalProgress += progress.progress || 0;
        progressCount++;
      });
      
      // 计算平均完成率
      avgCompletionRate = progressCount > 0 ? Math.round(totalProgress / progressCount) : 0;
    }
    
    res.json({
      userStats: {
        totalUsers,
        activeToday,
        newThisWeek
      },
      moduleStats: {
        totalModules,
        totalTerms,
        newTermsThisMonth
      },
      learningStats: {
        termsLearned,
        learnedToday,
        avgCompletionRate
      }
    });
  } catch (error) {
    console.error('获取仪表盘统计数据错误:', error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 