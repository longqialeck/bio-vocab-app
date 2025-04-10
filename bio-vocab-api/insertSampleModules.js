/**
 * 插入示例模块脚本 - 直接使用与前端一致的格式
 * 运行方式: node insertSampleModules.js
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

// 直接插入示例模块
const insertSampleModules = async () => {
  try {
    console.log('开始插入示例模块...');
    
    // 获取管理员用户作为创建者
    const adminUser = await mongoose.connection.db.collection('users')
      .findOne({ isAdmin: true });
    
    if (!adminUser) {
      console.log('找不到管理员用户，将创建无所有者的模块');
    }
    
    const creatorId = adminUser ? adminUser._id : null;
    
    // 确认modules集合存在
    const collections = await mongoose.connection.db.listCollections().toArray();
    const modulesCollection = collections.find(c => c.name === 'modules');
    
    if (!modulesCollection) {
      console.log('警告: 数据库中不存在modules集合，将创建新集合');
    }
    
    // 检查当前模块
    const existingModules = await mongoose.connection.db.collection('modules').find({}).toArray();
    console.log(`当前数据库中有 ${existingModules.length} 个模块`);
    
    if (existingModules.length > 0) {
      console.log('当前模块示例:');
      console.log(JSON.stringify(existingModules[0], null, 2));
    }
    
    // 创建示例模块列表 - 使用与前端完全一致的格式
    const sampleModules = [
      {
        name: 'Genetics Example',
        title: 'Genetics Example',
        description: 'Example module for genetics terminology',
        gradeLevel: '10',
        category: '分子生物学',
        difficulty: 2,
        isActive: true,
        createdBy: creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Botany Example',
        title: 'Botany Example',
        description: 'Example module for botany terminology',
        gradeLevel: '10',
        category: '植物学',
        difficulty: 2,
        isActive: true,
        createdBy: creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Ecology Example',
        title: 'Ecology Example',
        description: 'Example module for ecology terminology',
        gradeLevel: '10',
        category: '生态学',
        difficulty: 2,
        isActive: true,
        createdBy: creatorId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // 插入示例模块
    const result = await mongoose.connection.db.collection('modules').insertMany(sampleModules);
    
    console.log(`成功插入 ${result.insertedCount} 个示例模块`);
    console.log('插入的模块ID:');
    for (const id of Object.values(result.insertedIds)) {
      console.log(id);
    }
    
    // 添加示例词汇
    if (result.insertedCount > 0) {
      // 为第一个模块添加示例词汇
      const moduleId = result.insertedIds[0];
      
      const sampleTerms = [
        {
          english: 'Chromosome',
          chinese: '染色体',
          definition: '细胞核内携带遗传信息的线状结构',
          moduleId: moduleId,
          difficultyLevel: 2,
          createdBy: creatorId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          english: 'Allele',
          chinese: '等位基因',
          definition: '同一基因的不同形式',
          moduleId: moduleId,
          difficultyLevel: 2,
          createdBy: creatorId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      // 检查terms集合是否存在
      const termsCollection = collections.find(c => c.name === 'terms');
      if (!termsCollection) {
        console.log('警告: 数据库中不存在terms集合，将创建新集合');
      }
      
      // 插入示例词汇
      const termsResult = await mongoose.connection.db.collection('terms').insertMany(sampleTerms);
      console.log(`为模块 ${moduleId} 添加了 ${termsResult.insertedCount} 个示例词汇`);
    }
    
    return true;
  } catch (error) {
    console.error(`插入示例模块时出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 插入示例模块
    await insertSampleModules();
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    console.log('操作完成! 请刷新前端页面查看示例模块');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 