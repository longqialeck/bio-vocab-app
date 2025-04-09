<template>
  <div class="q-pa-md">
    <div class="row q-col-gutter-md">
      <div class="col-12">
        <h5 class="q-my-md">管理员控制面板</h5>
      </div>

      <!-- 统计卡片 -->
      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="bg-primary text-white">
          <q-card-section>
            <div class="text-h6">总用户数</div>
            <div class="text-h3">{{ statistics.totalUsers }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="bg-secondary text-white">
          <q-card-section>
            <div class="text-h6">本周活跃用户</div>
            <div class="text-h3">{{ statistics.activeUsers }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="bg-accent text-white">
          <q-card-section>
            <div class="text-h6">词汇模块数</div>
            <div class="text-h3">{{ statistics.moduleCount }}</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-md-3 col-sm-6 col-xs-12">
        <q-card class="bg-positive text-white">
          <q-card-section>
            <div class="text-h6">完成率</div>
            <div class="text-h3">{{ statistics.completionRate }}%</div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 快速访问 -->
      <div class="col-12 q-mt-md">
        <q-card>
          <q-card-section>
            <div class="text-h6">快速访问</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="row q-col-gutter-md">
              <div class="col-md-2 col-sm-4 col-xs-6">
                <q-card class="text-center menu-card" clickable v-ripple @click="goToUsers">
                  <q-card-section>
                    <q-icon name="people" size="3rem" color="primary" />
                    <div class="text-subtitle1 q-mt-sm">用户管理</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-md-2 col-sm-4 col-xs-6">
                <q-card class="text-center menu-card" clickable v-ripple @click="goToVocabulary">
                  <q-card-section>
                    <q-icon name="book" size="3rem" color="secondary" />
                    <div class="text-subtitle1 q-mt-sm">词汇管理</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-md-2 col-sm-4 col-xs-6">
                <q-card class="text-center menu-card" clickable v-ripple @click="goToStatistics">
                  <q-card-section>
                    <q-icon name="bar_chart" size="3rem" color="accent" />
                    <div class="text-subtitle1 q-mt-sm">数据统计</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-md-2 col-sm-4 col-xs-6">
                <q-card class="text-center menu-card" clickable v-ripple @click="goToSettings">
                  <q-card-section>
                    <q-icon name="settings" size="3rem" color="grey-7" />
                    <div class="text-subtitle1 q-mt-sm">系统设置</div>
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-md-2 col-sm-4 col-xs-6">
                <q-card class="text-center menu-card" clickable v-ripple @click="backToDashboard">
                  <q-card-section>
                    <q-icon name="exit_to_app" size="3rem" color="green" />
                    <div class="text-subtitle1 q-mt-sm">返回前台</div>
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- 最近登录 -->
      <div class="col-md-6 col-xs-12 q-mt-md">
        <q-card>
          <q-card-section>
            <div class="text-h6">最近登录用户</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list separator>
              <q-item v-for="user in recentUsers" :key="user.id">
                <q-item-section avatar>
                  <q-avatar>
                    <img :src="user.avatar || 'https://cdn.quasar.dev/img/avatar.png'">
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ user.name }}</q-item-label>
                  <q-item-label caption>{{ user.email }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-badge :color="user.isAdmin ? 'purple' : 'blue'">
                    {{ user.isAdmin ? '管理员' : '学生' }}
                  </q-badge>
                </q-item-section>
                <q-item-section side>
                  {{ user.lastLogin }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>

      <!-- 系统通知 -->
      <div class="col-md-6 col-xs-12 q-mt-md">
        <q-card>
          <q-card-section>
            <div class="text-h6">系统通知</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <q-list separator>
              <q-item v-for="notification in notifications" :key="notification.id">
                <q-item-section avatar>
                  <q-icon :name="notification.icon" :color="notification.color" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ notification.title }}</q-item-label>
                  <q-item-label caption>{{ notification.message }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  {{ notification.time }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'AdminDashboard',
  
  setup() {
    const router = useRouter()
    
    // 模拟统计数据
    const statistics = ref({
      totalUsers: 128,
      activeUsers: 45,
      moduleCount: 12,
      completionRate: 68
    })
    
    // 模拟最近登录用户
    const recentUsers = ref([
      { id: 1, name: '张三', email: 'zhang@example.com', isAdmin: true, lastLogin: '10分钟前', avatar: null },
      { id: 2, name: '李四', email: 'li@example.com', isAdmin: false, lastLogin: '1小时前', avatar: null },
      { id: 3, name: '王五', email: 'wang@example.com', isAdmin: false, lastLogin: '2小时前', avatar: null },
      { id: 4, name: '赵六', email: 'zhao@example.com', isAdmin: false, lastLogin: '昨天', avatar: null }
    ])
    
    // 模拟系统通知
    const notifications = ref([
      { id: 1, title: '系统更新', message: '系统将于今晚23:00进行维护更新', icon: 'update', color: 'primary', time: '1小时前' },
      { id: 2, title: '新用户注册', message: '今日有5名新用户注册', icon: 'person_add', color: 'positive', time: '3小时前' },
      { id: 3, title: '数据备份完成', message: '系统数据备份已完成', icon: 'backup', color: 'info', time: '昨天' },
      { id: 4, title: '磁盘空间警告', message: '服务器磁盘空间不足', icon: 'warning', color: 'warning', time: '3天前' }
    ])
    
    // 导航函数
    const goToUsers = () => router.push('/admin/users')
    const goToVocabulary = () => router.push('/admin/vocabulary')
    const goToStatistics = () => router.push('/admin/statistics')
    const goToSettings = () => router.push('/admin/settings')
    const backToDashboard = () => router.push('/dashboard')
    
    // 模拟获取数据
    onMounted(async () => {
      // 实际应用中，这里会从API获取数据
      // const { data } = await api.getAdminDashboardData()
      // statistics.value = data.statistics
      // recentUsers.value = data.recentUsers
      // notifications.value = data.notifications
    })
    
    return {
      statistics,
      recentUsers,
      notifications,
      goToUsers,
      goToVocabulary,
      goToStatistics,
      goToSettings,
      backToDashboard
    }
  }
})
</script>

<style scoped>
.menu-card {
  transition: transform 0.3s;
}
.menu-card:hover {
  transform: translateY(-5px);
}
</style> 