<template>
  <q-page class="flex flex-center column q-pa-md" style="max-width: 400px; margin: 0 auto;">
    <dna-logo class="q-mb-md" />
    <h2 class="text-h5 text-primary q-mb-lg">Welcome to BioVocab</h2>
    
    <q-form @submit="onSubmit" class="q-gutter-md full-width">
      <q-input
        filled
        v-model="email"
        label="Email"
        :rules="[val => !!val || 'Email is required']"
      />
      
      <q-input
        filled
        type="password"
        v-model="password"
        label="Password"
        :rules="[val => !!val || 'Password is required']"
      />
      
      <div class="q-mb-md">
        <q-checkbox v-model="rememberMe" label="Remember me" />
      </div>
      
      <q-btn
        type="submit"
        color="primary"
        class="full-width"
        label="Sign In"
        :loading="loading"
      />
    </q-form>
    
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
              v-model="adminEmail"
              label="管理员邮箱"
              filled
              :rules="[val => !!val || '请输入邮箱']"
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
import { defineComponent, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/userStore'
import DnaLogo from '../components/DnaLogo.vue'
import { useQuasar } from 'quasar'
import api, { clearAuth } from '../services/api'

export default defineComponent({
  name: 'LoginView',
  components: {
    DnaLogo
  },
  setup() {
    const router = useRouter()
    const userStore = useUserStore()
    const $q = useQuasar()
    
    const email = ref('')
    const password = ref('')
    const rememberMe = ref(false)
    const loading = ref(false)
    
    // 管理员登录相关
    const adminLoginDialog = ref(false)
    const adminEmail = ref('')
    const adminPassword = ref('')
    const adminLoading = ref(false)
    
    // 页面加载时自动清除旧令牌
    onMounted(() => {
      // 强制清除所有认证相关信息
      localStorage.removeItem('token');
      localStorage.removeItem('bioVocabUser');
      sessionStorage.removeItem('token');
      
      // 检查是否有登录后跳转路径
      const redirectPath = localStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        console.log('检测到登录后跳转路径:', redirectPath);
      }
      
      // 为应用添加全局登录过期处理函数
      window.showLoginExpiredMessage = (message) => {
        $q.notify({
          color: 'warning',
          message: message || '您的登录已过期，请重新登录',
          icon: 'warning',
          timeout: 5000
        });
      };
      
      // 检查URL参数中是否有错误信息
      const urlParams = new URLSearchParams(window.location.search);
      const errorMsg = urlParams.get('error');
      if (errorMsg) {
        $q.notify({
          color: 'negative',
          message: decodeURIComponent(errorMsg),
          icon: 'error',
          timeout: 5000
        });
      }
    })
    
    const onSubmit = async () => {
      try {
        loading.value = true
        await userStore.login({ email: email.value, password: password.value, rememberMe: rememberMe.value })
        $q.notify({
          type: 'positive',
          message: '登录成功'
        })
        router.push('/')
      } catch (error) {
        console.error('Login error:', error)
        clearAuth() // 清除可能损坏的 token
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || '登录失败，请重试'
        })
      } finally {
        loading.value = false
      }
    }
    
    // 显示管理员登录对话框
    const showAdminLoginDialog = () => {
      adminLoginDialog.value = true
    }
    
    // 管理员登录
    const adminLogin = async () => {
      adminLoading.value = true
      
      try {
        console.log('尝试管理员登录:', { email: adminEmail.value, password: adminPassword.value })
        // 使用API进行管理员登录
        const response = await api.post('/auth/login', {
          email: adminEmail.value,
          password: adminPassword.value
        });
        
        console.log('管理员登录API响应:', response);
        
        if (!response.data) {
          throw new Error('API返回了空响应');
        }
        
        if (!response.data.token) {
          throw new Error('API响应中缺少token');
        }
        
        if (!response.data.user) {
          throw new Error('API响应中缺少用户信息');
        }
        
        console.log('管理员登录成功:', response.data)
        
        // 检查是否为管理员
        if (response.data.user.isAdmin) {
          // 管理员登录始终使用localStorage保存token
          localStorage.setItem('token', response.data.token);
          
          // 然后通过store设置用户信息
          userStore.setUser(response.data.user);
          
          // 验证存储是否成功
          console.log('用户信息已存储，检查localStorage:', {
            token: localStorage.getItem('token'),
            bioVocabUser: localStorage.getItem('bioVocabUser'),
            user: userStore.user,
            isAdmin: userStore.isAdmin
          });
          
          // 关闭对话框
          adminLoginDialog.value = false;
          
          // 检查是否有登录后跳转路径
          const redirectPath = localStorage.getItem('redirectAfterLogin');
          const shouldGoToAdminPanel = !redirectPath || redirectPath.includes('/admin');
          
          // 导航前插入一个小延迟，确保状态已更新
          console.log('准备导航...', shouldGoToAdminPanel ? '管理后台' : redirectPath);
          setTimeout(() => {
            if (shouldGoToAdminPanel) {
              // 前往管理后台
              router.push({ name: 'admin' });
            } else {
              // 前往指定页面
              localStorage.removeItem('redirectAfterLogin'); // 使用后清除
              router.push(redirectPath);
            }
          }, 1000); // 延长延时，确保足够时间处理状态更新
        } else {
          $q.notify({
            color: 'negative',
            message: '非管理员账户',
            icon: 'error'
          });
        }
      } catch (error) {
        console.error('管理员登录失败:', error);
        $q.notify({
          color: 'negative',
          message: error.message || '管理员用户名或密码错误',
          icon: 'error'
        });
      } finally {
        adminLoading.value = false;
      }
    }
    
    return {
      email,
      password,
      rememberMe,
      loading,
      onSubmit,
      adminLoginDialog,
      adminEmail,
      adminPassword,
      adminLoading,
      showAdminLoginDialog,
      adminLogin
    }
  }
})
</script> 