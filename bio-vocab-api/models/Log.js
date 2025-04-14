const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: {
        args: [['system', 'user', 'database', 'security', 'api']],
        msg: '日志类型必须是system、user、database、security或api之一'
      }
    }
  },
  level: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      isIn: {
        args: [['info', 'warning', 'error', 'fatal']],
        msg: '日志级别必须是info、warning、error或fatal之一'
      }
    }
  },
  message: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'SET NULL'
  },
  userName: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  ip: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('details');
      if (!rawValue) return null;
      
      try {
        return JSON.parse(rawValue);
      } catch (error) {
        console.error('解析日志详情失败:', error);
        return { error: '日志详情解析失败', rawValue };
      }
    },
    set(value) {
      if (!value) {
        this.setDataValue('details', null);
        return;
      }
      
      try {
        const jsonStr = JSON.stringify(value);
        this.setDataValue('details', jsonStr);
      } catch (error) {
        console.error('序列化日志详情失败:', error);
        this.setDataValue('details', JSON.stringify({ error: '无法序列化的数据类型' }));
      }
    }
  }
}, {
  tableName: 'logs',
  timestamps: false, // 不需要 createdAt 和 updatedAt，因为我们有自定义的 timestamp 字段
  indexes: [
    {
      name: 'logs_timestamp_idx',
      fields: ['timestamp']
    },
    {
      name: 'logs_type_idx',
      fields: ['type']
    },
    {
      name: 'logs_level_idx',
      fields: ['level']
    }
  ],
  // 添加钩子用于故障排除
  hooks: {
    beforeCreate: (log, options) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('创建日志:', {
          type: log.type,
          level: log.level,
          message: log.message && log.message.substring(0, 50)
        });
      }
    },
    beforeBulkCreate: (logs, options) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`批量创建${logs.length}条日志`);
      }
    }
  }
});

module.exports = Log; 