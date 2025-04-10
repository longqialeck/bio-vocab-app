/**
 * 检查前端vocabStore.js文件
 * 运行方式: node inspectVocabStore.js
 */

const fs = require('fs');
const path = require('path');
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

// 检查前端store文件
const inspectVocabStore = () => {
  try {
    console.log('开始检查前端vocabStore.js文件...');
    
    // 确定前端目录路径
    const frontendDir = path.join(__dirname, '..', 'src');
    
    if (!fs.existsSync(frontendDir)) {
      console.log(`前端目录不存在: ${frontendDir}`);
      return false;
    }
    
    // 检查stores目录
    const storesDir = path.join(frontendDir, 'stores');
    
    if (!fs.existsSync(storesDir)) {
      console.log(`stores目录不存在: ${storesDir}`);
      return false;
    }
    
    // 检查vocabStore.js文件
    const vocabStorePath = path.join(storesDir, 'vocabStore.js');
    
    if (!fs.existsSync(vocabStorePath)) {
      console.log(`vocabStore.js文件不存在: ${vocabStorePath}`);
      return false;
    }
    
    // 读取vocabStore.js内容
    const content = fs.readFileSync(vocabStorePath, 'utf8');
    console.log('成功读取vocabStore.js文件');
    
    // 分析API调用
    console.log('\n--- API调用分析 ---');
    
    // 查找模块加载相关代码
    const loadModulesMatch = content.match(/loadModules\s*\(\s*\)\s*{[^}]*}/s);
    if (loadModulesMatch) {
      console.log('找到loadModules函数:');
      console.log(loadModulesMatch[0]);
      
      // 查找API调用
      const apiCallMatch = loadModulesMatch[0].match(/api\.get\([^)]+\)/);
      if (apiCallMatch) {
        console.log('\n找到API调用:');
        console.log(apiCallMatch[0]);
        
        // 检查是否有查询参数
        const paramsMatch = apiCallMatch[0].match(/\?\s*(.+)/);
        if (paramsMatch) {
          console.log('\n发现查询参数:');
          console.log(paramsMatch[1]);
          console.log('\n这可能是问题所在，前端在API请求中添加了额外的过滤条件');
        }
      }
    } else {
      console.log('未找到loadModules函数，尝试查找其他模块加载函数');
      
      // 查找包含modules的API调用
      const moduleApiCalls = content.match(/api\.get\([^)]*modules[^)]*\)/g);
      if (moduleApiCalls && moduleApiCalls.length > 0) {
        console.log('找到与模块相关的API调用:');
        moduleApiCalls.forEach((call, index) => {
          console.log(`${index + 1}. ${call}`);
        });
      } else {
        console.log('未找到与模块相关的API调用');
      }
    }
    
    // 查找硬编码的模块数据
    const hardcodedModulesMatch = content.match(/const\s+modules\s*=\s*\[[\s\S]*?\];/);
    if (hardcodedModulesMatch) {
      console.log('\n发现可能的硬编码模块数据:');
      console.log(hardcodedModulesMatch[0]);
      console.log('\n这可能是前端只显示3个模块的原因，它可能使用了硬编码的模块数据而不是从API获取');
    }
    
    return true;
  } catch (error) {
    console.error(`检查vocabStore.js时出错: ${error.message}`);
    return false;
  }
};

// 添加特定硬编码模块以与前端匹配
const addHardcodedModules = async () => {
  try {
    console.log('\n添加对应于前端可能硬编码的模块...');
    
    // 检查三个标准模块名称是否存在
    const stdModuleNames = ["Cell Structure", "DNA & Genetics", "Plant Biology"];
    
    // 检查数据库中是否已有这些名称的模块
    for (const name of stdModuleNames) {
      const exists = await mongoose.connection.db.collection('modules').findOne({ name });
      if (!exists) {
        console.log(`未找到名称为 "${name}" 的模块，需要添加`);
      } else {
        console.log(`数据库中已有名称为 "${name}" 的模块: ${exists._id}`);
      }
    }
    
    // 获取管理员用户
    const adminUser = await mongoose.connection.db.collection('users').findOne({ isAdmin: true });
    const creatorId = adminUser ? adminUser._id : null;
    
    // 创建硬编码的三个模块
    const hardcodedModules = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "Cell Structure",  // 精确匹配前端硬编码名称
        title: "Cell Structure",
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
        name: "DNA & Genetics",  // 精确匹配前端硬编码名称
        title: "DNA & Genetics",
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
        name: "Plant Biology",  // 精确匹配前端硬编码名称
        title: "Plant Biology",
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
    
    // 插入这些模块，如果名称已存在则跳过
    for (const module of hardcodedModules) {
      const exists = await mongoose.connection.db.collection('modules').findOne({ name: module.name });
      
      if (!exists) {
        await mongoose.connection.db.collection('modules').insertOne(module);
        console.log(`创建了新模块: "${module.name}" (${module._id})`);
      } else {
        console.log(`跳过已存在的模块: "${module.name}"`);
      }
    }
    
    console.log('确保模块与前端假设匹配的操作完成');
    return true;
  } catch (error) {
    console.error(`创建精准匹配模块时出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 检查前端store文件
    inspectVocabStore();
    
    // 添加与前端硬编码匹配的模块
    await addHardcodedModules();
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    console.log('所有操作已完成! 请刷新前端页面查看模块');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 