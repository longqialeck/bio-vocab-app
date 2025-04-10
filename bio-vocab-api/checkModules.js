/**
 * 检查模块和API路由
 * 运行方式: node checkModules.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// 加载环境变量
dotenv.config();

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

// 检查数据库模块
const checkModules = async () => {
  try {
    console.log('==================== 数据库检查 ====================');
    
    // 检查所有集合
    console.log('\n----- 数据库集合 -----');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('数据库集合列表:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // 检查模块集合
    console.log('\n----- 模块集合检查 -----');
    const moduleCollection = collections.find(c => c.name === 'modules');
    if (!moduleCollection) {
      console.log('警告: 数据库中没有modules集合!');
    } else {
      // 获取所有模块
      const modules = await mongoose.connection.db.collection('modules').find({}).toArray();
      console.log(`找到 ${modules.length} 个模块:`);
      modules.forEach((module, index) => {
        console.log(`${index + 1}. ID: ${module._id}, 名称: ${module.name}, 标题: ${module.title || 'N/A'}`);
      });
      
      // 如果找到很多模块但前端只显示3个，可能是查询过滤了某些条件
      if (modules.length > 3) {
        console.log('\n可能的问题: 数据库中有多个模块，但前端只显示3个，可能是查询条件过滤了其他模块');
      }
    }
    
    // 检查词汇集合
    const termCollections = ['terms', 'vocabularies'];
    console.log('\n----- 词汇集合检查 -----');
    for (const collName of termCollections) {
      const coll = collections.find(c => c.name === collName);
      if (!coll) {
        console.log(`集合 '${collName}' 不存在`);
        continue;
      }
      
      const terms = await mongoose.connection.db.collection(collName).find({}).toArray();
      console.log(`${collName}集合中有 ${terms.length} 个词汇条目`);
      
      // 检查词汇关联
      if (terms.length > 0) {
        const moduleIds = [...new Set(terms.map(t => String(t.moduleId)))];
        console.log(`词汇关联的模块ID: ${moduleIds.join(', ')}`);
      }
    }
    
    console.log('\n----- API路由检查 -----');
    // 检查路由文件，找出可能的模块API路由
    const routesDir = path.join(__dirname, 'routes');
    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir);
      console.log('后端路由文件:', routeFiles);
      
      // 搜索与模块相关的路由文件
      for (const file of routeFiles) {
        if (file.includes('module') || file.includes('vocab') || file.includes('term')) {
          const routeContent = fs.readFileSync(path.join(routesDir, file), 'utf8');
          console.log(`\n${file} 中的路由:`);
          
          // 简单解析路由定义（仅供参考，不是完全准确的解析）
          const routeMatches = routeContent.match(/router\.(get|post|put|delete)\s*\(\s*['"](.*?)['"],/g);
          if (routeMatches) {
            routeMatches.forEach(match => {
              console.log(`  ${match.trim()}`);
            });
          } else {
            console.log('  无法解析路由定义');
          }
        }
      }
    } else {
      console.log('找不到路由目录');
    }
    
    console.log('\n----- 前端API检查 -----');
    // 尝试找出前端API调用
    const frontendDir = path.join(__dirname, '..', 'src');
    if (fs.existsSync(frontendDir)) {
      // 查找store文件
      const storeDir = path.join(frontendDir, 'stores');
      if (fs.existsSync(storeDir)) {
        const storeFiles = fs.readdirSync(storeDir);
        console.log('前端store文件:', storeFiles);
        
        // 搜索与模块相关的store文件
        for (const file of storeFiles) {
          if (file.includes('vocab') || file.includes('module')) {
            const storeContent = fs.readFileSync(path.join(storeDir, file), 'utf8');
            console.log(`\n${file} 中的API调用:`);
            
            // 简单解析API调用（仅供参考，不是完全准确的解析）
            const apiMatches = storeContent.match(/api\.(get|post|put|delete)\s*\(\s*['"](.*?)['"],?/g);
            if (apiMatches) {
              apiMatches.forEach(match => {
                console.log(`  ${match.trim()}`);
              });
            } else {
              console.log('  无法解析API调用');
            }
          }
        }
      } else {
        console.log('找不到前端store目录');
      }
    } else {
      console.log('找不到前端源代码目录');
    }
    
    console.log('\n==================== 检查完成 ====================');
  } catch (error) {
    console.error(`检查过程中出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 检查模块和API
    await checkModules();
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 