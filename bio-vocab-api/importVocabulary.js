/**
 * 词汇导入脚本
 * 运行方式: node importVocabulary.js [--clear-all]
 * 参数:
 *   --clear-all: 删除所有现有模块和词汇
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

// CSV文件路径
const CSV_FILE_PATH = path.join(__dirname, '../bio_vocab_list.csv');

// 检查是否传入了--clear-all参数
const shouldClearAll = process.argv.includes('--clear-all');

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

// 解析CSV文件并提取所有模块名称
const parseCSV = () => {
  return new Promise((resolve, reject) => {
    const results = [];
    const moduleNames = new Set();
    
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
        if (data['所属单元']) {
          moduleNames.add(data['所属单元']);
        }
      })
      .on('end', () => {
        resolve({ results, moduleNames: Array.from(moduleNames) });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// 清除所有现有模块和词汇，但保留CSV中即将导入的模块
const clearExistingData = async (moduleNames) => {
  try {
    console.log('开始清除现有数据...');
    
    if (shouldClearAll) {
      // 获取所有模块
      const allModules = await Module.find({});
      
      // 找出不在CSV中的模块
      const modulesToDelete = allModules.filter(module => 
        !moduleNames.includes(module.name) && !moduleNames.includes(module.title)
      );
      
      if (modulesToDelete.length > 0) {
        console.log(`将删除 ${modulesToDelete.length} 个不在CSV中的模块`);
        
        // 收集要删除的模块ID
        const moduleIdsToDelete = modulesToDelete.map(module => module._id);
        
        // 删除这些模块关联的词汇
        const termDeleteResult = await Term.deleteMany({ moduleId: { $in: moduleIdsToDelete } });
        console.log(`已删除 ${termDeleteResult.deletedCount} 个词汇(Term)`);
        
        const vocabDeleteResult = await Vocabulary.deleteMany({ moduleId: { $in: moduleIdsToDelete } });
        console.log(`已删除 ${vocabDeleteResult.deletedCount} 个词汇(Vocabulary)`);
        
        // 删除模块
        const moduleDeleteResult = await Module.deleteMany({ _id: { $in: moduleIdsToDelete } });
        console.log(`已删除 ${moduleDeleteResult.deletedCount} 个模块`);
      } else {
        console.log('没有需要删除的模块');
      }
      
      // 对于要保留的模块，清除其中的词汇以便重新导入
      const moduleIdsToKeep = allModules
        .filter(module => moduleNames.includes(module.name) || moduleNames.includes(module.title))
        .map(module => module._id);
      
      if (moduleIdsToKeep.length > 0) {
        const termClearResult = await Term.deleteMany({ moduleId: { $in: moduleIdsToKeep } });
        console.log(`已清除 ${termClearResult.deletedCount} 个词汇(Term)以便重新导入`);
        
        const vocabClearResult = await Vocabulary.deleteMany({ moduleId: { $in: moduleIdsToKeep } });
        console.log(`已清除 ${vocabClearResult.deletedCount} 个词汇(Vocabulary)以便重新导入`);
      }
    } else {
      console.log('跳过清除操作，使用--clear-all参数可启用清除功能');
    }
    
    console.log('数据清除完成');
  } catch (error) {
    console.error(`清除数据出错: ${error.message}`);
    throw error;
  }
};

// 创建或获取模块
const createOrGetModule = async (moduleName, adminUserId) => {
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
    
    // 检查模块是否已存在（检查name或title）
    let module = await Module.findOne({ 
      $or: [
        { name: moduleName },
        { title: moduleName }
      ] 
    });
    
    if (!module) {
      console.log(`创建新模块: ${moduleName}`);
      
      module = new Module({
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
    } else {
      // 确保name和title字段都匹配
      if (module.name !== moduleName) {
        module.name = moduleName;
        await module.save();
      }
      if (module.title !== moduleName) {
        module.title = moduleName;
        await module.save();
      }
    }
    
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
      skippedTerms: 0,
      errors: []
    };
    
    // 获取管理员用户
    const admin = await User.findById(adminUserId);
    if (!admin) {
      throw new Error('找不到管理员用户');
    }
    
    // 用于跟踪已导入的词汇，避免重复
    const importedTerms = new Map();
    
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
        
        // 获取英文单词和中文单词
        const englishTerm = item['英文单词名']?.trim();
        const chineseTerm = item['中文单词名']?.trim();
        
        if (!englishTerm) {
          stats.errorTerms++;
          stats.errors.push(`缺少英文单词名`);
          continue;
        }
        
        // 创建唯一标识符，用于去重
        const termKey = `${moduleName}:${englishTerm}`;
        
        // 检查是否已处理过该词汇（在当前导入过程中）
        if (importedTerms.has(termKey)) {
          stats.skippedTerms++;
          continue;
        }
        
        // 标记该词汇已被处理
        importedTerms.set(termKey, true);
        
        // 创建或获取模块
        if (!stats.modules[moduleName]) {
          const module = await createOrGetModule(moduleName, adminUserId);
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
          english: englishTerm,
          chinese: chineseTerm,
          definition: item['单词中文描述'] || '',
          moduleId: moduleId,
          difficultyLevel: difficultyLevel,
          createdBy: adminUserId
        };
        
        // 检查是否已存在相同的词汇
        const existingTerm = await Term.findOne({
          english: termData.english,
          moduleId: moduleId
        });
        
        if (existingTerm) {
          // 更新已存在的词汇
          Object.assign(existingTerm, termData);
          await existingTerm.save();
        } else {
          // 创建新词汇
          await Term.create(termData);
        }
        
        // 创建Vocabulary记录 (同时支持两种模型)
        const vocabData = {
          term: englishTerm,
          foreignTerm: chineseTerm,
          definition: item['单词中文描述'] || '',
          moduleId: moduleId,
          difficulty: difficultyLevel === 3 ? 'hard' : (difficultyLevel === 1 ? 'easy' : 'medium'),
        };
        
        // 检查是否已存在相同的词汇
        const existingVocab = await Vocabulary.findOne({
          term: vocabData.term,
          moduleId: moduleId
        });
        
        if (existingVocab) {
          // 更新已存在的词汇
          Object.assign(existingVocab, vocabData);
          await existingVocab.save();
        } else {
          try {
            // 创建新词汇
            await Vocabulary.create(vocabData);
          } catch (vocabError) {
            console.log(`创建Vocabulary记录失败，但Term已创建: ${vocabError.message}`);
          }
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
    
    // 解析CSV文件
    console.log(`正在解析 ${CSV_FILE_PATH} 文件...`);
    const { results: csvData, moduleNames } = await parseCSV();
    console.log(`成功解析 ${csvData.length} 行数据`);
    console.log(`CSV中包含 ${moduleNames.length} 个模块`);
    
    // 清除现有数据
    if (shouldClearAll) {
      await clearExistingData(moduleNames);
    }
    
    // 导入词汇
    const stats = await importVocabulary(csvData, admin._id);
    
    // 更新每个模块的词汇计数
    console.log('\n正在更新模块词汇计数...');
    for (const moduleName in stats.modules) {
      const moduleId = stats.modules[moduleName].id;
      
      // 计算该模块下的词汇数量
      const termCount = await Term.countDocuments({ moduleId });
      
      // 更新模块记录
      await Module.findByIdAndUpdate(moduleId, { 
        termCount: termCount,
        totalTerms: termCount 
      });
      
      console.log(`  - 更新模块 "${moduleName}": ${termCount} 个词汇`);
    }
    
    // 显示导入统计信息
    console.log('\n========== 导入统计 ==========');
    console.log(`总词汇数: ${stats.totalTerms}`);
    console.log(`成功导入: ${stats.successTerms}`);
    console.log(`跳过重复: ${stats.skippedTerms}`);
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