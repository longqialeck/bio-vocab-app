const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供姓名' }
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: '请提供邮箱' },
      isEmail: { msg: '请提供有效邮箱' }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供密码' },
      len: { args: [6, 100], msg: '密码长度至少为6位' }
    }
  },
  gradeLevel: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: '请提供年级' }
    }
  },
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  progressWordsLearned: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  progressTotalWords: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  progressDailyGoal: {
    type: DataTypes.INTEGER,
    defaultValue: 5
  },
  progressStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  progressQuizCompletion: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastLogin: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// 实例方法
User.prototype.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

User.prototype.isAccountLocked = function() {
  if (this.lockUntil && this.lockUntil > new Date()) {
    return true;
  }
  return this.isLocked;
};

User.prototype.incrementLoginAttempts = async function() {
  this.failedLoginAttempts += 1;
  
  if (this.failedLoginAttempts >= 5 && !this.isLocked) {
    this.isLocked = true;
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
  }
  
  await this.save();
};

User.prototype.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = null;
  await this.save();
};

module.exports = User; 