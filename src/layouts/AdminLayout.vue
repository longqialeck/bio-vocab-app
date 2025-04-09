<template>
  <q-layout view="lHh Lpr lff">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          <q-btn flat no-caps to="/admin/dashboard" class="text-white">
            BioVocab 管理系统
          </q-btn>
        </q-toolbar-title>

        <q-space />

        <q-btn flat round dense icon="notifications">
          <q-badge color="red" floating>5</q-badge>
        </q-btn>
        
        <q-btn flat round dense icon="person" class="q-ml-sm">
          <q-menu>
            <q-list style="min-width: 150px">
              <q-item clickable @click="returnToDashboard">
                <q-item-section>返回学习平台</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable @click="logout">
                <q-item-section>登出</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      class="bg-grey-1"
    >
      <q-list>
        <q-item-label header>管理菜单</q-item-label>

        <q-item clickable v-ripple to="/admin/dashboard" exact>
          <q-item-section avatar>
            <q-icon name="dashboard" />
          </q-item-section>
          <q-item-section>控制面板</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/users" exact>
          <q-item-section avatar>
            <q-icon name="people" />
          </q-item-section>
          <q-item-section>用户管理</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/vocabulary" exact>
          <q-item-section avatar>
            <q-icon name="book" />
          </q-item-section>
          <q-item-section>词汇管理</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/statistics" exact>
          <q-item-section avatar>
            <q-icon name="bar_chart" />
          </q-item-section>
          <q-item-section>数据统计</q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/admin/settings" exact>
          <q-item-section avatar>
            <q-icon name="settings" />
          </q-item-section>
          <q-item-section>系统设置</q-item-section>
        </q-item>

        <q-separator />

        <q-item clickable v-ripple @click="returnToDashboard">
          <q-item-section avatar>
            <q-icon name="exit_to_app" />
          </q-item-section>
          <q-item-section>返回学习平台</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

export default defineComponent({
  name: 'AdminLayout',

  setup() {
    const leftDrawerOpen = ref(false)
    const router = useRouter()
    const userStore = useUserStore()

    const toggleLeftDrawer = () => {
      leftDrawerOpen.value = !leftDrawerOpen.value
    }

    const returnToDashboard = () => {
      router.push('/dashboard')
    }

    const logout = async () => {
      await userStore.logout()
      router.push('/login')
    }

    return {
      leftDrawerOpen,
      toggleLeftDrawer,
      returnToDashboard,
      logout
    }
  }
})
</script>

<style scoped>
.q-toolbar {
  min-height: 60px;
}
</style> 