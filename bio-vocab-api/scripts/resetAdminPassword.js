/**
 * 重置管理员密码脚本 (MariaDB版本)
 * 运行方式: node scripts/resetAdminPassword.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User } = require('../models');

// 重置管理员密码
const resetAdminPassword = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // 定义新密码
    const newPassword = 'admin123';
    console.log(`将重置管理员密码为: ${newPassword}`);
    
    // 生成密码哈希
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // 查找管理员用户
    const admin = await User.findOne({ 
      where: { email: 'admin@biovocab.com' },
      transaction
    });
    
    if (!admin) {
      console.log('未找到管理员用户!');
      await transaction.rollback();
      return null;
    }
    
    // 直接设置密码，绕过模型钩子
    await sequelize.query(
      'UPDATE Users SET password = ?, failedLoginAttempts = 0, isLocked = 0, lockUntil = NULL WHERE email = ?',
      {
        replacements: [hashedPassword, 'admin@biovocab.com'],
        type: sequelize.QueryTypes.UPDATE,
        transaction
      }
    );
    
    // 重新获取更新后的用户
    const updatedAdmin = await User.findOne({ 
      where: { email: 'admin@biovocab.com' },
      transaction
    });
    
    await transaction.commit();
    console.log('管理员密码已成功重置!');
    return updatedAdmin;
  } catch (error) {
    await transaction.rollback();
    console.error(`重置管理员密码出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接正常');
    
    // 重置管理员密码
    const admin = await resetAdminPassword();
    
    if (admin) {
      console.log(`管理员信息: 
    ID: ${admin.id}
    名称: ${admin.name}
    邮箱: ${admin.email}
    是否管理员: ${admin.isAdmin ? '是' : '否'}
    `);
      
      console.log('请使用以下凭据登录:');
      console.log('邮箱: admin@biovocab.com');
      console.log('密码: admin123');
    }
    
    console.log('操作完成!');
    process.exit(0);
  } catch (error) {
    console.error('脚本执行出错:', error);
    process.exit(1);
  }
};

// 执行主函数
main(); 