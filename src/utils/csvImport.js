import Papa from 'papaparse';
import { ref } from 'vue';
import api from '../services/api';

export const importStatus = ref({
  processing: false,
  progress: 0,
  message: '',
  success: false,
  error: null
});

export async function importVocabularyFromCSV(file) {
  try {
    importStatus.value = {
      processing: true,
      progress: 0,
      message: '开始解析CSV文件...',
      success: false,
      error: null
    };

    // Read file content
    const fileContent = await readFileAsText(file);
    
    // Parse CSV
    const { data } = Papa.parse(fileContent, { 
      header: true,
      skipEmptyLines: true 
    });
    
    importStatus.value.message = `解析完成，发现 ${data.length} 个单词`;
    importStatus.value.progress = 10;
    
    // Group by unit
    const unitGroups = {};
    data.forEach(item => {
      if (!unitGroups[item.所属单元]) {
        unitGroups[item.所属单元] = [];
      }
      unitGroups[item.所属单元].push({
        english: item.英文单词名,
        chinese: item.中文单词名,
        description: item.单词中文描述,
        importance: item.单词重要等级
      });
    });
    
    importStatus.value.message = `按单元分组完成，共 ${Object.keys(unitGroups).length} 个单元`;
    importStatus.value.progress = 20;
    
    // Process each unit
    let completedUnits = 0;
    const totalUnits = Object.keys(unitGroups).length;
    
    for (const [unitName, terms] of Object.entries(unitGroups)) {
      importStatus.value.message = `正在处理单元: ${unitName}`;
      
      // Create or update module
      const moduleData = {
        title: unitName,
        description: `${unitName} vocabulary terms`,
        termCount: terms.length
      };
      
      // Check if module already exists
      const existingModules = await api.get('/modules', { 
        params: { title: unitName }
      });
      
      let moduleId;
      if (existingModules.data.length > 0) {
        // Update existing module
        moduleId = existingModules.data[0]._id;
        await api.put(`/modules/${moduleId}`, moduleData);
      } else {
        // Create new module
        const moduleResponse = await api.post('/modules', moduleData);
        moduleId = moduleResponse.data._id;
      }
      
      // Process terms for this module
      for (let i = 0; i < terms.length; i++) {
        const term = terms[i];
        const termData = {
          ...term,
          moduleId
        };
        
        // Check if term already exists
        const existingTerms = await api.get('/terms', {
          params: { 
            moduleId,
            english: term.english 
          }
        });
        
        if (existingTerms.data.length > 0) {
          // Update existing term
          await api.put(`/terms/${existingTerms.data[0]._id}`, termData);
        } else {
          // Create new term
          await api.post('/terms', termData);
        }
        
        // Update progress for each term
        importStatus.value.progress = 20 + Math.floor(
          (completedUnits / totalUnits) * 70 + 
          (i / terms.length) * (70 / totalUnits)
        );
      }
      
      completedUnits++;
      importStatus.value.message = `完成单元: ${unitName}`;
    }
    
    importStatus.value.message = '导入完成!';
    importStatus.value.progress = 100;
    importStatus.value.success = true;
    importStatus.value.processing = false;
    
    return Object.keys(unitGroups).length;
  } catch (error) {
    console.error('Import error:', error);
    importStatus.value.error = error.message || '导入过程中发生错误';
    importStatus.value.processing = false;
    importStatus.value.success = false;
    throw error;
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = error => reject(error);
    reader.readAsText(file);
  });
} 