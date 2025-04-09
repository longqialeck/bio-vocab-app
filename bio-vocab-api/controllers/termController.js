const Term = require('../models/Term');
const Module = require('../models/Module');

// 获取模块中的所有词汇
exports.getTerms = async (req, res) => {
  try {
    const terms = await Term.find({ moduleId: req.params.moduleId });
    res.json(terms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取单个词汇
exports.getTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    
    if (!term) {
      return res.status(404).json({ message: '词汇不存在' });
    }
    
    res.json(term);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建词汇 (管理员功能)
exports.createTerm = async (req, res) => {
  try {
    const { moduleId, term, definition, foreignTerm, notes, image } = req.body;
    
    // 检查模块是否存在
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    const newTerm = await Term.create({
      moduleId,
      term,
      definition,
      foreignTerm,
      notes,
      image
    });
    
    // 更新模块中的词汇总数
    module.totalTerms += 1;
    await module.save();
    
    res.status(201).json(newTerm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 更新词汇 (管理员功能)
exports.updateTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    
    if (!term) {
      return res.status(404).json({ message: '词汇不存在' });
    }
    
    term.term = req.body.term || term.term;
    term.definition = req.body.definition || term.definition;
    term.foreignTerm = req.body.foreignTerm || term.foreignTerm;
    term.notes = req.body.notes || term.notes;
    term.image = req.body.image || term.image;
    
    const updatedTerm = await term.save();
    res.json(updatedTerm);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 删除词汇 (管理员功能)
exports.deleteTerm = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    
    if (!term) {
      return res.status(404).json({ message: '词汇不存在' });
    }
    
    // 更新模块中的词汇总数
    const module = await Module.findById(term.moduleId);
    if (module) {
      module.totalTerms = Math.max(0, module.totalTerms - 1);
      await module.save();
    }
    
    await term.remove();
    res.json({ message: '词汇已删除' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
};

// 批量导入词汇 (管理员功能)
exports.importTerms = async (req, res) => {
  try {
    const { moduleId, terms } = req.body;
    
    // 检查模块是否存在
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: '模块不存在' });
    }
    
    // 准备批量插入的词汇数据
    const termsToInsert = terms.map(t => ({
      moduleId,
      term: t.term,
      definition: t.definition,
      foreignTerm: t.foreignTerm,
      notes: t.notes || '',
      image: t.image || ''
    }));
    
    // 批量插入词汇
    const insertedTerms = await Term.insertMany(termsToInsert);
    
    // 更新模块中的词汇总数
    module.totalTerms += insertedTerms.length;
    await module.save();
    
    res.status(201).json({
      message: `成功导入${insertedTerms.length}个词汇`,
      terms: insertedTerms
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '服务器错误' });
  }
}; 