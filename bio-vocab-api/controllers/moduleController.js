const Module = require('../models/Module');
const Term = require('../models/Term');
const csvParser = require('csv-parser');
const fs = require('fs');
const { createReadStream } = require('fs');
const multer = require('multer');
const path = require('path');
const { promisify } = require('util');
const unlink = promisify(fs.unlink);
const Vocabulary = require('../models/Vocabulary');
const mongoose = require('mongoose');

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
    const filter = {};
    
    console.log('[调试] 获取模块列表请求参数:', req.query);
    
    // Apply filters if provided
    if (req.query.gradeLevel) {
      filter.gradeLevel = req.query.gradeLevel;
      console.log('[调试] 应用年级过滤:', req.query.gradeLevel);
    }
    
    // 修改：默认返回所有模块，忽略active参数
    // if (req.query.active === 'true') {
    //   filter.isActive = true;
    // } else if (req.query.active === 'false') {
    //   filter.isActive = false;
    // }
    
    console.log('[调试] 最终查询过滤条件:', filter);

    const modules = await Module.find(filter)
      .sort({ name: 1 })
      .select('-__v');
    
    console.log(`[调试] 查询返回了 ${modules.length} 个模块`);
    if (modules.length > 0) {
      console.log(`[调试] 第一个模块:`, {
        id: modules[0]._id,
        name: modules[0].name,
        isActive: modules[0].isActive
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
    const module = await Module.findById(req.params.id).select('-__v');
    
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
    const existingModule = await Module.findOne({ name });
    if (existingModule) {
      return res.status(400).json({ message: 'Module with this name already exists' });
    }
    
    const newModule = new Module({
      name,
      description,
      gradeLevel,
      difficulty: difficulty || 1,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });
    
    const savedModule = await newModule.save();
    res.status(201).json(savedModule);
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
    const module = await Module.findById(req.params.id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if name is being changed and if it conflicts with existing module
    if (name && name !== module.name) {
      const existingModule = await Module.findOne({ name });
      if (existingModule) {
        return res.status(400).json({ message: 'Module with this name already exists' });
      }
    }
    
    // Update fields
    if (name) module.name = name;
    if (description !== undefined) module.description = description;
    if (gradeLevel) module.gradeLevel = gradeLevel;
    if (difficulty !== undefined) module.difficulty = difficulty;
    if (isActive !== undefined) module.isActive = isActive;
    
    const updatedModule = await module.save();
    res.status(200).json(updatedModule);
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Error updating module', error: error.message });
  }
};

// Delete module
const deleteModule = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Check if module exists
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check if module has vocabulary items
    const vocabularyCount = await Vocabulary.countDocuments({ moduleId: id });
    if (vocabularyCount > 0) {
      // Delete all associated vocabulary items
      await Vocabulary.deleteMany({ moduleId: id }, { session });
    }
    
    // Delete the module
    await Module.findByIdAndDelete(id, { session });
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ message: 'Module deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Error deleting module', error: error.message });
  }
};

// Get vocabulary by module ID
const getVocabularyByModule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if module exists
    const module = await Module.findById(id);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const vocabulary = await Vocabulary.find({ moduleId: id }).select('-__v');
    
    res.status(200).json(vocabulary);
  } catch (error) {
    console.error('Error fetching vocabulary:', error);
    res.status(500).json({ message: 'Error fetching vocabulary', error: error.message });
  }
};

// Import terms from CSV
const importTerms = async (req, res) => {
  try {
    // Check if module exists
    const moduleId = req.params.id;
    const module = await Module.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Process file upload
    const file = await processUpload(req, res);
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Parse CSV file
    const results = [];
    const errors = [];
    let rowCount = 0;
    
    await new Promise((resolve, reject) => {
      createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => {
          rowCount++;
          // Validate required fields
          if (!data.english || !data.chinese) {
            errors.push({
              row: rowCount,
              message: 'Missing required fields (english or chinese)',
              data
            });
            return;
          }
          
          // Process the row data
          results.push({
            english: data.english.trim(),
            chinese: data.chinese.trim(),
            pinyin: data.pinyin ? data.pinyin.trim() : '',
            definition: data.definition ? data.definition.trim() : '',
            notes: data.notes ? data.notes.trim() : '',
            examples: data.examples ? data.examples.trim() : '',
            imageUrl: data.imageUrl ? data.imageUrl.trim() : '',
            audioUrl: data.audioUrl ? data.audioUrl.trim() : '',
            difficultyLevel: data.difficultyLevel ? parseInt(data.difficultyLevel, 10) || 1 : 1,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : [],
            moduleId: moduleId
          });
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', () => {
          resolve();
        });
    });
    
    // Clean up the uploaded file
    await unlink(file.path);
    
    // Check if there are any valid results
    if (results.length === 0) {
      return res.status(400).json({ 
        message: 'No valid terms found in the uploaded file',
        errors
      });
    }
    
    // Insert terms into the database
    await Term.insertMany(results);
    
    res.status(200).json({
      message: `Successfully imported ${results.length} terms`,
      termCount: results.length,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing terms:', error);
    
    // If there was a file uploaded, try to clean it up
    if (req.file && req.file.path) {
      try {
        await unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    
    res.status(500).json({ message: 'Error importing terms', error: error.message });
  }
};

// Get all terms for a module
const getModuleTerms = async (req, res) => {
  try {
    const { search, sort, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build the query
    const query = { moduleId: req.params.id };
    
    if (search) {
      query.$or = [
        { english: { $regex: search, $options: 'i' } },
        { chinese: { $regex: search, $options: 'i' } },
        { definition: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build the sort options
    let sortOptions = {};
    if (sort) {
      const [field, direction] = sort.split(':');
      sortOptions[field] = direction === 'desc' ? -1 : 1;
    } else {
      // Default sort by english alphabetically
      sortOptions = { english: 1 };
    }
    
    // Get total count for pagination
    const totalCount = await Term.countDocuments(query);
    
    // Get terms
    const terms = await Term.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit, 10));
    
    res.status(200).json({
      terms,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page, 10),
        hasNextPage: skip + terms.length < totalCount,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ message: 'Error fetching terms', error: error.message });
  }
};

// Get module statistics
const getModuleStats = async (req, res) => {
  try {
    const moduleId = req.params.id;
    
    // Get the module
    const module = await Module.findById(moduleId);
    
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Get stats about this module
    const termCount = await Term.countDocuments({ moduleId });
    const terms = await Term.find({ moduleId });
    
    // If user ID is provided, get user-specific stats
    let userStats = null;
    if (req.query.userId) {
      const userId = req.query.userId;
      
      // Calculate user statistics
      let completedCount = 0;
      let inProgressCount = 0;
      let notStartedCount = 0;
      
      for (const term of terms) {
        const userProgress = term.learningProgress.find(
          progress => progress.userId.toString() === userId
        );
        
        if (!userProgress) {
          notStartedCount++;
        } else if (userProgress.status === 'mastered') {
          completedCount++;
        } else {
          inProgressCount++;
        }
      }
      
      userStats = {
        userId,
        completedCount,
        inProgressCount,
        notStartedCount,
        percentComplete: termCount > 0 ? (completedCount / termCount) * 100 : 0
      };
    }
    
    const stats = {
      moduleId,
      name: module.name,
      totalTerms: termCount,
      userStats
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching module stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
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
  getModuleStats
}; 