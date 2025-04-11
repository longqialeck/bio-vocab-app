require('dotenv').config();
const { sequelize, Module, Term } = require('./models');

async function checkData() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 获取所有模块
    const modules = await Module.findAll();
    console.log(`\n数据库中有 ${modules.length} 个模块:`);
    
    for (const module of modules) {
      console.log(`模块 ID=${module.id}, 名称=${module.name}`);
      
      // 获取该模块的词汇数量
      const termCount = await Term.count({ where: { moduleId: module.id } });
      console.log(`  词汇数量: ${termCount}`);
      
      // 显示词汇示例
      if (termCount > 0) {
        const terms = await Term.findAll({ 
          where: { moduleId: module.id },
          limit: 3
        });
        
        console.log('  词汇示例:');
        terms.forEach((term, index) => {
          console.log(`    [${index+1}] ${term.english} (${term.chinese}): ${term.definition || '无定义'}`);
        });
      }
      
      console.log(''); // 空行分隔
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

checkData(); 