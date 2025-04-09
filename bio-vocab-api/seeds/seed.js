const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Module = require('../models/moduleModel');
const Term = require('../models/Term');

// 加载环境变量
dotenv.config();

// 连接数据库
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// 样本数据
const users = [
  {
    name: 'Admin User',
    email: 'admin@biovocab.com',
    password: 'admin123',
    gradeLevel: 'Teacher',
    isAdmin: true
  },
  {
    name: 'Emily Chen',
    email: 'emily@example.com',
    password: 'password123',
    gradeLevel: '10th Grade',
    isAdmin: false
  },
  {
    name: 'David Wang',
    email: 'david@example.com',
    password: 'password123',
    gradeLevel: '11th Grade',
    isAdmin: false
  }
];

const modules = [
  {
    name: 'Cell Structure',
    description: '基础细胞结构相关词汇',
    gradeLevel: '10',
    category: '分子生物学',
    difficulty: 2,
    isActive: true
  },
  {
    name: 'DNA & Genetics',
    description: 'DNA和遗传学相关词汇',
    gradeLevel: '11',
    category: '遗传学',
    difficulty: 3,
    isActive: true
  },
  {
    name: 'Plant Biology',
    description: '植物生物学相关词汇',
    gradeLevel: '9',
    category: '植物学',
    difficulty: 1,
    isActive: true
  }
];

const cellTerms = [
  {
    english: 'Cell',
    chinese: '细胞',
    definition: 'The basic structural and functional unit of all organisms.',
    notes: 'From Latin "cella" meaning "small room"'
  },
  {
    english: 'Nucleus',
    chinese: '细胞核',
    definition: 'A membrane-bound organelle that contains the cell\'s genetic material.',
    notes: 'From Latin "nucleus" meaning "kernel"'
  },
  {
    english: 'Mitochondria',
    chinese: '线粒体',
    definition: 'Organelles that produce energy for the cell through cellular respiration.',
    notes: 'Known as the "powerhouse of the cell"'
  },
  {
    english: 'Ribosome',
    chinese: '核糖体',
    definition: 'Organelles that synthesize proteins according to the genetic instructions.',
    notes: 'Can be found free in cytoplasm or attached to endoplasmic reticulum'
  }
];

const dnaTerms = [
  {
    english: 'DNA',
    chinese: '脱氧核糖核酸',
    definition: 'Deoxyribonucleic acid, a molecule that carries genetic instructions.',
    notes: 'Forms a double helix structure'
  },
  {
    english: 'Gene',
    chinese: '基因',
    definition: 'A sequence of DNA that codes for a specific protein or trait.',
    notes: 'From Greek "genos" meaning "birth, origin"'
  },
  {
    english: 'Chromosome',
    chinese: '染色体',
    definition: 'A thread-like structure of nucleic acids and protein in the cell nucleus.',
    notes: 'Humans typically have 46 chromosomes'
  }
];

// 填充数据函数
const seedData = async () => {
  try {
    // 清空现有数据
    await User.deleteMany({});
    await Module.deleteMany({});
    await Term.deleteMany({});
    
    console.log('数据库已清空');
    
    // 创建用户
    const createdUsers = [];
    for (const user of users) {
      // 直接创建用户，让模型的中间件处理密码加密
      const newUser = await User.create(user);
      createdUsers.push(newUser);
    }
    
    console.log(`已创建 ${createdUsers.length} 位用户`);
    
    // 获取管理员用户
    const adminUser = createdUsers.find(user => user.isAdmin);
    
    // 创建模块
    const createdModules = [];
    for (const module of modules) {
      const newModule = await Module.create({
        ...module,
        createdBy: adminUser._id
      });
      createdModules.push(newModule);
    }
    
    console.log(`已创建 ${createdModules.length} 个模块`);
    
    // 创建词汇
    const cellModule = createdModules.find(m => m.name === 'Cell Structure');
    const dnaModule = createdModules.find(m => m.name === 'DNA & Genetics');
    
    let termCount = 0;
    
    // 添加细胞词汇
    for (const term of cellTerms) {
      await Term.create({
        ...term,
        moduleId: cellModule._id,
        createdBy: adminUser._id
      });
      termCount++;
    }
    
    // 添加DNA词汇
    for (const term of dnaTerms) {
      await Term.create({
        ...term,
        moduleId: dnaModule._id,
        createdBy: adminUser._id
      });
      termCount++;
    }
    
    console.log(`已创建 ${termCount} 个词汇条目`);
    
    console.log('数据填充完成!');
    process.exit(0);
  } catch (error) {
    console.error(`数据填充出错: ${error.message}`);
    process.exit(1);
  }
};

// 执行填充
seedData(); 