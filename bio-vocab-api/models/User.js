const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请提供姓名']
  },
  email: {
    type: String,
    required: [true, '请提供邮箱'],
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请提供有效邮箱']
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minlength: 6,
    select: false
  },
  gradeLevel: {
    type: String,
    required: [true, '请提供年级']
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date,
    default: null
  },
  progress: {
    wordsLearned: { type: Number, default: 0 },
    totalWords: { type: Number, default: 0 },
    dailyGoal: { type: Number, default: 5 },
    streak: { type: Number, default: 0 }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 密码加密中间件
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 验证密码方法
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 检查账户是否锁定
UserSchema.methods.isAccountLocked = function() {
  // 检查账户是否被锁定
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return true;
  }
  
  // 检查失败尝试次数
  return this.isLocked;
};

// 增加失败登录尝试次数
UserSchema.methods.incrementLoginAttempts = async function() {
  // 增加失败次数
  this.failedLoginAttempts += 1;
  
  // 如果失败尝试达到5次，锁定账户
  if (this.failedLoginAttempts >= 5 && !this.isLocked) {
    this.isLocked = true;
    this.lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 锁定30分钟
  }
  
  await this.save();
};

// 重置登录尝试
UserSchema.methods.resetLoginAttempts = async function() {
  this.failedLoginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = null;
  await this.save();
};

module.exports = mongoose.model('User', UserSchema); 