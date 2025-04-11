require('dotenv').config();
const { sequelize, Module, Term } = require('./models');

async function testModuleTerms() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 测试获取模块1的词汇
    const moduleId = 1;
    console.log(`测试获取模块ID=${moduleId}的词汇`);
    
    // 验证模块存在
    const module = await Module.findByPk(moduleId);
    if (!module) {
      console.error(`模块ID=${moduleId}不存在!`);
      return;
    }
    console.log(`找到模块: ${module.name}`);
    
    // 获取该模块下的所有词汇
    const terms = await Term.findAll({
      where: { moduleId: moduleId }
    });
    
    console.log(`模块 "${module.name}" 有 ${terms.length} 个词汇`);
    
    if (terms.length > 0) {
      console.log("词汇示例:");
      terms.forEach((term, index) => {
        console.log(`[${index+1}] ${term.english} (${term.chinese}): ${term.definition}`);
      });
    } else {
      console.log("该模块没有词汇!");
    }
    
    // 测试API路由使用的查询
    console.log("\n测试getModuleTerms函数使用的查询:");
    const termsWithQuery = await Term.findAll({
      where: { moduleId },
      order: [['english', 'ASC']]
    });
    
    console.log(`查询返回了 ${termsWithQuery.length} 个词汇`);
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

testModuleTerms(); 