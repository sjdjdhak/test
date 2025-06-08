<template>
  <div class="category-selector">
    <el-select
      ref="selectRef"
      v-model="selectedValue"
      :placeholder="placeholder"
      :clearable="clearable"
      :disabled="disabled"
      :multiple="multiple"
      :collapse-tags="multiple && collapseTags"
      :max-collapse-tags="maxCollapseTags"
      :filterable="filterable"
      :filter-method="handleFilter"
      :loading="loading"
      :size="size"
      @change="handleChange"
      @clear="handleClear"
      @visible-change="handleVisibleChange"
    >
      <!-- 搜索框 -->
      <template v-if="showSearch" #header>
        <div class="selector-search">
          <el-input
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            :prefix-icon="Search"
            size="small"
            clearable
            @input="handleSearch"
            @click.stop
          />
        </div>
      </template>

      <!-- 分类选项 -->
      <template v-if="!loading && filteredCategories.length > 0">
        <CategorySelectorOption
          v-for="category in filteredCategories"
          :key="category.id"
          :category="category"
          :selected-values="selectedValues"
          :multiple="multiple"
          :show-count="showCount"
          :disabled-categories="disabledCategories"
          @select="handleSelect"
        />
      </template>

      <!-- 空状态 -->
      <template v-else-if="!loading">
        <el-option disabled value="" label="">
          <div class="selector-empty">
            <el-icon><FolderOpened /></el-icon>
            <span>{{ searchQuery ? '未找到匹配的分类' : '暂无分类' }}</span>
          </div>
        </el-option>
      </template>

      <!-- 加载状态 -->
      <template v-if="loading">
        <el-option disabled value="" label="">
          <div class="selector-loading">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
        </el-option>
      </template>

      <!-- 底部操作 -->
      <template v-if="showActions" #footer>
        <div class="selector-actions">
          <el-button
            size="small"
            text
            @click="handleSelectAll"
          >
            全选
          </el-button>
          <el-button
            size="small"
            text
            @click="handleClearAll"
          >
            清空
          </el-button>
          <el-button
            v-if="allowCreate"
            size="small"
            type="primary"
            text
            @click="handleCreate"
          >
            新建分类
          </el-button>
        </div>
      </template>
    </el-select>

    <!-- 新建分类对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建分类"
      width="500px"
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="80px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入分类名称"
          />
        </el-form-item>
        
        <el-form-item label="父级分类" prop="parentId">
          <CategorySelector
            v-model="createForm.parentId"
            placeholder="选择父级分类（可选）"
            :categories="categories"
            :disabled-categories="[createForm.id]"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="分类描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <el-form-item label="分类图标" prop="icon">
          <el-input
            v-model="createForm.icon"
            placeholder="图标名称"
          />
        </el-form-item>
        
        <el-form-item label="分类颜色" prop="color">
          <el-color-picker v-model="createForm.color" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, FolderOpened, Loading } from '@element-plus/icons-vue'
import CategorySelectorOption from './CategorySelectorOption.vue'
import { useCategoryStore } from '@/stores/category'
import { textUtils } from '@/utils/helpers'
import type { Category } from '@/types/category'

// Props
interface Props {
  modelValue?: string | string[]
  categories?: Category[]
  placeholder?: string
  clearable?: boolean
  disabled?: boolean
  multiple?: boolean
  collapseTags?: boolean
  maxCollapseTags?: number
  filterable?: boolean
  loading?: boolean
  size?: 'large' | 'default' | 'small'
  showSearch?: boolean
  showCount?: boolean
  showActions?: boolean
  allowCreate?: boolean
  disabledCategories?: string[]
  searchPlaceholder?: string
  checkStrictly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  categories: () => [],
  placeholder: '请选择分类',
  clearable: true,
  disabled: false,
  multiple: false,
  collapseTags: true,
  maxCollapseTags: 3,
  filterable: true,
  loading: false,
  size: 'default',
  showSearch: true,
  showCount: false,
  showActions: false,
  allowCreate: false,
  disabledCategories: () => [],
  searchPlaceholder: '搜索分类...',
  checkStrictly: false
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string | string[]]
  'change': [value: string | string[]]
  'create': [category: Partial<Category>]
}>()

const categoryStore = useCategoryStore()
const selectRef = ref()
const createFormRef = ref()

// 响应式数据
const searchQuery = ref('')
const showCreateDialog = ref(false)

const createForm = ref({
  id: '',
  name: '',
  parentId: '',
  description: '',
  icon: 'Folder',
  color: '#1890ff'
})

const createRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 20, message: '长度在 1 到 20 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const allCategories = computed(() => {
  return props.categories.length > 0 ? props.categories : categoryStore.categories
})

const selectedValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedValues = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }
  return props.modelValue ? [props.modelValue as string] : []
})

const filteredCategories = computed(() => {
  if (!searchQuery.value) {
    return allCategories.value
  }
  
  return filterCategoriesBySearch(allCategories.value, searchQuery.value)
})

// 方法
const filterCategoriesBySearch = (categories: Category[], query: string): Category[] => {
  const result: Category[] = []
  
  const searchInCategory = (category: Category): boolean => {
    const matchSelf = category.name.toLowerCase().includes(query.toLowerCase()) ||
                     (category.description && category.description.toLowerCase().includes(query.toLowerCase()))
    
    let matchChildren = false
    const filteredChildren: Category[] = []
    
    if (category.children) {
      category.children.forEach(child => {
        if (searchInCategory(child)) {
          filteredChildren.push(child)
          matchChildren = true
        }
      })
    }
    
    if (matchSelf || matchChildren) {
      result.push({
        ...category,
        children: filteredChildren.length > 0 ? filteredChildren : category.children
      })
      return true
    }
    
    return false
  }
  
  categories.forEach(category => {
    searchInCategory(category)
  })
  
  return result
}

const handleFilter = (query: string) => {
  searchQuery.value = query
}

const handleSearch = (query: string) => {
  searchQuery.value = query
}

const handleSelect = (categoryId: string) => {
  if (props.multiple) {
    const values = [...selectedValues.value]
    const index = values.indexOf(categoryId)
    
    if (index > -1) {
      values.splice(index, 1)
    } else {
      values.push(categoryId)
    }
    
    emit('update:modelValue', values)
    emit('change', values)
  } else {
    emit('update:modelValue', categoryId)
    emit('change', categoryId)
    selectRef.value?.blur()
  }
}

const handleChange = (value: string | string[]) => {
  emit('change', value)
}

const handleClear = () => {
  const value = props.multiple ? [] : ''
  emit('update:modelValue', value)
  emit('change', value)
}

const handleVisibleChange = (visible: boolean) => {
  if (!visible) {
    searchQuery.value = ''
  }
}

const handleSelectAll = () => {
  if (!props.multiple) return
  
  const allIds = getAllCategoryIds(allCategories.value)
  const enabledIds = allIds.filter(id => !props.disabledCategories.includes(id))
  
  emit('update:modelValue', enabledIds)
  emit('change', enabledIds)
}

const handleClearAll = () => {
  const value = props.multiple ? [] : ''
  emit('update:modelValue', value)
  emit('change', value)
}

const getAllCategoryIds = (categories: Category[]): string[] => {
  const ids: string[] = []
  
  const collectIds = (cats: Category[]) => {
    cats.forEach(cat => {
      ids.push(cat.id)
      if (cat.children) {
        collectIds(cat.children)
      }
    })
  }
  
  collectIds(categories)
  return ids
}

const handleCreate = () => {
  showCreateDialog.value = true
}

const resetCreateForm = () => {
  createForm.value = {
    id: '',
    name: '',
    parentId: '',
    description: '',
    icon: 'Folder',
    color: '#1890ff'
  }
  createFormRef.value?.resetFields()
}

const handleCreateSubmit = async () => {
  try {
    await createFormRef.value.validate()
    
    const newCategory = {
      ...createForm.value,
      id: textUtils.generateId('cat_')
    }
    
    emit('create', newCategory)
    showCreateDialog.value = false
    resetCreateForm()
    
    ElMessage.success('分类创建成功')
  } catch (error) {
    console.error('Create category error:', error)
  }
}

// 组件方法暴露
defineExpose({
  focus: () => selectRef.value?.focus(),
  blur: () => selectRef.value?.blur()
})
</script>

<script setup lang="ts">
// CategorySelectorOption 子组件
import { defineComponent, computed } from 'vue'

const CategorySelectorOption = defineComponent({
  name: 'CategorySelectorOption',
  props: {
    category: {
      type: Object as PropType<Category>,
      required: true
    },
    selectedValues: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    multiple: {
      type: Boolean,
      default: false
    },
    showCount: {
      type: Boolean,
      default: false
    },
    disabledCategories: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    level: {
      type: Number,
      default: 0
    }
  },
  emits: ['select'],
  setup(props, { emit }) {
    const isSelected = computed(() => {
      return props.selectedValues.includes(props.category.id)
    })
    
    const isDisabled = computed(() => {
      return props.disabledCategories.includes(props.category.id)
    })
    
    const handleClick = () => {
      if (!isDisabled.value) {
        emit('select', props.category.id)
      }
    }
    
    return {
      isSelected,
      isDisabled,
      handleClick
    }
  },
  template: `
    <div>
      <el-option
        :value="category.id"
        :label="category.name"
        :disabled="isDisabled"
        @click="handleClick"
      >
        <div class="category-option" :style="{ paddingLeft: \`\${level * 20}px\` }">
          <div class="option-content">
            <el-icon :color="category.color" size="16">
              <component :is="category.icon" />
            </el-icon>
            <span class="option-name">{{ category.name }}</span>
            <span v-if="showCount" class="option-count">({{ category.children?.length || 0 }})</span>
          </div>
          <el-icon v-if="multiple && isSelected" class="option-check" color="var(--el-color-primary)">
            <Check />
          </el-icon>
        </div>
      </el-option>
      
      <CategorySelectorOption
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :selected-values="selectedValues"
        :multiple="multiple"
        :show-count="showCount"
        :disabled-categories="disabledCategories"
        :level="level + 1"
        @select="$emit('select', $event)"
      />
    </div>
  `
})
</script>

<style lang="scss" scoped>
.category-selector {
  .selector-search {
    padding: 8px 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  
  .selector-empty,
  .selector-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    color: var(--el-text-color-placeholder);
  }
  
  .selector-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

:deep(.el-select-dropdown__item) {
  padding: 0;
  
  .category-option {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    width: 100%;
    
    .option-content {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      
      .option-name {
        flex: 1;
      }
      
      .option-count {
        font-size: 0.875rem;
        color: var(--el-text-color-placeholder);
      }
    }
    
    .option-check {
      flex-shrink: 0;
    }
  }
}
</style> 