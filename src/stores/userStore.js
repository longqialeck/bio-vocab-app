import { defineStore } from 'pinia'
import api from '../services/api'

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
    
    async loadUser() {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('bioVocabUser')
      
      if (token && userData) {
        this.user = JSON.parse(userData)
        this.isAuthenticated = true
        
        // 验证token有效性
        try {
          const response = await api.get('/auth/me')
          this.user = response.data
          localStorage.setItem('bioVocabUser', JSON.stringify(this.user))
          await this.loadProgress()
          return true
        } catch (error) {
          console.error('Token验证失败:', error)
          this.logout()
          return false
        }
      }
      return false
    },
    
    logout() {
      this.user = null
      this.isAuthenticated = false
      localStorage.removeItem('bioVocabUser')
      localStorage.removeItem('token')
    },
    
    async loadProgress() {
      try {
        // 从API获取学习进度
        const response = await api.get('/progress')
        if (response.data) {
          // 更新用户总体学习进度
          this.progress = {
            wordsLearned: this.user.progress?.wordsLearned || 0,
            totalWords: this.user.progress?.totalWords || 0,
            dailyGoal: 5, // 这可以从用户设置中获取
            streak: 5 // 这需要单独的逻辑计算
          }
          
          // 获取模块列表和进度
          const modulesResponse = await api.get('/modules')
          if (modulesResponse.data) {
            this.learningModules = modulesResponse.data.map(module => {
              // 查找用户对应模块的进度
              const moduleProgress = response.data.find(p => 
                p.moduleId && p.moduleId._id === module._id
              )
              
              return {
                id: module._id,
                title: module.title,
                totalTerms: module.totalTerms || 0,
                progress: moduleProgress ? moduleProgress.progress : 0,
                icon: module.icon || 'o_science'
              }
            })
          }
        }
      } catch (error) {
        console.error('加载进度失败:', error)
        // 使用模拟数据作为后备
        this.useDefaultProgressData()
      }
    },
    
    useDefaultProgressData() {
      this.progress = {
        wordsLearned: 0,
        totalWords: 0,
        dailyGoal: 5,
        streak: 0
      }
      
      this.learningModules = [
        {
          id: 'cell-structure',
          title: 'Cell Structure',
          totalTerms: 15,
          progress: 0,
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
    
    async updateProgress(moduleId, completedTermIds) {
      try {
        // 更新API中的进度
        const response = await api.put(`/progress/module/${moduleId}`, {
          completedTermIds
        })
        
        if (response.data) {
          // 更新本地模块进度
          const moduleIndex = this.learningModules.findIndex(m => m.id === moduleId)
          if (moduleIndex >= 0) {
            this.learningModules[moduleIndex].progress = response.data.progress
          }
          
          // 更新总体进度
          this.progress.wordsLearned = this.user.progress?.wordsLearned || 0
          this.progress.totalWords = this.user.progress?.totalWords || 0
        }
      } catch (error) {
        console.error('更新进度失败:', error)
      }
    },

    // Admin功能 - 加载所有用户
    async loadAllUsers() {
      try {
        if (!this.isAdmin) {
          throw new Error('只有管理员可以访问用户列表')
        }
        
        const response = await api.get('/users')
        if (response.data) {
          this.allUsers = response.data
        }
        return this.allUsers
      } catch (error) {
        console.error('加载用户列表失败:', error)
        return []
      }
    },

    // 添加或更新用户
    async addOrUpdateUser(user) {
      try {
        if (!this.isAdmin) {
          throw new Error('只有管理员可以管理用户')
        }
        
        let response
        if (user._id) {
          // 更新现有用户
          response = await api.put(`/users/${user._id}`, user)
        } else {
          // 创建新用户
          response = await api.post('/users', user)
        }
        
        if (response.data) {
          await this.loadAllUsers() // 重新加载用户列表
          return response.data
        }
      } catch (error) {
        console.error('用户保存失败:', error)
        throw error
      }
    },

    // 删除用户
    async deleteUser(userId) {
      try {
        if (!this.isAdmin) {
          throw new Error('只有管理员可以删除用户')
        }
        
        await api.delete(`/users/${userId}`)
        await this.loadAllUsers() // 重新加载用户列表
        return true
      } catch (error) {
        console.error('用户删除失败:', error)
        throw error
      }
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
      
      try {
        const response = await api.put(`/users/${this.user._id}`, profileData)
        if (response.data) {
          this.user = {
            ...this.user,
            ...response.data
          }
          localStorage.setItem('bioVocabUser', JSON.stringify(this.user))
          return true
        }
      } catch (error) {
        console.error('更新个人资料失败:', error)
        throw error
      }
    },

    // 更新用户密码
    async updatePassword(currentPassword, newPassword) {
      if (!this.user) {
        throw new Error('未登录，无法修改密码')
      }
      
      try {
        await api.put(`/users/${this.user._id}/password`, {
          currentPassword,
          newPassword
        })
        return true
      } catch (error) {
        console.error('密码更新失败:', error)
        throw error
      }
    }
  }
}) 