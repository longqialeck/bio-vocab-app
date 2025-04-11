/**
 * 词汇导入脚本 (MariaDB版本)
 * 运行方式: node scripts/importVocabulary.js [--clear-all]
 * 参数:
 *   --clear-all: 删除所有现有模块和词汇
 */

require('dotenv').config();
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { Sequelize, Op } = require('sequelize');
const { sequelize, User, Module, Term } = require('../models');

// CSV文件路径
const CSV_FILE_PATH = path.join(__dirname, '../../bio_vocab_list.csv');

// 检查是否传入了--clear-all参数
const shouldClearAll = process.argv.includes('--clear-all');

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
      const transaction = await sequelize.transaction();
      
      try {
        // 获取所有模块
        const allModules = await Module.findAll({ transaction });
        
        // 找出不在CSV中的模块
        const modulesToDelete = allModules.filter(module => 
          !moduleNames.includes(module.name) && !moduleNames.includes(module.title)
        );
        
        if (modulesToDelete.length > 0) {
          console.log(`将删除 ${modulesToDelete.length} 个不在CSV中的模块`);
          
          // 收集要删除的模块ID
          const moduleIdsToDelete = modulesToDelete.map(module => module.id);
          
          // 删除这些模块关联的词汇
          const termDeleteCount = await Term.destroy({ 
            where: { moduleId: moduleIdsToDelete },
            transaction
          });
          console.log(`已删除 ${termDeleteCount} 个词汇`);
          
          // 删除模块
          const moduleDeleteCount = await Module.destroy({ 
            where: { id: moduleIdsToDelete },
            transaction
          });
          console.log(`已删除 ${moduleDeleteCount} 个模块`);
        } else {
          console.log('没有需要删除的模块');
        }
        
        // 对于要保留的模块，清除其中的词汇以便重新导入
        const moduleIdsToKeep = allModules
          .filter(module => moduleNames.includes(module.name) || moduleNames.includes(module.title))
          .map(module => module.id);
        
        if (moduleIdsToKeep.length > 0) {
          const termClearCount = await Term.destroy({ 
            where: { moduleId: moduleIdsToKeep },
            transaction
          });
          console.log(`已清除 ${termClearCount} 个词汇以便重新导入`);
        }
        
        await transaction.commit();
      } catch (error) {
        await transaction.rollback();
        throw error;
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
      const unitNumber = parseInt(unitMatch[1]);
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
      where: {
        [Op.or]: [
          { name: moduleName },
          { title: moduleName }
        ]
      }
    });
    
    if (!module) {
      console.log(`创建新模块: ${moduleName}`);
      
      module = await Module.create({
        name: moduleName,
        title: moduleName,
        description: `${moduleName}中的生物学词汇`,
        gradeLevel: gradeLevel,
        category: category,
        difficulty: 2,
        isActive: true,
        createdById: adminUserId,
        assignedToGrades: ['高一', '高二', '高三']
      });
    } else {
      // 确保name和title字段都匹配
      let updated = false;
      
      if (module.name !== moduleName) {
        module.name = moduleName;
        updated = true;
      }
      if (module.title !== moduleName) {
        module.title = moduleName;
        updated = true;
      }
      
      if (updated) {
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
    const admin = await User.findByPk(adminUserId);
    if (!admin) {
      throw new Error('找不到管理员用户');
    }
    
    // 用于跟踪已导入的词汇，避免重复
    const importedTerms = new Map();
    
    // 使用事务来确保数据一致性
    const transaction = await sequelize.transaction();
    
    try {
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
              id: module.id,
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
          
          // 定义词汇数据
          const termData = {
            english: englishTerm,
            chinese: chineseTerm,
            definition: item['单词中文描述'] || '',
            moduleId: moduleId,
            difficultyLevel: difficultyLevel,
            createdById: adminUserId,
            tags: []
          };
          
          // 检查是否已存在相同的词汇
          const [term, created] = await Term.findOrCreate({
            where: {
              english: termData.english,
              moduleId: moduleId
            },
            defaults: termData,
            transaction
          });
          
          // 如果词汇已存在但需要更新
          if (!created) {
            await term.update(termData, { transaction });
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
      
      // 提交事务
      await transaction.commit();
      return stats;
      
    } catch (error) {
      // 出错时回滚事务
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`导入词汇出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('数据库连接正常');
    
    // 获取管理员用户
    const admin = await User.findOne({ where: { isAdmin: true } });
    if (!admin) {
      throw new Error('找不到管理员用户，请先运行 db:seed 脚本创建管理员');
    }
    
    console.log(`使用管理员用户 ${admin.name} (${admin.email}) 导入词汇`);
    
    // 解析CSV文件
    console.log(`正在解析 ${CSV_FILE_PATH} 文件...`);
    const { results: csvData, moduleNames } = await parseCSV();
    console.log(`成功解析 ${csvData.length} 行数据`);
    console.log(`CSV中包含 ${moduleNames.length} 个模块: ${moduleNames.join(', ')}`);
    
    // 清除现有数据
    if (shouldClearAll) {
      await clearExistingData(moduleNames);
    }
    
    // 导入词汇
    const stats = await importVocabulary(csvData, admin.id);
    
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
    
    console.log('\n词汇导入完成!');
    process.exit(0);
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
};

// 执行主函数
main(); 