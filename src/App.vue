<template>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useUserStore } from './stores/userStore'

export default defineComponent({
  name: 'App',
  
  setup() {
    const userStore = useUserStore()
    
    onMounted(async () => {
      console.log('App mounted, 尝试恢复用户登录状态')
      
      // 从localStorage恢复用户登录状态
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('bioVocabUser')
      
      if (token && userData) {
        console.log('找到本地存储的用户信息，尝试恢复登录状态')
        try {
          // 直接设置用户状态，确保响应式更新
          userStore.setUser(JSON.parse(userData))
          console.log('用户登录状态已恢复:', userStore.user)
          
          // 可选：验证token有效性（这会在后台进行）
          userStore.loadUser().catch(error => {
            console.error('Token验证失败，已自动登出:', error)
          })
        } catch (error) {
          console.error('恢复用户状态失败:', error)
          // 清除无效的存储数据
          localStorage.removeItem('token')
          localStorage.removeItem('bioVocabUser')
        }
      } else {
        console.log('未找到本地存储的登录信息')
      }
    })
    
    return {}
  }
})
</script>

<style>
body {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}
</style>
