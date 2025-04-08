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
      // In a real app, this would fetch from Google Sheets API
      // For prototype, we'll use mock data
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
        ]
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
        ]
      }
      
      this.currentModule = moduleId
      return this.modules[moduleId]
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
      this.moduleList = [
        {
          id: 'cell-structure',
          title: 'Cell Structure',
          description: 'Basic terms related to cell structure and organelles',
          totalTerms: 15,
          lastUpdated: '2023-05-10',
          language: 'English-Chinese'
        },
        {
          id: 'dna-genetics',
          title: 'DNA & Genetics',
          description: 'Terms related to DNA structure and genetics',
          totalTerms: 27,
          lastUpdated: '2023-05-12',
          language: 'English-Chinese'
        },
        {
          id: 'plant-biology',
          title: 'Plant Biology',
          description: 'Vocabulary for plant structure and functions',
          totalTerms: 20,
          lastUpdated: '2023-05-15',
          language: 'English-Chinese'
        }
      ]
      return this.moduleList
    },

    // 添加或更新模块
    addOrUpdateModule(module) {
      const index = this.moduleList.findIndex(m => m.id === module.id)
      if (index >= 0) {
        this.moduleList[index] = { ...this.moduleList[index], ...module }
      } else {
        // 为新模块创建唯一ID
        if (!module.id) {
          module.id = module.title.toLowerCase().replace(/\s+/g, '-')
        }
        this.moduleList.push(module)
      }
      return module
    },

    // 删除模块
    deleteModule(moduleId) {
      this.moduleList = this.moduleList.filter(module => module.id !== moduleId)
      if (this.modules[moduleId]) {
        delete this.modules[moduleId]
      }
    },

    // 从Excel/CSV导入词汇
    async importVocabulary(moduleId, data) {
      if (!this.modules[moduleId]) {
        this.modules[moduleId] = []
      }

      // 在真实应用中，这里会处理上传的Excel/CSV数据
      // 这里我们假设data是已经解析好的词汇数组
      
      // 为每个词条分配ID
      const currentMaxId = this.modules[moduleId].length > 0 
        ? Math.max(...this.modules[moduleId].map(t => t.id))
        : 0

      const newTerms = data.map((term, index) => ({
        id: currentMaxId + index + 1,
        ...term
      }))

      // 添加到现有模块
      this.modules[moduleId] = [...this.modules[moduleId], ...newTerms]

      // 更新模块信息
      const moduleIndex = this.moduleList.findIndex(m => m.id === moduleId)
      if (moduleIndex >= 0) {
        this.moduleList[moduleIndex].totalTerms = this.modules[moduleId].length
        this.moduleList[moduleIndex].lastUpdated = new Date().toISOString().split('T')[0]
      }

      return this.modules[moduleId]
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
    }
  }
}) 