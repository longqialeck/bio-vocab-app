const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Module = require('../models/Module');
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
    title: 'Cell Structure',
    description: '基础细胞结构相关词汇',
    language: 'en-zh',
    icon: 'o_science'
  },
  {
    title: 'DNA & Genetics',
    description: 'DNA和遗传学相关词汇',
    language: 'en-zh',
    icon: 'o_biotech'
  },
  {
    title: 'Plant Biology',
    description: '植物生物学相关词汇',
    language: 'en-zh',
    icon: 'o_eco'
  }
];

const cellTerms = [
  {
    term: 'Cell',
    definition: 'The basic structural and functional unit of all organisms.',
    foreignTerm: '细胞',
    notes: 'From Latin "cella" meaning "small room"'
  },
  {
    term: 'Nucleus',
    definition: 'A membrane-bound organelle that contains the cell\'s genetic material.',
    foreignTerm: '细胞核',
    notes: 'From Latin "nucleus" meaning "kernel"'
  },
  {
    term: 'Mitochondria',
    definition: 'Organelles that produce energy for the cell through cellular respiration.',
    foreignTerm: '线粒体',
    notes: 'Known as the "powerhouse of the cell"'
  },
  {
    term: 'Ribosome',
    definition: 'Organelles that synthesize proteins according to the genetic instructions.',
    foreignTerm: '核糖体',
    notes: 'Can be found free in cytoplasm or attached to endoplasmic reticulum'
  }
];

const dnaTerms = [
  {
    term: 'DNA',
    definition: 'Deoxyribonucleic acid, a molecule that carries genetic instructions.',
    foreignTerm: '脱氧核糖核酸',
    notes: 'Forms a double helix structure'
  },
  {
    term: 'Gene',
    definition: 'A sequence of DNA that codes for a specific protein or trait.',
    foreignTerm: '基因',
    notes: 'From Greek "genos" meaning "birth, origin"'
  },
  {
    term: 'Chromosome',
    definition: 'A thread-like structure of nucleic acids and protein in the cell nucleus.',
    foreignTerm: '染色体',
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
    
    // 创建模块
    const createdModules = [];
    for (const module of modules) {
      const newModule = await Module.create(module);
      createdModules.push(newModule);
    }
    
    console.log(`已创建 ${createdModules.length} 个模块`);
    
    // 创建词汇
    const cellModule = createdModules.find(m => m.title === 'Cell Structure');
    const dnaModule = createdModules.find(m => m.title === 'DNA & Genetics');
    
    let termCount = 0;
    
    // 添加细胞词汇
    for (const term of cellTerms) {
      await Term.create({
        ...term,
        moduleId: cellModule._id
      });
      termCount++;
    }
    
    // 添加DNA词汇
    for (const term of dnaTerms) {
      await Term.create({
        ...term,
        moduleId: dnaModule._id
      });
      termCount++;
    }
    
    console.log(`已创建 ${termCount} 个词汇条目`);
    
    // 更新模块词汇数量
    await Module.findByIdAndUpdate(cellModule._id, { totalTerms: cellTerms.length });
    await Module.findByIdAndUpdate(dnaModule._id, { totalTerms: dnaTerms.length });
    
    console.log('数据填充完成!');
    process.exit(0);
  } catch (error) {
    console.error(`数据填充出错: ${error.message}`);
    process.exit(1);
  }
};

// 执行填充
seedData(); 