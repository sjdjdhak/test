<template>
  <el-dialog
    v-model="visible"
    title="导入数据"
    width="600px"
    :before-close="handleClose"
  >
    <div class="import-dialog">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 文件导入 -->
        <el-tab-pane label="文件导入" name="file">
          <div class="import-section">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="true"
              :on-change="handleFileChange"
              :before-upload="beforeUpload"
              accept=".json,.csv,.xlsx"
              drag
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 JSON、CSV、Excel 格式文件
                </div>
              </template>
            </el-upload>
          </div>
        </el-tab-pane>

        <!-- URL导入 -->
        <el-tab-pane label="URL导入" name="url">
          <div class="import-section">
            <el-form :model="urlForm" label-width="80px">
              <el-form-item label="数据URL">
                <el-input
                  v-model="urlForm.url"
                  placeholder="请输入JSON数据的URL地址"
                />
              </el-form-item>
              <el-form-item label="请求头">
                <el-input
                  v-model="urlForm.headers"
                  type="textarea"
                  :rows="3"
                  placeholder="JSON格式的请求头（可选）"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 文本导入 -->
        <el-tab-pane label="文本导入" name="text">
          <div class="import-section">
            <el-input
              v-model="textData"
              type="textarea"
              :rows="10"
              placeholder="请粘贴JSON格式的数据"
            />
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 导入选项 -->
      <div class="import-options">
        <h4>导入选项</h4>
        <el-checkbox v-model="options.overwrite">覆盖现有数据</el-checkbox>
        <el-checkbox v-model="options.backup">导入前备份</el-checkbox>
        <el-checkbox v-model="options.validate">验证数据格式</el-checkbox>
      </div>

      <!-- 预览数据 -->
      <div v-if="previewData.length > 0" class="preview-section">
        <h4>数据预览 (前5条)</h4>
        <el-table :data="previewData.slice(0, 5)" border>
          <el-table-column
            v-for="column in previewColumns"
            :key="column"
            :prop="column"
            :label="column"
            show-overflow-tooltip
          />
        </el-table>
        <p class="preview-info">
          共 {{ previewData.length }} 条数据
        </p>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="importing" @click="handleImport">
          导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
  type?: 'navigation' | 'category'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'navigation'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'import-success': [data: any[]]
}>()

// 响应式数据
const activeTab = ref('file')
const importing = ref(false)
const uploadRef = ref()
const textData = ref('')
const urlForm = ref({
  url: '',
  headers: ''
})
const options = ref({
  overwrite: false,
  backup: true,
  validate: true
})
const previewData = ref<any[]>([])

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const previewColumns = computed(() => {
  if (previewData.value.length === 0) return []
  return Object.keys(previewData.value[0])
})

// 方法
const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  activeTab.value = 'file'
  textData.value = ''
  urlForm.value = { url: '', headers: '' }
  previewData.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      let data: any[]
      
      if (file.name.endsWith('.json')) {
        data = JSON.parse(content)
      } else if (file.name.endsWith('.csv')) {
        data = parseCSV(content)
      } else {
        ElMessage.error('不支持的文件格式')
        return
      }
      
      if (Array.isArray(data)) {
        previewData.value = data
        ElMessage.success('文件解析成功')
      } else {
        ElMessage.error('文件格式不正确，需要数组格式的数据')
      }
    } catch (error) {
      ElMessage.error('文件解析失败')
      console.error(error)
    }
  }
  reader.readAsText(file.raw)
}

const beforeUpload = () => {
  return false // 阻止自动上传
}

const parseCSV = (content: string): any[] => {
  const lines = content.split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const data: any[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',').map(v => v.trim())
    const item: any = {}
    
    headers.forEach((header, index) => {
      item[header] = values[index] || ''
    })
    
    data.push(item)
  }
  
  return data
}

const handleImport = async () => {
  let data: any[] = []
  
  try {
    importing.value = true
    
    // 根据当前标签页获取数据
    if (activeTab.value === 'file') {
      data = previewData.value
    } else if (activeTab.value === 'url') {
      if (!urlForm.value.url) {
        ElMessage.error('请输入URL地址')
        return
      }
      data = await fetchDataFromURL()
    } else if (activeTab.value === 'text') {
      if (!textData.value.trim()) {
        ElMessage.error('请输入数据')
        return
      }
      data = JSON.parse(textData.value)
    }
    
    if (!Array.isArray(data) || data.length === 0) {
      ElMessage.error('没有有效的数据可导入')
      return
    }
    
    // 数据验证
    if (options.value.validate) {
      const isValid = validateData(data)
      if (!isValid) {
        ElMessage.error('数据格式验证失败')
        return
      }
    }
    
    // 确认导入
    const confirmMessage = options.value.overwrite 
      ? `确定要导入 ${data.length} 条数据并覆盖现有数据吗？`
      : `确定要导入 ${data.length} 条数据吗？`
    
    await ElMessageBox.confirm(confirmMessage, '确认导入', {
      type: 'warning'
    })
    
    // 执行导入
    emit('import-success', data)
    ElMessage.success(`成功导入 ${data.length} 条数据`)
    handleClose()
    
  } catch (error) {
    console.error('Import error:', error)
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const fetchDataFromURL = async (): Promise<any[]> => {
  const headers: any = {}
  
  if (urlForm.value.headers) {
    try {
      Object.assign(headers, JSON.parse(urlForm.value.headers))
    } catch (error) {
      ElMessage.error('请求头格式不正确')
      throw error
    }
  }
  
  const response = await fetch(urlForm.value.url, { headers })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  
  return await response.json()
}

const validateData = (data: any[]): boolean => {
  if (props.type === 'navigation') {
    return data.every(item => 
      item.title && 
      item.url && 
      item.categoryId
    )
  } else if (props.type === 'category') {
    return data.every(item => 
      item.name && 
      item.id
    )
  }
  return true
}

// 监听文本数据变化
watch(textData, (newValue) => {
  if (newValue.trim()) {
    try {
      const data = JSON.parse(newValue)
      if (Array.isArray(data)) {
        previewData.value = data
      }
    } catch (error) {
      // 忽略解析错误
    }
  } else {
    previewData.value = []
  }
})
</script>

<style lang="scss" scoped>
.import-dialog {
  .import-section {
    padding: 20px 0;
  }
  
  .import-options {
    margin: 20px 0;
    padding: 15px;
    background: var(--el-bg-color-page);
    border-radius: 6px;
    
    h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
    
    .el-checkbox {
      display: block;
      margin: 8px 0;
    }
  }
  
  .preview-section {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: var(--el-text-color-primary);
    }
    
    .preview-info {
      margin: 10px 0 0 0;
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }
}

.dialog-footer {
  text-align: right;
}
</style> 