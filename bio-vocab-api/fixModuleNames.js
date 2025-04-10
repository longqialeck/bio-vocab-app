/**
 * 修复模块名称格式脚本
 * 运行方式: node fixModuleNames.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入模型
const Module = require('./models/Module');
const Term = require('./models/Term');
const Vocabulary = require('./models/vocabularyModel');

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

// 模块名称映射表
const moduleNameMap = {
  'Unit 1: Cell Biology': 'Cell Structure',
  'Unit 2: Organization of Organisms': 'Biological Organization',
  'Unit 3: Movement into and out of Cells': 'Cell Transport',
  'Unit 4: Biological Molecules': 'Biomolecules',
  'Unit 5: Enzymes': 'Enzymes and Metabolism',
  'Unit 6: Plant Physiology': 'Plant Biology',
  'Unit 7: Human Physiology': 'Human Physiology',
  'Unit 8: Coordination and Response': 'Homeostasis',
  'Unit 9: Reproduction': 'Reproduction',
  'Unit 10: Genetics': 'DNA & Genetics',
  'Unit 11: Evolution and Biodiversity': 'Evolution',
  'Unit 12: Ecology': 'Ecology',
  'Unit 13: Human Impact on the Environment': 'Environmental Biology',
  'Unit 14: Biotechnology and Genetic Engineering': 'Biotechnology'
};

// 修复模块名称
const fixModuleNames = async () => {
  try {
    console.log('开始修复模块名称...');
    
    // 获取所有模块
    const modules = await Module.find({});
    console.log(`找到 ${modules.length} 个模块需要处理`);
    
    // 修复每个模块
    for (const module of modules) {
      const oldName = module.name;
      
      if (moduleNameMap[oldName]) {
        const newName = moduleNameMap[oldName];
        
        console.log(`修改模块: "${oldName}" -> "${newName}"`);
        
        // 更新模块名称
        module.name = newName;
        module.title = newName;
        
        // 保存更改
        await module.save();
        
        console.log(`模块 "${newName}" 已更新`);
      } else {
        console.log(`保持原名: "${oldName}"`);
      }
    }
    
    console.log('模块名称修复完成!');
    
    return true;
  } catch (error) {
    console.error(`修复模块名称时出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 修复模块名称
    await fixModuleNames();
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('数据库连接已关闭');
    console.log('所有操作已完成!');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 