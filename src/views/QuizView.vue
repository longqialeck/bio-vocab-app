<template>
  <q-page class="q-pa-md">
    <div v-if="currentQuestion">
      <div class="row items-center justify-between q-mb-md">
        <q-btn icon="close" flat round dense @click="exitQuiz" />
        <div class="progress-indicator">
          <q-linear-progress
            :value="(currentQuestionIndex) / totalQuestions"
            color="primary"
            class="q-mb-xs"
          />
          <div class="text-caption text-right">{{ currentQuestionIndex }} / {{ totalQuestions }}</div>
        </div>
      </div>
      
      <div class="text-center q-mb-md">
        <div class="timer-indicator">{{ timeLeft }} seconds</div>
      </div>
      
      <q-card class="quiz-card q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-lg">{{ currentQuestion.question }}</div>
          
          <div class="q-gutter-y-md">
            <q-item
              v-for="option in currentQuestion.options"
              :key="option.id"
              clickable
              v-ripple
              :active="selectedOption === option.id"
              active-class="bg-green-1"
              @click="selectOption(option.id)"
              class="rounded-borders"
            >
              <q-item-section>
                <q-radio
                  v-model="selectedOption"
                  :val="option.id"
                  :label="option.text"
                  color="primary"
                />
              </q-item-section>
              
              <q-item-section v-if="showFeedback && option.id === currentQuestion.correctAnswerId" avatar>
                <q-icon name="check_circle" color="positive" />
              </q-item-section>
              
              <q-item-section v-else-if="showFeedback && selectedOption === option.id" avatar>
                <q-icon name="cancel" color="negative" />
              </q-item-section>
            </q-item>
          </div>
          
          <div v-if="showFeedback" class="q-mt-lg feedback-area">
            <q-banner v-if="isCorrect" class="bg-positive text-white">
              <template v-slot:avatar>
                <q-icon name="check_circle" />
              </template>
              Correct! Ribosomes are the sites of protein synthesis.
            </q-banner>
            
            <q-banner v-else class="bg-negative text-white">
              <template v-slot:avatar>
                <q-icon name="cancel" />
              </template>
              Incorrect. Ribosomes are the sites of protein synthesis.
            </q-banner>
          </div>
        </q-card-section>
      </q-card>
      
      <div class="row justify-end">
        <q-btn
          :label="showFeedback ? 'Next Question' : 'Check Answer'"
          color="primary"
          :disable="!selectedOption && !showFeedback"
          @click="showFeedback ? nextQuestion() : checkAnswer()"
        />
      </div>
    </div>
    
    <div v-else-if="quizCompleted" class="column items-center q-pa-lg">
      <h4 class="text-h4 text-primary q-mb-lg">Quiz Results</h4>
      
      <q-circular-progress
        show-value
        font-size="20px"
        :value="scorePercentage"
        size="180px"
        :thickness="0.2"
        color="primary"
        track-color="grey-3"
        class="q-mb-lg"
      >
        {{ correctAnswers }} / {{ totalQuestions }}
      </q-circular-progress>
      
      <p class="text-h6 q-mb-lg">You scored {{ scorePercentage }}%</p>
      
      <div class="row q-col-gutter-md">
        <q-btn color="primary" label="Study Again" @click="goToStudy" />
        <q-btn color="secondary" label="Return to Dashboard" @click="exitQuiz" />
      </div>
    </div>
    
    <div v-else class="flex flex-center">
      <q-spinner-dots color="primary" size="80px" />
      <div class="q-mt-sm">Loading quiz...</div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVocabStore } from '../stores/vocabStore'
import { useUserStore } from '../stores/userStore'

export default defineComponent({
  name: 'QuizView',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const vocabStore = useVocabStore()
    const userStore = useUserStore()
    
    const moduleId = computed(() => route.params.moduleId)
    
    const questions = ref([])
    const currentQuestionIndex = ref(1)
    const selectedOption = ref(null)
    const showFeedback = ref(false)
    const isCorrect = ref(false)
    const quizCompleted = ref(false)
    const correctAnswers = ref(0)
    const totalQuestions = ref(10)
    const timeLeft = ref(20)
    let timerInterval = null
    
    const currentQuestion = computed(() => {
      if (questions.value.length === 0) return null
      return questions.value[currentQuestionIndex.value - 1] || null
    })
    
    const scorePercentage = computed(() => {
      return Math.round((correctAnswers.value / totalQuestions.value) * 100)
    })
    
    onMounted(async () => {
      await loadQuizQuestions()
      startTimer()
    })
    
    onUnmounted(() => {
      clearInterval(timerInterval)
    })
    
    const loadQuizQuestions = async () => {
      // Ensure module data is loaded first
      await vocabStore.loadModule(moduleId.value)
      // Generate quiz questions
      const quizQuestions = vocabStore.generateQuiz(moduleId.value, 10)
      questions.value = quizQuestions
      totalQuestions.value = quizQuestions.length
    }
    
    const startTimer = () => {
      clearInterval(timerInterval)
      timeLeft.value = 20
      
      timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
          timeLeft.value--
        } else {
          // Time's up, check answer or move to next question
          if (showFeedback.value) {
            nextQuestion()
          } else if (selectedOption.value) {
            checkAnswer()
          } else {
            // If no answer selected, move to next question
            nextQuestion()
          }
        }
      }, 1000)
    }
    
    const selectOption = (optionId) => {
      if (!showFeedback.value) {
        selectedOption.value = optionId
      }
    }
    
    const checkAnswer = () => {
      if (!currentQuestion.value || !selectedOption.value) return
      
      showFeedback.value = true
      clearInterval(timerInterval)
      
      isCorrect.value = selectedOption.value === currentQuestion.value.correctAnswerId
      
      if (isCorrect.value) {
        correctAnswers.value++
      }
    }
    
    const nextQuestion = () => {
      if (currentQuestionIndex.value < totalQuestions.value) {
        currentQuestionIndex.value++
        selectedOption.value = null
        showFeedback.value = false
        startTimer()
      } else {
        // Quiz completed
        completeQuiz()
      }
    }
    
    const completeQuiz = () => {
      quizCompleted.value = true
      clearInterval(timerInterval)
      
      // Update user progress
      userStore.updateProgress(moduleId.value, correctAnswers.value)
    }
    
    const exitQuiz = () => {
      router.push({ name: 'dashboard' })
    }
    
    const goToStudy = () => {
      router.push({ name: 'study', params: { moduleId: moduleId.value, termId: 1 } })
    }
    
    return {
      moduleId,
      questions,
      currentQuestionIndex,
      currentQuestion,
      selectedOption,
      showFeedback,
      isCorrect,
      quizCompleted,
      correctAnswers,
      totalQuestions,
      timeLeft,
      scorePercentage,
      selectOption,
      checkAnswer,
      nextQuestion,
      exitQuiz,
      goToStudy
    }
  }
})
</script>

<style scoped>
.quiz-card {
  border-radius: 16px;
  min-height: 400px;
}

.progress-indicator {
  width: 80%;
}

.timer-indicator {
  display: inline-block;
  padding: 4px 12px;
  background-color: #E0E0E0;
  border-radius: 16px;
  font-size: 0.9rem;
}

.feedback-area {
  animation: fadeIn 0.5s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style> 