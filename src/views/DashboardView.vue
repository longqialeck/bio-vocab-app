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
        <q-card
          class="module-card"
          :class="{'module-card-inactive': module.progress === 0}"
          @click="startModule(module.id)"
        >
          <q-card-section class="text-center">
            <q-icon :name="module.icon" size="40px" color="primary" />
            <div class="text-subtitle1 q-mt-sm">{{ module.title }}</div>
            <div class="text-caption">{{ module.totalTerms }} terms</div>
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
      router.push({ name: 'study', params: { moduleId, termId: 1 } })
    }
    
    const startModule = (moduleId) => {
      router.push({ name: 'study', params: { moduleId, termId: 1 } })
    }
    
    const goToAdmin = () => {
      router.push({ name: 'admin-dashboard' })
    }
    
    const goToUserProfile = () => {
      router.push({ name: 'user-profile' })
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
      goToUserProfile
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
</style> 