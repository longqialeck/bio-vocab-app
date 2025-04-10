<template>
  <q-page class="q-pa-md">
    <!-- 测验配置页面 -->
    <div v-if="!quizStarted && !quizCompleted" class="column items-center q-py-md">
      <h2 class="text-h4 text-primary q-mb-lg">词汇综合测验</h2>
      
      <q-card flat bordered class="full-width q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">选择测验模块</div>
          
          <q-option-group
            v-model="selectedModules"
            :options="moduleOptions"
            type="checkbox"
            class="q-mb-md"
          ></q-option-group>
          
          <div class="q-mt-lg">
            <div class="text-h6 q-mb-md">测验设置</div>
            
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-input
                  v-model.number="quizSettings.questionCount"
                  type="number"
                  label="题目数量"
                  min="5"
                  max="50"
                  outlined
                ></q-input>
              </div>
              
              <div class="col-12 col-md-6">
                <q-select
                  v-model="quizSettings.difficulty"
                  :options="difficultyOptions"
                  label="难度"
                  outlined
                ></q-select>
              </div>
            </div>
            
            <div class="q-mt-md">
              <q-checkbox v-model="quizSettings.includeMultipleChoice" label="包含选择题"></q-checkbox>
            </div>
            
            <div class="q-mt-sm">
              <q-checkbox v-model="quizSettings.includeSpelling" label="包含拼写题"></q-checkbox>
            </div>
            
            <div class="q-mt-sm">
              <q-checkbox v-model="quizSettings.randomOrder" label="随机顺序出题"></q-checkbox>
            </div>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn 
            label="开始测验" 
            color="primary" 
            :disable="selectedModules.length === 0 || 
                     !(quizSettings.includeMultipleChoice || quizSettings.includeSpelling)"
            @click="startQuiz"
          ></q-btn>
        </q-card-actions>
      </q-card>
    </div>
    
    <!-- 测验进行中 -->
    <div v-else-if="quizStarted && !quizCompleted">
      <div class="row items-center justify-between q-mb-md">
        <q-btn icon="close" flat round dense @click="confirmExitQuiz" />
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
        <div class="timer-indicator">{{ timeLeft }} 秒</div>
      </div>
      
      <!-- 选择题 -->
      <q-card v-if="currentQuestion && currentQuestion.type === 'multipleChoice'" class="quiz-card q-mb-lg">
        <q-card-section>
          <div class="text-overline">{{ currentQuestion.moduleName }}</div>
          <div class="text-h6 q-mb-md">
            <span v-if="currentQuestion.questionLanguage === 'foreign'">
              {{ currentQuestion.question }} 的英文是？
            </span>
            <span v-else>
              {{ currentQuestion.question }} 的中文是？
            </span>
          </div>
          
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
        </q-card-section>
      </q-card>
      
      <!-- 拼写题 -->
      <q-card v-else-if="currentQuestion && currentQuestion.type === 'spelling'" class="quiz-card q-mb-lg">
        <q-card-section>
          <div class="text-overline">{{ currentQuestion.moduleName }}</div>
          <div class="text-h6 q-mb-md">
            <span v-if="currentQuestion.questionLanguage === 'foreign'">
              {{ currentQuestion.prompt }} 的英文是？
            </span>
            <span v-else>
              {{ currentQuestion.prompt }} 的中文是？
            </span>
          </div>
          
          <q-input
            v-model="spellingAnswer"
            :hint="currentQuestion.questionLanguage === 'foreign' ? '请输入英文单词' : '请输入中文单词'"
            outlined
            :disable="showFeedback"
            ref="spellingInput"
            @keyup.enter="showFeedback ? nextQuestion() : checkAnswer()"
          ></q-input>
          
          <div v-if="showFeedback" class="q-mt-lg feedback-area">
            <q-banner v-if="isCorrect" class="bg-positive text-white">
              <template v-slot:avatar>
                <q-icon name="check_circle" />
              </template>
              正确！{{ currentQuestion.answer }}
            </q-banner>
            
            <q-banner v-else class="bg-negative text-white">
              <template v-slot:avatar>
                <q-icon name="cancel" />
              </template>
              错误。正确答案是: {{ currentQuestion.answer }}
            </q-banner>
          </div>
        </q-card-section>
      </q-card>
      
      <div class="row justify-end">
        <q-btn
          :label="showFeedback ? '下一题' : '检查答案'"
          color="primary"
          :disable="!canCheckAnswer && !showFeedback"
          @click="showFeedback ? nextQuestion() : checkAnswer()"
        />
      </div>
    </div>
    
    <!-- 测验结果页面 -->
    <div v-else-if="quizCompleted" class="column items-center q-pa-lg">
      <h4 class="text-h4 text-primary q-mb-lg">测验结果</h4>
      
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
      
      <p class="text-h6 q-mb-lg">您的得分: {{ scorePercentage }}%</p>
      
      <!-- 展示错误的题目 -->
      <div v-if="incorrectQuestions.length > 0" class="full-width q-mb-lg">
        <div class="text-h6 q-mb-md">需要复习的词汇</div>
        
        <q-list bordered separator>
          <q-item v-for="(question, index) in incorrectQuestions" :key="index">
            <q-item-section>
              <q-item-label class="text-weight-bold">{{ question.moduleName }}</q-item-label>
              <q-item-label v-if="question.type === 'multipleChoice'">
                题目: {{ question.question }}
              </q-item-label>
              <q-item-label v-else>
                题目: {{ question.prompt }}
              </q-item-label>
              <q-item-label caption>
                正确答案: {{ question.answer }}
              </q-item-label>
              <q-item-label caption v-if="question.type === 'spelling' && question.userAnswer">
                您的答案: {{ question.userAnswer }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </div>
      
      <div class="row q-col-gutter-md">
        <q-btn color="primary" label="再次测验" @click="resetQuiz" />
        <q-btn color="secondary" label="返回仪表盘" @click="exitQuiz" />
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-else class="flex flex-center">
      <q-spinner-dots color="primary" size="80px" />
      <div class="q-mt-sm">加载测验中...</div>
    </div>
    
    <!-- 退出确认对话框 -->
    <q-dialog v-model="exitConfirmDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">您确定要退出测验吗？当前进度将不会保存。</span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="确认退出" color="negative" v-close-popup @click="exitQuiz" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabStore } from '../stores/vocabStore'
import { useUserStore } from '../stores/userStore'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'ComprehensiveQuizView',
  setup() {
    const router = useRouter()
    const vocabStore = useVocabStore()
    const userStore = useUserStore()
    const $q = useQuasar()
    
    // 测验状态
    const quizStarted = ref(false)
    const quizCompleted = ref(false)
    const exitConfirmDialog = ref(false)
    const spellingInput = ref(null)
    
    // 模块选择
    const selectedModules = ref([])
    const moduleOptions = ref([])
    
    // 测验设置
    const quizSettings = ref({
      questionCount: 10,
      difficulty: 'all',
      includeMultipleChoice: true,
      includeSpelling: true,
      randomOrder: true
    })
    
    // 难度选项
    const difficultyOptions = [
      { label: '所有难度', value: 'all' },
      { label: '简单', value: 'easy' },
      { label: '中等', value: 'medium' },
      { label: '困难', value: 'hard' }
    ]
    
    // 测验题目
    const questions = ref([])
    const currentQuestionIndex = ref(1)
    const selectedOption = ref(null)
    const spellingAnswer = ref('')
    const showFeedback = ref(false)
    const isCorrect = ref(false)
    const correctAnswers = ref(0)
    const totalQuestions = ref(0)
    const timeLeft = ref(30)
    const incorrectQuestions = ref([])
    let timerInterval = null
    
    // 计算属性
    const currentQuestion = computed(() => {
      if (questions.value.length === 0) return null
      return questions.value[currentQuestionIndex.value - 1] || null
    })
    
    const scorePercentage = computed(() => {
      return Math.round((correctAnswers.value / totalQuestions.value) * 100)
    })
    
    const canCheckAnswer = computed(() => {
      if (!currentQuestion.value) return false
      
      if (currentQuestion.value.type === 'multipleChoice') {
        return !!selectedOption.value
      } else if (currentQuestion.value.type === 'spelling') {
        return !!spellingAnswer.value.trim()
      }
      
      return false
    })
    
    // 生命周期钩子
    onMounted(async () => {
      await loadModules()
    })
    
    onUnmounted(() => {
      clearInterval(timerInterval)
    })
    
    // 方法
    const loadModules = async () => {
      await vocabStore.loadAllModules()
      const allModules = vocabStore.getAllModules
      
      // 转换为选项格式
      moduleOptions.value = allModules.map(module => ({
        label: module.title,
        value: module.id
      }))
    }
    
    const generateQuestions = async () => {
      // 确保所选模块都已加载
      for (const moduleId of selectedModules.value) {
        await vocabStore.loadModule(moduleId)
      }
      
      const allQuestions = []
      
      // 处理每个模块
      for (const moduleId of selectedModules.value) {
        const module = vocabStore.getAllModules.find(m => m.id === moduleId)
        const terms = vocabStore.getModuleTerms(moduleId)
        
        if (!terms || terms.length === 0) continue
        
        // 根据难度过滤词汇
        const filteredTerms = quizSettings.value.difficulty === 'all'
          ? terms
          : terms.filter(term => {
              if (quizSettings.value.difficulty === 'easy' && term.difficulty === 'easy') return true
              if (quizSettings.value.difficulty === 'medium' && term.difficulty === 'medium') return true
              if (quizSettings.value.difficulty === 'hard' && term.difficulty === 'hard') return true
              return false
            })
        
        if (filteredTerms.length === 0) continue
        
        // 选择题
        if (quizSettings.value.includeMultipleChoice) {
          const multipleChoiceQuestions = generateMultipleChoiceQuestions(moduleId, module.title, filteredTerms)
          allQuestions.push(...multipleChoiceQuestions)
        }
        
        // 拼写题
        if (quizSettings.value.includeSpelling) {
          const spellingQuestions = generateSpellingQuestions(moduleId, module.title, filteredTerms)
          allQuestions.push(...spellingQuestions)
        }
      }
      
      // 随机排序
      if (quizSettings.value.randomOrder) {
        allQuestions.sort(() => Math.random() - 0.5)
      }
      
      // 限制问题数量
      const finalQuestions = allQuestions.slice(0, quizSettings.value.questionCount)
      
      questions.value = finalQuestions
      totalQuestions.value = finalQuestions.length
    }
    
    const generateMultipleChoiceQuestions = (moduleId, moduleName, terms) => {
      const questions = []
      
      // 英文->中文问题
      for (const term of terms) {
        // 从其他词汇中随机选择三个作为错误选项
        const otherTerms = terms.filter(t => t.id !== term.id)
        if (otherTerms.length < 3) continue // 确保有足够的错误选项
        
        // 随机选择并打乱
        const shuffledTerms = [...otherTerms].sort(() => Math.random() - 0.5)
        const wrongOptions = shuffledTerms.slice(0, 3)
        
        // 生成选项
        const options = [
          { id: term.id, text: term.foreignTerm },
          ...wrongOptions.map(t => ({ id: t.id, text: t.foreignTerm }))
        ].sort(() => Math.random() - 0.5) // 随机排序选项
        
        // 创建问题
        questions.push({
          moduleId,
          moduleName,
          type: 'multipleChoice',
          questionLanguage: 'english',
          question: term.term,
          options,
          correctAnswerId: term.id,
          answer: term.foreignTerm
        })
      }
      
      // 中文->英文问题
      for (const term of terms) {
        const otherTerms = terms.filter(t => t.id !== term.id)
        if (otherTerms.length < 3) continue
        
        const shuffledTerms = [...otherTerms].sort(() => Math.random() - 0.5)
        const wrongOptions = shuffledTerms.slice(0, 3)
        
        const options = [
          { id: term.id, text: term.term },
          ...wrongOptions.map(t => ({ id: t.id, text: t.term }))
        ].sort(() => Math.random() - 0.5)
        
        questions.push({
          moduleId,
          moduleName,
          type: 'multipleChoice',
          questionLanguage: 'foreign',
          question: term.foreignTerm,
          options,
          correctAnswerId: term.id,
          answer: term.term
        })
      }
      
      return questions.sort(() => Math.random() - 0.5)
    }
    
    const generateSpellingQuestions = (moduleId, moduleName, terms) => {
      const questions = []
      
      // 英文->中文拼写
      for (const term of terms) {
        questions.push({
          moduleId,
          moduleName,
          type: 'spelling',
          questionLanguage: 'english',
          prompt: term.term,
          answer: term.foreignTerm
        })
      }
      
      // 中文->英文拼写
      for (const term of terms) {
        questions.push({
          moduleId,
          moduleName,
          type: 'spelling',
          questionLanguage: 'foreign',
          prompt: term.foreignTerm,
          answer: term.term
        })
      }
      
      return questions.sort(() => Math.random() - 0.5)
    }
    
    const startQuiz = async () => {
      if (selectedModules.value.length === 0) {
        $q.notify({
          color: 'negative',
          message: '请选择至少一个模块',
          icon: 'warning'
        })
        return
      }
      
      // 生成题目
      await generateQuestions()
      
      if (questions.value.length === 0) {
        $q.notify({
          color: 'negative',
          message: '无法生成测验题目，请选择其他模块或调整设置',
          icon: 'warning'
        })
        return
      }
      
      // 开始测验
      currentQuestionIndex.value = 1
      correctAnswers.value = 0
      incorrectQuestions.value = []
      showFeedback.value = false
      selectedOption.value = null
      spellingAnswer.value = ''
      quizStarted.value = true
      quizCompleted.value = false
      
      // 开始计时
      startTimer()
      
      // 如果是拼写题，聚焦输入框
      nextTick(() => {
        if (currentQuestion.value?.type === 'spelling' && spellingInput.value) {
          spellingInput.value.focus()
        }
      })
    }
    
    const startTimer = () => {
      clearInterval(timerInterval)
      timeLeft.value = 30
      
      timerInterval = setInterval(() => {
        if (timeLeft.value > 0) {
          timeLeft.value--
        } else {
          // 时间到，检查答案或前进到下一题
          if (showFeedback.value) {
            nextQuestion()
          } else if (canCheckAnswer.value) {
            checkAnswer()
          } else {
            // 如果没有选择答案，直接进入下一题
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
      if (!currentQuestion.value) return
      
      // 检查答案
      if (currentQuestion.value.type === 'multipleChoice') {
        // 多选题
        if (!selectedOption.value) return
        
        isCorrect.value = selectedOption.value === currentQuestion.value.correctAnswerId
      } else if (currentQuestion.value.type === 'spelling') {
        // 拼写题
        if (!spellingAnswer.value.trim()) return
        
        // 比较答案（忽略大小写和额外空格）
        const userAnswer = spellingAnswer.value.trim().toLowerCase()
        const correctAnswer = currentQuestion.value.answer.toLowerCase()
        
        isCorrect.value = userAnswer === correctAnswer
        
        // 记录用户的答案
        currentQuestion.value.userAnswer = spellingAnswer.value.trim()
      }
      
      showFeedback.value = true
      clearInterval(timerInterval)
      
      // 记录正确答案
      if (isCorrect.value) {
        correctAnswers.value++
      } else {
        // 记录错误的问题，用于最后显示
        incorrectQuestions.value.push({...currentQuestion.value})
      }
    }
    
    const nextQuestion = () => {
      if (currentQuestionIndex.value < totalQuestions.value) {
        currentQuestionIndex.value++
        selectedOption.value = null
        spellingAnswer.value = ''
        showFeedback.value = false
        startTimer()
        
        // 如果是拼写题，聚焦输入框
        nextTick(() => {
          if (currentQuestion.value?.type === 'spelling' && spellingInput.value) {
            spellingInput.value.focus()
          }
        })
      } else {
        // 测验完成
        completeQuiz()
      }
    }
    
    const completeQuiz = () => {
      quizCompleted.value = true
      clearInterval(timerInterval)
      
      // 记录进度
      recordProgress()
      
      // 显示结果通知
      $q.notify({
        color: scorePercentage.value >= 70 ? 'positive' : 'warning',
        message: `测验完成！得分: ${scorePercentage.value}%`,
        icon: scorePercentage.value >= 70 ? 'check_circle' : 'info',
        timeout: 2000
      })
    }
    
    const recordProgress = () => {
      // 为每个参与测验的模块更新进度
      const moduleProgress = {}
      
      // 统计每个模块的正确答案数
      for (let i = 0; i < questions.value.length; i++) {
        const question = questions.value[i]
        const moduleId = question.moduleId
        
        if (i < currentQuestionIndex.value) { // 只计算已答题的问题
          const isAnswerCorrect = i === currentQuestionIndex.value - 1 
            ? isCorrect.value 
            : !incorrectQuestions.value.some(q => 
                q.type === question.type && 
                q.question === question.question
              )
          
          if (!moduleProgress[moduleId]) {
            moduleProgress[moduleId] = {
              correct: 0,
              total: 0
            }
          }
          
          moduleProgress[moduleId].total++
          
          if (isAnswerCorrect) {
            moduleProgress[moduleId].correct++
          }
        }
      }
      
      // 更新每个模块的进度
      for (const moduleId in moduleProgress) {
        userStore.updateProgress(moduleId, moduleProgress[moduleId].correct)
      }
    }
    
    const resetQuiz = () => {
      quizStarted.value = false
      quizCompleted.value = false
      selectedOption.value = null
      spellingAnswer.value = ''
      questions.value = []
    }
    
    const confirmExitQuiz = () => {
      if (quizStarted.value && !quizCompleted.value) {
        exitConfirmDialog.value = true
      } else {
        exitQuiz()
      }
    }
    
    const exitQuiz = () => {
      router.push({ name: 'dashboard' })
    }
    
    return {
      // 状态
      quizStarted,
      quizCompleted,
      exitConfirmDialog,
      spellingInput,
      
      // 模块和设置
      selectedModules,
      moduleOptions,
      quizSettings,
      difficultyOptions,
      
      // 题目相关
      questions,
      currentQuestionIndex,
      currentQuestion,
      selectedOption,
      spellingAnswer,
      showFeedback,
      isCorrect,
      correctAnswers,
      totalQuestions,
      timeLeft,
      scorePercentage,
      incorrectQuestions,
      canCheckAnswer,
      
      // 方法
      startQuiz,
      selectOption,
      checkAnswer,
      nextQuestion,
      resetQuiz,
      confirmExitQuiz,
      exitQuiz
    }
  }
})
</script>

<style scoped>
.quiz-card {
  border-radius: 16px;
  min-height: 350px;
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