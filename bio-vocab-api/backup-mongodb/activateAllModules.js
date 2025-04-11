/**
 * 激活所有模块脚本
 * 运行方式: node activateAllModules.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

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

// 激活所有模块
const activateAllModules = async () => {
  try {
    console.log('开始激活所有模块...');
    
    // 获取所有模块数量
    const moduleCount = await mongoose.connection.db.collection('modules').countDocuments({});
    console.log(`数据库中共有 ${moduleCount} 个模块`);
    
    // 查找未激活的模块
    const inactiveModules = await mongoose.connection.db.collection('modules').find({ isActive: false }).toArray();
    console.log(`找到 ${inactiveModules.length} 个未激活的模块`);
    
    if (inactiveModules.length > 0) {
      // 显示未激活模块
      console.log('未激活模块列表:');
      inactiveModules.forEach((module, index) => {
        console.log(`${index + 1}. ID: ${module._id}, 名称: ${module.name}`);
      });
      
      // 激活所有模块
      const result = await mongoose.connection.db.collection('modules').updateMany(
        { isActive: false },
        { $set: { isActive: true } }
      );
      
      console.log(`已激活 ${result.modifiedCount} 个模块`);
    } else {
      console.log('所有模块已经是激活状态');
    }
    
    // 再次检查所有模块
    const activeModules = await mongoose.connection.db.collection('modules').find({ isActive: true }).toArray();
    console.log(`当前共有 ${activeModules.length} 个激活模块`);
    
    console.log('模块激活完成!');
    return true;
  } catch (error) {
    console.error(`激活模块时出错: ${error.message}`);
    throw error;
  }
};

// 主函数
const main = async () => {
  try {
    // 连接数据库
    await connectDB();
    
    // 激活所有模块
    await activateAllModules();
    
    // 断开数据库连接
    mongoose.disconnect();
    console.log('\n数据库连接已关闭');
    console.log('所有操作已完成!');
    
  } catch (error) {
    console.error(`脚本执行出错: ${error.message}`);
    mongoose.disconnect();
    process.exit(1);
  }
};

// 执行主函数
main(); 