<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <q-btn icon="arrow_back" flat round dense @click="goBack" />
      <h2 class="text-h5 q-ml-md">Learning Modules</h2>
    </div>
    
    <div class="row q-col-gutter-md">
      <div 
        v-for="module in modules" 
        :key="module.id" 
        class="col-12 col-sm-6"
      >
        <q-card
          class="module-card q-mb-md"
          :class="{'module-card-active': module.progress > 0}"
          @click="startModule(module.id)"
        >
          <q-card-section>
            <div class="row items-center">
              <q-icon :name="module.icon" size="40px" color="primary" class="q-mr-md" />
              <div>
                <div class="text-h6">{{ module.title }}</div>
                <div class="text-caption">Chapter {{ userStore.getModuleChapter(module.id) }} • {{ module.totalTerms }} terms</div>
              </div>
              <q-space />
              <div class="text-right">
                <div class="text-body2">{{ module.progress }}% Complete</div>
                <q-linear-progress
                  :value="module.progress / 100"
                  color="primary"
                  class="q-mt-sm"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'

export default defineComponent({
  name: 'ModulesView',
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    const modules = computed(() => userStore.getModules)
    
    const startModule = (moduleId) => {
      router.push({ name: 'study', params: { moduleId, termId: 1 } })
    }
    
    const goBack = () => {
      router.push({ name: 'dashboard' })
    }
    
    return {
      modules,
      startModule,
      goBack,
      userStore
    }
  }
})
</script>

<style scoped>
.module-card {
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.module-card-active {
  border-left: 4px solid #4285F4;
}
</style> 