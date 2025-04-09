<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">数据统计分析</div>
      
      <!-- 过滤器 -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-3">
          <q-select
            v-model="timeRange"
            :options="timeRangeOptions"
            label="时间范围"
            outlined
            dense
            @update:model-value="refreshData"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="gradeFilter"
            :options="gradeOptions"
            label="年级筛选"
            outlined
            dense
            @update:model-value="refreshData"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="moduleFilter"
            :options="moduleOptions"
            label="模块筛选"
            outlined
            dense
            @update:model-value="refreshData"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-btn
            color="primary"
            icon="refresh"
            label="刷新数据"
            class="full-width"
            @click="refreshData"
          />
        </div>
      </div>
      
      <!-- 主要统计指标 -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-sm-6 col-md-3">
          <q-card>
            <q-card-section class="bg-primary text-white">
              <div class="text-subtitle1">完成率</div>
              <div class="text-h4">{{ statistics.completionRate }}%</div>
            </q-card-section>
            <q-card-section>
              <div class="text-caption">所选范围内所有用户的平均完成率</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-12 col-sm-6 col-md-3">
          <q-card>
            <q-card-section class="bg-secondary text-white">
              <div class="text-subtitle1">平均学习时间</div>
              <div class="text-h4">{{ statistics.avgStudyTime }}分钟</div>
            </q-card-section>
            <q-card-section>
              <div class="text-caption">用户每天平均学习时间</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-12 col-sm-6 col-md-3">
          <q-card>
            <q-card-section class="bg-accent text-white">
              <div class="text-subtitle1">平均正确率</div>
              <div class="text-h4">{{ statistics.avgAccuracy }}%</div>
            </q-card-section>
            <q-card-section>
              <div class="text-caption">测验平均答题正确率</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-12 col-sm-6 col-md-3">
          <q-card>
            <q-card-section class="bg-positive text-white">
              <div class="text-subtitle1">活跃用户</div>
              <div class="text-h4">{{ statistics.activeUsers }}</div>
            </q-card-section>
            <q-card-section>
              <div class="text-caption">所选时间范围内的活跃用户数</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <!-- 图表区域 -->
      <div class="row q-col-gutter-md">
        <!-- 按天学习情况图表 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">每日学习情况</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div style="height: 300px; position: relative;" class="chart-placeholder">
                <q-icon name="bar_chart" size="3em" color="grey-7" />
                <div class="text-body1 q-mt-sm">每日学习情况图表</div>
                <div class="text-caption q-mt-xs">显示所选时间范围内每天的学习量和完成情况</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        
        <!-- 按模块学习进度图表 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">模块学习进度</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div style="height: 300px; position: relative;" class="chart-placeholder">
                <q-icon name="pie_chart" size="3em" color="grey-7" />
                <div class="text-body1 q-mt-sm">模块学习进度图表</div>
                <div class="text-caption q-mt-xs">显示各模块的学习完成比例</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        
        <!-- 词汇掌握情况图表 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">词汇掌握情况</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div style="height: 300px; position: relative;" class="chart-placeholder">
                <q-icon name="donut_large" size="3em" color="grey-7" />
                <div class="text-body1 q-mt-sm">词汇掌握情况图表</div>
                <div class="text-caption q-mt-xs">显示词汇掌握程度的分布情况</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
        
        <!-- 用户活跃度热图 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">用户活跃度分析</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div style="height: 300px; position: relative;" class="chart-placeholder">
                <q-icon name="calendar_view_month" size="3em" color="grey-7" />
                <div class="text-body1 q-mt-sm">用户活跃度热图</div>
                <div class="text-caption q-mt-xs">显示不同时段的用户活跃情况</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <!-- 用户学习情况表格 -->
      <div class="q-mt-lg">
        <q-card>
          <q-card-section>
            <div class="text-h6">用户学习详情</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <q-table
              :rows="userProgressData"
              :columns="columns"
              row-key="id"
              :pagination="{ rowsPerPage: 10 }"
              :loading="loading"
            >
              <template v-slot:top-right>
                <q-input 
                  dense
                  outlined
                  v-model="search" 
                  placeholder="搜索用户..."
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </template>
              
              <template v-slot:body-cell-progress="props">
                <q-td :props="props">
                  <q-linear-progress
                    :value="props.value / 100"
                    :color="getProgressColor(props.value)"
                    style="height: 10px"
                  />
                  <div class="text-caption q-mt-xs">{{ props.value }}%</div>
                </q-td>
              </template>
              
              <template v-slot:body-cell-accuracy="props">
                <q-td :props="props">
                  <q-circular-progress
                    :value="props.value"
                    size="48px"
                    :thickness="0.2"
                    :color="getAccuracyColor(props.value)"
                    center-color="white"
                    show-value
                    class="q-ma-md"
                  >
                    {{ props.value }}%
                  </q-circular-progress>
                </q-td>
              </template>
              
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <q-btn
                    flat
                    round
                    dense
                    icon="info"
                    color="info"
                    @click="viewUserDetail(props.row)"
                  />
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 用户详情对话框 -->
      <q-dialog v-model="userDetailDialog">
        <q-card style="width: 700px; max-width: 90vw;">
          <q-card-section class="row items-center">
            <div class="text-h6">用户学习详情</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          
          <q-separator />
          
          <q-card-section v-if="selectedUser">
            <div class="row q-mb-md">
              <div class="col-12 col-sm-6">
                <div class="text-subtitle2">用户信息</div>
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>姓名</q-item-label>
                      <q-item-label>{{ selectedUser.name }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>年级</q-item-label>
                      <q-item-label>{{ selectedUser.grade }}</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>注册时间</q-item-label>
                      <q-item-label>{{ selectedUser.registerDate }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div class="col-12 col-sm-6">
                <div class="text-subtitle2">学习情况</div>
                <q-list dense>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>总学习时长</q-item-label>
                      <q-item-label>{{ selectedUser.totalStudyTime }} 小时</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>完成测验数</q-item-label>
                      <q-item-label>{{ selectedUser.completedQuizzes }} 次</q-item-label>
                    </q-item-section>
                  </q-item>
                  <q-item>
                    <q-item-section>
                      <q-item-label caption>已掌握词汇数</q-item-label>
                      <q-item-label>{{ selectedUser.masteredTerms }} 个</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
            </div>
            
            <div class="text-subtitle2 q-mb-sm">模块学习进度</div>
            <div class="q-mb-md">
              <q-list dense>
                <q-item v-for="module in selectedUser.moduleProgress" :key="module.id">
                  <q-item-section>
                    <q-item-label>{{ module.name }}</q-item-label>
                    <q-linear-progress
                      :value="module.progress / 100"
                      :color="getProgressColor(module.progress)"
                      style="height: 8px"
                      class="q-mt-xs"
                    />
                    <div class="row justify-between q-mt-xs">
                      <div class="text-caption">进度: {{ module.progress }}%</div>
                      <div class="text-caption">正确率: {{ module.accuracy }}%</div>
                    </div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>
      
      <!-- 导出按钮 -->
      <div class="q-mt-md flex justify-end">
        <q-btn color="primary" icon="file_download" label="导出数据" @click="exportData" />
      </div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'

export default defineComponent({
  name: 'DataStatistics',
  
  setup() {
    const loading = ref(false)
    const search = ref('')
    
    // 筛选器
    const timeRange = ref('last30days')
    const timeRangeOptions = [
      { label: '最近7天', value: 'last7days' },
      { label: '最近30天', value: 'last30days' },
      { label: '最近90天', value: 'last90days' },
      { label: '本学期', value: 'currSemester' },
      { label: '全部', value: 'all' }
    ]
    
    const gradeFilter = ref(null)
    const gradeOptions = [
      { label: '全部年级', value: null },
      { label: '高一', value: 'grade10' },
      { label: '高二', value: 'grade11' },
      { label: '高三', value: 'grade12' }
    ]
    
    const moduleFilter = ref(null)
    const moduleOptions = [
      { label: '全部模块', value: null },
      { label: '细胞结构', value: 'module1' },
      { label: '光合作用', value: 'module2' },
      { label: '遗传学', value: 'module3' }
    ]
    
    // 统计数据
    const statistics = ref({
      completionRate: 72,
      avgStudyTime: 38,
      avgAccuracy: 85,
      activeUsers: 245
    })
    
    // 表格列定义
    const columns = [
      { name: 'name', label: '姓名', field: 'name', sortable: true, align: 'left' },
      { name: 'grade', label: '年级', field: 'grade', sortable: true, align: 'left' },
      { name: 'studyTime', label: '学习时长(分钟)', field: 'studyTime', sortable: true, align: 'center' },
      { name: 'progress', label: '总体进度', field: 'progress', sortable: true, align: 'center' },
      { name: 'accuracy', label: '正确率', field: 'accuracy', sortable: true, align: 'center' },
      { name: 'lastActive', label: '最近活跃', field: 'lastActive', sortable: true, align: 'center' },
      { name: 'actions', label: '操作', field: 'actions', align: 'center' }
    ]
    
    // 用户进度数据
    const userProgressData = ref([
      {
        id: 1,
        name: '张三',
        grade: '高一(3)班',
        studyTime: 120,
        progress: 85,
        accuracy: 92,
        lastActive: '今天 14:30',
        registerDate: '2023-01-15',
        totalStudyTime: 45.5,
        completedQuizzes: 18,
        masteredTerms: 350,
        moduleProgress: [
          { id: 1, name: '细胞结构', progress: 100, accuracy: 95 },
          { id: 2, name: '光合作用', progress: 80, accuracy: 88 },
          { id: 3, name: '遗传学', progress: 75, accuracy: 90 }
        ]
      },
      {
        id: 2,
        name: '李四',
        grade: '高二(1)班',
        studyTime: 95,
        progress: 72,
        accuracy: 85,
        lastActive: '今天 12:15',
        registerDate: '2023-02-20',
        totalStudyTime: 38.2,
        completedQuizzes: 15,
        masteredTerms: 280,
        moduleProgress: [
          { id: 1, name: '细胞结构', progress: 92, accuracy: 88 },
          { id: 2, name: '光合作用', progress: 65, accuracy: 82 },
          { id: 3, name: '遗传学', progress: 60, accuracy: 85 }
        ]
      },
      {
        id: 3,
        name: '王五',
        grade: '高三(2)班',
        studyTime: 200,
        progress: 95,
        accuracy: 97,
        lastActive: '昨天 18:40',
        registerDate: '2022-09-05',
        totalStudyTime: 78.5,
        completedQuizzes: 32,
        masteredTerms: 450,
        moduleProgress: [
          { id: 1, name: '细胞结构', progress: 100, accuracy: 98 },
          { id: 2, name: '光合作用', progress: 100, accuracy: 95 },
          { id: 3, name: '遗传学', progress: 85, accuracy: 92 }
        ]
      },
      {
        id: 4,
        name: '赵六',
        grade: '高一(2)班',
        studyTime: 60,
        progress: 45,
        accuracy: 72,
        lastActive: '3天前',
        registerDate: '2023-03-10',
        totalStudyTime: 22.5,
        completedQuizzes: 8,
        masteredTerms: 160,
        moduleProgress: [
          { id: 1, name: '细胞结构', progress: 68, accuracy: 75 },
          { id: 2, name: '光合作用', progress: 40, accuracy: 70 },
          { id: 3, name: '遗传学', progress: 30, accuracy: 68 }
        ]
      },
      {
        id: 5,
        name: '钱七',
        grade: '高二(3)班',
        studyTime: 150,
        progress: 80,
        accuracy: 88,
        lastActive: '今天 09:20',
        registerDate: '2022-11-15',
        totalStudyTime: 55.8,
        completedQuizzes: 20,
        masteredTerms: 315,
        moduleProgress: [
          { id: 1, name: '细胞结构', progress: 95, accuracy: 90 },
          { id: 2, name: '光合作用', progress: 85, accuracy: 87 },
          { id: 3, name: '遗传学', progress: 70, accuracy: 82 }
        ]
      }
    ])
    
    // 用户详情对话框
    const userDetailDialog = ref(false)
    const selectedUser = ref(null)
    
    // 方法
    const refreshData = () => {
      loading.value = true
      
      // 模拟API请求延迟
      setTimeout(() => {
        // 实际应用中，这里会根据筛选条件从API获取数据
        loading.value = false
      }, 800)
    }
    
    const viewUserDetail = (user) => {
      selectedUser.value = user
      userDetailDialog.value = true
    }
    
    const getProgressColor = (progress) => {
      if (progress < 30) return 'red'
      if (progress < 70) return 'orange'
      return 'green'
    }
    
    const getAccuracyColor = (accuracy) => {
      if (accuracy < 60) return 'red'
      if (accuracy < 80) return 'orange'
      return 'green'
    }
    
    const exportData = () => {
      // 实际应用中，这里会调用API导出数据
      // 为演示目的，我们显示一个通知
      // $q.notify({
      //   color: 'positive',
      //   message: '数据已导出',
      //   icon: 'file_download'
      // })
    }
    
    onMounted(() => {
      refreshData()
    })
    
    return {
      loading,
      search,
      timeRange,
      timeRangeOptions,
      gradeFilter,
      gradeOptions,
      moduleFilter,
      moduleOptions,
      statistics,
      columns,
      userProgressData,
      userDetailDialog,
      selectedUser,
      refreshData,
      viewUserDetail,
      getProgressColor,
      getAccuracyColor,
      exportData
    }
  }
})
</script>

<style scoped>
.chart-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  color: #9e9e9e;
}
</style> 