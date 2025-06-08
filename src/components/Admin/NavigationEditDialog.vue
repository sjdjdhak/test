<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑导航' : '添加导航'"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="标题" prop="title">
        <el-input v-model="form.title" placeholder="请输入导航标题" />
      </el-form-item>

      <el-form-item label="网址" prop="url">
        <el-input v-model="form.url" placeholder="请输入网址" />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </el-form-item>

      <el-form-item label="分类" prop="categoryId">
        <el-select v-model="form.categoryId" placeholder="请选择分类" style="width: 100%">
          <el-option
            v-for="category in categories"
            :key="category.id"
            :label="category.name"
            :value="category.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="图标">
        <el-input v-model="form.icon" placeholder="图标URL或类名">
          <template #append>
            <el-button @click="showIconPicker = true">选择</el-button>
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="标签">
        <el-select
          v-model="form.tags"
          multiple
          filterable
          allow-create
          placeholder="请选择或输入标签"
          style="width: 100%"
        >
          <el-option
            v-for="tag in availableTags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="评分">
            <el-rate v-model="form.rating" allow-half />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="排序">
            <el-input-number v-model="form.sort" :min="0" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="推荐">
            <el-switch v-model="form.featured" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch
              v-model="form.status"
              active-text="启用"
              inactive-text="禁用"
              :active-value="1"
              :inactive-value="0"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存
        </el-button>
      </div>
    </template>

    <!-- 图标选择器 -->
    <el-dialog
      v-model="showIconPicker"
      title="选择图标"
      width="400px"
      append-to-body
    >
      <div class="icon-picker">
        <div class="icon-grid">
          <div
            v-for="icon in iconList"
            :key="icon"
            class="icon-item"
            :class="{ active: form.icon === icon }"
            @click="selectIcon(icon)"
          >
            <i :class="icon" />
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showIconPicker = false">取消</el-button>
        <el-button type="primary" @click="showIconPicker = false">确定</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useCategoryStore } from '@/stores/category'
import type { Navigation } from '@/types/navigation'

interface Props {
  modelValue: boolean
  navigation?: Navigation | null
}

const props = withDefaults(defineProps<Props>(), {
  navigation: null
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [navigation: Navigation]
}>()

const categoryStore = useCategoryStore()
const formRef = ref<FormInstance>()
const saving = ref(false)
const showIconPicker = ref(false)

// 表单数据
const form = ref<Partial<Navigation>>({
  title: '',
  url: '',
  description: '',
  categoryId: '',
  icon: '',
  tags: [],
  rating: 0,
  sort: 0,
  featured: false,
  status: 1
})

// 计算属性
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.navigation)

const categories = computed(() => categoryStore.flatCategories)

const availableTags = ref([
  'AI工具', '设计', '开发', '效率', '学习', '娱乐', '社交', '购物', '新闻', '音乐'
])

const iconList = ref([
  'el-icon-star-on', 'el-icon-star-off', 'el-icon-s-goods', 'el-icon-goods',
  'el-icon-warning', 'el-icon-question', 'el-icon-info', 'el-icon-remove',
  'el-icon-circle-plus', 'el-icon-success', 'el-icon-error', 'el-icon-zoom-in',
  'el-icon-zoom-out', 'el-icon-remove-outline', 'el-icon-circle-plus-outline',
  'el-icon-circle-check', 'el-icon-circle-close', 'el-icon-s-help',
  'el-icon-help', 'el-icon-minus', 'el-icon-plus', 'el-icon-check',
  'el-icon-close', 'el-icon-picture', 'el-icon-picture-outline',
  'el-icon-picture-outline-round', 'el-icon-upload', 'el-icon-upload2',
  'el-icon-download'
])

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度在 1 到 50 个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入网址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的网址格式', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

// 方法
const handleClose = () => {
  visible.value = false
  resetForm()
}

const resetForm = () => {
  form.value = {
    title: '',
    url: '',
    description: '',
    categoryId: '',
    icon: '',
    tags: [],
    rating: 0,
    sort: 0,
    featured: false,
    status: 1
  }
  nextTick(() => {
    formRef.value?.clearValidate()
  })
}

const loadFormData = () => {
  if (props.navigation) {
    form.value = { ...props.navigation }
  } else {
    resetForm()
  }
}

const selectIcon = (icon: string) => {
  form.value.icon = icon
}

const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    saving.value = true

    const navigationData: Navigation = {
      id: props.navigation?.id || Date.now().toString(),
      title: form.value.title!,
      url: form.value.url!,
      description: form.value.description || '',
      categoryId: form.value.categoryId!,
      icon: form.value.icon || '',
      tags: form.value.tags || [],
      rating: form.value.rating || 0,
      sort: form.value.sort || 0,
      featured: form.value.featured || false,
      status: form.value.status || 1,
      createdAt: props.navigation?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      clickCount: props.navigation?.clickCount || 0
    }

    emit('save', navigationData)
    ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
    handleClose()

  } catch (error) {
    console.error('Save error:', error)
  } finally {
    saving.value = false
  }
}

// 监听器
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    loadFormData()
  }
})

watch(() => props.navigation, () => {
  if (visible.value) {
    loadFormData()
  }
})
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

.icon-picker {
  .icon-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .icon-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }

    &.active {
      border-color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-8);
    }

    i {
      font-size: 18px;
    }
  }
}
</style> 