require('dotenv').config();
const mysql = require('mysql2/promise');

const createDatabase = async () => {
  try {
    // 创建数据库连接（不包含数据库名称）
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    console.log('MySQL连接成功');
    
    // 创建数据库（如果不存在）
    const dbName = process.env.DB_NAME;
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    
    console.log(`数据库 '${dbName}' 创建成功`);
    
    // 关闭连接
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('创建数据库出错:', error.message);
    process.exit(1);
  }
};

createDatabase(); 