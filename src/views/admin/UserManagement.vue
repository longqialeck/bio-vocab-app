<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h4">用户管理</div>
      <q-btn color="primary" icon="add" label="添加用户" @click="openAddDialog" />
    </div>
    
    <q-card>
      <q-card-section>
        <div class="row items-center q-mb-md">
          <q-input
            v-model="filter"
            placeholder="搜索用户..."
            dense
            clearable
            class="col-grow"
          >
            <template v-slot:append>
              <q-icon name="search" />
            </template>
          </q-input>
          
          <q-select
            v-model="gradeFilter"
            :options="gradeOptions"
            label="年级筛选"
            dense
            clearable
            options-dense
            class="q-ml-md"
            style="width: 150px"
          />
        </div>
        
        <q-table
          :rows="filteredUsers"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :filter="filter"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <div class="row q-gutter-xs justify-center">
                <q-btn size="sm" color="primary" round dense icon="edit" @click="editUser(props.row)" />
                <q-btn size="sm" color="negative" round dense icon="delete" @click="confirmDelete(props.row)" />
              </div>
            </q-td>
          </template>
          
          <template v-slot:body-cell-progress="props">
            <q-td :props="props">
              <q-linear-progress
                :value="props.value / 100"
                :color="getProgressColor(props.value)"
                style="height: 6px"
              />
              <div class="text-caption text-center">{{ props.value }}%</div>
            </q-td>
          </template>
          
          <template v-slot:body-cell-isAdmin="props">
            <q-td :props="props">
              <q-badge :color="props.value ? 'negative' : 'primary'">
                {{ props.value ? '管理员' : '学生' }}
              </q-badge>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    
    <!-- 添加/编辑用户对话框 -->
    <q-dialog v-model="userDialog.show" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ userDialog.isEdit ? '编辑用户' : '添加用户' }}</div>
        </q-card-section>
        
        <q-card-section>
          <q-form @submit="saveUser" ref="userForm">
            <q-input
              v-model="userDialog.user.name"
              label="姓名"
              :rules="[val => !!val || '姓名必填']"
              dense
              class="q-mb-sm"
            />
            
            <q-input
              v-model="userDialog.user.email"
              label="电子邮箱"
              type="email"
              :rules="[
                val => !!val || '邮箱必填',
                val => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(val) || '邮箱格式不正确'
              ]"
              dense
              class="q-mb-sm"
            />
            
            <q-select
              v-model="userDialog.user.gradeLevel"
              :options="gradeOptions"
              label="年级"
              :rules="[val => !!val || '年级必选']"
              dense
              class="q-mb-sm"
            />
            
            <q-toggle
              v-model="userDialog.user.isAdmin"
              label="管理员权限"
              color="primary"
              class="q-mb-sm"
            />
            
            <q-input
              v-if="!userDialog.isEdit"
              v-model="userDialog.user.password"
              label="密码"
              type="password"
              :rules="[val => !!val || '密码必填', val => val.length >= 6 || '密码至少6位']"
              dense
              class="q-mb-sm"
            />
          </q-form>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="保存" color="primary" @click="saveUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- 删除确认对话框 -->
    <q-dialog v-model="deleteDialog.show" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">确定要删除用户 "{{ deleteDialog.user.name }}" 吗？</span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="删除" color="negative" @click="deleteUser" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/userStore'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'UserManagement',
  setup() {
    const userStore = useUserStore()
    const $q = useQuasar()
    
    const users = ref([])
    const loading = ref(true)
    const filter = ref('')
    const gradeFilter = ref(null)
    
    // 用户对话框
    const userDialog = ref({
      show: false,
      isEdit: false,
      user: {
        id: '',
        name: '',
        email: '',
        gradeLevel: '',
        password: '',
        isAdmin: false
      }
    })
    
    // 删除对话框
    const deleteDialog = ref({
      show: false,
      user: {}
    })
    
    // 年级选项
    const gradeOptions = [
      '6th Grade', '7th Grade', '8th Grade', '9th Grade', 
      '10th Grade', '11th Grade', '12th Grade', 'College', 'Teacher'
    ]
    
    // 表格列定义
    const columns = [
      {
        name: 'name',
        label: '姓名',
        field: 'name',
        sortable: true,
        align: 'left'
      },
      {
        name: 'email',
        label: '电子邮箱',
        field: 'email',
        sortable: true,
        align: 'left'
      },
      {
        name: 'gradeLevel',
        label: '年级',
        field: 'gradeLevel',
        sortable: true,
        align: 'left'
      },
      {
        name: 'lastLogin',
        label: '上次登录',
        field: 'lastLogin',
        sortable: true,
        align: 'center'
      },
      {
        name: 'progress',
        label: '学习进度',
        field: 'progress',
        sortable: true,
        align: 'center'
      },
      {
        name: 'isAdmin',
        label: '角色',
        field: 'isAdmin',
        sortable: true,
        align: 'center'
      },
      {
        name: 'actions',
        label: '操作',
        field: 'actions',
        align: 'center'
      }
    ]
    
    // 根据筛选条件过滤用户
    const filteredUsers = computed(() => {
      let result = users.value;
      
      if (gradeFilter.value) {
        result = result.filter(user => user.gradeLevel === gradeFilter.value)
      }
      
      return result
    })
    
    // 获取进度条颜色
    const getProgressColor = (progress) => {
      if (progress < 30) return 'negative'
      if (progress < 70) return 'warning'
      return 'positive'
    }
    
    // 加载用户数据
    const loadUsers = async () => {
      loading.value = true
      try {
        const data = await userStore.loadAllUsers()
        users.value = data
      } catch (error) {
        console.error('加载用户失败:', error)
        $q.notify({
          color: 'negative',
          message: '加载用户数据失败',
          icon: 'warning'
        })
      } finally {
        loading.value = false
      }
    }
    
    // 打开添加用户对话框
    const openAddDialog = () => {
      userDialog.value = {
        show: true,
        isEdit: false,
        user: {
          id: '',
          name: '',
          email: '',
          gradeLevel: '',
          password: '',
          isAdmin: false
        }
      }
    }
    
    // 打开编辑用户对话框
    const editUser = (user) => {
      userDialog.value = {
        show: true,
        isEdit: true,
        user: { ...user }
      }
    }
    
    // 确认删除对话框
    const confirmDelete = (user) => {
      deleteDialog.value = {
        show: true,
        user
      }
    }
    
    // 保存用户（添加/编辑）
    const saveUser = async () => {
      try {
        // 验证表单
        const isValid = await new Promise(resolve => {
          // 在实际项目中应该使用表单验证
          resolve(true)
        })
        
        if (!isValid) return
        
        const user = userDialog.value.user
        
        // 对于新用户，生成ID
        if (!userDialog.value.isEdit) {
          user.id = 'user_' + Math.floor(Math.random() * 1000000)
          user.lastLogin = '-'
          user.progress = 0
        }
        
        // 调用store方法保存用户
        userStore.addOrUpdateUser(user)
        
        // 关闭对话框
        userDialog.value.show = false
        
        // 提示成功
        $q.notify({
          color: 'positive',
          message: userDialog.value.isEdit ? '用户已更新' : '用户已添加',
          icon: 'check_circle'
        })
      } catch (error) {
        console.error('保存用户失败:', error)
        $q.notify({
          color: 'negative',
          message: '保存用户失败',
          icon: 'warning'
        })
      }
    }
    
    // 删除用户
    const deleteUser = () => {
      try {
        userStore.deleteUser(deleteDialog.value.user.id)
        deleteDialog.value.show = false
        
        $q.notify({
          color: 'positive',
          message: '用户已删除',
          icon: 'check_circle'
        })
      } catch (error) {
        console.error('删除用户失败:', error)
        $q.notify({
          color: 'negative',
          message: '删除用户失败',
          icon: 'warning'
        })
      }
    }
    
    onMounted(() => {
      loadUsers()
    })
    
    return {
      users,
      loading,
      columns,
      filter,
      gradeFilter,
      gradeOptions,
      filteredUsers,
      userDialog,
      deleteDialog,
      getProgressColor,
      openAddDialog,
      editUser,
      confirmDelete,
      saveUser,
      deleteUser
    }
  }
})
</script>

<style scoped>
/* Add any custom styles here */
</style> 