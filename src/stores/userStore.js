import { defineStore } from 'pinia'
import api, { clearAuth } from '../services/api'

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
    allUsers: [], // 存储所有用户，仅管理员可访问
    // 模块ID到章节号的映射
    moduleChapterMap: {
      0: 0,  // 基础词汇对应Chapter 0
      1: 1,  // 生物体简介对应Chapter 1
      2: 2,  // 细胞物质移动对应Chapter 2
      3: 3,  // 生物分子对应Chapter 3
      4: 4,  // 酶对应Chapter 4
      5: 5   // 其他章节...
    }
  }),
  
  getters: {
    getUser: (state) => state.user,
    getProgress: (state) => state.progress,
    getModules: (state) => state.learningModules,
    isAdmin: (state) => state.user?.isAdmin || false,
    getAllUsers: (state) => state.allUsers,
    // 获取模块对应的章节号的getter
    getModuleChapter: (state) => (moduleId) => {
      return state.moduleChapterMap[moduleId] || moduleId
    }
  },
  
  actions: {
    setUser(user) {
      this.user = user
      this.isAuthenticated = true
      
      // 确保用户数据正确保存到localStorage
      console.log('保存用户数据:', user);
      localStorage.setItem('bioVocabUser', JSON.stringify(user))
      
      // 如果用户是管理员，记录额外的日志
      if (user.isAdmin) {
        console.log('管理员用户已登录:', user);
      }
    },
    
    async loadUser() {
      // 尝试从localStorage获取登录信息
      const token = localStorage.getItem('token')
      const userDataStr = localStorage.getItem('bioVocabUser')
      
      console.log('loadUser检查本地存储:', { 
        hasToken: !!token, 
        hasUserData: !!userDataStr 
      })
      
      // 如果token和用户数据都存在
      if (token && userDataStr) {
        try {
          // 解析用户数据
          const userData = JSON.parse(userDataStr)
          
          // 设置本地状态
          this.user = userData
          this.isAuthenticated = true
          
          console.log('从localStorage恢复用户状态:', { 
            user: this.user, 
            isAdmin: this.isAdmin 
          })
          
          // 验证token有效性
          try {
            const response = await api.get('/auth/me')
            
            // 如果API验证成功，更新最新的用户信息
            if (response.data) {
              this.user = response.data
              localStorage.setItem('bioVocabUser', JSON.stringify(this.user))
              console.log('Token验证成功，更新用户信息:', this.user)
              
              // 加载用户进度数据
              await this.loadProgress()
            }
            
            return true
          } catch (error) {
            console.error('Token验证失败:', error)
            this.logout()
            return false
          }
        } catch (error) {
          console.error('解析用户数据失败:', error)
          this.logout()
          return false
        }
      }
      
      console.log('无本地存储的用户信息')
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
          // 获取用户信息
          const userResponse = await api.get('/users/me');
          const userData = userResponse.data;
          
          // 更新用户总体学习进度
          this.progress = {
            wordsLearned: userData.progress?.wordsLearned || 0,
            totalWords: userData.progress?.totalWords || 0,
            dailyGoal: userData.progress?.dailyGoal || 5,
            streak: userData.progress?.streak || 0,
            quizCompletion: userData.progress?.quizCompletion || 0
          }
          
          // 获取模块列表和进度
          const modulesResponse = await api.get('/modules')
          if (modulesResponse.data) {
            // 筛选有效模块
            this.learningModules = modulesResponse.data
              .filter(module => module && (module.id || module._id)) // 确保模块有ID
              .map(module => {
                // 获取模块ID，确保其存在
                const moduleId = module.id || module._id;
                
                // 查找用户对应模块的进度
                const moduleProgress = response.data.find(p => 
                  p.moduleId && (p.moduleId._id === module._id || p.moduleId === moduleId)
                );
                
                return {
                  id: moduleId,
                  title: module.title || module.name || '未命名模块',
                  totalTerms: module.termCount || module.totalTerms || 0,
                  progress: moduleProgress ? moduleProgress.progress : 0,
                  icon: module.icon || 'o_science'
                }
              });
            
            console.log(`[UserStore] 加载了${this.learningModules.length}个模块:`, 
              this.learningModules.map(m => ({id: m.id, title: m.title})));
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
        streak: 0,
        quizCompletion: 0
      }
      
      this.learningModules = [
        {
          id: 1,
          title: 'Cell Biology',
          totalTerms: 8,
          progress: 0,
          icon: 'o_science'
        },
        {
          id: 2,
          title: 'Organization of Organisms',
          totalTerms: 5,
          progress: 0,
          icon: 'o_biotech'
        },
        {
          id: 3,
          title: 'Movement into and out of Cells',
          totalTerms: 3,
          progress: 0,
          icon: 'o_eco'
        }
      ]
    },
    
    async updateProgress(moduleId, completedTermIds) {
      try {
        // 修复认证检查逻辑
        if (!this.user) {
          console.error('用户对象不存在，无法更新进度');
          return Promise.reject(new Error('用户对象不存在'));
        }
        
        // 检查令牌存在性
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('认证令牌不存在，无法更新进度');
          return Promise.reject(new Error('认证令牌不存在'));
        }
        
        console.log(`更新进度: 模块=${moduleId}, 完成词汇数=${Array.isArray(completedTermIds) ? completedTermIds.length : completedTermIds}`);
        
        // 确保completedTermIds是数组
        let termIds = completedTermIds;
        if (!Array.isArray(completedTermIds)) {
          if (typeof completedTermIds === 'number' || typeof completedTermIds === 'string') {
            // 如果传入单个ID，转换为数组
            termIds = [completedTermIds];
          } else if (!completedTermIds) {
            console.error('无效的词汇ID:', completedTermIds);
            return Promise.reject(new Error('无效的词汇ID'));
          }
        }
        
        console.log(`准备发送进度更新请求: 模块ID=${moduleId}, 完成词汇=${JSON.stringify(termIds)}`);
        
        // 更新API中的进度
        const response = await api.put(`/progress/module/${moduleId}`, {
          completedTermIds: termIds
        });
        
        if (response.data) {
          console.log(`进度更新成功:`, response.data);
          
          // 更新本地模块进度
          const moduleIndex = this.learningModules.findIndex(m => m.id === moduleId || m.id === Number(moduleId));
          if (moduleIndex >= 0) {
            this.learningModules[moduleIndex].progress = response.data.progress;
            console.log(`本地模块进度已更新: ${response.data.progress}%`);
          } else {
            console.warn(`未找到模块ID=${moduleId}的本地数据`);
          }
          
          // 重新获取用户进度数据以更新总体进度
          await this.loadProgress();
          
          return Promise.resolve(response.data);
        }
        
        return Promise.resolve(null);
      } catch (error) {
        console.error('更新进度失败:', error.message, error);
        return Promise.reject(error);
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
    },

    // 诊断函数：检查认证状态
    checkAuthStatus() {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('bioVocabUser');
      
      const authStatus = {
        hasToken: !!token,
        tokenValue: token ? `${token.substring(0, 10)}...` : null,
        hasUserData: !!userData,
        isAuthenticated: this.isAuthenticated,
        hasUserObject: !!this.user,
        userId: this.user?.id
      };
      
      console.log('[AUTH_DIAGNOSIS] 认证状态检查:', authStatus);
      return authStatus;
    }
  }
}) 