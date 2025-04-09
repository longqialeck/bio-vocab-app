const Term = require('../models/Term');
const Module = require('../models/Module');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

// Get all terms with filtering and pagination
exports.getTerms = async (req, res) => {
  try {
    const { moduleId, search, tags, difficultyLevel, page = 1, limit = 20, sort } = req.query;
    const query = {};
    
    // Apply filters
    if (moduleId) query.moduleId = moduleId;
    if (difficultyLevel) query.difficultyLevel = difficultyLevel;
    
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagList };
    }
    
    if (search) {
      query.$or = [
        { english: { $regex: search, $options: 'i' } },
        { chinese: { $regex: search, $options: 'i' } },
        { pinyin: { $regex: search, $options: 'i' } },
        { definition: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Pagination
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    
    // Sort options
    let sortOptions = { english: 1 }; // Default sort
    if (sort) {
      const [field, direction] = sort.split(':');
      sortOptions = { [field]: direction === 'desc' ? -1 : 1 };
    }
    
    // Execute query with pagination
    const terms = await Term.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit, 10))
      .populate('moduleId', 'name');
    
    // Get total count for pagination
    const totalCount = await Term.countDocuments(query);
    
    res.status(200).json({
      terms,
      pagination: {
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
        currentPage: parseInt(page, 10),
        hasNextPage: skip + terms.length < totalCount,
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
    const term = await Term.findById(req.params.id)
      .populate('moduleId', 'name');
    
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
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: 'Module not found' });
    }
    
    // Check for duplicate term in the same module
    const existingTerm = await Term.findOne({
      english,
      moduleId
    });
    
    if (existingTerm) {
      return res.status(400).json({ message: 'This term already exists in the selected module' });
    }
    
    // Create new term
    const newTerm = new Term({
      english,
      chinese,
      pinyin,
      definition,
      notes,
      examples,
      imageUrl,
      audioUrl,
      difficultyLevel: difficultyLevel || 1,
      tags: tags || [],
      moduleId,
      createdBy: req.user._id
    });
    
    await newTerm.save();
    
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
      const module = await Module.findById(moduleId);
      if (!module) {
        return res.status(404).json({ message: 'Module not found' });
      }
    }
    
    // If english and moduleId are provided, check for duplicates (excluding this one)
    if (english && moduleId) {
      const existingTerm = await Term.findOne({
        english,
        moduleId,
        _id: { $ne: req.params.id }
      });
      
      if (existingTerm) {
        return res.status(400).json({ message: 'This term already exists in the selected module' });
      }
    }
    
    // Update the term
    const updatedTerm = await Term.findByIdAndUpdate(
      req.params.id,
      {
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
        moduleId,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedTerm) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    res.status(200).json(updatedTerm);
  } catch (error) {
    console.error('Error updating term:', error);
    res.status(500).json({ message: 'Error updating term', error: error.message });
  }
};

// Delete a term
exports.deleteTerm = async (req, res) => {
  try {
    const deletedTerm = await Term.findByIdAndDelete(req.params.id);
    
    if (!deletedTerm) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    res.status(200).json({ message: 'Term deleted successfully' });
  } catch (error) {
    console.error('Error deleting term:', error);
    res.status(500).json({ message: 'Error deleting term', error: error.message });
  }
};

// Batch delete terms
exports.batchDeleteTerms = async (req, res) => {
  try {
    const { termIds } = req.body;
    
    if (!termIds || !Array.isArray(termIds) || termIds.length === 0) {
      return res.status(400).json({ message: 'No term IDs provided for deletion' });
    }
    
    const result = await Term.deleteMany({ _id: { $in: termIds } });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No terms found to delete' });
    }
    
    res.status(200).json({
      message: `Successfully deleted ${result.deletedCount} terms`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error batch deleting terms:', error);
    res.status(500).json({ message: 'Error batch deleting terms', error: error.message });
  }
};

// Move terms to another module
exports.moveTerms = async (req, res) => {
  try {
    const { termIds, targetModuleId } = req.body;
    
    if (!termIds || !Array.isArray(termIds) || termIds.length === 0) {
      return res.status(400).json({ message: 'No term IDs provided' });
    }
    
    if (!targetModuleId) {
      return res.status(400).json({ message: 'Target module ID is required' });
    }
    
    // Validate target module exists
    const targetModule = await Module.findById(targetModuleId);
    if (!targetModule) {
      return res.status(404).json({ message: 'Target module not found' });
    }
    
    // Update the terms
    const result = await Term.updateMany(
      { _id: { $in: termIds } },
      {
        moduleId: targetModuleId,
        updatedAt: Date.now()
      }
    );
    
    if (result.nModified === 0) {
      return res.status(404).json({ message: 'No terms found to move' });
    }
    
    res.status(200).json({
      message: `Successfully moved ${result.nModified} terms to the target module`,
      movedCount: result.nModified
    });
  } catch (error) {
    console.error('Error moving terms:', error);
    res.status(500).json({ message: 'Error moving terms', error: error.message });
  }
};

// Import terms from CSV
exports.importTerms = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    const { moduleId } = req.body;
    
    // Check if module exists
    const module = await Module.findById(moduleId);
    if (!module) {
      return res.status(404).json({ message: '找不到指定模块' });
    }
    
    const results = [];
    const errors = [];
    let successCount = 0;
    
    // Create readable stream from buffer
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    
    // Process CSV file
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csv())
        .on('data', async (data) => {
          results.push(data);
        })
        .on('error', (error) => {
          reject(error);
        })
        .on('end', resolve);
    });
    
    // Process each row
    for (const row of results) {
      try {
        // Handle field names with potential spaces
        const english = row.english || row.English || row['English Term'] || '';
        const chinese = row.chinese || row.Chinese || row['Chinese Term'] || '';
        const description = row.description || row.Description || row['Description'] || '';
        const unit = parseInt(row.unit || row.Unit || '1', 10) || 1;
        const imageUrl = row.imageUrl || row.image || row['Image URL'] || '';
        const importance = row.importance || row.Importance || 'normal';
        
        if (!english || !chinese) {
          errors.push(`行缺少必要字段 (英文: ${english}, 中文: ${chinese})`);
          continue;
        }
        
        // Check if term already exists
        const existingTerm = await Term.findOne({ moduleId, english });
        if (existingTerm) {
          // Update existing term
          await Term.findByIdAndUpdate(existingTerm._id, {
            chinese,
            description,
            unit,
            imageUrl,
            importance,
            updatedAt: Date.now()
          });
        } else {
          // Create new term
          await Term.create({
            moduleId,
            english,
            chinese,
            description,
            unit,
            imageUrl,
            importance,
            learningProgress: []
          });
          // Increment term count
          successCount++;
        }
      } catch (error) {
        errors.push(`处理行时出错: ${error.message}`);
      }
    }
    
    // Update module term count
    if (successCount > 0) {
      await Module.findByIdAndUpdate(moduleId, { $inc: { termCount: successCount } });
    }
    
    res.status(200).json({
      message: `成功导入 ${successCount} 个词汇`,
      totalRows: results.length,
      successCount,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    res.status(500).json({ message: '导入词汇失败', error: error.message });
  }
}; 