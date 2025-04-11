/**
 * 管理员账户初始化脚本 (MariaDB版本)
 * 运行方式: node scripts/createAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

// 管理员账户信息
const adminUser = {
  name: 'Admin User',
  email: 'admin@biovocab.com',
  password: 'admin123',
  gradeLevel: 'Teacher',
  isAdmin: true
};

// 创建或更新管理员账户
const createAdminUser = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // 检查用户是否已存在
    const existingAdmin = await User.findOne({ 
      where: { email: adminUser.email },
      transaction
    });
    
    let admin;
    
    if (existingAdmin) {
      console.log('管理员用户已存在，正在更新...');
      
      // 生成新密码哈希
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminUser.password, salt);
      
      // 更新用户信息
      await existingAdmin.update({
        name: adminUser.name,
        password: hashedPassword,
        isAdmin: true
      }, { transaction });
      
      admin = existingAdmin;
      console.log('管理员用户更新成功!');
    } else {
      console.log('创建新管理员用户...');
      
      // 创建新用户
      admin = await User.create({
        name: adminUser.name,
        email: adminUser.email,
        password: adminUser.password, // 模型中的钩子会自动加密密码
        gradeLevel: adminUser.gradeLevel,
        isAdmin: adminUser.isAdmin
      }, { transaction });
      
      console.log('管理员用户创建成功!');
    }
    
    await transaction.commit();
    return admin;
  } catch (error) {
    await transaction.rollback();
    console.error(`创建/更新管理员用户出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接正常');
    
    // 创建或更新管理员用户
    const admin = await createAdminUser();
    console.log(`管理员信息: 
  ID: ${admin.id}
  名称: ${admin.name}
  邮箱: ${admin.email}
  是否管理员: ${admin.isAdmin ? '是' : '否'}
  `);
    
    console.log('管理员初始化完成!');
    process.exit(0);
  } catch (error) {
    console.error('脚本执行出错:', error);
    process.exit(1);
  }
};

// 执行主函数
main(); 