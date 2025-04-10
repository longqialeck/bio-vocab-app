/**
 * 解锁管理员账户脚本
 * 运行方式: node unlockAdmin.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入User模型
const User = require('./models/User');

// 连接数据库
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB 连接错误: ${error.message}`);
    process.exit(1);
  }
};

// 解锁管理员账户
const unlockAdminAccount = async () => {
  try {
    // 查找管理员用户
    const admin = await User.findOne({ email: 'admin@biovocab.com' });
    
    if (!admin) {
      console.log('找不到管理员用户!');
      return null;
    }
    
    console.log('找到管理员用户，当前状态:', {
      id: admin._id,
      name: admin.name,
      isAdmin: admin.isAdmin,
      isLocked: admin.isLocked,
      failedLoginAttempts: admin.failedLoginAttempts,
      lockUntil: admin.lockUntil
    });
    
    // 重置失败登录尝试和锁定状态
    admin.failedLoginAttempts = 0;
    admin.isLocked = false;
    admin.lockUntil = null;
    
    // 保存更改
    await admin.save();
    
    console.log('管理员账户已成功解锁!');
    return admin;
  } catch (error) {
    console.error(`解锁管理员账户出错: ${error.message}`);
    process.exit(1);
  }
};

// 主函数
const main = async () => {
  // 连接数据库
  await connectDB();
  
  // 解锁管理员账户
  const admin = await unlockAdminAccount();
  
  if (admin) {
    console.log(`管理员信息: 
    ID: ${admin._id}
    名称: ${admin.name}
    邮箱: ${admin.email}
    是否管理员: ${admin.isAdmin ? '是' : '否'}
    锁定状态: ${admin.isLocked ? '锁定' : '正常'}
    `);
  }
  
  // 断开数据库连接
  mongoose.disconnect();
  console.log('数据库连接已关闭');
};

// 执行主函数
main().catch(err => {
  console.error('脚本执行出错:', err);
  mongoose.disconnect();
}); 