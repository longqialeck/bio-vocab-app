const Progress = require('../models/Progress');
const User = require('../models/User');
const Module = require('../models/Module');
const Term = require('../models/Term');

// 获取用户的所有学习进度
exports.getUserProgress = async (req, res) => {
  try {
    const progress = await Progress.find({ userId: req.user._id })
      .populate('moduleId', 'title totalTerms');
    
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取用户特定模块的学习进度
exports.getModuleProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      moduleId: req.params.moduleId
    }).populate('completedTerms');
    
    if (!progress) {
      // 如果进度不存在，创建一个空的进度记录
      const newProgress = await Progress.create({
        userId: req.user._id,
        moduleId: req.params.moduleId,
        completedTerms: [],
        progress: 0
      });
      
      return res.json(newProgress);
    }
    
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新学习进度
exports.updateProgress = async (req, res) => {
  try {
    const { completedTermIds } = req.body;
    
    // 查找或创建进度记录
    let progress = await Progress.findOne({
      userId: req.user._id,
      moduleId: req.params.moduleId
    });
    
    if (!progress) {
      progress = await Progress.create({
        userId: req.user._id,
        moduleId: req.params.moduleId,
        completedTerms: [],
        progress: 0
      });
    }
    
    // 获取模块信息和词汇总数
    const module = await Module.findById(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    // 更新已完成词汇列表
    progress.completedTerms = [...new Set([...progress.completedTerms, ...completedTermIds])];
    
    // 计算完成百分比
    progress.progress = Math.round((progress.completedTerms.length / module.totalTerms) * 100);
    progress.lastStudied = Date.now();
    
    await progress.save();
    
    // 更新用户总体学习统计
    await updateUserStats(req.user._id);
    
    res.json(progress);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 辅助函数：更新用户总体学习统计
const updateUserStats = async (userId) => {
  try {
    // 获取所有学习进度
    const allProgress = await Progress.find({ userId });
    const allCompletedTerms = allProgress.reduce((acc, curr) => {
      return acc.concat(curr.completedTerms);
    }, []);
    
    // 去重后获取实际学习的词汇数
    const uniqueCompletedTerms = [...new Set(allCompletedTerms)];
    
    // 获取所有词汇总数
    const totalTerms = await Term.countDocuments();
    
    // 更新用户统计
    await User.findByIdAndUpdate(userId, {
      'progress.wordsLearned': uniqueCompletedTerms.length,
      'progress.totalWords': totalTerms
    });
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
}; 