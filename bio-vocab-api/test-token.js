require('dotenv').config();
const jwt = require('jsonwebtoken');
const { User } = require('./models');

async function testToken() {
  try {
    // 获取一个用户
    const user = await User.findOne();
    
    if (!user) {
      console.error('找不到用户');
      return;
    }
    
    console.log(`测试用户: ID=${user.id}, 名称=${user.name}, 邮箱=${user.email}`);
    
    // 创建JWT token
    const token = jwt.sign(
      { 
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log(`\n生成的token: ${token}`);
    
    // 验证JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('\ntoken验证成功，解码内容:');
      console.log(decoded);
    } catch (error) {
      console.error('token验证失败:', error.message);
    }
    
    // 检查JWT_SECRET是否设置
    console.log(`\nJWT_SECRET是否设置: ${process.env.JWT_SECRET ? '是' : '否'}`);
    if (process.env.JWT_SECRET) {
      console.log(`JWT_SECRET长度: ${process.env.JWT_SECRET.length}字符`);
    }
    
  } catch (error) {
    console.error('错误:', error);
  }
}

testToken(); 