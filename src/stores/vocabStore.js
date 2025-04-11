import { defineStore } from 'pinia'
import api from '../services/api'

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
        // 验证模块ID是否有效
        if (!moduleId) {
          console.error('[VocabStore] 无效的模块ID:', moduleId);
          throw new Error('无效的模块ID');
        }
        
        // 检查token
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('[VocabStore] 未找到token，用户可能未登录');
          throw new Error('未登录，请先登录');
        }
        
        console.log(`[VocabStore] 开始加载模块ID=${moduleId}的词汇 (类型: ${typeof moduleId})`);
        
        // 确保模块ID是正确的格式
        const id = typeof moduleId === 'number' ? moduleId : String(moduleId);
        
        // 使用正确的API路径
        const url = `/modules/${id}/terms`;
        console.log(`[VocabStore] 请求API: ${url}`);
        
        // 发送请求到API，添加额外的调试信息
        console.log(`[VocabStore] 发送请求头: Authorization: Bearer ${token.substring(0, 15)}...`);
        
        // 添加请求超时和重试逻辑
        let retries = 0;
        const maxRetries = 2;
        let response;
        
        while (retries <= maxRetries) {
          try {
            response = await api.get(url);
            break; // 请求成功，跳出循环
          } catch (err) {
            retries++;
            console.warn(`[VocabStore] API请求失败，重试 ${retries}/${maxRetries}:`, err.message);
            
            if (retries > maxRetries) {
              throw err; // 超过最大重试次数，抛出错误
            }
            
            // 等待一段时间后重试
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
        
        console.log(`[VocabStore] API响应状态: ${response.status}`);
        console.log(`[VocabStore] API响应数据类型: ${typeof response.data}, 是否为数组: ${Array.isArray(response.data)}`);
        
        const terms = response.data;
        
        if (!terms) {
          console.error(`[VocabStore] 模块${id}的API响应无效:`, response.data);
          this.modules[id] = [];
          this.currentModule = id;
          return [];
        }
        
        console.log(`[VocabStore] 接收到${terms.length}个词汇`);
        
        if (terms.length === 0) {
          console.warn(`[VocabStore] 模块${id}没有词汇`);
          this.modules[id] = [];
          this.currentModule = id;
          return [];
        }
        
        // 打印第一个词汇示例，用于调试
        if (terms.length > 0) {
          console.log('[VocabStore] 第一个词汇示例:', terms[0]);
        }
        
        // 映射字段名: 后端 -> 前端
        // 添加额外的字段检查和错误处理
        this.modules[id] = terms.map(term => {
          // 检查词汇是否有效
          if (!term) {
            console.warn('[VocabStore] 发现无效词汇项: ', term);
            return null;
          }
          
          // 创建词汇对象，确保所有必要的字段都存在
          return {
            id: term.id || 0,
            term: term.english || '(未知词汇)',
            definition: term.definition || '',
            foreignTerm: term.chinese || '(未知翻译)',
            image: term.imageUrl || null,
            notes: term.notes || null
          };
        }).filter(term => term !== null); // 过滤掉无效项
        
        console.log(`[VocabStore] 成功映射${this.modules[id].length}个词汇`);
        if (this.modules[id].length > 0) {
          console.log('[VocabStore] 映射后的第一个词汇:', this.modules[id][0]);
        }
        
        this.currentModule = id;
        return this.modules[id];
      } catch (error) {
        console.error(`[VocabStore] 加载模块${moduleId}时出错:`, error);
        console.error(`[VocabStore] 错误详情:`, {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        // 返回空数组表示没有数据
        this.modules[moduleId] = [];
        this.currentModule = moduleId;
        return [];
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
        const response = await api.get('/modules');
        const data = response.data;
        
        this.moduleList = data.map(module => ({
          id: module.id || module._id,
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
        const method = moduleData.id ? 'put' : 'post';
        const url = moduleData.id 
          ? `/modules/${moduleData.id}`
          : '/modules';
        
        const response = await api[method](url, {
          name: moduleData.title,
          title: moduleData.title,
          description: moduleData.description,
          language: moduleData.language || 'English-Chinese'
        });
        
        // 刷新模块列表
        await this.loadAllModules();
        
        return response.data;
      } catch (error) {
        console.error('Error saving module:', error);
        throw error;
      }
    },
    
    // 删除模块
    async deleteModule(moduleId) {
      try {
        await api.delete(`/modules/${moduleId}`);
        
        // 从状态中移除模块
        if (this.modules[moduleId]) {
          delete this.modules[moduleId];
        }
        
        this.moduleList = this.moduleList.filter(module => module.id !== moduleId);
        
        return true;
      } catch (error) {
        console.error('Error deleting module:', error);
        throw error;
      }
    },

    // 导入词汇
    async importVocabulary(moduleId, data) {
      try {
        const response = await api.post(`/terms/import`, {
          moduleId,
          terms: data
        });
        
        return response.data;
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

    // 保存术语
    async saveTerm(moduleId, termData) {
      try {
        const method = termData.id ? 'put' : 'post';
        const url = termData.id 
          ? `/terms/${termData.id}`
          : '/terms';
        
        const response = await api[method](url, {
          english: termData.term,
          chinese: termData.foreignTerm,
          definition: termData.definition,
          notes: termData.notes,
          imageUrl: termData.image,
          moduleId
        });
        
        const savedTerm = response.data;
        
        // 更新本地缓存
        if (this.modules[moduleId]) {
          if (termData.id) {
            // 更新现有术语
            const index = this.modules[moduleId].findIndex(t => t.id === termData.id);
            if (index !== -1) {
              this.modules[moduleId][index] = {
                id: savedTerm.id || savedTerm._id,
                term: savedTerm.english,
                definition: savedTerm.definition,
                foreignTerm: savedTerm.chinese,
                image: savedTerm.imageUrl,
                notes: savedTerm.notes
              };
            }
          } else {
            // 添加新术语
            this.modules[moduleId].push({
              id: savedTerm.id || savedTerm._id,
              term: savedTerm.english,
              definition: savedTerm.definition,
              foreignTerm: savedTerm.chinese,
              image: savedTerm.imageUrl,
              notes: savedTerm.notes
            });
          }
        }
        
        return savedTerm;
      } catch (error) {
        console.error('Error saving term:', error);
        throw error;
      }
    },
    
    // 删除术语
    async deleteTerm(termId, moduleId) {
      try {
        await api.delete(`/terms/${termId}`);
        
        // 从本地缓存中移除
        if (this.modules[moduleId]) {
          this.modules[moduleId] = this.modules[moduleId].filter(term => term.id !== termId);
        }
        
        if (this.currentTerm && this.currentTerm.id === termId) {
          this.currentTerm = null;
        }
        
        return true;
      } catch (error) {
        console.error('Error deleting term:', error);
        throw error;
      }
    }
  }
}) 