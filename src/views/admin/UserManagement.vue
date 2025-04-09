<template>
  <q-page padding>
    <div class="row items-center justify-between q-mb-md">
      <h4 class="q-my-sm">用户管理</h4>
      <q-btn color="primary" icon="person_add" label="添加用户" @click="showAddDialog" />
    </div>

    <div class="row q-mb-md q-gutter-md">
      <q-input v-model="searchText" filled placeholder="搜索用户" class="col-grow">
        <template v-slot:prepend>
          <q-icon name="search" />
        </template>
        <template v-slot:append>
          <q-icon v-if="searchText" name="close" @click="searchText = ''" class="cursor-pointer" />
        </template>
      </q-input>

      <q-select
        v-model="gradeFilter"
        :options="gradeOptions"
        filled
        label="年级"
        class="col-auto"
        style="min-width: 150px"
        clearable
      />
    </div>

    <q-table
      :rows="filteredUsers"
      :columns="columns"
      row-key="_id"
      :loading="loading"
      :pagination="{rowsPerPage: 10}"
    >
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th v-for="col in props.cols" :key="col.name" :props="props">
            {{ col.label }}
          </q-th>
          <q-th auto-width>操作</q-th>
        </q-tr>
      </template>

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
          <q-td key="lastLogin" :props="props">
            {{ formatDate(props.row.lastLogin) }}
          </q-td>
          <q-td key="progress" :props="props">
            <q-linear-progress
              size="25px"
              :value="props.row.progress ? props.row.progress / 100 : 0"
              color="primary"
              track-color="grey-3"
              class="q-mt-sm"
            >
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="primary" :label="`${props.row.progress || 0}%`" />
              </div>
            </q-linear-progress>
          </q-td>
          <q-td key="status" :props="props">
            <q-badge :color="props.row.isLocked ? 'negative' : 'positive'">
              {{ props.row.isLocked ? '已锁定' : '正常' }}
            </q-badge>
          </q-td>
          <q-td key="role" :props="props">
            <q-badge :color="props.row.isAdmin ? 'purple' : 'green'">
              {{ props.row.isAdmin ? '管理员' : '学生' }}
            </q-badge>
          </q-td>
          <q-td auto-width>
            <div class="row no-wrap q-gutter-xs">
              <q-btn size="sm" round flat color="primary" icon="edit" @click="editUser(props.row)" />
              <q-btn size="sm" round flat color="red" icon="delete" @click="confirmDelete(props.row)" />
              <q-btn 
                v-if="props.row.isLocked" 
                size="sm" 
                round 
                flat 
                color="amber" 
                icon="lock_open" 
                @click="unlockUser(props.row)"
              />
              <q-btn 
                size="sm" 
                round 
                flat 
                color="teal" 
                icon="key" 
                @click="showResetPasswordDialog(props.row)"
              />
            </div>
          </q-td>
        </q-tr>
      </template>

      <template v-slot:loading>
        <q-inner-loading showing color="primary" />
      </template>
    </q-table>

    <!-- 添加/编辑用户对话框 -->
    <q-dialog v-model="userDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editMode ? '编辑用户' : '添加用户' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveUser" ref="userForm">
            <q-input
              v-model="editedUser.name"
              label="姓名"
              filled
              :rules="[val => !!val || '请输入姓名']"
            />

            <q-input
              v-model="editedUser.email"
              label="邮箱"
              filled
              type="email"
              class="q-mt-md"
              :rules="[
                val => !!val || '请输入邮箱',
                val => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(val) || '请输入有效邮箱'
              ]"
            />

            <q-input
              v-if="!editMode"
              v-model="editedUser.password"
              label="密码"
              filled
              type="password"
              class="q-mt-md"
              :rules="[val => !!val || '请输入密码', val => val.length >= 6 || '密码至少6个字符']"
            />

            <q-select
              v-model="editedUser.gradeLevel"
              :options="gradeOptions"
              label="年级"
              filled
              class="q-mt-md"
              :rules="[val => !!val || '请选择年级']"
            />

            <q-toggle
              v-model="editedUser.isAdmin"
              label="管理员权限"
              class="q-mt-md"
            />
            
            <div class="q-mt-lg">
              <q-btn type="submit" color="primary" label="保存" />
              <q-btn flat label="取消" class="q-ml-sm" v-close-popup />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- 删除确认对话框 -->
    <q-dialog v-model="deleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">确定要删除此用户吗？</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="删除" color="negative" @click="deleteUser" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- 重置密码对话框 -->
    <q-dialog v-model="resetPasswordDialog" persistent>
      <q-card style="min-width: 350px">
        <q-card-section class="row items-center">
          <div class="text-h6">重置密码</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <p>为用户 <strong>{{ selectedUser?.name }}</strong> 设置新密码：</p>
          <q-form @submit="resetPassword" ref="resetPasswordForm">
            <q-input
              v-model="newPassword"
              label="新密码"
              filled
              type="password"
              :rules="[val => !!val || '请输入新密码', val => val.length >= 6 || '密码至少6个字符']"
            />
            
            <q-input
              v-model="confirmPassword"
              label="确认密码"
              filled
              type="password"
              class="q-mt-md"
              :rules="[
                val => !!val || '请确认密码',
                val => val === newPassword || '两次输入的密码不一致'
              ]"
            />
            
            <div class="q-mt-lg">
              <q-btn type="submit" color="primary" label="重置密码" />
              <q-btn flat label="取消" class="q-ml-sm" v-close-popup />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
    
    <!-- 解锁账户确认对话框 -->
    <q-dialog v-model="unlockDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="lock_open" color="amber" text-color="white" />
          <span class="q-ml-sm">确定要解锁用户 <strong>{{ selectedUser?.name }}</strong> 的账户吗？</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="解锁" color="amber" @click="confirmUnlock" v-close-popup />
        </q-card-actions>
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
  name: 'UserManagement',

  setup() {
    const $q = useQuasar()
    const userStore = useUserStore()
    
    const users = ref([])
    const loading = ref(false)
    const searchText = ref('')
    const gradeFilter = ref(null)
    
    const userDialog = ref(false)
    const deleteDialog = ref(false)
    const resetPasswordDialog = ref(false)
    const unlockDialog = ref(false)
    
    const editMode = ref(false)
    const editedUser = ref({
      name: '',
      email: '',
      password: '',
      gradeLevel: '',
      isAdmin: false
    })
    
    const selectedUser = ref(null)
    const newPassword = ref('')
    const confirmPassword = ref('')
    
    const userForm = ref(null)
    const resetPasswordForm = ref(null)
    
    const columns = [
      { name: 'name', label: '姓名', field: 'name', sortable: true },
      { name: 'email', label: '邮箱', field: 'email', sortable: true },
      { name: 'gradeLevel', label: '年级', field: 'gradeLevel', sortable: true },
      { name: 'lastLogin', label: '最后登录', field: 'lastLogin', sortable: true },
      { name: 'progress', label: '学习进度', field: 'progress' },
      { name: 'status', label: '状态', field: 'isLocked' },
      { name: 'role', label: '角色', field: 'isAdmin' }
    ]
    
    const gradeOptions = [
      '7th Grade', '8th Grade', '9th Grade', 
      '10th Grade', '11th Grade', '12th Grade', 'Teacher'
    ]
    
    const filteredUsers = computed(() => {
      let result = [...users.value]
      
      // 搜索过滤
      if (searchText.value) {
        const search = searchText.value.toLowerCase()
        result = result.filter(user => 
          user.name.toLowerCase().includes(search) || 
          user.email.toLowerCase().includes(search)
        )
      }
      
      // 年级过滤
      if (gradeFilter.value) {
        result = result.filter(user => user.gradeLevel === gradeFilter.value)
      }
      
      return result
    })
    
    const fetchUsers = async () => {
      loading.value = true
      try {
        users.value = await userStore.loadAllUsers()
      } catch (error) {
        console.error('加载用户失败:', error)
        $q.notify({
          color: 'negative',
          message: '加载用户列表失败',
          icon: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    const showAddDialog = () => {
      editMode.value = false
      editedUser.value = {
        name: '',
        email: '',
        password: '',
        gradeLevel: '',
        isAdmin: false
      }
      userDialog.value = true
    }
    
    const editUser = (user) => {
      editMode.value = true
      editedUser.value = { ...user }
      userDialog.value = true
    }
    
    const saveUser = async () => {
      try {
        await userStore.addOrUpdateUser(editedUser.value)
        userDialog.value = false
        $q.notify({
          color: 'positive',
          message: `${editMode.value ? '用户已更新' : '用户已添加'}`,
          icon: 'check'
        })
        await fetchUsers()
      } catch (error) {
        console.error('保存用户失败:', error)
        $q.notify({
          color: 'negative',
          message: `${editMode.value ? '更新' : '添加'}用户失败: ${error.message}`,
          icon: 'error'
        })
      }
    }
    
    const confirmDelete = (user) => {
      selectedUser.value = user
      deleteDialog.value = true
    }
    
    const deleteUser = async () => {
      try {
        await userStore.deleteUser(selectedUser.value._id)
        $q.notify({
          color: 'positive',
          message: '用户已删除',
          icon: 'check'
        })
        await fetchUsers()
      } catch (error) {
        console.error('删除用户失败:', error)
        $q.notify({
          color: 'negative',
          message: `删除用户失败: ${error.message}`,
          icon: 'error'
        })
      }
    }
    
    // 显示重置密码对话框
    const showResetPasswordDialog = (user) => {
      selectedUser.value = user
      newPassword.value = ''
      confirmPassword.value = ''
      resetPasswordDialog.value = true
    }
    
    // 重置用户密码
    const resetPassword = async () => {
      try {
        await api.post(`/users/${selectedUser.value._id}/reset-password`, {
          newPassword: newPassword.value
        })
        
        resetPasswordDialog.value = false
        $q.notify({
          color: 'positive',
          message: '密码已重置',
          icon: 'check'
        })
      } catch (error) {
        console.error('重置密码失败:', error)
        $q.notify({
          color: 'negative',
          message: `重置密码失败: ${error.response?.data?.message || error.message}`,
          icon: 'error'
        })
      }
    }
    
    // 解锁用户账户
    const unlockUser = (user) => {
      selectedUser.value = user
      unlockDialog.value = true
    }
    
    // 确认解锁账户
    const confirmUnlock = async () => {
      try {
        await api.post(`/users/${selectedUser.value._id}/unlock`)
        
        $q.notify({
          color: 'positive',
          message: '账户已解锁',
          icon: 'check'
        })
        await fetchUsers()
      } catch (error) {
        console.error('解锁账户失败:', error)
        $q.notify({
          color: 'negative',
          message: `解锁账户失败: ${error.response?.data?.message || error.message}`,
          icon: 'error'
        })
      }
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return '从未登录'
      return date.formatDate(dateString, 'YYYY-MM-DD HH:mm')
    }
    
    onMounted(fetchUsers)
    
    return {
      users,
      loading,
      columns,
      searchText,
      gradeFilter,
      gradeOptions,
      filteredUsers,
      userDialog,
      deleteDialog,
      resetPasswordDialog,
      unlockDialog,
      editMode,
      editedUser,
      selectedUser,
      newPassword,
      confirmPassword,
      userForm,
      resetPasswordForm,
      
      showAddDialog,
      editUser,
      saveUser,
      confirmDelete,
      deleteUser,
      showResetPasswordDialog,
      resetPassword,
      unlockUser,
      confirmUnlock,
      formatDate
    }
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style> 