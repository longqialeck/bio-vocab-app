require('dotenv').config();
const axios = require('axios');
const { User } = require('./models');

async function testModulesAPI() {
  try {
    // Get admin user from database
    const admin = await User.findOne({ where: { isAdmin: true } });
    if (!admin) {
      console.error('No admin user found in database');
      process.exit(1);
    }
    
    console.log(`Using admin user: ${admin.email}`);
    
    // Create a JWT token for authentication
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: admin.id, isAdmin: admin.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`Generated JWT token for testing`);
    
    // Create an axios instance with the token
    const api = axios.create({
      baseURL: `http://localhost:${process.env.PORT || 5001}/api`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Test the modules endpoint
    console.log('Testing GET /api/modules endpoint...');
    const response = await api.get('/modules');
    
    console.log(`API Response Status: ${response.status}`);
    console.log(`Found ${response.data.length} modules from API`);
    
    if (response.data.length > 0) {
      console.log('Sample module data:');
      console.log(JSON.stringify(response.data[0], null, 2));
    } else {
      console.log('No modules returned from API');
    }
    
  } catch (error) {
    console.error('API test error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  } finally {
    process.exit();
  }
}

testModulesAPI(); 