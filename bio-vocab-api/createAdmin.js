/**
 * 管理员账户初始化脚本
 * 运行方式: node createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 导入User模型
const User = require('./models/User');

// 管理员账户信息
const adminUser = {
  name: 'Admin User',
  email: 'admin@biovocab.com',
  password: 'admin123',
  gradeLevel: 'Teacher',
  isAdmin: true
};

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

// 创建或更新管理员账户
const createAdminUser = async () => {
  try {
    // 检查用户是否已存在
    const existingAdmin = await User.findOne({ email: adminUser.email });
    
    if (existingAdmin) {
      console.log('管理员用户已存在，正在更新...');
      
      // 生成新密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      // 更新用户信息
      existingAdmin.name = adminUser.name;
      existingAdmin.password = hashedPassword;
      existingAdmin.isAdmin = true;
      
      await existingAdmin.save();
      console.log('管理员用户更新成功!');
      return existingAdmin;
    } else {
      console.log('创建新管理员用户...');
      
      // 生成密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      // 创建新用户对象
      const newAdmin = new User({
        name: adminUser.name,
        email: adminUser.email,
        password: hashedPassword,
        gradeLevel: adminUser.gradeLevel,
        isAdmin: adminUser.isAdmin
      });
      
      // 保存到数据库
      const savedAdmin = await newAdmin.save();
      console.log('管理员用户创建成功!');
      return savedAdmin;
    }
  } catch (error) {
    console.error(`创建/更新管理员用户出错: ${error.message}`);
    if (error.code === 11000) {
      console.log('管理员邮箱已存在，但更新失败，可能有唯一索引冲突');
    }
    process.exit(1);
  }
};

// 主函数
const main = async () => {
  // 连接数据库
  await connectDB();
  
  // 创建或更新管理员用户
  const admin = await createAdminUser();
  console.log(`管理员信息: 
  ID: ${admin._id}
  名称: ${admin.name}
  邮箱: ${admin.email}
  是否管理员: ${admin.isAdmin ? '是' : '否'}
  `);
  
  // 断开数据库连接
  mongoose.disconnect();
  console.log('数据库连接已关闭');
};

// 执行主函数
main().catch(err => {
  console.error('脚本执行出错:', err);
  mongoose.disconnect();
}); 