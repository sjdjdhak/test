<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <h3 v-show="!collapsed">分类导航</h3>
      <el-button 
        type="text" 
        :icon="collapsed ? ArrowRight : ArrowLeft"
        @click="toggleCollapse"
        class="collapse-btn"
      />
    </div>
    
    <div class="sidebar-content">
      <CategoryTree 
        :categories="categories"
        :collapsed="collapsed"
        @select="handleCategorySelect"
      />
    </div>
    
    <div class="sidebar-footer" v-show="!collapsed">
      <el-divider />
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">总分类</span>
          <span class="stat-value">{{ totalCategories }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总导航</span>
          <span class="stat-value">{{ totalNavigations }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import CategoryTree from '@/components/Category/CategoryTree.vue'
import { useCategoryStore } from '@/stores/category'
import { useNavigationStore } from '@/stores/navigation'

interface Props {
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false
})

const emit = defineEmits<{
  'update:collapsed': [value: boolean]
}>()

const categoryStore = useCategoryStore()
const navigationStore = useNavigationStore()

const categories = computed(() => categoryStore.categories)
const totalCategories = computed(() => categoryStore.totalCount)
const totalNavigations = computed(() => navigationStore.totalCount)

const toggleCollapse = () => {
  emit('update:collapsed', !props.collapsed)
}

const handleCategorySelect = (categoryId: string) => {
  // 处理分类选择
  console.log('Selected category:', categoryId)
}

// 初始化数据
onMounted(() => {
  categoryStore.fetchCategories()
  navigationStore.fetchNavigations()
})
</script>

<style lang="scss" scoped>
.app-sidebar {
  width: 280px;
  background: var(--bg-primary);
  border-right: 1px solid var(--border-secondary);
  display: flex;
  flex-direction: column;
  transition: width var(--transition-normal);
  
  &.collapsed {
    width: 64px;
  }
}

.sidebar-header {
  height: 64px;
  padding: 0 var(--spacing-md);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  h3 {
    margin: 0;
    font-size: var(--font-size-md);
    color: var(--text-primary);
  }
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md);
  
  @include scrollbar(6px);
}

.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--border-secondary);
}

.stats {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  .stat-label {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
  }
  
  .stat-value {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--primary-color);
  }
}

.collapse-btn {
  width: 32px;
  height: 32px;
}

@include mobile {
  .app-sidebar {
    position: fixed;
    left: 0;
    top: 64px;
    height: calc(100vh - 64px);
    z-index: var(--z-fixed);
    transform: translateX(-100%);
    
    &:not(.collapsed) {
      transform: translateX(0);
    }
  }
}
</style> 