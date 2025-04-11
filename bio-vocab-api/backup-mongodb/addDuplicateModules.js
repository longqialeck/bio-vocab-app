/**
 * 复制现有模块脚本
 * 运行方式: node addDuplicateModules.js
 */

const mongoose = require('mongoose');
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

// 复制现有模块
const duplicateExistingModules = async () => {
  try {
    console.log('开始查找现有模块...');
    
    // 获取当前可见的模块
    const visibleModules = await mongoose.connection.db.collection('modules').find({}).limit(3).toArray();
    
    if (visibleModules.length === 0) {
      console.log('没有找到任何模块!');
      return false;
    }
    
    console.log(`找到 ${visibleModules.length} 个模块可以复制`);
    console.log('现有模块示例:');
    console.log(JSON.stringify(visibleModules[0], null, 2));
    
    // 创建新模块，复制现有模块的结构
    const newModules = [];
    
    for (let i = 0; i < visibleModules.length; i++) {
      const original = visibleModules[i];
      
      // 创建副本并修改名称
      const duplicate = {
        ...original,
        _id: new mongoose.Types.ObjectId(), // 生成新ID
        name: `${original.name} - Copy`,
        title: original.title ? `${original.title} - Copy` : `${original.name} - Copy`,
        description: original.description ? `${original.description} (Duplicated)` : 'Duplicated module',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 删除原始ID字段
      delete duplicate.id;
      
      newModules.push(duplicate);
    }
    
    // 插入新模块
    if (newModules.length > 0) {
      const result = await mongoose.connection.db.collection('modules').insertMany(newModules);
      console.log(`成功创建 ${result.insertedCount} 个模块副本`);
      
      for (const module of newModules) {
        console.log(`- ${module.name} (${module._id})`);
      }
      
      return true;
    } else {
      console.log('没有创建任何模块');
      return false;
    }
  } catch (error) {
    console.error(`复制模块时出错: ${error.message}`);
    throw error;
  }
};

// 创建硬编码模块
const createHardcodedModules = async () => {
  try {
    console.log('\n创建硬编码模块...');
    
    // 获取管理员用户作为创建者
    const adminUser = await mongoose.connection.db.collection('users')
      .findOne({ isAdmin: true });
    
    const creatorId = adminUser ? adminUser._id : null;
    
    // 直接硬编码"Cell Structure", "DNA & Genetics", "Plant Biology"三个模块
    const hardcodedModules = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Cell Structure - New",
        title: "Cell Structure - New",
        description: "Study of cell structure and function",
        gradeLevel: "10",
        category: "分子生物学",
        difficulty: 2,
        isActive: true,
        createdBy: creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "DNA & Genetics - New",
        title: "DNA & Genetics - New",
        description: "Study of DNA structure and genetics",
        gradeLevel: "10",
        category: "分子生物学",
        difficulty: 2,
        isActive: true,
        createdBy: creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Plant Biology - New",
        title: "Plant Biology - New",
        description: "Study of plant structure and function",
        gradeLevel: "10", 
        category: "植物学",
        difficulty: 2,
        isActive: true,
        createdBy: creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // 插入硬编码模块
    const result = await mongoose.connection.db.collection('modules').insertMany(hardcodedModules);
    console.log(`成功创建 ${result.insertedCount} 个硬编码模块`);
    
    for (const module of hardcodedModules) {
      console.log(`- ${module.name} (${module._id})`);
    }
    
    return true;
  } catch (error) {
    console.error(`创建硬编码模块时出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 尝试复制现有模块
    await duplicateExistingModules();
    
    // 创建硬编码模块
    await createHardcodedModules();
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    console.log('所有操作已完成! 请刷新前端页面查看新模块');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 