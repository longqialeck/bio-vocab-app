const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const csv = require('csv-parser');

// 解析上传的文件
exports.parseFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传文件' });
    }
    
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let terms = [];
    
    if (fileExtension === '.csv') {
      // 解析CSV文件
      terms = await parseCSV(filePath);
    } else {
      // 解析Excel文件
      terms = parseExcel(filePath);
    }
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    res.json({ terms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: '文件解析错误' });
  }
};

// 解析Excel文件
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  return normalizeData(data);
};

// 解析CSV文件
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(normalizeData(results));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// 标准化导入数据
const normalizeData = (data) => {
  return data.map(row => {
    // 尝试多种可能的列名匹配
    return {
      term: row.term || row.Term || row.TERM || row.word || row.Word || row.英文 || '',
      definition: row.definition || row.Definition || row.DEFINITION || row.meaning || row.英文定义 || '',
      foreignTerm: row.foreignTerm || row.ForeignTerm || row.chinese || row.Chinese || row.中文 || '',
      notes: row.notes || row.Notes || row.note || row.注释 || '',
      image: row.image || row.Image || row.imageUrl || row.图片 || ''
    };
  }).filter(term => term.term && (term.definition || term.foreignTerm)); // 至少要有术语和一种定义
}; 