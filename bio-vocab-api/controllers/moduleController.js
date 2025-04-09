const Module = require('../models/Module');
const Term = require('../models/Term');

// 获取所有模块
exports.getModules = async (req, res) => {
  try {
    const modules = await Module.find({});
    res.json(modules);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个模块
exports.getModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    res.json(module);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建模块 (管理员功能)
exports.createModule = async (req, res) => {
  try {
    const { title, description, language, icon } = req.body;
    
    const module = await Module.create({
      title,
      description,
      language,
      icon: icon || 'menu_book'
    });
    
    res.status(201).json(module);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新模块 (管理员功能)
exports.updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    module.title = req.body.title || module.title;
    module.description = req.body.description || module.description;
    module.language = req.body.language || module.language;
    module.icon = req.body.icon || module.icon;
    
    const updatedModule = await module.save();
    res.json(updatedModule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除模块 (管理员功能)
exports.deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id);
    
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    // 删除模块下的所有词汇
    await Term.deleteMany({ moduleId: module._id });
    
    await module.remove();
    res.json({ message: '模块已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 