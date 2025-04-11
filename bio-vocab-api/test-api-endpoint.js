require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

async function testModuleTermsEndpoint() {
  try {
    // 1. 获取一个管理员用户
    const admin = await User.findOne({ where: { isAdmin: true } });
    if (!admin) {
      console.error('找不到管理员用户');
      return;
    }
    
    // 2. 创建JWT token
    const token = jwt.sign(
      { 
        id: admin.id,
        name: admin.name,
        email: admin.email,
        isAdmin: admin.isAdmin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`使用管理员 ${admin.email} 创建的token测试API`);
    
    // 3. 测试模块列表端点
    console.log('\n测试模块列表端点:');
    const modulesResponse = await axios.get(`${BASE_URL}/modules`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`模块列表状态码: ${modulesResponse.status}`);
    console.log(`返回 ${modulesResponse.data.length} 个模块`);
    
    if (modulesResponse.data.length > 0) {
      const firstModule = modulesResponse.data[0];
      console.log(`第一个模块: ID=${firstModule.id}, 名称=${firstModule.name}`);
      
      // 4. 测试获取模块词汇端点
      console.log(`\n测试模块 ID=${firstModule.id} 的词汇端点:`);
      
      try {
        // 使用正确的端点获取词汇
        console.log(`GET ${BASE_URL}/modules/${firstModule.id}/terms`);
        const termsResponse = await axios.get(`${BASE_URL}/modules/${firstModule.id}/terms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log(`词汇列表状态码: ${termsResponse.status}`);
        console.log(`返回 ${termsResponse.data.length} 个词汇`);
        
        if (termsResponse.data.length > 0) {
          console.log('词汇示例:');
          termsResponse.data.slice(0, 3).forEach((term, index) => {
            console.log(`[${index+1}] ${term.english} (${term.chinese})`);
          });
        } else {
          console.log('没有返回词汇!');
        }
      } catch (error) {
        console.error(`访问词汇端点出错:`, error.message);
        if (error.response) {
          console.error(`状态码: ${error.response.status}`);
          console.error(`错误数据:`, error.response.data);
        }
      }
    }
  } catch (error) {
    console.error('测试过程中出错:', error.message);
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error(`错误数据:`, error.response.data);
    }
  }
}

testModuleTermsEndpoint(); 