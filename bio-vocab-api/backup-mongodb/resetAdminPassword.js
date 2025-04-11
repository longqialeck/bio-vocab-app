/**
 * 重置管理员密码脚本
 * 运行方式: node resetAdminPassword.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

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

// 直接重置管理员密码（绕过Mongoose中间件）
const resetAdminPassword = async () => {
  try {
    // 定义新密码
    const newPassword = 'admin123';
    console.log(`将重置管理员密码为: ${newPassword}`);
    
    // 生成密码哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 直接使用MongoDB原生API更新密码，绕过Mongoose中间件
    const result = await mongoose.connection.db.collection('users').updateOne(
      { email: 'admin@biovocab.com' },
      { 
        $set: { 
          password: hashedPassword,
          failedLoginAttempts: 0,
          isLocked: false,
          lockUntil: null
        } 
      }
    );
    
    if (result.matchedCount === 0) {
      console.log('未找到管理员用户!');
      return false;
    }
    
    console.log('管理员密码已成功重置!');
    
    // 获取更新后的用户信息
    const admin = await mongoose.connection.db.collection('users').findOne(
      { email: 'admin@biovocab.com' }
    );
    
    return admin;
  } catch (error) {
    console.error(`重置管理员密码出错: ${error.message}`);
    process.exit(1);
  }
};

// 主函数
const main = async () => {
  // 连接数据库
  await connectDB();
  
  // 重置管理员密码
  const admin = await resetAdminPassword();
  
  if (admin) {
    console.log(`管理员信息: 
    ID: ${admin._id}
    名称: ${admin.name}
    邮箱: ${admin.email}
    是否管理员: ${admin.isAdmin ? '是' : '否'}
    `);
    
    console.log('请使用以下凭据登录:');
    console.log('邮箱: admin@biovocab.com');
    console.log('密码: admin123');
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