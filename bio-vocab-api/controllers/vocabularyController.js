const { Term, Module, User, sequelize } = require('../models');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const csv = require('fast-csv');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { parseCsv } = require('../utils/fileUtils');
const { Op } = require('sequelize');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /csv|xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 CSV 和 Excel 文件格式!'));
    }
  }
}).single('file');

// 使用Term模型替代Vocabulary模型，保持API兼容性
// @desc    Get all vocabulary items
// @route   GET /api/vocabulary
// @access  Private
const getAllVocabulary = asyncHandler(async (req, res) => {
  const moduleId = req.query.moduleId;
  const where = moduleId ? { moduleId } : {};
  
  const terms = await Term.findAll({ 
    where,
    include: [{
      model: Module,
      attributes: ['name']
    }]
  });
  
  // 将Term格式转换为Vocabulary格式以保持API兼容性
  const vocabulary = terms.map(term => mapTermToVocabulary(term));
  
  res.status(200).json(vocabulary);
});

// @desc    Get vocabulary item by ID
// @route   GET /api/vocabulary/:id
// @access  Private
const getVocabularyById = asyncHandler(async (req, res) => {
  const term = await Term.findByPk(req.params.id, {
    include: [{
      model: Module,
      attributes: ['name']
    }]
  });
  
  if (!term) {
    res.status(404);
    throw new Error('Vocabulary item not found');
  }
  
  // 将Term格式转换为Vocabulary格式以保持API兼容性
  const vocabulary = mapTermToVocabulary(term);
  
  res.status(200).json(vocabulary);
});

// Helper function to map between Term model and Vocabulary format for API compatibility
const mapVocabularyToTerm = (vocabulary) => {
  return {
    english: vocabulary.term,
    chinese: vocabulary.foreignTerm,
    definition: vocabulary.definition,
    notes: vocabulary.notes,
    imageUrl: vocabulary.imageUrl,
    moduleId: vocabulary.moduleId,
    difficultyLevel: vocabulary.difficulty === 'easy' ? 1 : (vocabulary.difficulty === 'hard' ? 3 : 2),
    tags: vocabulary.tags || []
  };
};

const mapTermToVocabulary = (term) => {
  const termData = term.toJSON ? term.toJSON() : term;
  return {
    id: termData.id,
    term: termData.english,
    foreignTerm: termData.chinese,
    definition: termData.definition,
    notes: termData.notes,
    imageUrl: termData.imageUrl,
    moduleId: termData.moduleId,
    difficulty: termData.difficultyLevel <= 1 ? 'easy' : (termData.difficultyLevel >= 3 ? 'hard' : 'medium'),
    tags: termData.tags || [],
    createdAt: termData.createdAt,
    updatedAt: termData.updatedAt
  };
};

// @desc    Create vocabulary item
// @route   POST /api/vocabulary
// @access  Private/Admin
const createVocabulary = asyncHandler(async (req, res) => {
  const { term, definition, foreignTerm, notes, imageUrl, moduleId } = req.body;
  
  if (!term || !definition || !moduleId) {
    res.status(400);
    throw new Error('Please provide term, definition, and module ID');
  }
  
  // Check if module exists
  const moduleExists = await Module.findByPk(moduleId);
  if (!moduleExists) {
    res.status(404);
    throw new Error('Module not found');
  }
  
  // Create term (which replaces vocabulary in new system)
  const newTerm = await Term.create({
    english: term,
    chinese: foreignTerm || '',
    definition,
    notes: notes || '',
    imageUrl: imageUrl || '',
    moduleId,
    createdById: req.user ? req.user.id : null
  });
  
  // Return in vocabulary format for API compatibility
  const vocabulary = mapTermToVocabulary(newTerm);
  
  res.status(201).json(vocabulary);
});

// @desc    Update vocabulary item
// @route   PUT /api/vocabulary/:id
// @access  Private/Admin
const updateVocabulary = asyncHandler(async (req, res) => {
  const term = await Term.findByPk(req.params.id);
  
  if (!term) {
    res.status(404);
    throw new Error('Vocabulary item not found');
  }
  
  // If moduleId is being updated, check if new module exists
  if (req.body.moduleId && req.body.moduleId !== term.moduleId) {
    const moduleExists = await Module.findByPk(req.body.moduleId);
    if (!moduleExists) {
      res.status(404);
      throw new Error('Module not found');
    }
  }
  
  // Map vocabulary update to term update
  const updateData = {};
  if (req.body.term) updateData.english = req.body.term;
  if (req.body.foreignTerm !== undefined) updateData.chinese = req.body.foreignTerm;
  if (req.body.definition !== undefined) updateData.definition = req.body.definition;
  if (req.body.notes !== undefined) updateData.notes = req.body.notes;
  if (req.body.imageUrl !== undefined) updateData.imageUrl = req.body.imageUrl;
  if (req.body.moduleId !== undefined) updateData.moduleId = req.body.moduleId;
  if (req.body.difficulty !== undefined) {
    updateData.difficultyLevel = req.body.difficulty === 'easy' ? 1 : 
                                (req.body.difficulty === 'hard' ? 3 : 2);
  }
  if (req.body.tags !== undefined) updateData.tags = req.body.tags;
  
  await term.update(updateData);
  
  // Get updated term
  const updatedTerm = await Term.findByPk(req.params.id, {
    include: [{
      model: Module,
      attributes: ['name']
    }]
  });
  
  // Return in vocabulary format for API compatibility
  const vocabulary = mapTermToVocabulary(updatedTerm);
  
  res.status(200).json(vocabulary);
});

// @desc    Delete vocabulary item
// @route   DELETE /api/vocabulary/:id
// @access  Private/Admin
const deleteVocabulary = asyncHandler(async (req, res) => {
  const term = await Term.findByPk(req.params.id);
  
  if (!term) {
    res.status(404);
    throw new Error('Vocabulary item not found');
  }
  
  await term.destroy();
  
  res.status(200).json({ message: 'Vocabulary item removed' });
});

// @desc    Import vocabulary from CSV/Excel file
// @route   POST /api/vocabulary/import
// @access  Private/Admin
const importVocabulary = asyncHandler(async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Handle file upload
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      
      if (!req.file) {
        return res.status(400).json({ message: '请上传文件' });
      }
      
      const { moduleId } = req.body;
      if (!moduleId) {
        return res.status(400).json({ message: '请提供模块ID' });
      }
      
      // Check if module exists
      const module = await Module.findByPk(moduleId, { transaction });
      if (!module) {
        await transaction.rollback();
        return res.status(404).json({ message: '找不到指定模块' });
      }
      
      let records = [];
      let errors = [];
      
      // Process different file types
      const fileExt = path.extname(req.file.path).toLowerCase();
      if (fileExt === '.csv') {
        records = await parseCsv(req.file.path);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        records = xlsx.utils.sheet_to_json(worksheet);
      }
      
      if (records.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ message: '文件中没有有效记录' });
      }
      
      let count = 0;
      
      // Process each record
      for (const record of records) {
        try {
          const term = record.term || record.english || record.英文;
          const foreignTerm = record.foreignTerm || record.chinese || record.中文;
          const definition = record.definition || record.description || record.描述 || '';
          
          if (!term || !foreignTerm) {
            errors.push(`记录缺少必要字段: ${JSON.stringify(record)}`);
            continue;
          }
          
          // Check if term already exists
          const [termEntry, created] = await Term.findOrCreate({
            where: { 
              english: term,
              moduleId
            },
            defaults: {
              english: term, 
              chinese: foreignTerm,
              definition,
              notes: record.notes || record.备注 || '',
              imageUrl: record.imageUrl || record.图片 || '',
              difficultyLevel: record.difficulty === 'easy' ? 1 : 
                            (record.difficulty === 'hard' ? 3 : 2),
              tags: record.tags ? 
                (typeof record.tags === 'string' ? record.tags.split(',') : record.tags) 
                : [],
              moduleId,
              createdById: req.user.id
            },
            transaction
          });
          
          if (!created) {
            // Update existing term
            await termEntry.update({
              chinese: foreignTerm,
              definition,
              notes: record.notes || record.备注 || '',
              imageUrl: record.imageUrl || record.图片 || ''
            }, { transaction });
          } else {
            count++;
          }
        } catch (error) {
          errors.push(`处理记录出错: ${error.message}`);
        }
      }
      
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      
      await transaction.commit();
      
      res.status(200).json({
        message: `成功导入 ${count} 个术语，有 ${errors.length} 个错误`,
        count,
        errors
      });
    });
  } catch (error) {
    await transaction.rollback();
    console.error('导入词汇出错:', error);
    res.status(500).json({ message: '导入词汇时出错', error: error.message });
  }
});

module.exports = {
  getAllVocabulary,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  importVocabulary,
  upload
}; 