<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <q-btn icon="arrow_back" flat round dense @click="goBack" />
      <div class="q-ml-md">
        <div class="text-h6">{{ moduleTitle }}</div>
        <div class="text-caption text-grey-7">Chapter {{ userStore.getModuleChapter(moduleId) }}</div>
        <div class="row items-center" v-if="totalTerms > 0">
          <q-rating
            v-model="currentTermIndex"
            :max="totalTerms"
            size="1em"
            readonly
            color="primary"
          />
          <div class="q-ml-sm text-caption">{{ currentTermIndex }}/{{ totalTerms }} terms</div>
        </div>
      </div>
    </div>
    
    <q-card class="study-card q-mb-lg">
      <q-card-section>
        <div v-if="currentTerm" class="text-center">
          <div class="text-subtitle1 text-grey-7 q-mb-sm">What is the English term for:</div>
          <div class="foreign-term">{{ currentTerm.foreignTerm }}</div>
          
          <div class="english-term q-mt-xl">{{ showAnswer ? currentTerm.term : '?' }}</div>
          
          <q-btn
            :color="showAnswer ? 'grey' : 'primary'"
            :label="showAnswer ? 'Hide Answer' : 'Show Answer'"
            class="q-mt-lg"
            @click="toggleAnswer"
          />
          
          <div class="q-mt-lg" v-if="showAnswer">
            <div class="text-subtitle1 text-grey-7 q-mb-sm">Definition:</div>
            <div class="definition">{{ currentTerm.definition }}</div>
            
            <div class="q-mt-lg">
              <div class="text-subtitle2 text-grey-7">How well did you know this?</div>
              <div class="row justify-center q-mt-sm q-gutter-sm">
                <q-btn unelevated round color="red-5" icon="sentiment_very_dissatisfied" @click="rateKnowledge(1)" />
                <q-btn unelevated round color="orange-5" icon="sentiment_dissatisfied" @click="rateKnowledge(2)" />
                <q-btn unelevated round color="blue-5" icon="sentiment_satisfied" @click="rateKnowledge(3)" />
                <q-btn unelevated round color="green-5" icon="sentiment_very_satisfied" @click="rateKnowledge(4)" />
              </div>
            </div>
          </div>
        </div>
        
        <div v-else-if="loading" class="text-center">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-sm">加载中...</div>
        </div>
        
        <div v-else-if="loadError" class="text-center">
          <q-icon name="error" color="negative" size="3em" />
          <div class="q-mt-sm text-negative">{{ loadError }}</div>
          <q-btn color="primary" label="返回模块列表" class="q-mt-md" @click="goBack" />
        </div>
        
        <div v-else-if="terms.length === 0" class="text-center">
          <q-icon name="info" color="warning" size="3em" />
          <div class="q-mt-sm">该模块没有词汇</div>
          <q-btn color="primary" label="返回模块列表" class="q-mt-md" @click="goBack" />
        </div>
        
        <div v-else-if="!moduleId" class="text-center">
          <q-icon name="error_outline" color="negative" size="3em" />
          <div class="q-mt-sm">无效的模块ID</div>
          <q-btn color="primary" label="返回模块列表" class="q-mt-md" @click="goBack" />
        </div>
        
        <div v-else class="text-center">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-sm">正在准备学习内容...</div>
        </div>
      </q-card-section>
    </q-card>
    
    <div class="row justify-between" v-if="currentTerm">
      <q-btn
        icon="navigate_before"
        label="上一词"
        color="grey-7"
        flat
        :disable="currentTermIndex <= 1"
        @click="prevTerm"
      />
      
      <q-btn
        icon-right="navigate_next"
        label="下一词"
        color="primary"
        :disable="currentTermIndex >= totalTerms"
        @click="nextTerm"
      />
    </div>
    
    <div class="row justify-center q-mt-lg" v-if="currentTermIndex >= totalTerms && showAnswer && currentTerm">
      <q-btn color="primary" label="测验" @click="goToQuiz" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVocabStore } from '../stores/vocabStore'
import { useUserStore } from '../stores/userStore'

export default defineComponent({
  name: 'StudyView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const vocabStore = useVocabStore()
    const userStore = useUserStore()
    
    const moduleId = computed(() => {
      const paramId = route.params.moduleId;
      const queryId = route.query.moduleId;
      const pathMatch = window.location.hash.match(/\/study\/(\d+)\/\d+/);
      const pathId = pathMatch ? pathMatch[1] : null;
      
      let id = paramId || queryId || pathId;
      if (!id || id === 'undefined') {
        console.error('[StudyView] 无效的模块ID:', id);
        return null;
      }
      
      // 尝试将模块ID转换为数字
      const numericId = parseInt(id);
      if (!isNaN(numericId)) {
        id = numericId;
      }
      
      console.log('[StudyView] 模块ID:', {
        paramId, queryId, pathId, 最终ID: id,
        类型: typeof id
      });
      
      return id;
    })
    
    const termId = computed(() => {
      const paramTermId = route.params.termId;
      const queryTermId = route.query.termId;
      const pathMatch = window.location.hash.match(/\/study\/\d+\/(\d+)/);
      const pathTermId = pathMatch ? pathMatch[1] : null;
      
      const rawId = paramTermId || queryTermId || pathTermId || '1';
      const id = parseInt(rawId) || 1;
      console.log('词汇ID获取:', { paramTermId, queryTermId, pathTermId, 最终ID: id });
      
      return id;
    })
    
    const terms = ref([])
    const totalTerms = ref(0)
    const currentTermIndex = ref(1)
    const showAnswer = ref(false)
    const loading = ref(false)
    const loadError = ref('')
    
    const currentTerm = computed(() => {
      if (terms.value.length === 0) return null
      return terms.value[currentTermIndex.value - 1] || null
    })
    
    const moduleTitle = computed(() => {
      const modules = userStore.getModules
      const module = modules.find(m => m.id === moduleId.value)
      return module ? module.title : 'Study'
    })
    
    onMounted(async () => {
      await loadModuleTerms()
      currentTermIndex.value = termId.value
    })
    
    watch(moduleId, (newId, oldId) => {
      if (newId && newId !== oldId) {
        console.log(`[StudyView] moduleId changed: ${oldId} -> ${newId}`);
        loadModuleTerms();
      }
    })
    
    watch(moduleId, (newId) => {
      if (newId === null) {
        console.warn('[StudyView] 检测到无效模块ID，将重定向到主页');
        router.replace('/dashboard');
      }
    }, { immediate: true })
    
    const loadModuleTerms = async () => {
      try {
        loading.value = true;
        loadError.value = '';
        
        const id = moduleId.value;
        
        if (!id) {
          console.error('[StudyView] 模块ID无效:', id);
          loadError.value = '无效的模块ID';
          terms.value = [];
          totalTerms.value = 0;
          
          // 如果ID无效则返回到dashboard
          setTimeout(() => {
            router.replace('/dashboard');
          }, 1500);
          
          return;
        }
        
        console.log(`[StudyView] 开始加载模块ID=${id}的词汇，(类型: ${typeof id})`);
        
        const moduleTerms = await vocabStore.loadModule(id);
        
        if (!moduleTerms || moduleTerms.length === 0) {
          console.error(`[StudyView] 模块${id}没有找到词汇`);
          terms.value = [];
          totalTerms.value = 0;
          return;
        }
        
        console.log(`[StudyView] 成功加载模块${id}的${moduleTerms.length}个词汇`);
        
        const validTerms = moduleTerms.filter(term => term && term.term && term.foreignTerm);
        
        if (validTerms.length !== moduleTerms.length) {
          console.warn(`[StudyView] 过滤后有效词汇数量: ${validTerms.length}，原数量: ${moduleTerms.length}`);
        }
        
        if (validTerms.length === 0) {
          console.error(`[StudyView] 模块${id}没有有效词汇`);
          terms.value = [];
          totalTerms.value = 0;
          return;
        }
        
        console.log('[StudyView] 第一个词汇:', validTerms[0]);
        
        terms.value = validTerms;
        totalTerms.value = validTerms.length;
        
        if (currentTermIndex.value > totalTerms.value) {
          currentTermIndex.value = 1;
        }
      } catch (error) {
        console.error('[StudyView] 加载模块词汇出错:', error);
        console.error('[StudyView] 错误详情:', error.response || error.message || error);
        loadError.value = `加载词汇失败: ${error.message || '未知错误'}`;
        terms.value = [];
        totalTerms.value = 0;
      } finally {
        loading.value = false;
      }
    }
    
    const toggleAnswer = () => {
      showAnswer.value = !showAnswer.value
    }
    
    const nextTerm = () => {
      if (currentTermIndex.value < totalTerms.value) {
        currentTermIndex.value++
        showAnswer.value = false
        router.replace({ name: 'study', params: { moduleId: moduleId.value, termId: currentTermIndex.value } })
      }
    }
    
    const prevTerm = () => {
      if (currentTermIndex.value > 1) {
        currentTermIndex.value--
        showAnswer.value = false
        router.replace({ name: 'study', params: { moduleId: moduleId.value, termId: currentTermIndex.value } })
      }
    }
    
    const rateKnowledge = (rating) => {
      // 先做认证状态诊断
      const authStatus = userStore.checkAuthStatus();
      console.log(`[StudyView] 准备更新模块ID=${moduleId.value}的学习进度，认证状态:`, authStatus);
      
      // 处理评分并更新进度
      if (rating >= 3) {
        const currentTermId = currentTerm.value?.id;
        console.log(`[StudyView] 用户标记词汇为"已学会"，词汇ID=${currentTermId}，评分=${rating}`);
        
        try {
          // 传入当前词汇ID而不是数字1，以确保正确记录所学词汇
          userStore.updateProgress(moduleId.value, currentTermId || 1)
            .then(() => {
              console.log(`[StudyView] 进度更新请求已发送`);
            })
            .catch(err => {
              console.error(`[StudyView] 进度更新失败:`, err);
            });
        } catch (error) {
          console.error(`[StudyView] 调用更新进度方法失败:`, error);
        }
      }
      
      // 前往下一个词汇
      nextTerm();
    }
    
    const goToQuiz = () => {
      router.push({ name: 'quiz', params: { moduleId: moduleId.value } })
    }
    
    const goBack = () => {
      router.push({ name: 'dashboard' })
    }
    
    return {
      moduleId,
      termId,
      terms,
      totalTerms,
      currentTermIndex,
      currentTerm,
      showAnswer,
      moduleTitle,
      toggleAnswer,
      nextTerm,
      prevTerm,
      rateKnowledge,
      goToQuiz,
      goBack,
      loading,
      loadError,
      userStore
    }
  }
})
</script>

<style scoped>
.study-card {
  border-radius: 16px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.foreign-term {
  font-size: 2rem;
  font-weight: bold;
  margin: 1rem 0;
}

.english-term {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4285F4;
  margin: 1rem 0;
}

.definition {
  font-size: 1.1rem;
  line-height: 1.5;
}
</style> 