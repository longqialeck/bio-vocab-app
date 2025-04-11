<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-lg">
      <div class="text-h5">
        Hi, {{ user?.name }}!
        <div class="text-caption text-grey">{{ currentDate }}</div>
      </div>
      <div class="row items-center">
        <q-btn v-if="isAdmin" color="secondary" flat icon="admin_panel_settings" label="管理系统" @click="goToAdmin" class="q-mr-sm" />
        <q-avatar class="cursor-pointer" @click="goToUserProfile">
          <q-icon name="person" size="28px" />
          <q-badge floating color="primary">1</q-badge>
        </q-avatar>
      </div>
    </div>
    
    <q-card class="q-mb-md progress-card">
      <q-card-section>
        <div class="text-h6">Today's Progress</div>
        
        <div class="row q-mt-md">
          <div class="col-6">
            <div class="progress-chart">
              <q-circular-progress
                show-value
                font-size="12px"
                :value="progressPercentage"
                size="100px"
                :thickness="0.2"
                color="primary"
                track-color="grey-3"
                class="q-ma-md"
              >
                {{ progressPercentage }}%
              </q-circular-progress>
              <div class="text-subtitle2">Daily Goal</div>
            </div>
          </div>
          
          <div class="col-6">
            <div class="q-mt-sm">
              <div class="row items-center">
                <div class="text-subtitle1">Words Learned</div>
                <div class="q-ml-auto">{{ progress.wordsLearned }}/{{ progress.totalWords }}</div>
              </div>
              <q-linear-progress
                :value="progress.wordsLearned / progress.totalWords"
                color="primary"
                class="q-mt-sm"
              />
            </div>
            
            <div class="q-mt-lg">
              <div class="text-subtitle2">
                <q-icon name="local_fire_department" color="orange" />
                {{ progress.streak }} day streak! Keep it up!
              </div>
            </div>
          </div>
        </div>
        
        <div class="row justify-center q-mt-md">
          <q-btn
            color="secondary"
            icon="quiz"
            label="综合测验"
            @click="goToComprehensiveQuiz"
          />
        </div>
      </q-card-section>
    </q-card>
    
    <div class="text-h6 q-mb-md">Continue Learning</div>
    
    <q-card v-if="currentModule" class="q-mb-lg">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-subtitle1">{{ currentModule.title }}</div>
            <div class="text-caption text-grey">Chapter 3 • {{ currentModule.totalTerms }} words</div>
          </div>
          <div class="col-4 text-right">{{ currentModule.progress }}% Complete</div>
        </div>
        
        <q-linear-progress
          :value="currentModule.progress / 100"
          color="primary"
          class="q-mt-sm"
        />
        
        <div class="row justify-center q-mt-md">
          <q-btn
            color="primary"
            label="Continue"
            @click="continueModule(currentModule.id)"
          />
        </div>
      </q-card-section>
    </q-card>
    
    <div class="text-h6 q-mb-md">Learning Modules</div>
    
    <div class="row q-col-gutter-md">
      <div 
        v-for="module in modules" 
        :key="module.id" 
        class="col-6"
      >
        <a v-if="module && module.id" :href="`/#/study/${module.id}/1`" class="no-decoration">
          <q-card
            class="module-card"
            :class="{'module-card-inactive': module.progress === 0}"
          >
            <q-card-section class="text-center">
              <q-icon :name="module.icon" size="40px" color="primary" />
              <div class="text-subtitle1 q-mt-sm">{{ module.title }}</div>
              <div class="text-caption">{{ module.totalTerms || 0 }} terms</div>
              <q-btn 
                color="primary" 
                class="q-mt-sm"
                size="sm" 
                label="开始学习" 
              />
            </q-card-section>
          </q-card>
        </a>
        <q-card v-else class="module-card module-card-inactive">
          <q-card-section class="text-center">
            <q-icon name="warning" size="40px" color="grey" />
            <div class="text-subtitle1 q-mt-sm">模块加载中...</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import { useVocabStore } from '../stores/vocabStore'

export default defineComponent({
  name: 'DashboardView',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const vocabStore = useVocabStore()
    
    onMounted(() => {
      userStore.loadProgress()
    })
    
    const user = computed(() => userStore.getUser)
    const progress = computed(() => userStore.getProgress)
    const modules = computed(() => userStore.getModules)
    const isAdmin = computed(() => userStore.isAdmin)
    
    const currentModule = computed(() => {
      const inProgressModules = modules.value.filter(m => m.progress > 0 && m.progress < 100)
      return inProgressModules.length > 0 ? inProgressModules[0] : null
    })
    
    const progressPercentage = computed(() => {
      return Math.floor((progress.value.wordsLearned / progress.value.dailyGoal) * 100)
    })
    
    const currentDate = computed(() => {
      const now = new Date()
      const options = { weekday: 'long', month: 'long', day: 'numeric' }
      return now.toLocaleDateString('en-US', options)
    })
    
    const continueModule = (moduleId) => {
      if (!moduleId) {
        console.error('无效的模块ID:', moduleId);
        return;
      }
      
      const id = String(moduleId);
      console.log(`继续学习模块 ID: ${id}`);
      
      try {
        // 使用router跳转
        router.push({ 
          name: 'study', 
          params: { 
            moduleId: id, 
            termId: '1' 
          }
        });
        
        // 备用方法
        setTimeout(() => {
          if (window.location.hash.indexOf(`/study/${id}/`) === -1) {
            console.log('继续学习路由跳转失败，使用备用方式');
            window.location.href = `/#/study/${id}/1`;
          }
        }, 300);
      } catch (error) {
        console.error('继续学习路由跳转出错:', error);
        window.location.href = `/#/study/${id}/1`;
      }
    }
    
    const startModule = (moduleId) => {
      // 增加验证和详细日志
      if (!moduleId) {
        console.error('无效的模块ID:', moduleId);
        return;
      }
      
      console.log(`开始学习模块 ID: ${moduleId} (类型: ${typeof moduleId})`);
      
      // 确保将模块ID转换为字符串
      const id = String(moduleId);
      console.log(`转换后的模块ID: ${id}`);
      
      try {
        // 方式1: 使用router对象跳转
        router.push({
          name: 'study',
          params: {
            moduleId: id,
            termId: '1'
          }
        });
        
        // 备用方案 - 直接修改location
        setTimeout(() => {
          if (window.location.hash.indexOf(`/study/${id}/`) === -1) {
            console.log('路由跳转失败，使用备用方式');
            window.location.href = `/#/study/${id}/1`;
          }
        }, 300);
      } catch (error) {
        console.error('路由跳转出错:', error);
        // 出错时使用哈希模式URL格式
        window.location.href = `/#/study/${id}/1`;
      }
    }
    
    const goToAdmin = () => {
      router.push({ name: 'admin-dashboard' })
    }
    
    const goToUserProfile = () => {
      router.push({ name: 'user-profile' })
    }
    
    const goToComprehensiveQuiz = () => {
      router.push({ name: 'comprehensive-quiz' })
    }
    
    const onStartButtonClick = (moduleId, event) => {
      // 检查事件参数
      const eventTarget = event?.currentTarget;
      console.log('点击事件目标:', eventTarget);
      console.log('模块ID参数:', moduleId);
      
      // 如果moduleId为undefined，尝试从事件目标获取
      if (moduleId === undefined) {
        // 尝试从DOM元素上获取数据
        const dataModuleId = eventTarget?.dataset?.moduleId;
        if (dataModuleId) {
          moduleId = dataModuleId;
          console.log('从DOM元素获取到模块ID:', moduleId);
        } else {
          console.error('无法获取模块ID，所有尝试均失败');
          return;
        }
      }
      
      console.log('明确点击按钮启动模块:', moduleId);
      
      // 确保模块ID有效
      if (!moduleId) {
        console.error('无效的模块ID');
        return;
      }
      
      // 直接使用明确的方式设置路由
      const id = String(moduleId);
      console.log('处理后的模块ID:', id);
      
      // 使用与哈希模式匹配的URL格式
      try {
        // 阻止默认行为和冒泡
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        window.location.href = `/#/study/${id}/1`;
      } catch (e) {
        console.error('跳转失败:', e);
        // 尝试备用方法
        router.push({path: `/study/${id}/1`});
      }
    }
    
    return {
      user,
      progress,
      modules,
      currentModule,
      progressPercentage,
      currentDate,
      continueModule,
      startModule,
      isAdmin,
      goToAdmin,
      goToUserProfile,
      goToComprehensiveQuiz,
      onStartButtonClick
    }
  }
})
</script>

<style scoped>
.progress-card {
  border-radius: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.progress-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.module-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.module-card-inactive {
  opacity: 0.7;
}

.no-decoration {
  text-decoration: none;
  color: inherit;
}

.no-decoration:hover {
  text-decoration: none;
  color: inherit;
}
</style> 