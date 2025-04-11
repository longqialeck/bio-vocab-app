/**
 * 解锁管理员账户脚本 (MariaDB版本)
 * 运行方式: node scripts/unlockAdmin.js
 */

require('dotenv').config();
const { sequelize, User } = require('../models');

// 解锁管理员账户
const unlockAdminAccount = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    // 查找管理员用户
    const admin = await User.findOne({ 
      where: { email: 'admin@biovocab.com' },
      transaction
    });
    
    if (!admin) {
      console.log('找不到管理员用户!');
      await transaction.rollback();
      return null;
    }
    
    console.log('找到管理员用户，当前状态:', {
      id: admin.id,
      name: admin.name,
      isAdmin: admin.isAdmin,
      isLocked: admin.isLocked,
      failedLoginAttempts: admin.failedLoginAttempts,
      lockUntil: admin.lockUntil
    });
    
    // 重置失败登录尝试和锁定状态
    await admin.update({
      failedLoginAttempts: 0,
      isLocked: false,
      lockUntil: null
    }, { transaction });
    
    await transaction.commit();
    console.log('管理员账户已成功解锁!');
    return admin;
  } catch (error) {
    await transaction.rollback();
    console.error(`解锁管理员账户出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接正常');
    
    // 解锁管理员账户
    const admin = await unlockAdminAccount();
    
    if (admin) {
      console.log(`管理员信息: 
    ID: ${admin.id}
    名称: ${admin.name}
    邮箱: ${admin.email}
    是否管理员: ${admin.isAdmin ? '是' : '否'}
    锁定状态: ${admin.isLocked ? '锁定' : '正常'}
    `);
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