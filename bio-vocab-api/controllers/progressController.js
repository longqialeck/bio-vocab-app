const { Progress, User, Module, Term } = require('../models');

// 获取用户的所有学习进度
exports.getUserProgress = async (req, res) => {
  try {
    const progress = await Progress.findAll({ 
      where: { userId: req.user.id },
      include: [
        {
          model: Module,
          attributes: ['title', 'id']
        }
      ]
    });
    
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
      where: {
        userId: req.user.id,
        moduleId: req.params.moduleId
      },
      include: ['completedTerms']
    });
    
    if (!progress) {
      // 如果进度不存在，创建一个空的进度记录
      const newProgress = await Progress.create({
        userId: req.user.id,
        moduleId: req.params.moduleId,
        completedTermIds: [],
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
    let [progress, created] = await Progress.findOrCreate({
      where: {
        userId: req.user.id,
        moduleId: req.params.moduleId
      },
      defaults: {
        completedTermIds: [],
        progress: 0
      }
    });
    
    // 获取模块信息和词汇总数
    const module = await Module.findByPk(req.params.moduleId);
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    // 获取模块词汇总数
    const termCount = await Term.count({ 
      where: { moduleId: req.params.moduleId } 
    });
    
    // 更新已完成词汇列表
    let existingIds = progress.completedTermIds || [];
    if (!Array.isArray(existingIds)) {
      existingIds = [];
    }
    
    // 合并并去重
    const allCompletedIds = [...new Set([...existingIds, ...completedTermIds])];
    
    // 更新进度
    progress.completedTermIds = allCompletedIds;
    progress.progress = Math.round((allCompletedIds.length / termCount) * 100);
    progress.lastStudied = new Date();
    
    await progress.save();
    
    // 更新用户总体学习统计
    await updateUserStats(req.user.id);
    
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
    const allProgress = await Progress.findAll({ 
      where: { userId },
      order: [['lastStudied', 'DESC']]
    });
    
    // 合并所有已完成的词汇ID
    let allCompletedTerms = [];
    allProgress.forEach(progress => {
      if (progress.completedTermIds && Array.isArray(progress.completedTermIds)) {
        allCompletedTerms = [...allCompletedTerms, ...progress.completedTermIds];
      }
    });
    
    // 去重后获取实际学习的词汇数
    const uniqueCompletedTerms = [...new Set(allCompletedTerms)];
    
    // 获取所有词汇总数
    const totalTerms = await Term.count();
    
    // 计算连续学习天数
    let streak = 0;
    
    if (allProgress.length > 0) {
      // 获取今天的日期（去掉时间部分）
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // 获取最近的学习日期
      const mostRecent = new Date(allProgress[0].lastStudied);
      mostRecent.setHours(0, 0, 0, 0);
      
      // 如果用户今天或昨天没有学习，streak为0
      if ((today - mostRecent) / (1000 * 60 * 60 * 24) > 1) {
        streak = 0;
      } else {
        // 计算连续学习天数
        streak = 1;
        let currentDate = mostRecent;
        
        // 如果最近学习日期是今天，从昨天开始检查
        if (today.getTime() === currentDate.getTime()) {
          currentDate = new Date(today);
          currentDate.setDate(currentDate.getDate() - 1);
        }
        
        // 按天分组学习日期
        const studyDates = new Set();
        allProgress.forEach(progress => {
          const date = new Date(progress.lastStudied);
          date.setHours(0, 0, 0, 0);
          studyDates.add(date.getTime());
        });
        
        // 向前检查连续日期
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
      }
    }
    
    // 统计测验完成数
    let quizCompletionCount = 0;
    for (const progress of allProgress) {
      // 这里假设进度超过80%表示完成了该模块的测验
      if (progress.progress >= 80) {
        quizCompletionCount++;
      }
    }
    
    // 更新用户统计
    await User.update(
      {
        progressWordsLearned: uniqueCompletedTerms.length,
        progressTotalWords: totalTerms,
        progressStreak: streak,
        progressQuizCompletion: quizCompletionCount
      },
      { where: { id: userId } }
    );
  } catch (error) {
    console.error('更新用户统计失败:', error);
  }
}; 