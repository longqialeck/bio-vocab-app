const { Term, Module, TermProgress, sequelize } = require('../models');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { Op } = require('sequelize');

// Get all terms with filtering and pagination
exports.getTerms = async (req, res) => {
  try {
    const { moduleId, search, tags, difficultyLevel, page = 1, limit = 20, sort } = req.query;
    const where = {};
    
    // Apply filters
    if (moduleId) where.moduleId = moduleId;
    if (difficultyLevel) where.difficultyLevel = difficultyLevel;
    
    if (tags) {
      // Note: Searching JSON array fields in MySQL is different from MongoDB
      // This is a simplistic implementation that might need to be revised
      // based on the exact database configuration
      where.tags = { [Op.like]: `%${tags}%` };
    }
    
    if (search) {
      where[Op.or] = [
        { english: { [Op.like]: `%${search}%` } },
        { chinese: { [Op.like]: `%${search}%` } },
        { pinyin: { [Op.like]: `%${search}%` } },
        { definition: { [Op.like]: `%${search}%` } },
        { notes: { [Op.like]: `%${search}%` } }
      ];
    }
    
    // Pagination
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const limitInt = parseInt(limit, 10);
    
    // Sort options
    let order = [['english', 'ASC']]; // Default sort
    if (sort) {
      const [field, direction] = sort.split(':');
      order = [[field, direction.toUpperCase()]];
    }
    
    // Execute query with pagination
    const { count, rows: terms } = await Term.findAndCountAll({
      where,
      order,
      offset,
      limit: limitInt,
      include: [{
        model: Module,
        attributes: ['name']
      }]
    });
    
    res.status(200).json({
      terms,
      pagination: {
        totalCount: count,
        totalPages: Math.ceil(count / limitInt),
        currentPage: parseInt(page, 10),
        hasNextPage: offset + terms.length < count,
        hasPrevPage: parseInt(page, 10) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching terms:', error);
    res.status(500).json({ message: 'Error fetching terms', error: error.message });
  }
};

// Get a single term by ID
exports.getTermById = async (req, res) => {
  try {
    const term = await Term.findByPk(req.params.id, {
      include: [{
        model: Module,
        attributes: ['name']
      }]
    });
    
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    res.status(200).json(term);
  } catch (error) {
    console.error('Error fetching term:', error);
    res.status(500).json({ message: 'Error fetching term', error: error.message });
  }
};

// Create a new term
exports.createTerm = async (req, res) => {
  try {
    const {
      english,
      chinese,
      pinyin,
      definition,
      notes,
      examples,
      imageUrl,
      audioUrl,
      difficultyLevel,
      tags,
      moduleId
    } = req.body;
    
    // Validate module exists
    const module = await Module.findByPk(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check for duplicate term in the same module
    const existingTerm = await Term.findOne({
      where: {
        english,
        moduleId
      }
    });
    
    if (existingTerm) {
      return res.status(400).json({ message: 'This term already exists in the selected module' });
    }
    
    // Create new term
    const newTerm = await Term.create({
      english,
      chinese,
      pinyin,
      definition,
      notes,
      examples: examples || [],
      imageUrl,
      audioUrl,
      difficultyLevel: difficultyLevel || 1,
      tags: tags || [],
      moduleId,
      createdById: req.user.id
    });
    
    res.status(201).json(newTerm);
  } catch (error) {
    console.error('Error creating term:', error);
    res.status(500).json({ message: 'Error creating term', error: error.message });
  }
};

// Update a term
exports.updateTerm = async (req, res) => {
  try {
    const {
      english,
      chinese,
      pinyin,
      definition,
      notes,
      examples,
      imageUrl,
      audioUrl,
      difficultyLevel,
      tags,
      moduleId
    } = req.body;
    
    // If moduleId is provided, validate it exists
    if (moduleId) {
      const module = await Module.findByPk(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
    }
    
    // If english and moduleId are provided, check for duplicates (excluding this one)
    if (english && moduleId) {
      const existingTerm = await Term.findOne({
        where: {
          english,
          moduleId,
          id: { [Op.ne]: req.params.id }
        }
      });
      
      if (existingTerm) {
        return res.status(400).json({ message: 'This term already exists in the selected module' });
      }
    }
    
    // Get the current term
    const term = await Term.findByPk(req.params.id);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    // Update the term
    const updateData = {};
    if (english !== undefined) updateData.english = english;
    if (chinese !== undefined) updateData.chinese = chinese;
    if (pinyin !== undefined) updateData.pinyin = pinyin;
    if (definition !== undefined) updateData.definition = definition;
    if (notes !== undefined) updateData.notes = notes;
    if (examples !== undefined) updateData.examples = examples;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
    if (difficultyLevel !== undefined) updateData.difficultyLevel = difficultyLevel;
    if (tags !== undefined) updateData.tags = tags;
    if (moduleId !== undefined) updateData.moduleId = moduleId;
    
    await term.update(updateData);
    
    // Get updated term with module info
    const updatedTerm = await Term.findByPk(req.params.id, {
      include: [{
        model: Module,
        attributes: ['name']
      }]
    });
    
    res.status(200).json(updatedTerm);
  } catch (error) {
    console.error('Error updating term:', error);
    res.status(500).json({ message: 'Error updating term', error: error.message });
  }
};

// Delete a term
exports.deleteTerm = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Find the term to delete
    const term = await Term.findByPk(req.params.id, { transaction });
    
    if (!term) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Term not found' });
    }
    
    // Delete associated progress records
    await TermProgress.destroy({
      where: { termId: req.params.id },
      transaction
    });
    
    // Delete the term
    await term.destroy({ transaction });
    
    await transaction.commit();
    
    res.status(200).json({ message: 'Term deleted successfully' });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting term:', error);
    res.status(500).json({ message: 'Error deleting term', error: error.message });
  }
};

// Import terms from CSV
exports.importTerms = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Check if file and moduleId are provided
    if (!req.body.terms || !Array.isArray(req.body.terms)) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No terms data provided' });
    }
    
    const { moduleId } = req.body;
    if (!moduleId) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Module ID is required' });
    }
    
    // Validate module exists
    const module = await Module.findByPk(moduleId, { transaction });
    if (!module) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Module not found' });
    }
    
    const results = [];
    const errors = [];
    
    // Process each term
    for (const termData of req.body.terms) {
      try {
        // Validate required fields
        if (!termData.english || !termData.chinese) {
          errors.push(`Term missing required fields: ${JSON.stringify(termData)}`);
          continue;
        }
        
        // Create term object
        const term = {
          english: termData.english,
          chinese: termData.chinese,
          definition: termData.definition || '',
          notes: termData.notes || '',
          pinyin: termData.pinyin || '',
          difficultyLevel: termData.difficultyLevel || 2,
          tags: termData.tags || [],
          moduleId,
          createdById: req.user.id
        };
        
        results.push(term);
      } catch (err) {
        errors.push(`Error processing term: ${err.message}`);
      }
    }
    
    // Insert terms into database
    for (const term of results) {
      // Check if term already exists
      const existingTerm = await Term.findOne({
        where: {
          english: term.english,
          moduleId
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
    
    res.status(200).json({
      message: `Imported ${results.length} terms with ${errors.length} errors`,
      imported: results.length,
      errors
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error importing terms:', error);
    res.status(500).json({ message: 'Error importing terms', error: error.message });
  }
};

// Get terms due for review
exports.getTermsDueForReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const terms = await Term.getDueForReview(userId);
    
    res.status(200).json(terms);
  } catch (error) {
    console.error('Error fetching terms for review:', error);
    res.status(500).json({ message: 'Error fetching terms for review', error: error.message });
  }
};

// Update term learning progress
exports.updateTermProgress = async (req, res) => {
  try {
    const { termId } = req.params;
    const { status, isCorrect } = req.body;
    const userId = req.user.id;
    
    // Validate status
    const validStatuses = ['new', 'learning', 'reviewing', 'mastered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: new, learning, reviewing, mastered' });
    }
    
    // Find the term
    const term = await Term.findByPk(termId);
    if (!term) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    // Update the progress
    await term.updateProgress(userId, status, isCorrect === true);
    
    // Get the updated term with progress
    const updatedTerm = await Term.findByPk(termId, {
      include: [{
        model: TermProgress,
        where: { userId },
        required: false
      }]
    });
    
    const progress = updatedTerm.TermProgresses && updatedTerm.TermProgresses[0];
    
    res.status(200).json({
      term: updatedTerm,
      progress: progress ? {
        status: progress.status,
        correctCount: progress.correctCount,
        incorrectCount: progress.incorrectCount,
        lastReviewed: progress.lastReviewed,
        nextReviewDate: progress.nextReviewDate
      } : null
    });
  } catch (error) {
    console.error('Error updating term progress:', error);
    res.status(500).json({ message: 'Error updating term progress', error: error.message });
  }
};

// Get user's progress statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await Term.getUserStats(userId);
    
    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Error fetching user stats', error: error.message });
  }
}; 