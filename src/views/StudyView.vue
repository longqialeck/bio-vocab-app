<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-lg">
      <q-btn icon="arrow_back" flat round dense @click="goBack" />
      <div class="q-ml-md">
        <div class="text-h6">{{ moduleTitle }}</div>
        <div class="row items-center">
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
        
        <div v-else class="text-center">
          <q-spinner color="primary" size="3em" />
          <div class="q-mt-sm">Loading term...</div>
        </div>
      </q-card-section>
    </q-card>
    
    <div class="row justify-between">
      <q-btn
        icon="navigate_before"
        label="Previous Term"
        color="grey-7"
        flat
        :disable="currentTermIndex <= 1"
        @click="prevTerm"
      />
      
      <q-btn
        icon-right="navigate_next"
        label="Next Term"
        color="primary"
        :disable="currentTermIndex >= totalTerms"
        @click="nextTerm"
      />
    </div>
    
    <div class="row justify-center q-mt-lg" v-if="currentTermIndex >= totalTerms && showAnswer">
      <q-btn color="primary" label="Take Quiz" @click="goToQuiz" />
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
    
    const moduleId = computed(() => route.params.moduleId)
    const termId = computed(() => parseInt(route.params.termId) || 1)
    
    const terms = ref([])
    const totalTerms = ref(0)
    const currentTermIndex = ref(1)
    const showAnswer = ref(false)
    
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
    
    const loadModuleTerms = async () => {
      const moduleTerms = await vocabStore.loadModule(moduleId.value)
      terms.value = moduleTerms
      totalTerms.value = moduleTerms.length
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
      // In a real app, this would save the rating to track learning progress
      // For the prototype, we'll just move to the next term
      nextTerm()
      
      // Update progress in the store
      if (rating >= 3) {
        userStore.updateProgress(moduleId.value, 1)
      }
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
      goBack
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