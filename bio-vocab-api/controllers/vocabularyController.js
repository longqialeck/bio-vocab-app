const Vocabulary = require('../models/vocabularyModel');
const Module = require('../models/moduleModel');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');
const multer = require('multer');
const csv = require('fast-csv');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { parseCsv } = require('../utils/fileUtils');
const mongoose = require('mongoose');

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

// @desc    Get all vocabulary items
// @route   GET /api/vocabulary
// @access  Private
const getAllVocabulary = asyncHandler(async (req, res) => {
  const moduleId = req.query.moduleId;
  const filter = moduleId ? { moduleId } : {};
  
  const vocabulary = await Vocabulary.find(filter);
  res.status(200).json(vocabulary);
});

// @desc    Get vocabulary item by ID
// @route   GET /api/vocabulary/:id
// @access  Private
const getVocabularyById = asyncHandler(async (req, res) => {
  const vocabulary = await Vocabulary.findById(req.params.id);
  
  if (!vocabulary) {
    res.status(404);
    throw new Error('Vocabulary item not found');
  }
  
  res.status(200).json(vocabulary);
});

// Helper function to map between Vocabulary model and Term model
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
  return {
    term: term.english,
    foreignTerm: term.chinese,
    definition: term.definition,
    notes: term.notes,
    imageUrl: term.imageUrl,
    moduleId: term.moduleId,
    difficulty: term.difficultyLevel <= 1 ? 'easy' : (term.difficultyLevel >= 3 ? 'hard' : 'medium'),
    tags: term.tags || []
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
  const moduleExists = await Module.findById(moduleId);
  if (!moduleExists) {
    res.status(404);
    throw new Error('Module not found');
  }
  
  // First create in the Vocabulary model
  const vocabulary = await Vocabulary.create({
    term,
    definition,
    foreignTerm: foreignTerm || '',
    notes: notes || '',
    imageUrl: imageUrl || '',
    moduleId
  });
  
  // Also create in the Term model for backward compatibility
  try {
    const Term = mongoose.model('Term');
    await Term.create({
      english: term,
      chinese: foreignTerm || '',
      definition: definition,
      notes: notes || '',
      imageUrl: imageUrl || '',
      moduleId,
      createdBy: req.user ? req.user._id : undefined
    });
  } catch (error) {
    console.log('Warning: Could not create Term record', error.message);
  }
  
  res.status(201).json(vocabulary);
});

// @desc    Update vocabulary item
// @route   PUT /api/vocabulary/:id
// @access  Private/Admin
const updateVocabulary = asyncHandler(async (req, res) => {
  const vocabulary = await Vocabulary.findById(req.params.id);
  
  if (!vocabulary) {
    res.status(404);
    throw new Error('Vocabulary item not found');
  }
  
  // If moduleId is being updated, check if new module exists
  if (req.body.moduleId && req.body.moduleId !== vocabulary.moduleId.toString()) {
    const moduleExists = await Module.findById(req.body.moduleId);
    if (!moduleExists) {
      res.status(404);
      throw new Error('Module not found');
    }
  }
  
  const updatedVocabulary = await Vocabulary.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  
  // Also update in the Term model for backward compatibility
  try {
    const Term = mongoose.model('Term');
    // Try to find a matching Term by english/term value
    const matchingTerm = await Term.findOne({ 
      english: vocabulary.term,
      moduleId: vocabulary.moduleId
    });
    
    if (matchingTerm) {
      await Term.updateOne(
        { _id: matchingTerm._id },
        {
          english: req.body.term || vocabulary.term,
          chinese: req.body.foreignTerm || vocabulary.foreignTerm,
          definition: req.body.definition || vocabulary.definition,
          notes: req.body.notes || vocabulary.notes,
          imageUrl: req.body.imageUrl || vocabulary.imageUrl,
          moduleId: req.body.moduleId || vocabulary.moduleId
        }
      );
    }
  } catch (error) {
    console.log('Warning: Could not update Term record', error.message);
  }
  
  res.status(200).json(updatedVocabulary);
});

// @desc    Delete vocabulary item
// @route   DELETE /api/vocabulary/:id
// @access  Private/Admin
const deleteVocabulary = asyncHandler(async (req, res) => {
  const vocabulary = await Vocabulary.findById(req.params.id);
  
  if (!vocabulary) {
    res.status(404);
    throw new Error('Vocabulary item not found');
  }
  
  await vocabulary.remove();
  
  // Also delete from the Term model for backward compatibility
  try {
    const Term = mongoose.model('Term');
    await Term.deleteOne({ 
      english: vocabulary.term,
      moduleId: vocabulary.moduleId
    });
  } catch (error) {
    console.log('Warning: Could not delete Term record', error.message);
  }
  
  res.status(200).json({ id: req.params.id });
});

// @desc    Import vocabulary from CSV
// @route   POST /api/vocabulary/import
// @access  Private/Admin
const importVocabulary = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }
  
  const { moduleId } = req.body;
  
  if (!moduleId) {
    res.status(400);
    throw new Error('Please provide a module ID');
  }
  
  // Check if module exists
  const moduleExists = await Module.findById(moduleId);
  if (!moduleExists) {
    res.status(404);
    throw new Error('Module not found');
  }
  
  try {
    // Parse CSV file
    const vocabularyItems = await parseCsv(req.file.path);
    
    // Validate and prepare data
    const validItems = vocabularyItems.filter(item => 
      item.term && item.definition
    ).map(item => ({
      ...item,
      moduleId
    }));
    
    if (validItems.length === 0) {
      res.status(400);
      throw new Error('No valid vocabulary items found in the file');
    }
    
    // Insert vocabulary items
    const vocabularyResult = await Vocabulary.insertMany(validItems);
    
    // Also insert into Term model for backward compatibility
    try {
      const Term = mongoose.model('Term');
      const termItems = validItems.map(item => ({
        english: item.term,
        chinese: item.foreignTerm || '',
        definition: item.definition,
        notes: item.notes || '',
        imageUrl: item.imageUrl || '',
        moduleId,
        createdBy: req.user ? req.user._id : undefined,
        difficultyLevel: item.difficulty === 'easy' ? 1 : (item.difficulty === 'hard' ? 3 : 2)
      }));
      
      await Term.insertMany(termItems);
    } catch (termError) {
      console.log('Warning: Could not create Term records', termError.message);
    }
    
    res.status(201).json({
      success: true,
      count: vocabularyResult.length,
      data: vocabularyResult
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Error importing vocabulary: ${error.message}`);
  }
});

// @desc    Delete multiple vocabulary items
// @route   DELETE /api/vocabulary/bulk
// @access  Private/Admin
const bulkDeleteVocabulary = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of vocabulary IDs to delete');
  }
  
  const result = await Vocabulary.deleteMany({ _id: { $in: ids } });
  
  res.status(200).json({
    success: true,
    count: result.deletedCount,
    ids
  });
});

// Module Management

// @desc    Get all modules
// @route   GET /api/vocabulary/modules
// @access  Private
const getAllModules = asyncHandler(async (req, res) => {
  const modules = await Module.find({});
  res.status(200).json(modules);
});

// @desc    Get module by ID
// @route   GET /api/vocabulary/modules/:id
// @access  Private
const getModuleById = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  
  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }
  
  res.status(200).json(module);
});

// @desc    Create module
// @route   POST /api/vocabulary/modules
// @access  Private/Admin
const createModule = asyncHandler(async (req, res) => {
  const { name, description, gradeLevel } = req.body;
  
  if (!name) {
    res.status(400);
    throw new Error('Please provide a module name');
  }
  
  const moduleExists = await Module.findOne({ name });
  if (moduleExists) {
    res.status(400);
    throw new Error('Module with that name already exists');
  }
  
  const module = await Module.create({
    name,
    description: description || '',
    gradeLevel: gradeLevel || '',
  });
  
  res.status(201).json(module);
});

// @desc    Update module
// @route   PUT /api/vocabulary/modules/:id
// @access  Private/Admin
const updateModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  
  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }
  
  // Check if updating to a name that already exists
  if (req.body.name && req.body.name !== module.name) {
    const moduleWithName = await Module.findOne({ name: req.body.name });
    if (moduleWithName) {
      res.status(400);
      throw new Error('Module with that name already exists');
    }
  }
  
  const updatedModule = await Module.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  
  res.status(200).json(updatedModule);
});

// @desc    Delete module
// @route   DELETE /api/vocabulary/modules/:id
// @access  Private/Admin
const deleteModule = asyncHandler(async (req, res) => {
  const module = await Module.findById(req.params.id);
  
  if (!module) {
    res.status(404);
    throw new Error('Module not found');
  }
  
  // Check if module has vocabulary items
  const vocabularyCount = await Vocabulary.countDocuments({ moduleId: req.params.id });
  if (vocabularyCount > 0) {
    res.status(400);
    throw new Error('Cannot delete module that contains vocabulary items');
  }
  
  await module.remove();
  
  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getAllVocabulary,
  getVocabularyById,
  createVocabulary,
  updateVocabulary,
  deleteVocabulary,
  importVocabulary,
  bulkDeleteVocabulary,
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule
}; 