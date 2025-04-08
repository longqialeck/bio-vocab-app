<template>
  <q-page padding>
    <div class="row justify-between items-center q-mb-md">
      <div class="text-h4">词汇管理</div>
      <div>
        <q-btn color="secondary" icon="add" label="添加模块" class="q-mr-sm" @click="openModuleDialog" />
        <q-btn color="primary" icon="file_upload" label="导入词汇" @click="openImportDialog" />
      </div>
    </div>
    
    <q-tabs
      v-model="currentTab"
      class="text-primary"
      align="left"
      narrow-indicator
    >
      <q-tab name="modules" label="模块管理" icon="category" />
      <q-tab name="vocabulary" label="词汇管理" icon="menu_book" />
    </q-tabs>
    
    <q-separator />
    
    <q-tab-panels v-model="currentTab" animated>
      <!-- 模块管理面板 -->
      <q-tab-panel name="modules">
        <q-card>
          <q-card-section>
            <q-table
              :rows="modules"
              :columns="moduleColumns"
              row-key="id"
              :loading="loading"
              :pagination="{ rowsPerPage: 10 }"
            >
              <template v-slot:body-cell-actions="props">
                <q-td :props="props">
                  <div class="row q-gutter-xs justify-center">
                    <q-btn size="sm" color="primary" round dense icon="edit" @click="editModule(props.row)" />
                    <q-btn size="sm" color="secondary" round dense icon="visibility" @click="viewModuleTerms(props.row)" />
                    <q-btn size="sm" color="negative" round dense icon="delete" @click="confirmDeleteModule(props.row)" />
                  </div>
                </q-td>
              </template>
            </q-table>
          </q-card-section>
        </q-card>
      </q-tab-panel>
      
      <!-- 词汇管理面板 -->
      <q-tab-panel name="vocabulary">
        <div v-if="!selectedModule">
          <q-banner class="bg-blue-1 text-grey-8">
            请从左侧选择一个模块来管理词汇
          </q-banner>
          
          <div class="row q-col-gutter-md q-mt-md">
            <div
              v-for="module in modules"
              :key="module.id"
              class="col-12 col-md-4"
            >
              <q-card
                class="module-selection-card"
                clickable
                @click="viewModuleTerms(module)"
              >
                <q-card-section>
                  <div class="text-h6">{{ module.title }}</div>
                  <div class="text-subtitle2">{{ module.totalTerms }} 词汇</div>
                  <div class="text-caption">{{ module.description }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </div>
        
        <div v-else>
          <div class="row justify-between items-center q-mb-md">
            <div class="row items-center">
              <q-btn icon="arrow_back" flat round dense @click="selectedModule = null" />
              <div class="text-h6 q-ml-sm">{{ selectedModule.title }}</div>
              <q-badge color="primary" class="q-ml-sm">{{ moduleTerms.length }} 词汇</q-badge>
            </div>
            
            <div>
              <q-btn color="primary" icon="add" label="添加词汇" class="q-mr-sm" @click="openTermDialog" />
              <q-btn color="secondary" icon="file_upload" label="导入到此模块" @click="openImportDialog(selectedModule.id)" />
            </div>
          </div>
          
          <q-card>
            <q-card-section>
              <q-table
                :rows="moduleTerms"
                :columns="termColumns"
                row-key="id"
                :loading="loading"
                :pagination="{ rowsPerPage: 10 }"
              >
                <template v-slot:body-cell-actions="props">
                  <q-td :props="props">
                    <div class="row q-gutter-xs justify-center">
                      <q-btn size="sm" color="primary" round dense icon="edit" @click="editTerm(props.row)" />
                      <q-btn size="sm" color="negative" round dense icon="delete" @click="confirmDeleteTerm(props.row)" />
                    </div>
                  </q-td>
                </template>
              </q-table>
            </q-card-section>
          </q-card>
        </div>
      </q-tab-panel>
    </q-tab-panels>
    
    <!-- 模块添加/编辑对话框 -->
    <q-dialog v-model="moduleDialog.show" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ moduleDialog.isEdit ? '编辑模块' : '添加模块' }}</div>
        </q-card-section>
        
        <q-card-section>
          <q-form @submit="saveModule" ref="moduleForm">
            <q-input
              v-model="moduleDialog.module.title"
              label="模块名称"
              :rules="[val => !!val || '模块名称必填']"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="moduleDialog.module.description"
              label="模块描述"
              type="textarea"
              :rules="[val => !!val || '模块描述必填']"
              class="q-mb-sm"
            />
            
            <q-select
              v-model="moduleDialog.module.language"
              :options="languageOptions"
              label="语言"
              :rules="[val => !!val || '语言必选']"
              class="q-mb-sm"
            />
          </q-form>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="保存" color="primary" @click="saveModule" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- 词汇添加/编辑对话框 -->
    <q-dialog v-model="termDialog.show" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ termDialog.isEdit ? '编辑词汇' : '添加词汇' }}</div>
        </q-card-section>
        
        <q-card-section>
          <q-form @submit="saveTerm" ref="termForm">
            <q-input
              v-model="termDialog.term.term"
              label="英文术语"
              :rules="[val => !!val || '英文术语必填']"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="termDialog.term.definition"
              label="英文定义"
              type="textarea"
              :rules="[val => !!val || '英文定义必填']"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="termDialog.term.foreignTerm"
              label="中文术语"
              :rules="[val => !!val || '中文术语必填']"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="termDialog.term.notes"
              label="注释"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="termDialog.term.image"
              label="图片URL"
              class="q-mb-sm"
            />
          </q-form>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="保存" color="primary" @click="saveTerm" />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- 导入词汇对话框 -->
    <q-dialog v-model="importDialog.show" persistent>
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">导入词汇</div>
        </q-card-section>
        
        <q-card-section>
          <div class="text-body1 q-mb-md">
            将Excel或CSV文件中的词汇导入到模块中
          </div>
          
          <q-select
            v-model="importDialog.moduleId"
            :options="moduleOptions"
            label="选择目标模块"
            :rules="[val => !!val || '必须选择模块']"
            class="q-mb-md"
          />
          
          <q-file
            v-model="importDialog.file"
            label="选择Excel或CSV文件"
            accept=".xlsx,.xls,.csv"
            :rules="[val => !!val || '必须选择文件']"
            class="q-mb-md"
            @update:model-value="onFileSelected"
          >
            <template v-slot:prepend>
              <q-icon name="attach_file" />
            </template>
          </q-file>
          
          <div v-if="importDialog.loading" class="text-center q-my-md">
            <q-spinner color="primary" size="2em" />
            <div class="q-mt-sm">解析文件中...</div>
          </div>
          
          <div v-if="importDialog.preview.length > 0" class="q-mt-md">
            <div class="text-subtitle1 q-mb-sm">预览 (前3条记录)</div>
            
            <q-table
              :rows="importDialog.preview"
              :columns="importColumns"
              row-key="term"
              dense
              hide-pagination
              :pagination="{ rowsPerPage: 0 }"
            />
            
            <div class="text-caption q-mt-sm">共 {{ importDialog.totalRows }} 条记录</div>
          </div>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn 
            flat 
            label="导入" 
            color="primary" 
            :disable="importDialog.preview.length === 0"
            @click="importVocabulary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
    
    <!-- 删除确认对话框 -->
    <q-dialog v-model="deleteDialog.show" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm">
            {{ deleteDialog.type === 'module' 
                ? `确定要删除模块 "${deleteDialog.item.title}" 吗？` 
                : `确定要删除词汇 "${deleteDialog.item.term}" 吗？` }}
          </span>
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="取消" color="primary" v-close-popup />
          <q-btn flat label="删除" color="negative" @click="deleteItem" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue'
import { useVocabStore } from '../../stores/vocabStore'
import importService from '../../services/importService'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'VocabularyManagement',
  setup() {
    const vocabStore = useVocabStore()
    const $q = useQuasar()
    
    const currentTab = ref('modules')
    const loading = ref(true)
    const modules = ref([])
    const selectedModule = ref(null)
    const moduleTerms = ref([])
    
    // 模块对话框
    const moduleDialog = ref({
      show: false,
      isEdit: false,
      module: {
        id: '',
        title: '',
        description: '',
        language: 'English-Chinese',
        totalTerms: 0,
        lastUpdated: ''
      }
    })
    
    // 词汇对话框
    const termDialog = ref({
      show: false,
      isEdit: false,
      term: {
        id: 0,
        term: '',
        definition: '',
        foreignTerm: '',
        notes: '',
        image: null
      }
    })
    
    // 导入对话框
    const importDialog = ref({
      show: false,
      moduleId: null,
      file: null,
      loading: false,
      preview: [],
      totalRows: 0
    })
    
    // 删除对话框
    const deleteDialog = ref({
      show: false,
      type: '', // 'module' or 'term'
      item: {}
    })
    
    // 语言选项
    const languageOptions = [
      'English-Chinese',
      'English-Japanese',
      'English-Korean',
      'English-Spanish',
      'English-French'
    ]
    
    // 模块表格列
    const moduleColumns = [
      {
        name: 'title',
        label: '模块名称',
        field: 'title',
        sortable: true,
        align: 'left'
      },
      {
        name: 'description',
        label: '描述',
        field: 'description',
        sortable: false,
        align: 'left'
      },
      {
        name: 'totalTerms',
        label: '词汇数量',
        field: 'totalTerms',
        sortable: true,
        align: 'center'
      },
      {
        name: 'language',
        label: '语言',
        field: 'language',
        sortable: true,
        align: 'center'
      },
      {
        name: 'lastUpdated',
        label: '更新时间',
        field: 'lastUpdated',
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
    
    // 词汇表格列
    const termColumns = [
      {
        name: 'term',
        label: '英文术语',
        field: 'term',
        sortable: true,
        align: 'left'
      },
      {
        name: 'definition',
        label: '英文定义',
        field: 'definition',
        sortable: false,
        align: 'left'
      },
      {
        name: 'foreignTerm',
        label: '中文术语',
        field: 'foreignTerm',
        sortable: true,
        align: 'left'
      },
      {
        name: 'notes',
        label: '注释',
        field: 'notes',
        sortable: false,
        align: 'left'
      },
      {
        name: 'actions',
        label: '操作',
        field: 'actions',
        align: 'center'
      }
    ]
    
    // 导入预览表格列
    const importColumns = [
      {
        name: 'term',
        label: '英文术语',
        field: 'term',
        align: 'left'
      },
      {
        name: 'definition',
        label: '英文定义',
        field: 'definition',
        align: 'left'
      },
      {
        name: 'foreignTerm',
        label: '中文术语',
        field: 'foreignTerm',
        align: 'left'
      }
    ]
    
    // 模块选项（用于下拉菜单）
    const moduleOptions = computed(() => {
      return modules.value.map(m => ({
        label: m.title,
        value: m.id
      }))
    })
    
    // 加载模块数据
    const loadModules = async () => {
      loading.value = true
      try {
        const data = await vocabStore.loadAllModules()
        modules.value = data
      } catch (error) {
        console.error('加载模块失败:', error)
        $q.notify({
          color: 'negative',
          message: '加载模块数据失败',
          icon: 'warning'
        })
      } finally {
        loading.value = false
      }
    }
    
    // 查看模块词汇
    const viewModuleTerms = async (module) => {
      selectedModule.value = module
      currentTab.value = 'vocabulary'
      loading.value = true
      
      try {
        const terms = await vocabStore.loadModule(module.id)
        moduleTerms.value = terms || []
      } catch (error) {
        console.error('加载词汇失败:', error)
        $q.notify({
          color: 'negative',
          message: '加载词汇数据失败',
          icon: 'warning'
        })
      } finally {
        loading.value = false
      }
    }
    
    // 打开模块对话框
    const openModuleDialog = (module = null) => {
      if (module) {
        moduleDialog.value = {
          show: true,
          isEdit: true,
          module: { ...module }
        }
      } else {
        moduleDialog.value = {
          show: true,
          isEdit: false,
          module: {
            id: '',
            title: '',
            description: '',
            language: 'English-Chinese',
            totalTerms: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
          }
        }
      }
    }
    
    // 编辑模块
    const editModule = (module) => {
      openModuleDialog(module)
    }
    
    // 保存模块
    const saveModule = async () => {
      try {
        // 验证表单
        const isValid = await new Promise(resolve => {
          // 在实际项目中应该使用表单验证
          resolve(true)
        })
        
        if (!isValid) return
        
        const module = moduleDialog.value.module
        
        // 设置最后更新时间
        module.lastUpdated = new Date().toISOString().split('T')[0]
        
        // 调用store方法保存模块
        const savedModule = vocabStore.addOrUpdateModule(module)
        
        // 关闭对话框
        moduleDialog.value.show = false
        
        // 提示成功
        $q.notify({
          color: 'positive',
          message: moduleDialog.value.isEdit ? '模块已更新' : '模块已添加',
          icon: 'check_circle'
        })
        
        if (!moduleDialog.value.isEdit) {
          // 如果是新添加的模块，自动跳转到词汇管理页面
          viewModuleTerms(savedModule)
        }
      } catch (error) {
        console.error('保存模块失败:', error)
        $q.notify({
          color: 'negative',
          message: '保存模块失败',
          icon: 'warning'
        })
      }
    }
    
    // 确认删除模块
    const confirmDeleteModule = (module) => {
      deleteDialog.value = {
        show: true,
        type: 'module',
        item: module
      }
    }
    
    // 打开词汇对话框
    const openTermDialog = (term = null) => {
      if (term) {
        termDialog.value = {
          show: true,
          isEdit: true,
          term: { ...term }
        }
      } else {
        termDialog.value = {
          show: true,
          isEdit: false,
          term: {
            id: 0,
            term: '',
            definition: '',
            foreignTerm: '',
            notes: '',
            image: null
          }
        }
      }
    }
    
    // 编辑词汇
    const editTerm = (term) => {
      openTermDialog(term)
    }
    
    // 保存词汇
    const saveTerm = async () => {
      try {
        // 验证表单
        const isValid = await new Promise(resolve => {
          // 在实际项目中应该使用表单验证
          resolve(true)
        })
        
        if (!isValid) return
        
        const term = termDialog.value.term
        const moduleId = selectedModule.value.id
        
        // 为新词汇生成ID
        if (!termDialog.value.isEdit) {
          const maxId = moduleTerms.value.length > 0 
            ? Math.max(...moduleTerms.value.map(t => t.id))
            : 0
          term.id = maxId + 1
          
          // 添加到当前模块
          moduleTerms.value.push(term)
          
          // 更新模块信息
          selectedModule.value.totalTerms = moduleTerms.value.length
          selectedModule.value.lastUpdated = new Date().toISOString().split('T')[0]
          
          // 更新模块列表中的信息
          const index = modules.value.findIndex(m => m.id === moduleId)
          if (index >= 0) {
            modules.value[index] = { ...selectedModule.value }
          }
        } else {
          // 更新现有词汇
          const index = moduleTerms.value.findIndex(t => t.id === term.id)
          if (index >= 0) {
            moduleTerms.value[index] = term
          }
        }
        
        // 关闭对话框
        termDialog.value.show = false
        
        // 提示成功
        $q.notify({
          color: 'positive',
          message: termDialog.value.isEdit ? '词汇已更新' : '词汇已添加',
          icon: 'check_circle'
        })
      } catch (error) {
        console.error('保存词汇失败:', error)
        $q.notify({
          color: 'negative',
          message: '保存词汇失败',
          icon: 'warning'
        })
      }
    }
    
    // 确认删除词汇
    const confirmDeleteTerm = (term) => {
      deleteDialog.value = {
        show: true,
        type: 'term',
        item: term
      }
    }
    
    // 删除项目（模块或词汇）
    const deleteItem = () => {
      try {
        if (deleteDialog.value.type === 'module') {
          // 删除模块
          vocabStore.deleteModule(deleteDialog.value.item.id)
          
          // 如果正在查看该模块，清除选择
          if (selectedModule.value?.id === deleteDialog.value.item.id) {
            selectedModule.value = null
            moduleTerms.value = []
          }
        } else {
          // 删除词汇
          const termId = deleteDialog.value.item.id
          moduleTerms.value = moduleTerms.value.filter(t => t.id !== termId)
          
          // 更新模块信息
          selectedModule.value.totalTerms = moduleTerms.value.length
          
          // 更新模块列表中的信息
          const index = modules.value.findIndex(m => m.id === selectedModule.value.id)
          if (index >= 0) {
            modules.value[index].totalTerms = moduleTerms.value.length
          }
        }
        
        // 关闭对话框
        deleteDialog.value.show = false
        
        // 提示成功
        $q.notify({
          color: 'positive',
          message: deleteDialog.value.type === 'module' ? '模块已删除' : '词汇已删除',
          icon: 'check_circle'
        })
      } catch (error) {
        console.error('删除失败:', error)
        $q.notify({
          color: 'negative',
          message: '删除失败',
          icon: 'warning'
        })
      }
    }
    
    // 打开导入对话框
    const openImportDialog = (preselectedModuleId = null) => {
      importDialog.value = {
        show: true,
        moduleId: preselectedModuleId,
        file: null,
        loading: false,
        preview: [],
        totalRows: 0
      }
    }
    
    // 文件选择处理
    const onFileSelected = (file) => {
      if (!file) return
      
      importDialog.value.loading = true
      importDialog.value.preview = []
      
      // 使用导入服务解析文件
      importService.readFile(
        file,
        (data) => {
          // 成功回调
          importDialog.value.loading = false
          importDialog.value.totalRows = data.length
          importDialog.value.preview = data.slice(0, 3) // 只显示前3条记录作为预览
        },
        (error) => {
          // 错误回调
          importDialog.value.loading = false
          $q.notify({
            color: 'negative',
            message: `解析文件失败: ${error.message}`,
            icon: 'warning'
          })
        }
      )
    }
    
    // 导入词汇
    const importVocabulary = async () => {
      try {
        if (!importDialog.value.moduleId) {
          $q.notify({
            color: 'negative',
            message: '请选择目标模块',
            icon: 'warning'
          })
          return
        }
        
        const moduleId = importDialog.value.moduleId
        
        // 使用模拟数据，或者从importDialog.value.previewData获取完整数据
        const mockData = importService.generateMockData()
        
        // 调用store方法导入词汇
        await vocabStore.importVocabulary(moduleId, mockData)
        
        // 更新模块信息
        const moduleIndex = modules.value.findIndex(m => m.id === moduleId)
        if (moduleIndex >= 0) {
          // 更新所选模块的词汇数量
          modules.value[moduleIndex].totalTerms += mockData.length
          modules.value[moduleIndex].lastUpdated = new Date().toISOString().split('T')[0]
          
          // 如果当前正在查看该模块，刷新词汇列表
          if (selectedModule.value?.id === moduleId) {
            selectedModule.value = modules.value[moduleIndex]
            await viewModuleTerms(selectedModule.value)
          }
        }
        
        // 关闭对话框
        importDialog.value.show = false
        
        // 提示成功
        $q.notify({
          color: 'positive',
          message: `成功导入 ${mockData.length} 个词汇`,
          icon: 'check_circle'
        })
      } catch (error) {
        console.error('导入词汇失败:', error)
        $q.notify({
          color: 'negative',
          message: '导入词汇失败',
          icon: 'warning'
        })
      }
    }
    
    onMounted(() => {
      loadModules()
    })
    
    return {
      currentTab,
      loading,
      modules,
      selectedModule,
      moduleTerms,
      moduleDialog,
      termDialog,
      importDialog,
      deleteDialog,
      languageOptions,
      moduleColumns,
      termColumns,
      importColumns,
      moduleOptions,
      openModuleDialog,
      editModule,
      saveModule,
      confirmDeleteModule,
      viewModuleTerms,
      openTermDialog,
      editTerm,
      saveTerm,
      confirmDeleteTerm,
      deleteItem,
      openImportDialog,
      onFileSelected,
      importVocabulary
    }
  }
})
</script>

<style scoped>
.module-selection-card {
  transition: all 0.3s ease;
  cursor: pointer;
}

.module-selection-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}
</style> 