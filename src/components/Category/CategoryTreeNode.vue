<template>
  <div class="tree-node" :style="{ paddingLeft: `${level * 20}px` }">
    <div 
      class="node-content"
      :class="{ 
        'active': selectedId === category.id,
        'disabled': !category.isActive,
        'dragging': isDragging
      }"
      :draggable="draggable"
      @click="handleSelect"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @dragover="handleDragOver"
      @drop="handleDrop"
    >
      <!-- 展开/收起按钮 -->
      <div class="node-expand" @click.stop="handleToggleExpand">
        <el-icon v-if="hasChildren" class="expand-icon" :class="{ 'expanded': isExpanded }">
          <ArrowRight />
        </el-icon>
        <span v-else class="expand-placeholder"></span>
      </div>
      
      <!-- 分类图标 -->
      <div v-if="showIcon && !collapsed" class="node-icon">
        <el-icon v-if="category.icon" :style="{ color: category.color }">
          <component :is="category.icon" />
        </el-icon>
        <el-icon v-else class="default-icon">
          <Folder />
        </el-icon>
      </div>
      
      <!-- 分类信息 -->
      <div class="node-info" v-show="!collapsed">
        <span class="node-label">{{ category.name }}</span>
        <span v-if="showCount && navigationCount > 0" class="node-count">{{ navigationCount }}</span>
      </div>
      
      <!-- 操作按钮 -->
      <div v-if="showActions && !collapsed" class="node-actions" @click.stop>
        <el-dropdown @command="handleCommand" trigger="click">
          <el-button type="text" :icon="MoreFilled" size="small" class="action-btn" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="add-child" :icon="Plus">添加子分类</el-dropdown-item>
              <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
              <el-dropdown-item command="delete" :icon="Delete" divided>删除</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <!-- 收缩状态的提示 -->
      <el-tooltip v-if="collapsed" :content="category.name" placement="right">
        <div class="collapsed-indicator"></div>
      </el-tooltip>
    </div>
    
    <!-- 子分类 -->
    <div v-if="hasChildren && isExpanded" class="node-children">
      <CategoryTreeNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :selected-id="selectedId"
        :expanded-ids="expandedIds"
        :collapsed="collapsed"
        :show-count="showCount"
        :show-icon="showIcon"
        :show-actions="showActions"
        :draggable="draggable"
        :level="level + 1"
        @select="$emit('select', $event)"
        @expand="$emit('expand', $event)"
        @collapse="$emit('collapse', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @add-child="$emit('add-child', $event)"
        @drag-start="$emit('drag-start', $event)"
        @drag-end="$emit('drag-end', $event)"
        @drop="$emit('drop', $event)"
      />
    </div>
    
    <!-- 拖拽指示器 -->
    <div v-if="showDropIndicator" class="drop-indicator" :class="dropPosition"></div>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Folder, MoreFilled, Plus, Edit, Delete } from '@element-plus/icons-vue'
import type { Category } from '@/types/category'

interface Props {
  category: Category
  selectedId?: string | null
  expandedIds: Set<string>
  collapsed?: boolean
  showCount?: boolean
  showIcon?: boolean
  showActions?: boolean
  draggable?: boolean
  level: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  collapsed: false,
  showCount: true,
  showIcon: true,
  showActions: false,
  draggable: false
})

const emit = defineEmits<{
  select: [categoryId: string]
  expand: [categoryId: string]
  collapse: [categoryId: string]
  edit: [category: Category]
  delete: [category: Category]
  'add-child': [parentCategory: Category]
  'drag-start': [category: Category]
  'drag-end': [category: Category]
  drop: [dragCategory: Category, dropCategory: Category, position: 'before' | 'after' | 'inner']
}>()

// 响应式数据
const isDragging = ref(false)
const showDropIndicator = ref(false)
const dropPosition = ref<'before' | 'after' | 'inner'>('before')

// 计算属性
const hasChildren = computed(() => {
  return props.category.children && props.category.children.length > 0
})

const isExpanded = computed(() => {
  return props.expandedIds.has(props.category.id)
})

const navigationCount = computed(() => {
  // TODO: 从导航store获取该分类下的导航数量
  return 0
})

// 方法
const handleSelect = () => {
  if (props.category.isActive) {
    emit('select', props.category.id)
  }
}

const handleToggleExpand = () => {
  if (!hasChildren.value) return
  
  if (isExpanded.value) {
    emit('collapse', props.category.id)
  } else {
    emit('expand', props.category.id)
  }
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'add-child':
      emit('add-child', props.category)
      break
    case 'edit':
      emit('edit', props.category)
      break
    case 'delete':
      emit('delete', props.category)
      break
  }
}

// 拖拽相关方法
const handleDragStart = (event: DragEvent) => {
  if (!props.draggable) return
  
  isDragging.value = true
  emit('drag-start', props.category)
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', props.category.id)
  }
}

const handleDragEnd = () => {
  isDragging.value = false
  showDropIndicator.value = false
  emit('drag-end', props.category)
}

const handleDragOver = (event: DragEvent) => {
  if (!props.draggable) return
  
  event.preventDefault()
  event.stopPropagation()
  
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  
  // 计算拖拽位置
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const y = event.clientY - rect.top
  const height = rect.height
  
  if (y < height * 0.25) {
    dropPosition.value = 'before'
  } else if (y > height * 0.75) {
    dropPosition.value = 'after'
  } else {
    dropPosition.value = 'inner'
  }
  
  showDropIndicator.value = true
}

const handleDrop = (event: DragEvent) => {
  if (!props.draggable) return
  
  event.preventDefault()
  event.stopPropagation()
  
  showDropIndicator.value = false
  
  const dragCategoryId = event.dataTransfer?.getData('text/plain')
  if (dragCategoryId && dragCategoryId !== props.category.id) {
    // 这里需要从外部获取拖拽的分类对象
    // 暂时使用emit传递位置信息
    emit('drop', props.category, props.category, dropPosition.value)
  }
}
</script>

<style lang="scss" scoped>
.tree-node {
  position: relative;
  user-select: none;
}

.node-content {
  display: flex;
  align-items: center;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  
  &:hover {
    background-color: var(--bg-secondary);
    
    .node-actions {
      opacity: 1;
    }
  }
  
  &.active {
    background-color: var(--primary-color-light);
    color: var(--primary-color);
    
    .node-icon {
      color: var(--primary-color);
    }
  }
  
  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      background-color: transparent;
    }
  }
  
  &.dragging {
    opacity: 0.5;
  }
}

.node-expand {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-xs);
  
  .expand-icon {
    font-size: var(--font-size-sm);
    color: var(--text-tertiary);
    transition: transform var(--transition-fast);
    
    &.expanded {
      transform: rotate(90deg);
    }
  }
  
  .expand-placeholder {
    width: 16px;
    height: 16px;
  }
}

.node-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-sm);
  
  .el-icon {
    font-size: var(--font-size-md);
  }
  
  .default-icon {
    color: var(--text-tertiary);
  }
}

.node-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.node-label {
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  @include text-ellipsis;
}

.node-count {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: var(--border-radius-sm);
  flex-shrink: 0;
}

.node-actions {
  opacity: 0;
  transition: opacity var(--transition-fast);
  
  .action-btn {
    width: 24px;
    height: 24px;
    padding: 0;
  }
}

.collapsed-indicator {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: var(--primary-color);
  border-radius: 50%;
}

.node-children {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 10px;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--border-tertiary);
  }
}

.drop-indicator {
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--primary-color);
  border-radius: 1px;
  z-index: 10;
  
  &.before {
    top: -1px;
  }
  
  &.after {
    bottom: -1px;
  }
  
  &.inner {
    top: 0;
    bottom: 0;
    height: auto;
    background: var(--primary-color-light);
    opacity: 0.3;
  }
}

// 动画效果
.node-children {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@include mobile {
  .node-content {
    padding: var(--spacing-sm);
  }
  
  .node-expand {
    width: 24px;
    height: 24px;
  }
  
  .node-icon {
    width: 24px;
    height: 24px;
  }
  
  .node-label {
    font-size: var(--font-size-md);
  }
}
</style> 