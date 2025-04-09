const fs = require('fs');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const path = require('path');

/**
 * Parse a CSV file and return an array of objects
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Array>} - Array of parsed objects
 */
const parseCsv = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        // Clean up the file after processing
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
        resolve(results);
      })
      .on('error', (error) => {
        // Clean up the file if there's an error
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
        reject(error);
      });
  });
};

/**
 * Parse an Excel file and return an array of objects
 * @param {string} filePath - Path to the Excel file
 * @returns {Array} - Array of parsed objects
 */
const parseExcel = (filePath) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const results = xlsx.utils.sheet_to_json(worksheet);
    
    // Clean up the file after processing
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    
    return results;
  } catch (error) {
    // Clean up the file if there's an error
    fs.unlink(filePath, (err) => {
      if (err) console.error('Error deleting file:', err);
    });
    throw error;
  }
};

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 */
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Parse a file based on its extension
 * @param {string} filePath - Path to the file
 * @returns {Promise<Array>} - Array of parsed objects
 */
const parseFile = async (filePath) => {
  const extension = path.extname(filePath).toLowerCase();
  
  if (extension === '.csv') {
    return await parseCsv(filePath);
  } else if (['.xlsx', '.xls'].includes(extension)) {
    return parseExcel(filePath);
  } else {
    throw new Error('Unsupported file format');
  }
};

module.exports = {
  parseCsv,
  parseExcel,
  ensureDirectoryExists,
  parseFile
}; 