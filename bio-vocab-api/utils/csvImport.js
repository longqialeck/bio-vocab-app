const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');

/**
 * Parse CSV file and return array of objects
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - CSV parsing options
 * @returns {Promise<Array>} - Parsed data as array of objects
 */
exports.parseCSVFile = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // Default options
    const defaultOptions = {
      columns: true, // Use first row as column names
      skip_empty_lines: true,
      trim: true
    };
    
    // Merge options
    const parserOptions = { ...defaultOptions, ...options };
    
    // Create readable stream from file
    const fileStream = fs.createReadStream(filePath);
    
    // Create parser
    const parser = parse(parserOptions);
    
    // Handle errors
    fileStream.on('error', error => {
      reject(new Error(`File read error: ${error.message}`));
    });
    
    parser.on('error', error => {
      reject(new Error(`CSV parsing error: ${error.message}`));
    });
    
    // Process data
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        results.push(record);
      }
    });
    
    // Finalize
    parser.on('end', () => {
      resolve(results);
    });
    
    // Pipe file stream to parser
    fileStream.pipe(parser);
  });
};

/**
 * Validate imported vocabulary data
 * @param {Array} data - Array of vocabulary objects
 * @returns {Object} - Validation results
 */
exports.validateVocabularyData = (data) => {
  const validItems = [];
  const invalidItems = [];
  
  if (!Array.isArray(data) || data.length === 0) {
    return {
      isValid: false,
      validItems: [],
      invalidItems: [],
      error: 'No data found or invalid data format'
    };
  }
  
  data.forEach((item, index) => {
    const errors = [];
    
    // Check required fields
    if (!item.english || item.english.trim() === '') {
      errors.push('English term is required');
    }
    
    if (!item.chinese || item.chinese.trim() === '') {
      errors.push('Chinese translation is required');
    }
    
    // Check for valid data in optional fields
    if (item.difficultyLevel && isNaN(Number(item.difficultyLevel))) {
      errors.push('Difficulty level must be a number');
    }
    
    // Add more validations as needed...
    
    if (errors.length > 0) {
      invalidItems.push({
        rowIndex: index + 2, // +2 because index is 0-based and we skip header row
        data: item,
        errors
      });
    } else {
      // Process valid item
      const validItem = {
        english: item.english.trim(),
        chinese: item.chinese.trim(),
        pinyin: item.pinyin ? item.pinyin.trim() : '',
        definition: item.definition ? item.definition.trim() : '',
        notes: item.notes ? item.notes.trim() : '',
        imageUrl: item.imageUrl ? item.imageUrl.trim() : '',
        audioUrl: item.audioUrl ? item.audioUrl.trim() : '',
        difficultyLevel: item.difficultyLevel ? parseInt(item.difficultyLevel, 10) : 1,
        tags: item.tags ? item.tags.split(',').map(tag => tag.trim()) : []
      };
      
      // Add examples if available
      if (item.examples) {
        validItem.examples = item.examples.split('|').map(ex => ex.trim());
      }
      
      validItems.push(validItem);
    }
  });
  
  return {
    isValid: invalidItems.length === 0,
    validItems,
    invalidItems,
    error: invalidItems.length > 0 ? 'Some items have validation errors' : null
  };
};

/**
 * Clean up uploaded files
 * @param {string|Array} filePaths - Path or array of paths to delete
 */
exports.cleanupFiles = async (filePaths) => {
  const paths = Array.isArray(filePaths) ? filePaths : [filePaths];
  
  for (const filePath of paths) {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
      // Continue with other files even if one fails
    }
  }
};

/**
 * Get sample rows from CSV file for preview
 * @param {string} filePath - Path to the CSV file
 * @param {number} sampleSize - Number of rows to sample
 * @returns {Promise<Object>} - Sample data and headers
 */
exports.getSampleFromCSV = async (filePath, sampleSize = 5) => {
  try {
    // Parse with headers to get column names
    const allData = await exports.parseCSVFile(filePath);
    
    // Extract headers (keys from the first row)
    const headers = allData.length > 0 ? Object.keys(allData[0]) : [];
    
    // Get sample rows (limited to sampleSize)
    const sampleRows = allData.slice(0, sampleSize);
    
    return {
      headers,
      sampleRows,
      totalRows: allData.length
    };
  } catch (error) {
    throw new Error(`Error sampling CSV file: ${error.message}`);
  }
}; 