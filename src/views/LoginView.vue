<template>
  <q-page class="flex flex-center column q-pa-md" style="max-width: 400px; margin: 0 auto;">
    <dna-logo class="q-mb-md" />
    <h2 class="text-h5 text-primary q-mb-lg">Welcome to BioVocab</h2>
    
    <q-form @submit="onSubmit" class="q-gutter-md full-width">
      <q-input
        filled
        v-model="username"
        label="Username or Email"
        :rules="[val => !!val || 'Username is required']"
      />
      
      <q-input
        filled
        type="password"
        v-model="password"
        label="Password"
        :rules="[val => !!val || 'Password is required']"
      />
      
      <div class="row justify-between items-center q-mb-md">
        <q-checkbox v-model="rememberMe" label="Remember me" />
        <q-btn flat dense color="primary" label="Forgot Password?" />
      </div>
      
      <q-btn
        type="submit"
        color="primary"
        class="full-width"
        label="Sign In"
        :loading="loading"
      />
    </q-form>
    
    <div class="q-mt-lg">
      <div class="row justify-center q-mb-sm">
        <div class="text-subtitle2 text-grey">Or login with</div>
      </div>
      
      <div class="row q-gutter-md">
        <q-btn outline color="red" icon="img:https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" @click="thirdPartyLogin('google')" />
        <q-btn outline color="black" icon="img:https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" @click="thirdPartyLogin('apple')" />
      </div>
    </div>
    
    <div class="q-mt-xl">
      <q-btn flat color="grey" label="管理员登录" size="sm" @click="showAdminLoginDialog" />
    </div>
    
    <!-- 管理员登录对话框 -->
    <q-dialog v-model="adminLoginDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">管理员登录</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="adminLogin" class="q-gutter-md">
            <q-input
              v-model="adminUsername"
              label="管理员用户名"
              filled
              :rules="[val => !!val || '请输入用户名']"
            />
            
            <q-input
              v-model="adminPassword"
              type="password"
              label="管理员密码"
              filled
              :rules="[val => !!val || '请输入密码']"
            />
            
            <div class="q-mt-md">
              <q-btn type="submit" color="primary" label="登录" class="full-width" :loading="adminLoading" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import DnaLogo from '../components/DnaLogo.vue'
import wechatService from '../services/wechatService'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'LoginView',
  components: {
    DnaLogo
  },
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const $q = useQuasar()
    
    const username = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const loading = ref(false)
    
    // 管理员登录相关
    const adminLoginDialog = ref(false)
    const adminUsername = ref('')
    const adminPassword = ref('')
    const adminLoading = ref(false)
    
    const onSubmit = async () => {
      loading.value = true
      
      // In a real app, this would authenticate against a backend
      // For the prototype, we'll simulate login
      setTimeout(() => {
        userStore.setUser({
          id: 'user_' + Math.floor(Math.random() * 1000000),
          name: 'Emily',
          email: username.value,
          gradeLevel: '10'
        })
        
        loading.value = false
        router.push({ name: 'dashboard' })
      }, 1000)
    }
    
    const thirdPartyLogin = async (provider) => {
      loading.value = true
      
      if (provider === 'wechat') {
        await wechatService.initialize()
        const result = await wechatService.requestLogin()
        
        if (result.success) {
          userStore.setUser(result.user)
          router.push({ name: 'dashboard' })
        }
      } else {
        // Simulate third-party login
        setTimeout(() => {
          userStore.setUser({
            id: `${provider}_${Math.floor(Math.random() * 1000000)}`,
            name: 'Emily',
            email: `emily@${provider}.com`,
            gradeLevel: '10'
          })
          
          loading.value = false
          router.push({ name: 'dashboard' })
        }, 1000)
      }
    }
    
    // 显示管理员登录对话框
    const showAdminLoginDialog = () => {
      adminLoginDialog.value = true
    }
    
    // 管理员登录
    const adminLogin = () => {
      adminLoading.value = true
      
      setTimeout(() => {
        // 获取保存的管理员密码，如果没有则使用默认密码'admin'
        const savedAdminPassword = localStorage.getItem('adminPassword') || 'admin'
        
        if (adminUsername.value === 'admin' && adminPassword.value === savedAdminPassword) {
          userStore.loginAsAdmin()
          adminLoading.value = false
          adminLoginDialog.value = false
          router.push({ name: 'admin-dashboard' })
        } else {
          adminLoading.value = false
          $q.notify({
            color: 'negative',
            message: '管理员用户名或密码错误',
            icon: 'error'
          })
        }
      }, 1000)
    }
    
    return {
      username,
      password,
      rememberMe,
      loading,
      onSubmit,
      thirdPartyLogin,
      adminLoginDialog,
      adminUsername,
      adminPassword,
      adminLoading,
      showAdminLoginDialog,
      adminLogin
    }
  }
})
</script> 