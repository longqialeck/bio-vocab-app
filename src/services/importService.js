/**
 * 处理Excel和CSV文件导入的服务
 * 在真实应用中，这将使用适当的库如Papa Parse或xlsx.js
 */
class ImportService {
  /**
   * 从文件中读取表格数据
   * @param {File} file - 上传的文件对象
   * @param {Function} onComplete - 成功读取后的回调函数
   * @param {Function} onError - 错误处理回调函数
   */
  async readFile(file, onComplete, onError) {
    try {
      // 检查文件类型
      if (!this.isValidFileType(file)) {
        throw new Error('文件格式不支持。请上传Excel(.xlsx, .xls)或CSV(.csv)文件');
      }

      // 在真实应用中，这里会使用适当的库解析文件
      // 这里我们模拟异步读取
      setTimeout(() => {
        // 生成模拟数据
        const data = this.generateMockData();
        onComplete(data);
      }, 1000);
    } catch (error) {
      onError(error);
    }
  }

  /**
   * 检查文件类型是否有效
   * @param {File} file - 上传的文件
   * @returns {boolean} - 文件类型是否有效
   */
  isValidFileType(file) {
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    return validTypes.includes(file.type) || 
      file.name.endsWith('.xlsx') || 
      file.name.endsWith('.xls') || 
      file.name.endsWith('.csv');
  }

  /**
   * 生成用于预览的表头结构
   * @returns {Array} - 表头结构
   */
  getHeaderStructure() {
    return [
      { name: 'term', label: '英文术语', required: true },
      { name: 'definition', label: '英文定义', required: true },
      { name: 'foreignTerm', label: '中文术语', required: true },
      { name: 'notes', label: '注释', required: false },
      { name: 'image', label: '图片URL', required: false }
    ];
  }

  /**
   * 验证导入的数据结构
   * @param {Array} data - 要验证的数据
   * @returns {Object} - 验证结果和错误信息
   */
  validateData(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return { 
        valid: false, 
        errors: ['没有找到有效数据'] 
      };
    }

    const headers = this.getHeaderStructure();
    const requiredFields = headers
      .filter(h => h.required)
      .map(h => h.name);
    
    const errors = [];
    
    // 验证每行数据
    data.forEach((row, index) => {
      requiredFields.forEach(field => {
        if (!row[field] || row[field].trim() === '') {
          errors.push(`行 ${index + 1}: 缺少必填字段 "${field}"`);
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 生成模拟数据用于测试
   * @returns {Array} - 模拟数据
   */
  generateMockData() {
    return [
      {
        term: 'Chloroplast',
        definition: 'Organelle that captures energy from sunlight and converts it to chemical energy through photosynthesis',
        foreignTerm: '叶绿体',
        notes: 'Found in plant cells and algae',
        image: null
      },
      {
        term: 'Lysosome',
        definition: 'Membrane-bound organelle containing digestive enzymes',
        foreignTerm: '溶酶体',
        notes: 'Involved in breaking down waste materials and cellular debris',
        image: null
      },
      {
        term: 'Vacuole',
        definition: 'Membrane-bound organelle that stores materials like water, food, or waste',
        foreignTerm: '液泡',
        notes: 'Large in plant cells, smaller in animal cells',
        image: null
      }
    ];
  }

  /**
   * 将数据转换为指定格式
   * @param {Array} data - 要转换的数据
   * @returns {Array} - 转换后的数据
   */
  transformData(data) {
    // 在实际应用中，这里会进行必要的数据转换
    return data.map(item => ({
      term: item.term?.trim(),
      definition: item.definition?.trim(),
      foreignTerm: item.foreignTerm?.trim(),
      notes: item.notes?.trim() || '',
      image: item.image || null
    }));
  }
}

export default new ImportService(); 