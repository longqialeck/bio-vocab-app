require('dotenv').config();
const { sequelize, Module, Term } = require('./models');

async function checkTerms() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Get all modules
    const modules = await Module.findAll();
    console.log(`Found ${modules.length} modules in database`);
    
    // Check terms for each module
    for (const module of modules) {
      const termCount = await Term.count({ where: { moduleId: module.id } });
      console.log(`Module ${module.id}: ${module.name} has ${termCount} terms`);
      
      if (termCount === 0) {
        console.log(`⚠️ Warning: Module ${module.name} has no terms!`);
      } else {
        // Show sample terms for this module
        const sampleTerms = await Term.findAll({ 
          where: { moduleId: module.id },
          limit: 3
        });
        
        console.log('  Sample terms:');
        sampleTerms.forEach(term => {
          console.log(`    - ${term.english} (${term.chinese})`);
        });
      }
    }
    
    // Check if any terms exist without a valid module
    const orphanedTerms = await Term.count({
      where: sequelize.literal(`moduleId NOT IN (SELECT id FROM Modules)`)
    });
    
    if (orphanedTerms > 0) {
      console.log(`⚠️ Found ${orphanedTerms} terms not associated with any module!`);
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkTerms(); 