import { defineStore } from 'pinia'

export const useVocabStore = defineStore('vocab', {
  state: () => ({
    modules: {},
    moduleList: [],
    currentModule: null,
    currentTerm: null,
    quizQuestions: []
  }),
  
  getters: {
    getModuleTerms: (state) => (moduleId) => {
      return state.modules[moduleId] || []
    },
    
    getCurrentTerm: (state) => {
      return state.currentTerm
    },

    getAllModules: (state) => {
      return state.moduleList
    }
  },
  
  actions: {
    async loadModule(moduleId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录，请先登录');
        }
        
        const response = await fetch(`http://localhost:5000/api/terms/module/${moduleId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch terms for module ${moduleId}`);
        }
        
        const data = await response.json();
        
        // 处理API返回的数据格式，可能是直接terms数组或带有pagination的对象
        const terms = data.terms || data;
        
        // 字段名称映射: 后端 -> 前端
        this.modules[moduleId] = terms.map(term => ({
          id: term._id,
          term: term.english,
          definition: term.definition || '',
          foreignTerm: term.chinese || '',
          image: term.imageUrl || null,
          notes: term.notes || null
        }));
        
        this.currentModule = moduleId;
        return this.modules[moduleId];
      } catch (error) {
        console.error(`Error loading module ${moduleId}:`, error);
        
        // 回退到硬编码数据用于演示
        if (moduleId === 'cell-structure') {
          this.modules[moduleId] = [
            {
              id: 1,
              term: 'Cell Membrane',
              definition: 'Also called the plasma membrane, it is the thin layer of protein and fat that surrounds the cell.',
              foreignTerm: '细胞膜',
              image: null
            },
            {
              id: 2,
              term: 'Cytoplasm',
              definition: 'The fluid inside the cell that holds the organelles in place.',
              foreignTerm: '细胞质',
              image: null
            },
            {
              id: 3,
              term: 'Nucleus',
              definition: 'The cell\'s control center, containing the cell\'s DNA and directing cell activities.',
              foreignTerm: '细胞核',
              image: null
            }
          ];
        } else if (moduleId === 'dna-genetics') {
          this.modules[moduleId] = [
            {
              id: 1,
              term: 'DNA',
              definition: 'Deoxyribonucleic acid, the hereditary material in humans and almost all other organisms.',
              foreignTerm: '脱氧核糖核酸',
              image: null
            },
            {
              id: 2,
              term: 'Gene',
              definition: 'The basic physical and functional unit of heredity.',
              foreignTerm: '基因',
              image: null
            }
          ];
        }
        
        this.currentModule = moduleId;
        return this.modules[moduleId] || [];
      }
    },
    
    setCurrentTerm(termId) {
      if (!this.currentModule || !this.modules[this.currentModule]) return null
      
      const term = this.modules[this.currentModule].find(t => t.id === termId)
      this.currentTerm = term || null
      return term
    },
    
    generateQuiz(moduleId, count = 10) {
      if (!this.modules[moduleId]) return []
      
      const terms = this.modules[moduleId]
      const questions = []
      
      // Generate simple quiz with 4 options for each question
      for (let i = 0; i < Math.min(count, terms.length); i++) {
        const correctTerm = terms[i]
        const otherTerms = terms.filter(t => t.id !== correctTerm.id)
        
        // Shuffle and take first 3
        const shuffled = otherTerms.sort(() => 0.5 - Math.random())
        const options = shuffled.slice(0, 3).map(t => ({ id: t.id, text: t.term }))
        
        // Add correct answer
        options.push({ id: correctTerm.id, text: correctTerm.term })
        
        // Shuffle again
        options.sort(() => 0.5 - Math.random())
        
        questions.push({
          id: i + 1,
          question: `Which organelle is responsible for ${correctTerm.definition.toLowerCase()}`,
          options,
          correctAnswerId: correctTerm.id
        })
      }
      
      this.quizQuestions = questions
      return questions
    },

    // 管理员功能：加载所有模块
    async loadAllModules() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录，请先登录');
        }
        
        const response = await fetch('http://localhost:5000/api/modules', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }
        
        const data = await response.json();
        this.moduleList = data.map(module => ({
          id: module._id,
          title: module.title || module.name,
          description: module.description || '',
          totalTerms: module.termCount || 0,
          lastUpdated: module.updatedAt ? new Date(module.updatedAt).toISOString().split('T')[0] : '',
          language: module.language || 'English-Chinese'
        }));
        
        return this.moduleList;
      } catch (error) {
        console.error('Error loading modules:', error);
        return [];
      }
    },

    // 添加或更新模块
    async addOrUpdateModule(moduleData) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录，请先登录');
        }
        
        const method = moduleData.id ? 'PUT' : 'POST';
        const url = moduleData.id 
          ? `http://localhost:5000/api/modules/${moduleData.id}`
          : 'http://localhost:5000/api/modules';
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: moduleData.title,
            title: moduleData.title,
            description: moduleData.description,
            language: moduleData.language || 'English-Chinese'
          })
        });
        
        if (!response.ok) {
          throw new Error(moduleData.id ? 'Failed to update module' : 'Failed to create module');
        }
        
        // 刷新模块列表
        await this.loadAllModules();
        
        const result = await response.json();
        return result;
      } catch (error) {
        console.error('Error saving module:', error);
        throw error;
      }
    },
    
    // 删除模块
    async deleteModule(moduleId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录，请先登录');
        }
        
        const response = await fetch(`http://localhost:5000/api/modules/${moduleId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete module');
        }
        
        // 从状态中移除模块
        if (this.modules[moduleId]) {
          delete this.modules[moduleId];
        }
        
        // 如果当前显示的是被删除的模块，清空当前模块
        if (this.currentModule === moduleId) {
          this.currentModule = null;
        }
        
        // 刷新模块列表
        await this.loadAllModules();
        
        return true;
      } catch (error) {
        console.error('Error deleting module:', error);
        throw error;
      }
    },

    // 从Excel/CSV导入词汇
    async importVocabulary(moduleId, data) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录，请先登录');
        }
        
        // 将前端词汇数据字段映射到后端字段
        const mappedData = data.map(item => ({
          english: item.term, 
          chinese: item.foreignTerm,
          definition: item.definition || '',
          notes: item.notes || '',
          imageUrl: item.image || ''
        }));
        
        const response = await fetch(`http://localhost:5000/api/terms/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            moduleId: moduleId,
            terms: mappedData 
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to import vocabulary');
        }
        
        // 更新模块信息
        await this.loadModule(moduleId);
        
        // 刷新模块列表以更新统计信息
        await this.loadAllModules();
        
        return this.modules[moduleId];
      } catch (error) {
        console.error('Error importing vocabulary:', error);
        throw error;
      }
    },

    // 解析上传的Excel/CSV文件
    parseImportedFile(file, headers) {
      // 这里是一个示例解析函数
      // 在实际应用中，您需要使用如Papa Parse或xlsx库来解析文件
      // 这里我们假设已经解析并返回模拟数据
      
      return [
        {
          term: 'Mitochondrion',
          definition: 'Organelle that produces energy for the cell through cellular respiration',
          foreignTerm: '线粒体'
        },
        {
          term: 'Endoplasmic Reticulum',
          definition: 'A network of membranes throughout the cytoplasm that is involved in protein and lipid synthesis',
          foreignTerm: '内质网'
        },
        {
          term: 'Golgi Apparatus',
          definition: 'Organelle that modifies, sorts, and packages proteins for secretion or use within the cell',
          foreignTerm: '高尔基体'
        }
      ]
    },

    // 保存词汇条目
    async saveTerm(moduleId, termData) {
      try {
        const method = termData.id ? 'PUT' : 'POST';
        const url = termData.id 
          ? `http://localhost:5000/api/terms/${termData.id}`
          : 'http://localhost:5000/api/terms';
        
        // 准备请求数据 - 映射前端字段名称到后端字段名称
        const requestData = {
          moduleId: moduleId,
          english: termData.term,
          definition: termData.definition,
          chinese: termData.foreignTerm || '',
          notes: termData.notes || '',
          imageUrl: termData.image || ''
        };
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(termData.id ? 'Failed to update term' : 'Failed to create term');
        }
        
        const result = await response.json();
        
        // 更新本地数据
        await this.loadModule(moduleId);
        
        return result;
      } catch (error) {
        console.error('Error saving term:', error);
        throw error;
      }
    },
    
    // 删除词汇条目
    async deleteTerm(termId, moduleId) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('未登录，请先登录');
        }
        
        const response = await fetch(`http://localhost:5000/api/terms/${termId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete term');
        }
        
        // 重新加载模块内容
        await this.loadModule(moduleId);
        
        return true;
      } catch (error) {
        console.error('Error deleting term:', error);
        throw error;
      }
    }
  }
}) 