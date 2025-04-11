require('dotenv').config();
const { sequelize, User } = require('./models');

async function checkAdmin() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    const admins = await User.findAll({ where: { isAdmin: true } });
    console.log(`Found ${admins.length} admin users:`);
    
    if (admins.length > 0) {
      admins.forEach(admin => {
        console.log(` - ${admin.name} (${admin.email}, ID: ${admin.id})`);
      });
    } else {
      console.log('No admin users found in the database.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

checkAdmin(); 