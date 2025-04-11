require('dotenv').config();
const { sequelize } = require('./models');

async function queryModules() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Execute a raw SQL query to get all modules
    const [modules] = await sequelize.query('SELECT * FROM Modules');
    console.log(`Found ${modules.length} modules using raw SQL query:`);
    
    if (modules.length > 0) {
      modules.forEach(m => {
        console.log(` - ${m.name || m.title} (ID: ${m.id})`);
      });
    } else {
      console.log('No modules found in the database.');
    }
    
    // Check the table structure
    console.log('\nChecking database tables...');
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log(`Found ${tables.length} tables in database ${process.env.DB_NAME}:`);
    tables.forEach(table => {
      const tableName = table[`Tables_in_${process.env.DB_NAME}`];
      console.log(` - ${tableName}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

queryModules(); 