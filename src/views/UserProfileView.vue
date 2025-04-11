<template>
  <q-page class="q-pa-md">
    <div class="row q-mb-lg">
      <q-btn flat icon="arrow_back" color="primary" @click="$router.back()" />
      <div class="text-h5 q-ml-sm">个人资料</div>
    </div>

    <div class="row justify-center q-mb-lg">
      <q-avatar size="100px" class="q-mb-md">
        <q-icon name="person" size="80px" />
      </q-avatar>
    </div>
    
    <q-card flat class="q-pa-md">
      <q-form @submit="onSubmit" class="q-gutter-md">
        <q-input
          v-model="userForm.name"
          label="姓名"
          outlined
          :rules="[val => !!val || '请输入姓名']"
        />

        <q-input
          v-model="userForm.email"
          type="email"
          label="邮箱"
          outlined
          :rules="[
            val => !!val || '请输入邮箱',
            val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '邮箱格式不正确'
          ]"
        />

        <q-select
          v-model="userForm.grade"
          :options="gradeOptions"
          label="年级"
          outlined
        />
        
        <div class="text-subtitle1 q-mb-sm q-mt-lg">修改密码</div>

        <q-input
          v-model="userForm.currentPassword"
          type="password"
          label="当前密码"
          outlined
          :rules="[val => !hasPasswordChanges || !!val || '请输入当前密码']"
        />

        <q-input
          v-model="userForm.newPassword"
          type="password"
          label="新密码"
          outlined
          :rules="[val => !hasPasswordChanges || !!val || '请输入新密码']"
        />

        <q-input
          v-model="userForm.confirmPassword"
          type="password"
          label="确认新密码"
          outlined
          :rules="[
            val => !hasPasswordChanges || !!val || '请确认新密码',
            val => !hasPasswordChanges || val === userForm.newPassword || '两次输入的密码不一致'
          ]"
        />

        <div class="row justify-end q-mt-lg">
          <q-btn type="submit" color="primary" label="保存修改" />
        </div>
      </q-form>
    </q-card>
    
    <q-card flat class="q-pa-md q-mt-lg">
      <div class="text-subtitle1 q-mb-md">学习统计</div>
      
      <div class="row q-col-gutter-md q-mt-lg">
        <div class="col-4">
          <q-card class="stats-card">
            <q-card-section class="text-center">
              <div class="text-h1">{{ progress.wordsLearned }}</div>
              <div class="text-subtitle1">已学单词</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-4">
          <q-card class="stats-card">
            <q-card-section class="text-center">
              <div class="text-h1">{{ progress.streak }}</div>
              <div class="text-subtitle1">连续学习天数</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-4">
          <q-card class="stats-card">
            <q-card-section class="text-center">
              <div class="text-h1">{{ progress.quizCompletion }}</div>
              <div class="text-subtitle1">测验完成数</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </q-card>
    
    <!-- 添加注销按钮 -->
    <div class="row justify-center q-mt-xl">
      <q-btn 
        label="注销登录" 
        color="negative" 
        flat
        @click="confirmLogout"
      />
    </div>
    
    <!-- 添加注销确认对话框 -->
    <q-dialog v-model="logoutDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="logout" color="negative" text-color="white" />
          <span class="q-ml-sm">确认注销登录？</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="确认" color="negative" @click="logout" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useUserStore } from '../stores/userStore'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'UserProfileView',
  
  setup() {
    const userStore = useUserStore()
    const $q = useQuasar()
    const router = useRouter()
    
    const user = computed(() => userStore.getUser)
    const progress = computed(() => userStore.getProgress)
    
    const userForm = ref({
      name: '',
      email: '',
      grade: null,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    
    const logoutDialog = ref(false)
    
    const gradeOptions = [
      '初一', '初二', '初三',
      '高一', '高二', '高三',
      '大学', '研究生', '其他'
    ]
    
    const hasPasswordChanges = computed(() => {
      return userForm.value.currentPassword || 
             userForm.value.newPassword || 
             userForm.value.confirmPassword
    })
    
    onMounted(() => {
      // 加载用户数据
      if (user.value) {
        userForm.value.name = user.value.name || ''
        userForm.value.email = user.value.email || ''
        userForm.value.grade = user.value.grade || null
      }
      
      // 加载统计数据
      userStore.loadProgress()
    })
    
    const onSubmit = async () => {
      try {
        // 处理密码修改逻辑
        if (hasPasswordChanges.value) {
          if (userForm.value.newPassword !== userForm.value.confirmPassword) {
            $q.notify({
              color: 'negative',
              message: '两次输入的密码不一致',
              icon: 'warning'
            })
            return
          }
          
          // 调用更新密码的逻辑
          await userStore.updatePassword(
            userForm.value.currentPassword,
            userForm.value.newPassword
          )
        }
        
        // 更新用户信息
        await userStore.updateUserProfile({
          name: userForm.value.name,
          email: userForm.value.email,
          grade: userForm.value.grade
        })
        
        $q.notify({
          color: 'positive',
          message: '个人资料已更新',
          icon: 'check_circle'
        })
        
        // 清空密码字段
        userForm.value.currentPassword = ''
        userForm.value.newPassword = ''
        userForm.value.confirmPassword = ''
      } catch (error) {
        $q.notify({
          color: 'negative',
          message: error.message || '更新个人资料失败',
          icon: 'error'
        })
      }
    }
    
    const confirmLogout = () => {
      logoutDialog.value = true
    }
    
    const logout = () => {
      userStore.logout()
      router.push({ name: 'login' })
    }
    
    return {
      user,
      progress,
      userForm,
      gradeOptions,
      hasPasswordChanges,
      onSubmit,
      logoutDialog,
      confirmLogout,
      logout
    }
  }
})
</script>

<style scoped>
/* 添加自定义样式 */
</style> 