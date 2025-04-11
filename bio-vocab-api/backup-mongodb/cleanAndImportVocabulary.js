/**
 * 清空并重新导入词汇脚本
 * 运行方式: node cleanAndImportVocabulary.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const dotenv = require('dotenv');

// 加载环境变量
dotenv.config();

// 导入模型
const Module = require('./models/Module');
const Term = require('./models/Term');
const User = require('./models/User');
const Vocabulary = require('./models/vocabularyModel');

// CSV文件路径 - 注意路径是相对于当前脚本的位置
const CSV_FILE_PATH = path.join(__dirname, '../bio_vocab_list.csv');

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

// 清空现有数据
const cleanExistingData = async () => {
  try {
    console.log('开始清空现有模块和词汇数据...');
    
    // 清空模块和词汇
    const moduleResult = await Module.deleteMany({});
    const termResult = await Term.deleteMany({});
    const vocabResult = await Vocabulary.deleteMany({});
    
    console.log(`已删除 ${moduleResult.deletedCount} 个模块`);
    console.log(`已删除 ${termResult.deletedCount} 个Term词汇`);
    console.log(`已删除 ${vocabResult.deletedCount} 个Vocabulary词汇`);
    
    console.log('数据清空完成!');
  } catch (error) {
    console.error(`清空数据失败: ${error.message}`);
    throw error;
  }
};

// 解析CSV文件
const parseCSV = () => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE_PATH)) {
      reject(new Error(`找不到CSV文件: ${CSV_FILE_PATH}`));
      return;
    }
    
    const results = [];
    
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// 创建模块
const createModule = async (moduleName, adminUserId) => {
  try {
    // 从模块名称中提取单元编号和名称
    const unitMatch = moduleName.match(/Unit (\d+): (.+)/);
    let gradeLevel = '10'; // 默认等级
    let category = '综合'; // 默认类别
    
    if (unitMatch) {
      const unitNumber = unitMatch[1];
      // 根据单元编号设置年级和类别
      if (unitNumber <= 5) {
        category = '分子生物学';
      } else if (unitNumber <= 9) {
        category = '人体解剖学';
      } else if (unitNumber <= 12) {
        category = '生态学';
      } else {
        category = '其他';
      }
    }
    
    console.log(`创建新模块: ${moduleName}`);
    
    const module = new Module({
      name: moduleName,
      title: moduleName,
      description: `${moduleName}中的生物学词汇`,
      gradeLevel: gradeLevel,
      category: category,
      difficulty: 2,
      isActive: true,
      createdBy: adminUserId
    });
    
    await module.save();
    return module;
  } catch (error) {
    console.error(`创建模块出错: ${error.message}`);
    throw error;
  }
};

// 导入词汇
const importVocabulary = async (csvData, adminUserId) => {
  try {
    console.log(`开始导入 ${csvData.length} 个词汇条目...`);
    
    // 用于存储统计信息
    const stats = {
      modules: {},
      totalTerms: 0,
      successTerms: 0,
      errorTerms: 0,
      errors: []
    };
    
    // 获取管理员用户
    const admin = await User.findById(adminUserId);
    if (!admin) {
      throw new Error('找不到管理员用户');
    }
    
    // 检查CSV数据格式
    if (csvData.length > 0) {
      const firstRow = csvData[0];
      console.log('CSV列名:', Object.keys(firstRow));
      const requiredColumns = ['英文单词名', '中文单词名', '单词中文描述', '所属单元', '单词重要等级'];
      for (const col of requiredColumns) {
        if (!Object.keys(firstRow).includes(col)) {
          console.warn(`警告: CSV文件中缺少必要的列 "${col}"`);
        }
      }
    }
    
    // 按模块分组处理词汇
    for (const item of csvData) {
      try {
        // 获取模块信息
        const moduleName = item['所属单元'];
        if (!moduleName) {
          stats.errorTerms++;
          stats.errors.push(`词汇 "${item['英文单词名']}" 缺少模块信息`);
          continue;
        }
        
        // 创建或获取模块
        if (!stats.modules[moduleName]) {
          const module = await createModule(moduleName, adminUserId);
          stats.modules[moduleName] = {
            id: module._id,
            name: module.name,
            count: 0
          };
        }
        
        const moduleId = stats.modules[moduleName].id;
        
        // 处理重要等级
        let difficultyLevel = 2; // 默认中等
        if (item['单词重要等级'] === '高') {
          difficultyLevel = 3;
        } else if (item['单词重要等级'] === '低') {
          difficultyLevel = 1;
        }
        
        // 创建Term记录
        const termData = {
          english: item['英文单词名'],
          chinese: item['中文单词名'],
          definition: item['单词中文描述'],
          moduleId: moduleId,
          difficultyLevel: difficultyLevel,
          createdBy: adminUserId
        };
        
        // 创建新词汇
        await Term.create(termData);
        
        // 创建Vocabulary记录 (同时支持两种模型)
        const vocabData = {
          term: item['英文单词名'],
          foreignTerm: item['中文单词名'],
          definition: item['单词中文描述'],
          moduleId: moduleId,
          difficulty: difficultyLevel === 3 ? 'hard' : (difficultyLevel === 1 ? 'easy' : 'medium'),
        };
        
        try {
          // 创建新词汇
          await Vocabulary.create(vocabData);
        } catch (vocabError) {
          console.log(`创建Vocabulary记录失败，但Term已创建: ${vocabError.message}`);
        }
        
        // 更新统计信息
        stats.modules[moduleName].count++;
        stats.successTerms++;
        stats.totalTerms++;
        
      } catch (itemError) {
        console.error(`处理词汇 "${item['英文单词名']}" 时出错: ${itemError.message}`);
        stats.errorTerms++;
        stats.errors.push(`词汇 "${item['英文单词名']}": ${itemError.message}`);
        stats.totalTerms++;
      }
    }
    
    return stats;
  } catch (error) {
    console.error(`导入词汇出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 获取管理员用户
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
      throw new Error('找不到管理员用户，请先运行 createAdmin.js 脚本创建管理员');
    }
    
    console.log(`使用管理员用户 ${admin.name} (${admin.email}) 导入词汇`);
    
    // 清空现有数据
    await cleanExistingData();
    
    // 解析CSV文件
    console.log(`正在解析 ${CSV_FILE_PATH} 文件...`);
    const csvData = await parseCSV();
    console.log(`成功解析 ${csvData.length} 行数据`);
    
    // 导入词汇
    const stats = await importVocabulary(csvData, admin._id);
    
    // 显示导入统计信息
    console.log('\n========== 导入统计 ==========');
    console.log(`总词汇数: ${stats.totalTerms}`);
    console.log(`成功导入: ${stats.successTerms}`);
    console.log(`导入失败: ${stats.errorTerms}`);
    console.log('\n模块统计:');
    for (const moduleName in stats.modules) {
      console.log(`  - ${moduleName}: ${stats.modules[moduleName].count} 个词汇`);
    }
    
    if (stats.errors.length > 0) {
      console.log('\n错误详情:');
      stats.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    console.log('词汇导入完成!');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 