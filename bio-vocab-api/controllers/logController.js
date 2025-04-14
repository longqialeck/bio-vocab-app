const db = require('../models');
const Log = db.Log;
const User = db.User;
const { Op } = require('sequelize');

/**
 * 创建新日志
 */
exports.createLog = async (logData) => {
  try {
    // 检查Log模型是否可用
    if (!Log) {
      console.error('Log模型未定义，无法创建日志');
      return null;
    }
    
    return await Log.create(logData);
  } catch (error) {
    console.error('日志创建失败:', error);
    // 这里不抛出错误，避免日志记录失败影响主业务流程
    return null;
  }
};

/**
 * 记录系统日志
 */
exports.logSystem = async (level, message, details = null) => {
  return await this.createLog({
    type: 'system',
    level,
    message,
    details
  });
};

/**
 * 记录用户相关日志
 */
exports.logUser = async (level, message, userId, userName, ip = null, details = null) => {
  return await this.createLog({
    type: 'user',
    level,
    message,
    userId,
    userName,
    ip,
    details
  });
};

/**
 * 记录数据库操作日志
 */
exports.logDatabase = async (level, message, userId = null, userName = null, details = null) => {
  return await this.createLog({
    type: 'database',
    level,
    message,
    userId,
    userName,
    details
  });
};

/**
 * 记录安全相关日志
 */
exports.logSecurity = async (level, message, userId = null, userName = null, ip = null, details = null) => {
  return await this.createLog({
    type: 'security',
    level,
    message,
    userId,
    userName,
    ip,
    details
  });
};

/**
 * 记录API相关日志
 */
exports.logApi = async (level, message, userId = null, userName = null, ip = null, details = null) => {
  return await this.createLog({
    type: 'api',
    level,
    message,
    userId,
    userName,
    ip,
    details
  });
};

/**
 * 获取日志列表
 */
exports.getLogs = async (req, res) => {
  try {
    // 确保Log模型已初始化
    if (!Log) {
      console.error('Log模型未定义，无法获取日志');
      return res.status(500).json({ 
        message: '日志系统未初始化',
        error: '日志模型未加载'
      });
    }
    
    console.log('Log模型实例:', !!Log, typeof Log.count, typeof Log.findAll);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const offset = (page - 1) * limit;
    
    // 构建筛选条件
    const filter = {};
    const where = {};
    
    // 日志类型筛选
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    // 日志级别筛选
    if (req.query.level) {
      where.level = req.query.level;
    }
    
    // 关键词搜索
    if (req.query.search) {
      where.message = {
        [Op.like]: `%${req.query.search}%`
      };
    }
    
    // 日期范围筛选（添加错误处理）
    try {
      if (req.query.fromDate && req.query.toDate) {
        // 验证日期格式
        const fromDate = new Date(req.query.fromDate);
        const toDate = new Date(req.query.toDate);
        
        // 检查日期是否有效
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          console.warn('无效的日期格式:', { fromDate: req.query.fromDate, toDate: req.query.toDate });
        } else {
          // 设置为当天结束
          toDate.setHours(23, 59, 59, 999);
          
          where.timestamp = {
            [Op.between]: [fromDate, toDate]
          };
        }
      } else if (req.query.fromDate) {
        const fromDate = new Date(req.query.fromDate);
        if (!isNaN(fromDate.getTime())) {
          where.timestamp = {
            [Op.gte]: fromDate
          };
        } else {
          console.warn('无效的起始日期:', req.query.fromDate);
        }
      } else if (req.query.toDate) {
        const toDate = new Date(req.query.toDate);
        if (!isNaN(toDate.getTime())) {
          toDate.setHours(23, 59, 59, 999);
          where.timestamp = {
            [Op.lte]: toDate
          };
        } else {
          console.warn('无效的结束日期:', req.query.toDate);
        }
      }
    } catch (dateError) {
      console.error('日期处理错误:', dateError);
      // 忽略日期筛选条件
    }
    
    // 用户ID筛选
    if (req.query.userId) {
      where.userId = req.query.userId;
    }
    
    filter.where = where;
    
    // 排序
    filter.order = [
      ['timestamp', req.query.sortDesc === 'true' ? 'DESC' : 'ASC']
    ];
    
    // 分页
    filter.limit = limit;
    filter.offset = offset;
    
    console.log('日志查询参数:', { 
      filter, 
      page, 
      limit,
      query: req.query
    });
    
    // 查询日志总数
    const count = await Log.count({ where });
    
    // 查询日志列表
    const logs = await Log.findAll(filter);
    
    return res.json({
      total: count,
      page,
      limit,
      logs
    });
  } catch (error) {
    console.error('获取日志列表失败:', error);
    return res.status(500).json({ 
      message: '获取日志列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 清空日志
 */
exports.clearLogs = async (req, res) => {
  try {
    // 验证管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: '无权执行此操作' });
    }
    
    const filter = {};
    const where = {};
    
    // 可选的类型筛选
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    // 可选的级别筛选
    if (req.query.level) {
      where.level = req.query.level;
    }
    
    // 可选的日期范围筛选
    if (req.query.fromDate && req.query.toDate) {
      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);
      toDate.setHours(23, 59, 59, 999);
      
      where.timestamp = {
        [Op.between]: [fromDate, toDate]
      };
    }
    
    filter.where = where;
    
    // 删除日志
    const count = await Log.destroy(filter);
    
    // 记录操作日志
    await this.logSystem('info', `管理员${req.user.name}(ID:${req.user.id})清空了${count}条日志`);
    
    return res.json({
      message: `成功清空${count}条日志`,
      count
    });
  } catch (error) {
    console.error('清空日志失败:', error);
    return res.status(500).json({ message: '清空日志失败' });
  }
};

/**
 * 导出日志
 */
exports.exportLogs = async (req, res) => {
  try {
    // 验证管理员权限
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: '无权执行此操作' });
    }
    
    // 构建筛选条件，与getLogs相同
    const filter = {};
    const where = {};
    
    if (req.query.type) {
      where.type = req.query.type;
    }
    
    if (req.query.level) {
      where.level = req.query.level;
    }
    
    if (req.query.search) {
      where.message = {
        [Op.like]: `%${req.query.search}%`
      };
    }
    
    if (req.query.fromDate && req.query.toDate) {
      const fromDate = new Date(req.query.fromDate);
      const toDate = new Date(req.query.toDate);
      toDate.setHours(23, 59, 59, 999);
      
      where.timestamp = {
        [Op.between]: [fromDate, toDate]
      };
    }
    
    filter.where = where;
    
    // 排序
    filter.order = [
      ['timestamp', 'DESC']
    ];
    
    // 查询日志
    const logs = await Log.findAll(filter);
    
    // 记录操作日志
    await this.logSystem('info', `管理员${req.user.name}(ID:${req.user.id})导出了${logs.length}条日志`);
    
    // 将日志格式化为CSV格式
    const csvHeader = "ID,Timestamp,Type,Level,Message,User ID,User Name,IP\n";
    const csvRows = logs.map(log => {
      return `${log.id},"${log.timestamp}","${log.type}","${log.level}","${log.message.replace(/"/g, '""')}",${log.userId || ''},"${log.userName || ''}","${log.ip || ''}"`;
    }).join("\n");
    
    const csv = csvHeader + csvRows;
    
    // 设置响应头
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=logs.csv');
    
    return res.send(csv);
  } catch (error) {
    console.error('导出日志失败:', error);
    return res.status(500).json({ message: '导出日志失败' });
  }
}; 