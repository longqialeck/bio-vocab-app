<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">系统日志</div>
      
      <!-- 日志筛选器 -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-3">
          <q-select
            v-model="logType"
            :options="logTypeOptions"
            label="日志类型"
            outlined
            dense
            @update:model-value="refreshLogs"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-select
            v-model="logLevel"
            :options="logLevelOptions"
            label="日志级别"
            outlined
            dense
            @update:model-value="refreshLogs"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-input
            v-model="searchText"
            label="搜索关键词"
            outlined
            dense
            clearable
            @update:model-value="refreshLogs"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-3">
          <q-btn
            color="primary"
            icon="refresh"
            label="刷新日志"
            class="full-width"
            @click="refreshLogs"
          />
        </div>
      </div>
      
      <!-- 日期范围筛选 -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-12 col-md-4">
          <q-input
            v-model="dateRange.from"
            mask="date"
            label="起始日期"
            outlined
            dense
            @update:model-value="refreshLogs"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="dateRange.from" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="关闭" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="dateRange.to"
            mask="date"
            label="结束日期"
            outlined
            dense
            @update:model-value="refreshLogs"
          >
            <template v-slot:append>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="dateRange.to" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup label="关闭" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </div>
        <div class="col-12 col-md-4">
          <q-btn-group spread>
            <q-btn label="今天" icon="today" @click="setDateRange('today')" />
            <q-btn label="本周" icon="date_range" @click="setDateRange('week')" />
            <q-btn label="本月" icon="calendar_month" @click="setDateRange('month')" />
          </q-btn-group>
        </div>
      </div>
      
      <!-- 日志表格 -->
      <q-card class="q-mb-md">
        <q-table
          :rows="logs"
          :columns="columns"
          row-key="id"
          :pagination="pagination"
          :loading="loading"
          binary-state-sort
          v-model:pagination="pagination"
        >
          <template v-slot:body-cell-level="props">
            <q-td :props="props">
              <q-badge :color="getLevelColor(props.value)" :label="props.value" />
            </q-td>
          </template>
          
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                color="primary"
                icon="info"
                @click="showLogDetails(props.row)"
              />
            </q-td>
          </template>
          
          <template v-slot:bottom="scope">
            <div class="row items-center justify-between full-width">
              <div>
                <q-btn
                  color="negative"
                  icon="delete"
                  label="清空日志"
                  flat
                  @click="confirmClearLogs"
                  :disable="logs.length === 0"
                />
                <q-btn
                  color="primary"
                  icon="file_download"
                  label="导出日志"
                  flat
                  @click="exportLogs"
                  :disable="logs.length === 0"
                />
              </div>
              <div>
                <q-pagination
                  v-model="scope.pagination.page"
                  :max="scope.pagesNumber"
                  :max-pages="6"
                  boundary-links
                  direction-links
                  @update:model-value="(val) => { scope.pagination.page = val }"
                />
              </div>
            </div>
          </template>
        </q-table>
      </q-card>
    </div>
    
    <!-- 日志详情对话框 -->
    <q-dialog v-model="logDetailDialog">
      <q-card style="min-width: 700px; max-width: 90vw;">
        <q-card-section class="row items-center">
          <div class="text-h6">日志详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        
        <q-separator />
        
        <q-card-section v-if="selectedLog">
          <q-list>
            <q-item>
              <q-item-section>
                <q-item-label caption>时间</q-item-label>
                <q-item-label>{{ selectedLog.timestamp }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>类型</q-item-label>
                <q-item-label>{{ selectedLog.type }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>级别</q-item-label>
                <q-item-label>
                  <q-badge :color="getLevelColor(selectedLog.level)" :label="selectedLog.level" />
                </q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>用户</q-item-label>
                <q-item-label>{{ selectedLog.user || 'System' }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>IP地址</q-item-label>
                <q-item-label>{{ selectedLog.ip || 'N/A' }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item>
              <q-item-section>
                <q-item-label caption>消息</q-item-label>
                <q-item-label>{{ selectedLog.message }}</q-item-label>
              </q-item-section>
            </q-item>
            
            <q-item v-if="selectedLog.details">
              <q-item-section>
                <q-item-label caption>详细信息</q-item-label>
                <q-card flat bordered class="q-pa-md bg-grey-2">
                  <pre class="text-wrap">{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
                </q-card>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
    
    <!-- 确认清空日志对话框 -->
    <q-dialog v-model="clearLogsDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">确定要清空所有日志吗？此操作无法撤销。</span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="确认清空" color="negative" @click="clearLogs" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { date, useQuasar } from 'quasar'

export default defineComponent({
  name: 'SystemLogs',
  
  setup() {
    const $q = useQuasar()
    const loading = ref(false)
    
    // 筛选条件
    const logType = ref(null)
    const logLevel = ref(null)
    const searchText = ref('')
    const dateRange = ref({
      from: date.formatDate(date.subtractFromDate(new Date(), { days: 7 }), 'YYYY-MM-DD'),
      to: date.formatDate(new Date(), 'YYYY-MM-DD')
    })
    
    // 选项
    const logTypeOptions = [
      { label: '全部类型', value: null },
      { label: '系统', value: 'system' },
      { label: '用户', value: 'user' },
      { label: '数据库', value: 'database' },
      { label: '安全', value: 'security' },
      { label: 'API', value: 'api' }
    ]
    
    const logLevelOptions = [
      { label: '全部级别', value: null },
      { label: '信息', value: 'info' },
      { label: '警告', value: 'warning' },
      { label: '错误', value: 'error' },
      { label: '致命', value: 'fatal' }
    ]
    
    // 表格数据和配置
    const logs = ref([])
    const columns = [
      { name: 'timestamp', label: '时间', field: 'timestamp', sortable: true, align: 'left' },
      { name: 'type', label: '类型', field: 'type', sortable: true, align: 'left' },
      { name: 'level', label: '级别', field: 'level', sortable: true, align: 'center' },
      { name: 'user', label: '用户', field: 'user', sortable: true, align: 'left' },
      { name: 'message', label: '消息', field: 'message', sortable: true, align: 'left' },
      { name: 'actions', label: '操作', field: 'actions', align: 'center' }
    ]
    
    const pagination = ref({
      sortBy: 'timestamp',
      descending: true,
      page: 1,
      rowsPerPage: 15
    })
    
    // 对话框
    const logDetailDialog = ref(false)
    const selectedLog = ref(null)
    const clearLogsDialog = ref(false)
    
    // 方法
    const refreshLogs = () => {
      loading.value = true
      
      // 模拟API请求延迟
      setTimeout(() => {
        // 实际应用中，这里会从API获取日志数据
        // 模拟生成测试数据
        generateMockLogs()
        loading.value = false
      }, 800)
    }
    
    const generateMockLogs = () => {
      const mockLogs = []
      const types = ['system', 'user', 'database', 'security', 'api']
      const levels = ['info', 'warning', 'error', 'fatal']
      const users = ['admin', 'system', 'zhang.san@example.com', 'li.si@example.com']
      
      const messages = {
        system: [
          '系统启动',
          '系统配置更新',
          '系统备份完成',
          '定时任务执行失败',
          '内存使用超过阈值'
        ],
        user: [
          '用户登录成功',
          '用户修改密码',
          '用户注册',
          '用户登录失败',
          '用户权限变更'
        ],
        database: [
          '数据库连接超时',
          '数据库备份完成',
          '数据完整性检查',
          '表结构更新',
          'SQL查询执行时间过长'
        ],
        security: [
          '检测到多次失败登录尝试',
          'IP地址已被封锁',
          '检测到可疑活动',
          '防火墙规则更新',
          '敏感操作执行'
        ],
        api: [
          'API请求超时',
          'API调用频率过高',
          'API密钥更新',
          'API版本更新',
          '第三方API集成错误'
        ]
      }
      
      for (let i = 0; i < 100; i++) {
        const type = types[Math.floor(Math.random() * types.length)]
        const level = levels[Math.floor(Math.random() * levels.length)]
        const user = users[Math.floor(Math.random() * users.length)]
        const message = messages[type][Math.floor(Math.random() * messages[type].length)]
        
        // 生成随机日期，最早为7天前
        const randomDays = Math.floor(Math.random() * 7)
        const randomHours = Math.floor(Math.random() * 24)
        const randomMinutes = Math.floor(Math.random() * 60)
        const logDate = date.subtractFromDate(new Date(), { 
          days: randomDays, 
          hours: randomHours,
          minutes: randomMinutes
        })
        
        mockLogs.push({
          id: i + 1,
          timestamp: date.formatDate(logDate, 'YYYY-MM-DD HH:mm:ss'),
          type,
          level,
          user: user !== 'system' ? user : null,
          ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
          message,
          details: level === 'error' || level === 'fatal' ? {
            stack: `Error: ${message}\n  at Function.Module._load (internal/modules/cjs/loader.js:807:14)\n  at Function.executeUserEntryPoint [as runMain] (internal/modules/run_main.js:76:12)`,
            context: {
              request: { method: 'GET', path: '/api/data' },
              response: { status: 500 }
            }
          } : null
        })
      }
      
      // 应用筛选
      logs.value = mockLogs.filter(log => {
        let match = true
        
        // 类型筛选
        if (logType.value && log.type !== logType.value) {
          match = false
        }
        
        // 级别筛选
        if (logLevel.value && log.level !== logLevel.value) {
          match = false
        }
        
        // 关键词搜索
        if (searchText.value && !log.message.toLowerCase().includes(searchText.value.toLowerCase())) {
          match = false
        }
        
        // 日期范围筛选
        const logDate = date.extractDate(log.timestamp, 'YYYY-MM-DD')
        const fromDate = date.extractDate(dateRange.value.from, 'YYYY-MM-DD')
        const toDate = date.extractDate(dateRange.value.to, 'YYYY-MM-DD')
        
        if (logDate < fromDate || logDate > toDate) {
          match = false
        }
        
        return match
      })
    }
    
    const showLogDetails = (log) => {
      selectedLog.value = log
      logDetailDialog.value = true
    }
    
    const getLevelColor = (level) => {
      switch (level) {
        case 'info': return 'info'
        case 'warning': return 'warning'
        case 'error': return 'negative'
        case 'fatal': return 'deep-orange'
        default: return 'grey'
      }
    }
    
    const setDateRange = (range) => {
      const today = new Date()
      
      switch (range) {
        case 'today':
          dateRange.value.from = date.formatDate(today, 'YYYY-MM-DD')
          dateRange.value.to = date.formatDate(today, 'YYYY-MM-DD')
          break
        case 'week':
          dateRange.value.from = date.formatDate(date.subtractFromDate(today, { days: 7 }), 'YYYY-MM-DD')
          dateRange.value.to = date.formatDate(today, 'YYYY-MM-DD')
          break
        case 'month':
          dateRange.value.from = date.formatDate(date.subtractFromDate(today, { days: 30 }), 'YYYY-MM-DD')
          dateRange.value.to = date.formatDate(today, 'YYYY-MM-DD')
          break
      }
      
      refreshLogs()
    }
    
    const confirmClearLogs = () => {
      clearLogsDialog.value = true
    }
    
    const clearLogs = () => {
      // 实际应用中，这里会调用API清空日志
      logs.value = []
      
      $q.notify({
        color: 'positive',
        message: '日志已清空',
        icon: 'delete'
      })
    }
    
    const exportLogs = () => {
      // 实际应用中，这里会调用API导出日志
      $q.notify({
        color: 'positive',
        message: '日志已导出',
        icon: 'file_download'
      })
    }
    
    onMounted(() => {
      refreshLogs()
    })
    
    return {
      loading,
      logType,
      logTypeOptions,
      logLevel,
      logLevelOptions,
      searchText,
      dateRange,
      logs,
      columns,
      pagination,
      logDetailDialog,
      selectedLog,
      clearLogsDialog,
      refreshLogs,
      showLogDetails,
      getLevelColor,
      setDateRange,
      confirmClearLogs,
      clearLogs,
      exportLogs
    }
  }
})
</script>

<style scoped>
.text-wrap {
  white-space: pre-wrap;
  word-break: break-word;
}
</style> 