<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h4 class="q-my-sm">学习进度管理</h4>
      <q-input
        v-model="searchText"
        dense
        filled
        placeholder="搜索用户"
        class="col-grow q-ml-md"
        style="max-width: 300px"
      >
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append>
          <q-icon
            v-if="searchText"
            name="close"
            @click="searchText = ''"
            class="cursor-pointer"
          />
        </template>
      </q-input>
    </div>

    <q-card class="q-mb-md">
      <q-tabs
        v-model="activeTab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="users" label="用户进度" icon="people" />
        <q-tab name="modules" label="模块完成率" icon="menu_book" />
        <q-tab name="analytics" label="数据分析" icon="insert_chart" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- 用户进度标签页 -->
        <q-tab-panel name="users">
          <q-table
            :rows="filteredUsers"
            :columns="userColumns"
            row-key="_id"
            :loading="loading"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="name" :props="props">
                  {{ props.row.name }}
                </q-td>
                <q-td key="email" :props="props">
                  {{ props.row.email }}
                </q-td>
                <q-td key="gradeLevel" :props="props">
                  {{ props.row.gradeLevel }}
                </q-td>
                <q-td key="wordsLearned" :props="props">
                  {{ props.row.progress?.wordsLearned || 0 }}
                </q-td>
                <q-td key="totalProgress" :props="props">
                  <q-linear-progress
                    size="25px"
                    :value="getProgressPercent(props.row)"
                    color="primary"
                    track-color="grey-3"
                    class="q-mt-sm"
                  >
                    <div class="absolute-full flex flex-center">
                      <q-badge color="white" text-color="primary" :label="`${getProgressPercent(props.row) * 100}%`" />
                    </div>
                  </q-linear-progress>
                </q-td>
                <q-td key="lastActive" :props="props">
                  {{ formatDate(props.row.lastLogin) }}
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn size="sm" round flat color="primary" icon="visibility" @click="viewUserDetails(props.row)" />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- 模块完成率标签页 -->
        <q-tab-panel name="modules">
          <q-table
            :rows="modules"
            :columns="moduleColumns"
            row-key="_id"
            :loading="loading"
            :pagination="{ rowsPerPage: 10 }"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td key="title" :props="props">
                  {{ props.row.title }}
                </q-td>
                <q-td key="totalTerms" :props="props">
                  {{ props.row.totalTerms }}
                </q-td>
                <q-td key="usersCompleted" :props="props">
                  {{ props.row.usersCompleted || 0 }} / {{ totalUsers }}
                </q-td>
                <q-td key="completion" :props="props">
                  <q-linear-progress
                    size="25px"
                    :value="(props.row.usersCompleted || 0) / totalUsers"
                    color="primary"
                    track-color="grey-3"
                    class="q-mt-sm"
                  >
                    <div class="absolute-full flex flex-center">
                      <q-badge color="white" text-color="primary" :label="`${Math.round((props.row.usersCompleted || 0) / totalUsers * 100)}%`" />
                    </div>
                  </q-linear-progress>
                </q-td>
                <q-td key="averageScore" :props="props">
                  {{ props.row.averageScore || 'N/A' }}
                </q-td>
                <q-td key="actions" :props="props">
                  <q-btn size="sm" round flat color="primary" icon="visibility" @click="viewModuleDetails(props.row)" />
                </q-td>
              </q-tr>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- 数据分析标签页 -->
        <q-tab-panel name="analytics">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-h6">词汇学习统计</div>
                  <div class="text-subtitle2">过去30天</div>
                </q-card-section>
                <q-card-section>
                  <div style="height: 300px; position: relative">
                    <div class="absolute-center text-grey-6">
                      图表占位 - 词汇学习趋势
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12 col-md-6">
              <q-card>
                <q-card-section>
                  <div class="text-h6">活跃用户</div>
                  <div class="text-subtitle2">过去30天</div>
                </q-card-section>
                <q-card-section>
                  <div style="height: 300px; position: relative">
                    <div class="absolute-center text-grey-6">
                      图表占位 - 用户活跃度
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-12">
              <q-card>
                <q-card-section>
                  <div class="text-h6">每周学习时间分布</div>
                </q-card-section>
                <q-card-section>
                  <div style="height: 300px; position: relative">
                    <div class="absolute-center text-grey-6">
                      图表占位 - 学习时间分布
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>

    <!-- 用户详情对话框 -->
    <q-dialog v-model="userDetailsDialog">
      <q-card style="min-width: 600px">
        <q-card-section class="row items-center">
          <div class="text-h6">用户学习详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedUser">
          <div class="text-h6">{{ selectedUser.name }}</div>
          <div class="text-subtitle2">{{ selectedUser.email }} | {{ selectedUser.gradeLevel }}</div>
          
          <q-list bordered separator>
            <q-item v-for="module in userModules" :key="module._id">
              <q-item-section>
                <q-item-label>{{ module.title }}</q-item-label>
                <q-item-label caption>词汇量: {{ module.totalTerms }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-linear-progress
                  style="width: 200px"
                  size="20px"
                  :value="module.progress / 100"
                  color="primary"
                  track-color="grey-3"
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge color="white" text-color="primary" :label="`${module.progress}%`" />
                  </div>
                </q-linear-progress>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 模块详情对话框 -->
    <q-dialog v-model="moduleDetailsDialog">
      <q-card style="min-width: 600px">
        <q-card-section class="row items-center">
          <div class="text-h6">模块学习详情</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section v-if="selectedModule">
          <div class="text-h6">{{ selectedModule.title }}</div>
          <div class="text-subtitle2">总词汇量: {{ selectedModule.totalTerms }}</div>
          
          <q-list bordered separator>
            <q-item v-for="(user, index) in moduleUsers" :key="index">
              <q-item-section>
                <q-item-label>{{ user.name }}</q-item-label>
                <q-item-label caption>{{ user.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-linear-progress
                  style="width: 200px"
                  size="20px"
                  :value="user.progress / 100"
                  color="primary"
                  track-color="grey-3"
                >
                  <div class="absolute-full flex flex-center">
                    <q-badge color="white" text-color="primary" :label="`${user.progress}%`" />
                  </div>
                </q-linear-progress>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { date } from 'quasar'
import { useUserStore } from '../../stores/userStore'
import api from '../../services/api'

export default defineComponent({
  name: 'ProgressManagement',
  
  setup() {
    const $q = useQuasar()
    const userStore = useUserStore()
    
    const loading = ref(false)
    const searchText = ref('')
    const activeTab = ref('users')
    
    const users = ref([])
    const modules = ref([])
    const totalUsers = computed(() => users.value.length)
    
    // 用户详情相关
    const userDetailsDialog = ref(false)
    const selectedUser = ref(null)
    const userModules = ref([])
    
    // 模块详情相关
    const moduleDetailsDialog = ref(false)
    const selectedModule = ref(null)
    const moduleUsers = ref([])
    
    // 用户表格列定义
    const userColumns = [
      { name: 'name', label: '姓名', field: 'name', sortable: true },
      { name: 'email', label: '邮箱', field: 'email', sortable: true },
      { name: 'gradeLevel', label: '年级', field: 'gradeLevel', sortable: true },
      { name: 'wordsLearned', label: '已学词汇', field: row => row.progress?.wordsLearned || 0, sortable: true },
      { name: 'totalProgress', label: '总体进度', field: row => getProgressPercent(row), sortable: true },
      { name: 'lastActive', label: '上次活跃', field: 'lastLogin', sortable: true },
      { name: 'actions', label: '操作', field: 'actions' }
    ]
    
    // 模块表格列定义
    const moduleColumns = [
      { name: 'title', label: '模块名称', field: 'title', sortable: true },
      { name: 'totalTerms', label: '词汇量', field: 'totalTerms', sortable: true },
      { name: 'usersCompleted', label: '完成人数', field: 'usersCompleted', sortable: true },
      { name: 'completion', label: '完成率', field: row => (row.usersCompleted || 0) / totalUsers.value, sortable: true },
      { name: 'averageScore', label: '平均分数', field: 'averageScore', sortable: true },
      { name: 'actions', label: '操作', field: 'actions' }
    ]
    
    // 过滤用户列表
    const filteredUsers = computed(() => {
      if (!searchText.value) return users.value
      
      const search = searchText.value.toLowerCase()
      return users.value.filter(user => 
        user.name.toLowerCase().includes(search) || 
        user.email.toLowerCase().includes(search)
      )
    })
    
    // 加载数据
    const fetchData = async () => {
      loading.value = true
      try {
        // 加载用户
        const userResponse = await api.get('/users')
        users.value = userResponse.data
        
        // 加载模块
        const moduleResponse = await api.get('/modules')
        modules.value = moduleResponse.data
        
        // 模拟添加一些统计数据（实际应该从API获取）
        modules.value = modules.value.map(module => ({
          ...module,
          usersCompleted: Math.floor(Math.random() * totalUsers.value),
          averageScore: Math.floor(Math.random() * 40) + 60
        }))
      } catch (error) {
        console.error('加载数据失败:', error)
        $q.notify({
          color: 'negative',
          message: '加载数据失败',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // 计算进度百分比
    const getProgressPercent = (user) => {
      if (!user.progress || !user.progress.wordsLearned || !user.progress.totalWords) {
        return 0
      }
      return user.progress.wordsLearned / (user.progress.totalWords || 1)
    }
    
    // 查看用户详情
    const viewUserDetails = async (user) => {
      selectedUser.value = user
      loading.value = true
      
      try {
        // 获取用户学习的所有模块和进度
        const response = await api.get(`/progress?userId=${user._id}`)
        
        // 模拟数据（实际应该从API返回）
        userModules.value = modules.value.map(module => ({
          ...module,
          progress: Math.floor(Math.random() * 100)
        }))
        
        userDetailsDialog.value = true
      } catch (error) {
        console.error('获取用户进度失败:', error)
        $q.notify({
          color: 'negative',
          message: '获取用户进度失败',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // 查看模块详情
    const viewModuleDetails = async (module) => {
      selectedModule.value = module
      loading.value = true
      
      try {
        // 获取学习此模块的所有用户和进度
        const response = await api.get(`/progress/module/${module._id}/users`)
        
        // 模拟数据（实际应该从API返回）
        moduleUsers.value = users.value.slice(0, 5).map(user => ({
          ...user,
          progress: Math.floor(Math.random() * 100)
        }))
        
        moduleDetailsDialog.value = true
      } catch (error) {
        console.error('获取模块进度失败:', error)
        $q.notify({
          color: 'negative',
          message: '获取模块进度失败',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '从未登录'
      return date.formatDate(dateString, 'YYYY-MM-DD HH:mm')
    }
    
    onMounted(() => {
      fetchData()
    })
    
    return {
      loading,
      searchText,
      activeTab,
      users,
      modules,
      totalUsers,
      filteredUsers,
      userColumns,
      moduleColumns,
      userDetailsDialog,
      selectedUser,
      userModules,
      moduleDetailsDialog,
      selectedModule,
      moduleUsers,
      getProgressPercent,
      viewUserDetails,
      viewModuleDetails,
      formatDate
    }
  }
})
</script> 