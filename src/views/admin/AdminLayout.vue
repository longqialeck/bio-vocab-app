<template>
  <q-layout view="hHh LpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title class="cursor-pointer" @click="navigateTo('/')">
          BioVocab 管理系统
        </q-toolbar-title>
        <q-space />
        <q-btn flat round dense icon="notifications">
          <q-badge color="red" floating>
            2
          </q-badge>
        </q-btn>
        <q-btn flat round dense icon="person" />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header class="text-grey-8">
            管理菜单
          </q-item-label>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-dashboard')"
            @click="navigateTo('/admin')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>仪表盘</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-users')"
            @click="navigateTo('/admin/users')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>用户管理</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-vocabulary')"
            @click="navigateTo('/admin/vocabulary')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="book" />
            </q-item-section>
            <q-item-section>词汇管理</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-progress')"
            @click="navigateTo('/admin/progress')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="trending_up" />
            </q-item-section>
            <q-item-section>学习进度</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-reports')"
            @click="navigateTo('/admin/reports')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="bar_chart" />
            </q-item-section>
            <q-item-section>报表分析</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-logs')"
            @click="navigateTo('/admin/logs')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="receipt_long" />
            </q-item-section>
            <q-item-section>系统日志</q-item-section>
          </q-item>

          <q-item
            clickable
            v-ripple
            :active="isCurrentRoute('admin-settings')"
            @click="navigateTo('/admin/settings')"
            active-class="bg-primary text-white"
          >
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>系统设置</q-item-section>
          </q-item>

          <q-separator class="q-my-sm" />

          <q-item
            clickable
            v-ripple
            @click="navigateTo('/dashboard')"
          >
            <q-item-section avatar>
              <q-icon name="exit_to_app" />
            </q-item-section>
            <q-item-section>返回应用</q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center text-caption">
          BioVocab 管理系统 &copy; {{ currentYear }} 版权所有
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script>
import { defineComponent, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

export default defineComponent({
  name: 'AdminLayout',
  
  setup() {
    const router = useRouter()
    const route = useRoute()
    const leftDrawerOpen = ref(false)
    
    const currentYear = computed(() => new Date().getFullYear())
    
    const navigateTo = (path) => {
      router.push(path)
    }
    
    const isCurrentRoute = (routeName) => {
      return route.name === routeName
    }
    
    return {
      leftDrawerOpen,
      currentYear,
      navigateTo,
      isCurrentRoute
    }
  }
})
</script>

<style scoped>
.q-drawer .q-router-link--exact-active {
  color: white !important;
}
</style> 