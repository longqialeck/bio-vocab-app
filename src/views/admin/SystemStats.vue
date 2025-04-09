<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h4 class="q-my-sm">数据统计</h4>
      <div>
        <q-btn color="primary" label="导出报告" icon="download" class="q-mr-sm" />
        <q-btn-dropdown color="secondary" label="时间范围" icon="date_range">
          <q-list>
            <q-item clickable v-close-popup @click="setTimeRange('today')">
              <q-item-section>今天</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setTimeRange('week')">
              <q-item-section>本周</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setTimeRange('month')">
              <q-item-section>本月</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setTimeRange('year')">
              <q-item-section>今年</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="setTimeRange('custom')">
              <q-item-section>自定义</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </div>
    </div>

    <div class="row q-col-gutter-md q-mb-md">
      <!-- 数据卡片概览 -->
      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card bg-blue-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">总用户数</div>
            <div class="text-h4 q-mt-sm text-bold">{{ stats.totalUsers }}</div>
            <div class="text-caption text-green q-mt-sm" v-if="stats.userGrowth > 0">
              <q-icon name="trending_up" /> 增长 {{ stats.userGrowth }}%
            </div>
            <div class="text-caption text-red q-mt-sm" v-else>
              <q-icon name="trending_down" /> 下降 {{ Math.abs(stats.userGrowth) }}%
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card bg-green-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">活跃用户</div>
            <div class="text-h4 q-mt-sm text-bold">{{ stats.activeUsers }}</div>
            <div class="text-caption q-mt-sm">
              活跃率: {{ (stats.activeUsers / stats.totalUsers * 100).toFixed(1) }}%
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card bg-orange-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">词汇总数</div>
            <div class="text-h4 q-mt-sm text-bold">{{ stats.totalVocabs }}</div>
            <div class="text-caption q-mt-sm">
              模块数: {{ stats.totalModules }}
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-sm-6 col-md-3">
        <q-card class="stats-card bg-purple-1">
          <q-card-section>
            <div class="text-subtitle2 text-grey-8">学习完成率</div>
            <div class="text-h4 q-mt-sm text-bold">{{ stats.completionRate }}%</div>
            <div class="text-caption q-mt-sm">
              已完成用户: {{ stats.completedUsers }}
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <!-- 学习情况图表 -->
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="text-h6">学习趋势</div>
            <div class="text-caption text-grey">过去30天的学习情况</div>
          </q-card-section>
          
          <q-card-section>
            <div class="chart-container" style="height: 300px; position: relative;">
              <canvas id="learningTrendChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 用户活跃情况 -->
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-h6">用户活跃时段</div>
            <div class="text-caption text-grey">24小时分布</div>
          </q-card-section>
          
          <q-card-section>
            <div class="chart-container" style="height: 300px; position: relative;">
              <canvas id="activeTimeChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 模块学习情况 -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">模块学习情况</div>
            <div class="text-caption text-grey">按模块查看完成率</div>
          </q-card-section>
          
          <q-card-section>
            <div class="chart-container" style="height: 300px; position: relative;">
              <canvas id="moduleCompletionChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 年级分布 -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">用户年级分布</div>
          </q-card-section>
          
          <q-card-section>
            <div class="chart-container" style="height: 250px; position: relative;">
              <canvas id="gradeDistributionChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 设备使用情况 -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">设备使用情况</div>
          </q-card-section>
          
          <q-card-section>
            <div class="chart-container" style="height: 250px; position: relative;">
              <canvas id="deviceUsageChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- 自定义日期范围对话框 -->
    <q-dialog v-model="customDateDialog">
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">选择自定义日期范围</div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <q-input filled v-model="dateRange.from" label="开始日期" mask="date" :rules="['date']">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dateRange.from">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="关闭" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input filled v-model="dateRange.to" label="结束日期" mask="date" :rules="['date']">
                <template v-slot:append>
                  <q-icon name="event" class="cursor-pointer">
                    <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                      <q-date v-model="dateRange.to">
                        <div class="row items-center justify-end">
                          <q-btn v-close-popup label="关闭" color="primary" flat />
                        </div>
                      </q-date>
                    </q-popup-proxy>
                  </q-icon>
                </template>
              </q-input>
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="grey" v-close-popup />
          <q-btn flat label="应用" color="primary" @click="applyCustomDateRange" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted, watch } from 'vue'
import Chart from 'chart.js/auto'
import api from '../../services/api'

export default defineComponent({
  name: 'SystemStats',
  
  setup() {
    const currentRange = ref('month')
    const customDateDialog = ref(false)
    const dateRange = ref({
      from: '',
      to: ''
    })
    
    // 统计数据
    const stats = ref({
      totalUsers: 358,
      userGrowth: 12.5,
      activeUsers: 215,
      totalVocabs: 2450,
      totalModules: 18,
      completionRate: 67,
      completedUsers: 146
    })
    
    // 图表实例
    const charts = ref({
      learningTrend: null,
      activeTime: null,
      moduleCompletion: null,
      gradeDistribution: null,
      deviceUsage: null
    })
    
    // 设置时间范围
    const setTimeRange = (range) => {
      currentRange.value = range
      
      if (range === 'custom') {
        // 打开自定义日期对话框
        customDateDialog.value = true
        return
      }
      
      // 获取新的数据
      fetchData(range)
    }
    
    // 应用自定义日期范围
    const applyCustomDateRange = () => {
      // 在实际应用中，这里会调用API获取指定日期范围的数据
      console.log('应用自定义日期范围:', dateRange.value)
      fetchData('custom', dateRange.value)
    }
    
    // 获取数据
    const fetchData = async (range, customRange = null) => {
      try {
        // 这里应该调用实际API获取数据
        // const response = await api.get('/stats', { 
        //   params: { 
        //     range,
        //     ...(customRange ? { from: customRange.from, to: customRange.to } : {})
        //   } 
        // })
        // 处理数据并更新图表
        
        // 模拟数据更新
        setTimeout(() => {
          // 更新数据卡片
          stats.value = {
            totalUsers: range === 'today' ? 358 : range === 'week' ? 345 : 358,
            userGrowth: range === 'today' ? 2.1 : range === 'week' ? 8.3 : 12.5,
            activeUsers: range === 'today' ? 82 : range === 'week' ? 168 : 215,
            totalVocabs: 2450,
            totalModules: 18,
            completionRate: range === 'today' ? 65 : range === 'week' ? 66 : 67,
            completedUsers: range === 'today' ? 140 : range === 'week' ? 143 : 146
          }
          
          // 更新图表
          updateCharts(range)
        }, 500)
      } catch (error) {
        console.error('获取统计数据失败:', error)
      }
    }
    
    // 初始化图表
    const initCharts = () => {
      // 学习趋势图表
      const learningTrendCtx = document.getElementById('learningTrendChart')
      charts.value.learningTrend = new Chart(learningTrendCtx, {
        type: 'line',
        data: {
          labels: Array.from({ length: 30 }, (_, i) => i + 1 + '日'),
          datasets: [
            {
              label: '单词学习量',
              data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 500) + 100),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.3,
              fill: true
            },
            {
              label: '活跃用户数',
              data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 200) + 50),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.2)',
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              mode: 'index',
              intersect: false
            }
          },
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
      
      // 用户活跃时段图表
      const activeTimeCtx = document.getElementById('activeTimeChart')
      charts.value.activeTime = new Chart(activeTimeCtx, {
        type: 'bar',
        data: {
          labels: Array.from({ length: 24 }, (_, i) => i + '时'),
          datasets: [{
            label: '活跃用户数',
            data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 10),
            backgroundColor: 'rgba(153, 102, 255, 0.5)',
            borderColor: 'rgb(153, 102, 255)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      })
      
      // 模块学习情况图表
      const moduleCompletionCtx = document.getElementById('moduleCompletionChart')
      charts.value.moduleCompletion = new Chart(moduleCompletionCtx, {
        type: 'bar',
        data: {
          labels: ['细胞结构', '生物膜', '细胞分裂', '遗传物质', '基因表达', '蛋白质合成', '酶', '光合作用', '呼吸作用', '人体系统'],
          datasets: [{
            label: '完成人数',
            data: [210, 180, 165, 152, 130, 125, 110, 95, 90, 85],
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }, {
            label: '完成率 (%)',
            data: [85, 78, 72, 65, 56, 52, 47, 41, 38, 35],
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
            borderColor: 'rgb(255, 99, 132)',
            borderWidth: 1,
            yAxisID: 'y1'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '完成人数'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: '完成率 (%)'
              },
              max: 100
            }
          }
        }
      })
      
      // 年级分布图表
      const gradeDistributionCtx = document.getElementById('gradeDistributionChart')
      charts.value.gradeDistribution = new Chart(gradeDistributionCtx, {
        type: 'doughnut',
        data: {
          labels: ['高一', '高二', '高三'],
          datasets: [{
            data: [125, 150, 83],
            backgroundColor: [
              'rgba(255, 99, 132, 0.5)',
              'rgba(54, 162, 235, 0.5)',
              'rgba(255, 206, 86, 0.5)'
            ],
            borderColor: [
              'rgb(255, 99, 132)',
              'rgb(54, 162, 235)',
              'rgb(255, 206, 86)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
      
      // 设备使用情况图表
      const deviceUsageCtx = document.getElementById('deviceUsageChart')
      charts.value.deviceUsage = new Chart(deviceUsageCtx, {
        type: 'pie',
        data: {
          labels: ['移动端', '平板', '桌面端'],
          datasets: [{
            data: [215, 65, 78],
            backgroundColor: [
              'rgba(75, 192, 192, 0.5)',
              'rgba(153, 102, 255, 0.5)',
              'rgba(255, 159, 64, 0.5)'
            ],
            borderColor: [
              'rgb(75, 192, 192)',
              'rgb(153, 102, 255)',
              'rgb(255, 159, 64)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      })
    }
    
    // 根据时间范围更新图表
    const updateCharts = (range) => {
      // 在实际应用中，这里应该根据从API获取的数据更新图表
      // 这里仅演示简单的随机更新
      
      if (charts.value.learningTrend) {
        const learningData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 500) + 100)
        const usersData = Array.from({ length: 30 }, () => Math.floor(Math.random() * 200) + 50)
        
        charts.value.learningTrend.data.datasets[0].data = learningData
        charts.value.learningTrend.data.datasets[1].data = usersData
        charts.value.learningTrend.update()
      }
      
      if (charts.value.activeTime) {
        const activeData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 10)
        charts.value.activeTime.data.datasets[0].data = activeData
        charts.value.activeTime.update()
      }
    }
    
    // 组件加载时初始化图表
    onMounted(() => {
      // 初始化图表
      initCharts()
      
      // 获取初始数据
      fetchData(currentRange.value)
    })
    
    return {
      currentRange,
      customDateDialog,
      dateRange,
      stats,
      setTimeRange,
      applyCustomDateRange
    }
  }
})
</script>

<style scoped>
.stats-card {
  transition: all 0.3s;
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.chart-container {
  width: 100%;
}
</style> 