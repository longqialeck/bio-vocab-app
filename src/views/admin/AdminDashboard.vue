<template>
  <q-page padding>
    <div class="text-h4 q-mb-md">管理员仪表盘</div>
    
    <q-inner-loading :showing="loading">
      <q-spinner-dots size="50px" color="primary" />
    </q-inner-loading>
    
    <div class="row q-col-gutter-md">
      <!-- 用户统计卡片 -->
      <div class="col-12 col-md-4">
        <q-card class="dashboard-card">
          <q-card-section>
            <div class="text-h6">用户统计</div>
            <div class="text-subtitle2 text-grey">注册用户和活跃情况</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <div class="row items-center">
              <q-icon name="people" size="56px" color="primary" class="q-mr-md" />
              <div class="stats-container">
                <div class="text-h4">{{ stats.totalUsers }}</div>
                <div class="text-caption">总用户数</div>
              </div>
            </div>
            
            <q-list dense class="q-mt-md">
              <q-item>
                <q-item-section>
                  <q-item-label>今日活跃用户</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="positive" text-color="white" dense>{{ stats.activeToday }}</q-chip>
                </q-item-section>
              </q-item>
              
              <q-item>
                <q-item-section>
                  <q-item-label>本周新增用户</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="info" text-color="white" dense>{{ stats.newThisWeek }}</q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          
          <q-card-actions align="right">
            <q-btn flat color="primary" label="查看详情" :to="{ name: 'admin-users' }" />
          </q-card-actions>
        </q-card>
      </div>
      
      <!-- 词汇模块卡片 -->
      <div class="col-12 col-md-4">
        <q-card class="dashboard-card">
          <q-card-section>
            <div class="text-h6">词汇模块</div>
            <div class="text-subtitle2 text-grey">学习模块和词汇统计</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <div class="row items-center">
              <q-icon name="menu_book" size="56px" color="secondary" class="q-mr-md" />
              <div class="stats-container">
                <div class="text-h4">{{ stats.totalModules }}</div>
                <div class="text-caption">学习模块数</div>
              </div>
            </div>
            
            <q-list dense class="q-mt-md">
              <q-item>
                <q-item-section>
                  <q-item-label>总词汇量</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="secondary" text-color="white" dense>{{ stats.totalTerms }}</q-chip>
                </q-item-section>
              </q-item>
              
              <q-item>
                <q-item-section>
                  <q-item-label>本月新增词汇</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="info" text-color="white" dense>{{ stats.newTermsThisMonth }}</q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          
          <q-card-actions align="right">
            <q-btn flat color="secondary" label="管理词汇" :to="{ name: 'admin-vocabulary' }" />
          </q-card-actions>
        </q-card>
      </div>
      
      <!-- 管理员设置卡片 -->
      <div class="col-12 col-md-4">
        <q-card class="dashboard-card">
          <q-card-section>
            <div class="text-h6">管理员设置</div>
            <div class="text-subtitle2 text-grey">修改管理员密码</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <q-btn 
              color="primary" 
              icon="key" 
              label="修改管理员密码" 
              class="full-width q-mb-md"
              @click="showChangePasswordDialog"
            />
          </q-card-section>
        </q-card>
      </div>
      
      <!-- 学习统计卡片 -->
      <div class="col-12 col-md-4">
        <q-card class="dashboard-card">
          <q-card-section>
            <div class="text-h6">学习统计</div>
            <div class="text-subtitle2 text-grey">用户学习情况和进度</div>
          </q-card-section>
          
          <q-separator />
          
          <q-card-section>
            <div class="row items-center">
              <q-icon name="school" size="56px" color="accent" class="q-mr-md" />
              <div class="stats-container">
                <div class="text-h4">{{ stats.termsLearned }}</div>
                <div class="text-caption">已学习词汇数</div>
              </div>
            </div>
            
            <q-list dense class="q-mt-md">
              <q-item>
                <q-item-section>
                  <q-item-label>今日已学词汇</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="accent" text-color="white" dense>{{ stats.learnedToday }}</q-chip>
                </q-item-section>
              </q-item>
              
              <q-item>
                <q-item-section>
                  <q-item-label>平均完成率</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-chip color="positive" text-color="white" dense>{{ stats.avgCompletionRate }}%</q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
          
          <q-card-actions align="right">
            <q-btn flat color="accent" label="查看报告" />
          </q-card-actions>
        </q-card>
      </div>
      
      <!-- 最近操作 -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">最近操作记录</div>
          </q-card-section>
          
          <q-separator />
          
          <q-table
            :rows="recentActions"
            :columns="actionColumns"
            row-key="id"
            dense
            :pagination="{ rowsPerPage: 5 }"
          >
            <template v-slot:body-cell-action="props">
              <q-td :props="props">
                <q-badge :color="getActionBadgeColor(props.value)">
                  {{ props.value }}
                </q-badge>
              </q-td>
            </template>
          </q-table>
          
          <q-card-actions align="center">
            <q-btn flat color="primary" label="查看所有记录" />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- 修改管理员密码对话框 -->
    <q-dialog v-model="passwordDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">修改管理员密码</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="changeAdminPassword" class="q-gutter-md">
            <q-input
              v-model="currentPassword"
              type="password"
              label="当前密码"
              filled
              :rules="[val => !!val || '请输入当前密码']"
            />
            
            <q-input
              v-model="newPassword"
              type="password"
              label="新密码"
              filled
              :rules="[val => !!val || '请输入新密码']"
            />
            
            <q-input
              v-model="confirmPassword"
              type="password"
              label="确认新密码"
              filled
              :rules="[
                val => !!val || '请确认新密码',
                val => val === newPassword || '两次输入的密码不一致'
              ]"
            />
            
            <div class="q-mt-md">
              <q-btn type="submit" color="primary" label="确认修改" class="full-width" :loading="passwordLoading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useVocabStore } from '../../stores/vocabStore'
import { useQuasar } from 'quasar'
import api from '../../services/api'

export default defineComponent({
  name: 'AdminDashboard',
  setup() {
    const userStore = useUserStore()
    const vocabStore = useVocabStore()
    const $q = useQuasar()
    
    // 管理员密码修改相关
    const passwordDialog = ref(false)
    const currentPassword = ref('')
    const newPassword = ref('')
    const confirmPassword = ref('')
    const passwordLoading = ref(false)
    const loading = ref(false)
    
    // 统计数据
    const stats = ref({
      totalUsers: 0,
      activeToday: 0,
      newThisWeek: 0,
      totalModules: 0,
      totalTerms: 0,
      newTermsThisMonth: 0,
      termsLearned: 0,
      learnedToday: 0,
      avgCompletionRate: 0
    })
    
    // 最近操作记录
    const recentActions = ref([
      {
        id: 1,
        date: '2023-05-16 14:30',
        admin: 'Admin User',
        action: '添加模块',
        details: '添加了新模块 "Plant Biology"'
      },
      {
        id: 2,
        date: '2023-05-16 11:20',
        admin: 'Admin User',
        action: '修改用户',
        details: '更新了用户 "Emily Chen" 的年级信息'
      },
      {
        id: 3,
        date: '2023-05-15 16:45',
        admin: 'Admin User',
        action: '添加词汇',
        details: '向 "Cell Structure" 模块添加了5个新词汇'
      },
      {
        id: 4,
        date: '2023-05-15 09:30',
        admin: 'Admin User',
        action: '修改模块',
        details: '更新了 "DNA & Genetics" 模块的描述'
      },
      {
        id: 5,
        date: '2023-05-14 14:15',
        admin: 'Admin User',
        action: '删除词汇',
        details: '从 "Cell Structure" 模块删除了1个词汇'
      }
    ])
    
    // 表格列定义
    const actionColumns = [
      {
        name: 'date',
        label: '时间',
        field: 'date',
        align: 'left',
      },
      {
        name: 'admin',
        label: '管理员',
        field: 'admin',
        align: 'left',
      },
      {
        name: 'action',
        label: '操作',
        field: 'action',
        align: 'center',
      },
      {
        name: 'details',
        label: '详情',
        field: 'details',
        align: 'left',
      }
    ]
    
    // 获取操作徽章颜色
    const getActionBadgeColor = (action) => {
      switch (action) {
        case '添加用户':
        case '添加模块':
        case '添加词汇':
          return 'positive'
        case '删除用户':
        case '删除模块':
        case '删除词汇':
          return 'negative'
        case '修改用户':
        case '修改模块':
        case '修改词汇':
          return 'warning'
        default:
          return 'primary'
      }
    }
    
    // 加载仪表盘数据
    const loadDashboardData = async () => {
      try {
        // 从API获取统计数据
        const response = await api.get('/users/dashboard/stats');
        
        // 更新统计数据
        const data = response.data;
        
        stats.value = {
          totalUsers: data.userStats.totalUsers,
          activeToday: data.userStats.activeToday,
          newThisWeek: data.userStats.newThisWeek,
          totalModules: data.moduleStats.totalModules,
          totalTerms: data.moduleStats.totalTerms,
          newTermsThisMonth: data.moduleStats.newTermsThisMonth,
          termsLearned: data.learningStats.termsLearned,
          learnedToday: data.learningStats.learnedToday,
          avgCompletionRate: data.learningStats.avgCompletionRate
        };
        
        loading.value = false;
      } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        
        $q.notify({
          color: 'negative',
          message: '加载仪表盘统计数据失败',
          icon: 'error'
        });
        
        // 使用默认数据作为后备
        stats.value = {
          totalUsers: 3,
          activeToday: 2,
          newThisWeek: 1,
          totalModules: 3,
          totalTerms: 62,
          newTermsThisMonth: 15,
          termsLearned: 475,
          learnedToday: 36,
          avgCompletionRate: 68
        };
        
        loading.value = false;
      }
    };
    
    // 修改管理员密码
    const showChangePasswordDialog = () => {
      passwordDialog.value = true
      currentPassword.value = ''
      newPassword.value = ''
      confirmPassword.value = ''
    }
    
    const changeAdminPassword = () => {
      passwordLoading.value = true
      
      // 验证当前密码是否正确(默认为admin)
      setTimeout(() => {
        if (currentPassword.value === 'admin') {
          // 在真实应用中，这里会调用API更新管理员密码
          // 为了演示，我们只保存在localStorage中
          localStorage.setItem('adminPassword', newPassword.value)
          
          passwordLoading.value = false
          passwordDialog.value = false
          
          $q.notify({
            color: 'positive',
            message: '管理员密码已更新',
            icon: 'check_circle'
          })
        } else {
          passwordLoading.value = false
          
          $q.notify({
            color: 'negative',
            message: '当前密码不正确',
            icon: 'error'
          })
        }
      }, 1000)
    }
    
    // 页面加载时获取数据
    onMounted(() => {
      loading.value = true;
      loadDashboardData();
    });
    
    return {
      stats,
      loading,
      recentActions,
      actionColumns,
      getActionBadgeColor,
      passwordDialog,
      currentPassword,
      newPassword,
      confirmPassword,
      passwordLoading,
      showChangePasswordDialog,
      changeAdminPassword
    }
  }
})
</script>

<style scoped>
.dashboard-card {
  height: 100%;
}

.stats-container {
  display: flex;
  flex-direction: column;
}
</style> 