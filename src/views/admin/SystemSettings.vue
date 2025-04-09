<template>
  <q-page padding>
    <div class="q-pa-md">
      <div class="text-h4 q-mb-md">系统设置</div>
      
      <q-tabs
        v-model="activeTab"
        dense
        class="bg-grey-2 text-primary q-mb-md"
        align="left"
        narrow-indicator
      >
        <q-tab name="general" label="通用设置" icon="settings" />
        <q-tab name="security" label="安全设置" icon="security" />
        <q-tab name="backup" label="数据备份" icon="backup" />
        <q-tab name="api" label="API集成" icon="api" />
      </q-tabs>
      
      <q-tab-panels v-model="activeTab" animated>
        <q-tab-panel name="general">
          <q-card>
            <q-card-section>
              <div class="text-h6">通用设置</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <q-form @submit="saveGeneralSettings" class="q-gutter-md">
                <q-input
                  v-model="generalSettings.siteName"
                  label="网站名称"
                  outlined
                  :rules="[val => !!val || '请输入网站名称']"
                />
                
                <q-input
                  v-model="generalSettings.contactEmail"
                  label="联系邮箱"
                  outlined
                  type="email"
                  :rules="[
                    val => !!val || '请输入联系邮箱',
                    val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || '邮箱格式不正确'
                  ]"
                />
                
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="generalSettings.defaultLanguage"
                      :options="languageOptions"
                      label="默认语言"
                      outlined
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-select
                      v-model="generalSettings.timezone"
                      :options="timezoneOptions"
                      label="时区"
                      outlined
                    />
                  </div>
                </div>
                
                <q-toggle
                  v-model="generalSettings.enableRegistration"
                  label="允许用户注册"
                />
                
                <q-toggle
                  v-model="generalSettings.enableNotifications"
                  label="启用系统通知"
                />
                
                <div class="q-mt-md">
                  <q-btn type="submit" color="primary" label="保存设置" :loading="saving" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-tab-panel>
        
        <q-tab-panel name="security">
          <q-card>
            <q-card-section>
              <div class="text-h6">安全设置</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <q-form @submit="saveSecuritySettings" class="q-gutter-md">
                <div class="text-subtitle1 q-mb-sm">密码策略</div>
                
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="securitySettings.passwordMinLength"
                      label="最小密码长度"
                      type="number"
                      min="6"
                      max="32"
                      outlined
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="securitySettings.passwordExpiryDays"
                      label="密码过期天数（0表示永不过期）"
                      type="number"
                      min="0"
                      outlined
                    />
                  </div>
                </div>
                
                <q-toggle
                  v-model="securitySettings.requireSpecialChar"
                  label="要求包含特殊字符"
                />
                
                <q-toggle
                  v-model="securitySettings.requireNumber"
                  label="要求包含数字"
                />
                
                <q-toggle
                  v-model="securitySettings.requireUpperLower"
                  label="要求包含大小写字母"
                />
                
                <q-separator class="q-my-md" />
                
                <div class="text-subtitle1 q-mb-sm">登录安全</div>
                
                <q-input
                  v-model="securitySettings.maxLoginAttempts"
                  label="最大登录失败次数（0表示不限制）"
                  type="number"
                  min="0"
                  outlined
                />
                
                <q-input
                  v-model="securitySettings.lockoutMinutes"
                  label="账户锁定时间（分钟）"
                  type="number"
                  min="5"
                  outlined
                />
                
                <q-toggle
                  v-model="securitySettings.enableTwoFactor"
                  label="启用双因素认证"
                />
                
                <div class="q-mt-md">
                  <q-btn type="submit" color="primary" label="保存设置" :loading="saving" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-tab-panel>
        
        <q-tab-panel name="backup">
          <q-card>
            <q-card-section>
              <div class="text-h6">数据备份</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div class="row q-mb-md">
                <div class="col-12 col-md-6">
                  <q-form @submit="saveBackupSettings" class="q-gutter-md">
                    <q-toggle
                      v-model="backupSettings.enableAutoBackup"
                      label="启用自动备份"
                    />
                    
                    <q-select
                      v-model="backupSettings.backupFrequency"
                      :options="backupFrequencyOptions"
                      label="备份频率"
                      outlined
                      :disable="!backupSettings.enableAutoBackup"
                    />
                    
                    <q-input
                      v-model="backupSettings.backupsToKeep"
                      label="保留备份数量"
                      type="number"
                      min="1"
                      outlined
                      :disable="!backupSettings.enableAutoBackup"
                    />
                    
                    <q-toggle
                      v-model="backupSettings.compressBackups"
                      label="压缩备份文件"
                      :disable="!backupSettings.enableAutoBackup"
                    />
                    
                    <div class="q-mt-md">
                      <q-btn type="submit" color="primary" label="保存设置" :loading="saving" />
                    </div>
                  </q-form>
                </div>
                
                <q-separator vertical class="q-mx-md" />
                
                <div class="col-12 col-md-5">
                  <div class="text-subtitle1 q-mb-md">手动备份</div>
                  
                  <q-btn
                    color="primary"
                    icon="backup"
                    label="立即备份"
                    class="q-mb-md"
                    @click="createBackup"
                    :loading="creatingBackup"
                  />
                  
                  <div class="text-subtitle1 q-mt-lg q-mb-sm">最近备份</div>
                  
                  <q-list bordered separator>
                    <q-item v-for="(backup, index) in recentBackups" :key="index">
                      <q-item-section>
                        <q-item-label>{{ backup.name }}</q-item-label>
                        <q-item-label caption>{{ backup.date }} · {{ backup.size }}</q-item-label>
                      </q-item-section>
                      <q-item-section side>
                        <q-btn flat round icon="file_download" @click="downloadBackup(backup)" />
                        <q-btn flat round icon="delete" color="negative" @click="confirmDeleteBackup(backup)" />
                      </q-item-section>
                    </q-item>
                    
                    <q-item v-if="recentBackups.length === 0">
                      <q-item-section>
                        <q-item-label>暂无备份</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-list>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-tab-panel>
        
        <q-tab-panel name="api">
          <q-card>
            <q-card-section>
              <div class="text-h6">API集成</div>
            </q-card-section>
            
            <q-separator />
            
            <q-card-section>
              <div class="text-subtitle1 q-mb-md">API访问密钥</div>
              
              <div class="row q-mb-md">
                <div class="col-12 col-md-8">
                  <q-input
                    v-model="apiSettings.apiKey"
                    label="API密钥"
                    outlined
                    readonly
                  >
                    <template v-slot:append>
                      <q-btn flat round icon="content_copy" @click="copyApiKey">
                        <q-tooltip>复制</q-tooltip>
                      </q-btn>
                      <q-btn flat round icon="refresh" @click="regenerateApiKey">
                        <q-tooltip>重新生成</q-tooltip>
                      </q-btn>
                    </template>
                  </q-input>
                </div>
              </div>
              
              <q-separator class="q-my-md" />
              
              <div class="text-subtitle1 q-mb-md">第三方集成</div>
              
              <q-form @submit="saveApiSettings" class="q-gutter-md">
                <div class="text-subtitle2 q-mb-sm">微信集成</div>
                
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="apiSettings.wechatAppId"
                      label="微信 AppID"
                      outlined
                    />
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="apiSettings.wechatAppSecret"
                      label="微信 AppSecret"
                      outlined
                      :type="showSecrets ? 'text' : 'password'"
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="showSecrets ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="showSecrets = !showSecrets"
                        />
                      </template>
                    </q-input>
                  </div>
                </div>
                
                <div class="text-subtitle2 q-mb-sm q-mt-md">Google Sheets集成</div>
                
                <div class="row q-col-gutter-md">
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="apiSettings.googleApiKey"
                      label="Google API密钥"
                      outlined
                      :type="showSecrets ? 'text' : 'password'"
                    >
                      <template v-slot:append>
                        <q-icon
                          :name="showSecrets ? 'visibility_off' : 'visibility'"
                          class="cursor-pointer"
                          @click="showSecrets = !showSecrets"
                        />
                      </template>
                    </q-input>
                  </div>
                  <div class="col-12 col-md-6">
                    <q-input
                      v-model="apiSettings.googleSheetId"
                      label="Google Sheet ID"
                      outlined
                    />
                  </div>
                </div>
                
                <q-toggle
                  v-model="apiSettings.enableGoogleSync"
                  label="启用Google Sheets数据同步"
                />
                
                <div class="q-mt-md">
                  <q-btn type="submit" color="primary" label="保存设置" :loading="saving" />
                  <q-btn flat color="grey" label="重置" class="q-ml-sm" @click="resetApiSettings" />
                </div>
              </q-form>
            </q-card-section>
          </q-card>
        </q-tab-panel>
      </q-tab-panels>
    </div>
    
    <!-- 确认删除备份对话框 -->
    <q-dialog v-model="deleteBackupDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">确定要删除这个备份吗？此操作无法撤销。</span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="删除" color="negative" @click="deleteBackup" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- 重新生成API密钥确认对话框 -->
    <q-dialog v-model="regenerateApiKeyDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="warning" text-color="white" />
          <span class="q-ml-sm">重新生成API密钥将使当前密钥失效。确定要继续吗？</span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="继续" color="negative" @click="confirmRegenerateApiKey" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, onMounted } from 'vue'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'SystemSettings',
  
  setup() {
    const $q = useQuasar()
    const activeTab = ref('general')
    const saving = ref(false)
    const creatingBackup = ref(false)
    const showSecrets = ref(false)
    
    // 对话框
    const deleteBackupDialog = ref(false)
    const regenerateApiKeyDialog = ref(false)
    const selectedBackup = ref(null)
    
    // 通用设置
    const generalSettings = ref({
      siteName: '生物词汇学习系统',
      contactEmail: 'admin@example.com',
      defaultLanguage: 'zh-CN',
      timezone: 'Asia/Shanghai',
      enableRegistration: true,
      enableNotifications: true
    })
    
    // 安全设置
    const securitySettings = ref({
      passwordMinLength: 8,
      passwordExpiryDays: 0,
      requireSpecialChar: true,
      requireNumber: true,
      requireUpperLower: true,
      maxLoginAttempts: 5,
      lockoutMinutes: 30,
      enableTwoFactor: false
    })
    
    // 备份设置
    const backupSettings = ref({
      enableAutoBackup: true,
      backupFrequency: 'daily',
      backupsToKeep: 7,
      compressBackups: true
    })
    
    // API设置
    const apiSettings = ref({
      apiKey: 'sk_test_51Ik9J7HKl3SxQ8zN2tvJcMQgxGvYgQ',
      wechatAppId: 'wx123456789abcdef',
      wechatAppSecret: '1234567890abcdef1234567890abcdef',
      googleApiKey: 'AIzaSyBNLrJhOMz6idD05pzfn5lCPxw',
      googleSheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      enableGoogleSync: true
    })
    
    // 备份数据
    const recentBackups = ref([
      {
        id: 1,
        name: 'backup-2023-05-15.zip',
        date: '2023-05-15 02:00:00',
        size: '24.5 MB'
      },
      {
        id: 2,
        name: 'backup-2023-05-14.zip',
        date: '2023-05-14 02:00:00',
        size: '24.2 MB'
      },
      {
        id: 3,
        name: 'backup-2023-05-13.zip',
        date: '2023-05-13 02:00:00',
        size: '23.8 MB'
      }
    ])
    
    // 选项
    const languageOptions = [
      { label: '简体中文', value: 'zh-CN' },
      { label: 'English', value: 'en-US' }
    ]
    
    const timezoneOptions = [
      { label: '(GMT+08:00) 北京时间', value: 'Asia/Shanghai' },
      { label: '(GMT+08:00) 香港时间', value: 'Asia/Hong_Kong' },
      { label: '(GMT+08:00) 台北时间', value: 'Asia/Taipei' },
      { label: '(GMT+09:00) 东京时间', value: 'Asia/Tokyo' },
      { label: '(GMT+00:00) 世界协调时间', value: 'UTC' }
    ]
    
    const backupFrequencyOptions = [
      { label: '每天', value: 'daily' },
      { label: '每周', value: 'weekly' },
      { label: '每月', value: 'monthly' }
    ]
    
    // 保存通用设置
    const saveGeneralSettings = () => {
      saving.value = true
      
      // 模拟API请求
      setTimeout(() => {
        saving.value = false
        
        $q.notify({
          color: 'positive',
          message: '通用设置已保存',
          icon: 'check_circle'
        })
      }, 1000)
    }
    
    // 保存安全设置
    const saveSecuritySettings = () => {
      saving.value = true
      
      // 模拟API请求
      setTimeout(() => {
        saving.value = false
        
        $q.notify({
          color: 'positive',
          message: '安全设置已保存',
          icon: 'check_circle'
        })
      }, 1000)
    }
    
    // 保存备份设置
    const saveBackupSettings = () => {
      saving.value = true
      
      // 模拟API请求
      setTimeout(() => {
        saving.value = false
        
        $q.notify({
          color: 'positive',
          message: '备份设置已保存',
          icon: 'check_circle'
        })
      }, 1000)
    }
    
    // 保存API设置
    const saveApiSettings = () => {
      saving.value = true
      
      // 模拟API请求
      setTimeout(() => {
        saving.value = false
        
        $q.notify({
          color: 'positive',
          message: 'API设置已保存',
          icon: 'check_circle'
        })
      }, 1000)
    }
    
    // 复制API密钥
    const copyApiKey = () => {
      navigator.clipboard.writeText(apiSettings.value.apiKey).then(() => {
        $q.notify({
          color: 'positive',
          message: 'API密钥已复制到剪贴板',
          icon: 'content_copy'
        })
      })
    }
    
    // 重新生成API密钥确认
    const regenerateApiKey = () => {
      regenerateApiKeyDialog.value = true
    }
    
    // 确认重新生成API密钥
    const confirmRegenerateApiKey = () => {
      // 模拟生成新的API密钥
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
      let newKey = 'sk_test_'
      
      for (let i = 0; i < 30; i++) {
        newKey += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      
      apiSettings.value.apiKey = newKey
      
      $q.notify({
        color: 'positive',
        message: 'API密钥已重新生成',
        icon: 'refresh'
      })
    }
    
    // 重置API设置
    const resetApiSettings = () => {
      apiSettings.value = {
        apiKey: 'sk_test_51Ik9J7HKl3SxQ8zN2tvJcMQgxGvYgQ',
        wechatAppId: 'wx123456789abcdef',
        wechatAppSecret: '1234567890abcdef1234567890abcdef',
        googleApiKey: 'AIzaSyBNLrJhOMz6idD05pzfn5lCPxw',
        googleSheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
        enableGoogleSync: true
      }
      
      $q.notify({
        color: 'info',
        message: 'API设置已重置',
        icon: 'refresh'
      })
    }
    
    // 创建备份
    const createBackup = () => {
      creatingBackup.value = true
      
      // 模拟API请求
      setTimeout(() => {
        creatingBackup.value = false
        
        // 添加新备份到列表
        const today = new Date()
        const formattedDate = today.toISOString().split('T')[0]
        const backupName = `backup-${formattedDate}.zip`
        
        recentBackups.value.unshift({
          id: recentBackups.value.length + 1,
          name: backupName,
          date: today.toLocaleString(),
          size: '25.1 MB'
        })
        
        $q.notify({
          color: 'positive',
          message: '系统备份已完成',
          icon: 'backup'
        })
      }, 2000)
    }
    
    // 下载备份
    const downloadBackup = (backup) => {
      $q.notify({
        color: 'info',
        message: `正在下载备份：${backup.name}`,
        icon: 'file_download'
      })
    }
    
    // 确认删除备份
    const confirmDeleteBackup = (backup) => {
      selectedBackup.value = backup
      deleteBackupDialog.value = true
    }
    
    // 删除备份
    const deleteBackup = () => {
      if (!selectedBackup.value) return
      
      recentBackups.value = recentBackups.value.filter(
        backup => backup.id !== selectedBackup.value.id
      )
      
      $q.notify({
        color: 'positive',
        message: '备份已删除',
        icon: 'delete'
      })
      
      selectedBackup.value = null
    }
    
    onMounted(() => {
      // 实际应用中，这里会从API加载配置数据
    })
    
    return {
      activeTab,
      saving,
      creatingBackup,
      showSecrets,
      deleteBackupDialog,
      regenerateApiKeyDialog,
      selectedBackup,
      generalSettings,
      securitySettings,
      backupSettings,
      apiSettings,
      recentBackups,
      languageOptions,
      timezoneOptions,
      backupFrequencyOptions,
      saveGeneralSettings,
      saveSecuritySettings,
      saveBackupSettings,
      saveApiSettings,
      copyApiKey,
      regenerateApiKey,
      confirmRegenerateApiKey,
      resetApiSettings,
      createBackup,
      downloadBackup,
      confirmDeleteBackup,
      deleteBackup
    }
  }
})
</script> 