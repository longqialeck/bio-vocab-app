import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    progress: {
      wordsLearned: 0,
      totalWords: 0,
      dailyGoal: 0,
      streak: 0
    },
    learningModules: [],
    allUsers: [] // 存储所有用户，仅管理员可访问
  }),
  
  getters: {
    getUser: (state) => state.user,
    getProgress: (state) => state.progress,
    getModules: (state) => state.learningModules,
    isAdmin: (state) => state.user?.isAdmin || false,
    getAllUsers: (state) => state.allUsers
  },
  
  actions: {
    setUser(user) {
      this.user = user
      this.isAuthenticated = true
      localStorage.setItem('bioVocabUser', JSON.stringify(user))
    },
    
    loadUser() {
      const userData = localStorage.getItem('bioVocabUser')
      if (userData) {
        this.user = JSON.parse(userData)
        this.isAuthenticated = true
        this.loadProgress()
        return true
      }
      return false
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('bioVocabUser')
    },
    
    async loadProgress() {
      // In a real app, this would fetch from Google Sheets API
      // For prototype, we'll use mock data
      this.progress = {
        wordsLearned: 14,
        totalWords: 20,
        dailyGoal: 5,
        streak: 5
      }
      
      this.learningModules = [
        {
          id: 'cell-structure',
          title: 'Cell Structure',
          totalTerms: 15,
          progress: 70,
          icon: 'o_science'
        },
        {
          id: 'dna-genetics',
          title: 'DNA & Genetics',
          totalTerms: 27,
          progress: 0,
          icon: 'o_biotech'
        },
        {
          id: 'plant-biology',
          title: 'Plant Biology',
          totalTerms: 20,
          progress: 0,
          icon: 'o_eco'
        }
      ]
    },
    
    updateProgress(moduleId, completed) {
      // Update progress logic would go here
      // Would sync with Google Sheets in production
      this.progress.wordsLearned += completed
      
      const moduleIndex = this.learningModules.findIndex(m => m.id === moduleId)
      if (moduleIndex >= 0) {
        const module = this.learningModules[moduleIndex]
        module.progress = Math.min(100, Math.floor((module.progress + 10)))
        this.learningModules[moduleIndex] = module
      }
    },

    // Admin功能 - 加载所有用户
    async loadAllUsers() {
      // 模拟API调用获取所有用户
      this.allUsers = [
        {
          id: 'user_123456',
          name: 'Emily Chen',
          email: 'emily@example.com',
          gradeLevel: '10',
          lastLogin: '2023-05-15',
          progress: 75,
          isAdmin: false
        },
        {
          id: 'user_789012',
          name: 'David Wang',
          email: 'david@example.com',
          gradeLevel: '11',
          lastLogin: '2023-05-14',
          progress: 45,
          isAdmin: false
        },
        {
          id: 'admin_001',
          name: 'Admin User',
          email: 'admin@biovocab.com',
          gradeLevel: 'Teacher',
          lastLogin: '2023-05-16',
          progress: 100,
          isAdmin: true
        }
      ]
      return this.allUsers
    },

    // 添加或更新用户
    addOrUpdateUser(user) {
      const index = this.allUsers.findIndex(u => u.id === user.id)
      if (index >= 0) {
        this.allUsers[index] = { ...this.allUsers[index], ...user }
      } else {
        this.allUsers.push(user)
      }
    },

    // 删除用户
    deleteUser(userId) {
      this.allUsers = this.allUsers.filter(user => user.id !== userId)
    },

    // 登录为管理员
    loginAsAdmin() {
      this.setUser({
        id: 'admin_001',
        name: 'Admin User',
        email: 'admin@biovocab.com',
        gradeLevel: 'Teacher',
        isAdmin: true
      })
      return true
    },

    // 更新用户个人资料
    async updateUserProfile(profileData) {
      if (!this.user) {
        throw new Error('未登录，无法更新个人资料')
      }
      
      // 在真实应用中，这里会调用API将数据保存到后端
      // 目前只更新本地存储
      this.user = {
        ...this.user,
        name: profileData.name || this.user.name,
        email: profileData.email || this.user.email,
        grade: profileData.grade || this.user.grade
      }
      
      // 更新本地存储
      localStorage.setItem('bioVocabUser', JSON.stringify(this.user))
      
      return true
    },

    // 更新用户密码
    async updatePassword(currentPassword, newPassword) {
      if (!this.user) {
        throw new Error('未登录，无法修改密码')
      }
      
      // 在真实应用中，这里会验证当前密码并通过API更新密码
      // 目前只做简单模拟
      if (currentPassword === 'password') { // 模拟密码验证
        // 密码更新成功
        console.log('密码已更新')
        return true
      } else {
        throw new Error('当前密码不正确')
      }
    }
  }
}) 