const { Module, Term, User, TermProgress, sequelize } = require('../models');
const csvParser = require('csv-parser');
const fs = require('fs');
const { createReadStream } = require('fs');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
const unlink = promisify(fs.unlink);
const { Op } = require('sequelize');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'));
    }
  }
}).single('file');

// Helper function to process uploaded file
const processUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(req.file);
      }
    });
  });
};

// Get all modules
const getModules = async (req, res) => {
  try {
    const whereClause = {};
    
    console.log('[调试] 获取模块列表请求参数:', req.query);
    
    // Apply filters if provided
    if (req.query.gradeLevel) {
      whereClause.gradeLevel = req.query.gradeLevel;
      console.log('[调试] 应用年级过滤:', req.query.gradeLevel);
    }
    
    console.log('[调试] 最终查询过滤条件:', whereClause);

    // Use getModulesWithTermCounts instead of findAll
    const modules = await Module.getModulesWithTermCounts(whereClause);
    
    console.log(`[调试] 查询返回了 ${modules.length} 个模块`);
    if (modules.length > 0) {
      console.log(`[调试] 第一个模块:`, {
        id: modules[0].id,
        name: modules[0].name,
        isActive: modules[0].isActive,
        termCount: modules[0].termCount || 0
      });
    }
    
    res.status(200).json(modules);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Error fetching modules', error: error.message });
  }
};

// Get module by ID
const getModuleById = async (req, res) => {
  try {
    const module = await Module.findByPk(req.params.id, {
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    res.status(200).json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    res.status(500).json({ message: 'Error fetching module', error: error.message });
  }
};

// Create new module
const createModule = async (req, res) => {
  try {
    const { name, description, gradeLevel, difficulty, isActive } = req.body;
    
    // Check if module with the same name exists
    const existingModule = await Module.findOne({ where: { name } });
    if (existingModule) {
      return res.status(400).json({ message: 'Module with this name already exists' });
    }
    
    const newModule = await Module.create({
      name,
      title: name,
      description,
      gradeLevel,
      difficulty: difficulty || 1,
      isActive: isActive !== undefined ? isActive : true,
      createdById: req.user.id,
      assignedToGrades: []
    });
    
    res.status(201).json(newModule);
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Error creating module', error: error.message });
  }
};

// Update module
const updateModule = async (req, res) => {
  try {
    const { name, description, gradeLevel, difficulty, isActive } = req.body;
    
    // Check if module exists
    const module = await Module.findByPk(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if name is being changed and if it conflicts with existing module
    if (name && name !== module.name) {
      const existingModule = await Module.findOne({ where: { name } });
      if (existingModule) {
        return res.status(400).json({ message: 'Module with this name already exists' });
      }
    }
    
    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (name) updateData.title = name;
    if (description !== undefined) updateData.description = description;
    if (gradeLevel) updateData.gradeLevel = gradeLevel;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    await module.update(updateData);
    
    const updatedModule = await Module.findByPk(req.params.id);
    res.status(200).json(updatedModule);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Error updating module', error: error.message });
  }
};

// Delete module
const deleteModule = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Check if module exists
    const module = await Module.findByPk(id, { transaction });
    if (!module) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Delete all associated terms
    await Term.destroy({ 
      where: { moduleId: id },
      transaction
    });
    
    // Delete the module
    await module.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({ message: 'Module deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Error deleting module', error: error.message });
  }
};

// Get vocabulary by module
const getVocabularyByModule = async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    
    // Check if module exists
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Get all terms in the module
    const terms = await Term.findAll({
      where: { moduleId },
      attributes: { exclude: ['createdAt', 'updatedAt'] }
    });
    
    res.status(200).json(terms);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ message: 'Error fetching vocabulary', error: error.message });
  }
};

// Import terms from CSV
const importTerms = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Process uploaded file
    const file = await processUpload(req, res);
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const moduleId = req.body.moduleId;
    
    // Check if module exists
    const module = await Module.findByPk(moduleId, { transaction });
    if (!module) {
      await transaction.rollback();
      await unlink(file.path); // Delete the uploaded file
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const results = [];
    const errors = [];
    
    // Parse CSV file
    await new Promise((resolve, reject) => {
      createReadStream(file.path)
        .pipe(csvParser())
        .on('data', async (data) => {
          try {
            // Extract data from CSV row
            const term = {
              english: data.english || data.term || '',
              chinese: data.chinese || data.foreignTerm || '',
              definition: data.definition || '',
              moduleId: moduleId,
              createdById: req.user.id
            };
            
            // Validate required fields
            if (!term.english || !term.chinese) {
              errors.push(`Row missing required fields: ${JSON.stringify(data)}`);
              return;
            }
            
            results.push(term);
          } catch (err) {
            errors.push(`Error processing row: ${err.message}`);
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    // Insert terms into database
    for (const term of results) {
      // Check if term already exists
      const existingTerm = await Term.findOne({
        where: {
          english: term.english,
          moduleId: moduleId
        },
        transaction
      });
      
      if (existingTerm) {
        // Update existing term
        await existingTerm.update(term, { transaction });
      } else {
        // Create new term
        await Term.create(term, { transaction });
      }
    }
    
    await transaction.commit();
    
    // Delete the uploaded file
    await unlink(file.path);
    
    res.status(200).json({
      message: `Imported ${results.length} terms with ${errors.length} errors`,
      imported: results.length,
      errors: errors
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error importing terms:', error);
    
    // Clean up the uploaded file
    if (req.file) {
      await unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
    }
    
    res.status(500).json({ message: 'Error importing terms', error: error.message });
  }
};

// Get terms in a module
const getModuleTerms = async (req, res) => {
  try {
    const moduleId = req.params.id;
    const userId = req.user.id;
    
    console.log(`[调试] 获取模块ID=${moduleId}的词汇，用户ID=${userId}`);
    
    // Check if module exists
    const module = await Module.findByPk(moduleId);
    if (!module) {
      console.log(`[调试] 模块ID=${moduleId}不存在`);
      return res.status(404).json({ message: 'Module not found' });
    }
    
    console.log(`[调试] 找到模块: ${module.name}`);
    
    // 先尝试简单查询所有词汇，不包含关联
    const termCount = await Term.count({ where: { moduleId } });
    console.log(`[调试] 模块${moduleId}中有${termCount}个词汇`);
    
    // 如果模块没有词汇，直接返回空数组
    if (termCount === 0) {
      console.log(`[调试] 模块${moduleId}没有词汇，返回空数组`);
      return res.status(200).json([]);
    }
    
    // 如果有词汇，获取词汇并包含关联的进度信息
    try {
      // Get all terms in the module with user progress
      const terms = await Term.findAll({
        where: { moduleId },
        include: [{
          model: TermProgress,
          where: { userId },
          required: false
        }],
        order: [['english', 'ASC']]
      });
      
      console.log(`[调试] 找到${terms.length}个词汇`);
      
      // Format response
      const formattedTerms = terms.map(term => {
        const termJson = term.toJSON();
        const userProgress = term.TermProgresses && term.TermProgresses.length > 0 ? term.TermProgresses[0] : null;
        
        return {
          ...termJson,
          userProgress: userProgress ? {
            status: userProgress.status,
            correctCount: userProgress.correctCount,
            incorrectCount: userProgress.incorrectCount,
            lastReviewed: userProgress.lastReviewed,
            nextReviewDate: userProgress.nextReviewDate
          } : null
        };
      });
      
      console.log(`[调试] 返回${formattedTerms.length}个词汇`);
      if (formattedTerms.length > 0) {
        console.log(`[调试] 第一个词汇示例:`, {
          id: formattedTerms[0].id,
          english: formattedTerms[0].english,
          chinese: formattedTerms[0].chinese
        });
      }
      
      res.status(200).json(formattedTerms);
    } catch (error) {
      console.error(`[调试] 获取词汇和进度出错:`, error);
      
      // 备用方案：仅返回词汇数据，不包含进度
      console.log(`[调试] 尝试备用方案: 仅获取词汇，不包含进度`);
      const termsOnly = await Term.findAll({
        where: { moduleId },
        order: [['english', 'ASC']]
      });
      
      console.log(`[调试] 备用方案找到${termsOnly.length}个词汇`);
      res.status(200).json(termsOnly);
    }
  } catch (error) {
    console.error('Error fetching module terms:', error);
    res.status(500).json({ message: 'Error fetching module terms', error: error.message });
  }
};

// Get module statistics
const getModuleStats = async (req, res) => {
  try {
    const moduleId = req.params.id;
    
    // Check if module exists
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Get total term count
    const termCount = await Term.count({ where: { moduleId } });
    
    // Get user progress statistics
    const stats = await module.getStats();
    
    res.status(200).json({
      moduleId,
      name: module.name,
      termCount,
      userProgress: stats.userProgress
    });
  } catch (error) {
    console.error('Error fetching module stats:', error);
    res.status(500).json({ message: 'Error fetching module stats', error: error.message });
  }
};

module.exports = {
  getModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  getVocabularyByModule,
  importTerms,
  getModuleTerms,
  getModuleStats,
  processUpload
}; 