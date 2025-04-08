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
    
    <p class="q-mt-lg">Don't have an account? <q-btn flat dense color="primary" label="Sign Up" @click="goToRegister" /></p>
    
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
      <q-btn flat color="grey" label="管理员登录" size="sm" @click="loginAsAdmin" />
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import DnaLogo from '../components/DnaLogo.vue'
import wechatService from '../services/wechatService'

export default defineComponent({
  name: 'LoginView',
  components: {
    DnaLogo
  },
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    
    const username = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const loading = ref(false)
    
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
    
    const goToRegister = () => {
      router.push({ name: 'register' })
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
    
    // 管理员登录
    const loginAsAdmin = () => {
      loading.value = true
      
      setTimeout(() => {
        userStore.loginAsAdmin()
        loading.value = false
        router.push({ name: 'admin-dashboard' })
      }, 1000)
    }
    
    return {
      username,
      password,
      rememberMe,
      loading,
      onSubmit,
      goToRegister,
      thirdPartyLogin,
      loginAsAdmin
    }
  }
})
</script> 