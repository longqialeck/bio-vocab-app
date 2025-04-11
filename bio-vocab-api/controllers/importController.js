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
    
    // 确保清理上传的文件
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('删除文件出错:', unlinkError);
      }
    }
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
    const term = {
      english: row.term || row.Term || row.TERM || row.word || row.Word || row.英文 || row.english || row.English || '',
      chinese: row.foreignTerm || row.ForeignTerm || row.chinese || row.Chinese || row.中文 || '',
      definition: row.definition || row.Definition || row.DEFINITION || row.meaning || row.英文定义 || '',
      pinyin: row.pinyin || row.Pinyin || row.PINYIN || row.拼音 || '',
      notes: row.notes || row.Notes || row.note || row.注释 || '',
      imageUrl: row.image || row.Image || row.imageUrl || row.图片 || '',
      difficultyLevel: convertDifficulty(row.difficulty || row.Difficulty || row.难度 || 'medium'),
      tags: convertTags(row.tags || row.Tags || row.标签 || '')
    };
    
    return term;
  }).filter(term => term.english && term.chinese); // 术语和中文翻译都需要有效
};

// 将难度文本转换为数字
const convertDifficulty = (difficulty) => {
  if (typeof difficulty === 'number') {
    return difficulty >= 1 && difficulty <= 3 ? difficulty : 2;
  }
  
  const difficultyText = String(difficulty).toLowerCase();
  
  if (difficultyText === 'easy' || difficultyText === '简单' || difficultyText === '1') {
    return 1;
  } else if (difficultyText === 'hard' || difficultyText === '困难' || difficultyText === '3') {
    return 3;
  } else {
    return 2; // medium/普通/默认
  }
};

// 将标签文本转换为数组
const convertTags = (tags) => {
  if (Array.isArray(tags)) {
    return tags;
  }
  
  if (typeof tags === 'string' && tags.trim()) {
    return tags.split(/[,;，；]/).map(tag => tag.trim()).filter(Boolean);
  }
  
  return [];
}; 