const { sequelize } = require('../config/db');
const logger = require('./logController');
const { Op } = require('sequelize');

// 定义设置类型常量
const SETTING_TYPES = {
  GENERAL: 'general',
  SECURITY: 'security',
  BACKUP: 'backup',
  API: 'api'
};

// 设置表结构简单，使用原生SQL创建
const initSettingsTable = async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        settings JSON NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updatedBy INT,
        UNIQUE KEY settings_type_unique (type)
      )
    `);
    console.log('设置表初始化成功');
    
    // 检查是否需要创建默认设置
    await createDefaultSettings();
  } catch (error) {
    console.error('初始化设置表失败:', error);
  }
};

// 创建默认设置
const createDefaultSettings = async () => {
  try {
    // 检查每种设置类型是否存在，不存在则创建默认值
    for (const type of Object.values(SETTING_TYPES)) {
      const [settings] = await sequelize.query(
        'SELECT * FROM settings WHERE type = :type',
        {
          replacements: { type },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      if (!settings) {
        let defaultSettings = {};
        
        switch (type) {
          case SETTING_TYPES.GENERAL:
            defaultSettings = {
              siteName: '生物词汇学习系统',
              contactEmail: 'admin@biovocab.com',
              defaultLanguage: 'zh-CN',
              timezone: 'Asia/Shanghai',
              enableRegistration: true,
              enableNotifications: true
            };
            break;
            
          case SETTING_TYPES.SECURITY:
            defaultSettings = {
              passwordMinLength: 8,
              passwordExpiryDays: 0,
              requireSpecialChar: true,
              requireNumber: true,
              requireUpperLower: true,
              maxLoginAttempts: 5,
              lockoutMinutes: 30,
              enableTwoFactor: false
            };
            break;
            
          case SETTING_TYPES.BACKUP:
            defaultSettings = {
              enableAutoBackup: true,
              backupFrequency: 'daily',
              backupsToKeep: 7,
              compressBackups: true,
              lastBackupDate: null
            };
            break;
            
          case SETTING_TYPES.API:
            // 生成随机API密钥
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let apiKey = 'sk_live_';
            for (let i = 0; i < 30; i++) {
              apiKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            defaultSettings = {
              apiKey,
              wechatAppId: '',
              wechatAppSecret: '',
              googleApiKey: '',
              googleSheetId: '',
              enableGoogleSync: false
            };
            break;
        }
        
        await sequelize.query(
          'INSERT INTO settings (type, settings) VALUES (:type, :settings)',
          {
            replacements: { 
              type, 
              settings: JSON.stringify(defaultSettings)
            }
          }
        );
        
        console.log(`已创建${type}默认设置`);
      }
    }
  } catch (error) {
    console.error('创建默认设置失败:', error);
  }
};

// 获取所有设置
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await sequelize.query(
      'SELECT * FROM settings',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    // 将设置格式化为前端期望的结构
    const formattedSettings = {};
    
    if (Array.isArray(settings)) {
      settings.forEach(setting => {
        formattedSettings[setting.type] = JSON.parse(setting.settings);
      });
    } else {
      console.warn('查询返回的settings不是数组:', settings);
    }
    
    return res.json(formattedSettings);
  } catch (error) {
    console.error('获取所有设置失败:', error);
    logger.logSystem('error', '获取所有设置失败', { error: error.message }).catch(err => {
      console.error('记录日志失败:', err);
    });
    return res.status(500).json({ message: '获取设置失败' });
  }
};

// 获取指定类型的设置
exports.getSettings = async (req, res) => {
  try {
    const { type } = req.params;
    
    // 验证类型是否有效
    if (!Object.values(SETTING_TYPES).includes(type)) {
      return res.status(400).json({ message: '无效的设置类型' });
    }
    
    const [settings] = await sequelize.query(
      'SELECT * FROM settings WHERE type = :type',
      {
        replacements: { type },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (!settings) {
      return res.status(404).json({ message: '未找到设置' });
    }
    
    return res.json(JSON.parse(settings.settings));
  } catch (error) {
    console.error(`获取${req.params.type}设置失败:`, error);
    logger.logSystem('error', `获取${req.params.type}设置失败`, { error: error.message }).catch(err => {
      console.error('记录日志失败:', err);
    });
    return res.status(500).json({ message: '获取设置失败' });
  }
};

// 更新设置
exports.updateSettings = async (req, res) => {
  try {
    const { type } = req.params;
    const newSettings = req.body;
    
    // 验证类型是否有效
    if (!Object.values(SETTING_TYPES).includes(type)) {
      return res.status(400).json({ message: '无效的设置类型' });
    }
    
    // 验证请求体是否为对象
    if (typeof newSettings !== 'object' || newSettings === null) {
      return res.status(400).json({ message: '无效的设置数据' });
    }
    
    // 获取现有设置以进行合并
    const [existingSettings] = await sequelize.query(
      'SELECT * FROM settings WHERE type = :type',
      {
        replacements: { type },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    let settings = newSettings;
    
    if (existingSettings) {
      // 更新现有设置
      await sequelize.query(
        'UPDATE settings SET settings = :settings, updatedBy = :userId WHERE type = :type',
        {
          replacements: { 
            type, 
            settings: JSON.stringify(settings),
            userId: req.user ? req.user.id : null
          }
        }
      );
    } else {
      // 创建新设置
      await sequelize.query(
        'INSERT INTO settings (type, settings, updatedBy) VALUES (:type, :settings, :userId)',
        {
          replacements: { 
            type, 
            settings: JSON.stringify(settings),
            userId: req.user ? req.user.id : null
          }
        }
      );
    }
    
    // 记录设置更新日志
    logger.logSystem('info', `系统${type}设置已更新`, { 
      userId: req.user ? req.user.id : null,
      userName: req.user ? req.user.name : null
    }).catch(err => {
      console.error('记录日志失败:', err);
    });
    
    return res.json({ message: '设置已更新', settings });
  } catch (error) {
    console.error(`更新${req.params.type}设置失败:`, error);
    logger.logSystem('error', `更新${req.params.type}设置失败`, { error: error.message }).catch(err => {
      console.error('记录日志失败:', err);
    });
    return res.status(500).json({ message: '更新设置失败' });
  }
};

// 重置设置为默认值
exports.resetSettings = async (req, res) => {
  try {
    const { type } = req.params;
    
    // 验证类型是否有效
    if (!Object.values(SETTING_TYPES).includes(type)) {
      return res.status(400).json({ message: '无效的设置类型' });
    }
    
    // 删除现有设置
    await sequelize.query(
      'DELETE FROM settings WHERE type = :type',
      {
        replacements: { type }
      }
    );
    
    // 重新创建默认设置
    await createDefaultSettings();
    
    // 获取新创建的默认设置
    const [settings] = await sequelize.query(
      'SELECT * FROM settings WHERE type = :type',
      {
        replacements: { type },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    // 记录重置日志
    logger.logSystem('warning', `系统${type}设置已重置为默认值`, { 
      userId: req.user ? req.user.id : null,
      userName: req.user ? req.user.name : null
    }).catch(err => {
      console.error('记录日志失败:', err);
    });
    
    return res.json({ 
      message: '设置已重置为默认值', 
      settings: JSON.parse(settings.settings) 
    });
  } catch (error) {
    console.error(`重置${req.params.type}设置失败:`, error);
    logger.logSystem('error', `重置${req.params.type}设置失败`, { error: error.message }).catch(err => {
      console.error('记录日志失败:', err);
    });
    return res.status(500).json({ message: '重置设置失败' });
  }
};

// 导出模块
module.exports.initSettingsTable = initSettingsTable; 