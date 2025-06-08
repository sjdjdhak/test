<template>
  <div class="empty-container" :class="[`empty-${size}`, { 'empty-centered': centered }]">
    <div class="empty-content">
      <!-- 图标区域 -->
      <div class="empty-icon">
        <slot name="icon">
          <el-icon :size="iconSize" :color="iconColor">
            <component :is="getIconComponent()" />
          </el-icon>
        </slot>
      </div>
      
      <!-- 标题 -->
      <div v-if="title || $slots.title" class="empty-title">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
      
      <!-- 描述 -->
      <div v-if="description || $slots.description" class="empty-description">
        <slot name="description">
          {{ description }}
        </slot>
      </div>
      
      <!-- 操作按钮 -->
      <div v-if="$slots.actions" class="empty-actions">
        <slot name="actions"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  Box, 
  Search, 
  FolderOpened, 
  DocumentRemove,
  Warning,
  Connection,
  Loading
} from '@element-plus/icons-vue'

interface Props {
  // 空状态类型
  type?: 'default' | 'search' | 'folder' | 'document' | 'error' | 'network' | 'loading'
  // 标题
  title?: string
  // 描述文本
  description?: string
  // 尺寸
  size?: 'small' | 'medium' | 'large'
  // 是否居中显示
  centered?: boolean
  // 自定义图标颜色
  iconColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  title: '',
  description: '',
  size: 'medium',
  centered: true,
  iconColor: '#dcdfe6'
})

// 计算属性
const iconSize = computed(() => {
  const sizes = {
    small: 48,
    medium: 64,
    large: 80
  }
  return sizes[props.size]
})

const getIconComponent = () => {
  const iconMap = {
    default: Box,
    search: Search,
    folder: FolderOpened,
    document: DocumentRemove,
    error: Warning,
    network: Connection,
    loading: Loading
  }
  return iconMap[props.type] || Box
}
</script>

<style lang="scss" scoped>
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  &.empty-centered {
    min-height: 200px;
  }
  
  &.empty-small {
    .empty-content {
      .empty-title {
        font-size: 1rem;
        margin-bottom: 0.5rem;
      }
      
      .empty-description {
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
    }
  }
  
  &.empty-medium {
    .empty-content {
      .empty-title {
        font-size: 1.25rem;
        margin-bottom: 0.75rem;
      }
      
      .empty-description {
        font-size: 1rem;
        margin-bottom: 1.5rem;
      }
    }
  }
  
  &.empty-large {
    .empty-content {
      .empty-title {
        font-size: 1.5rem;
        margin-bottom: 1rem;
      }
      
      .empty-description {
        font-size: 1.125rem;
        margin-bottom: 2rem;
      }
    }
  }
}

.empty-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem 1rem;
  
  .empty-icon {
    margin-bottom: 1rem;
    opacity: 0.6;
  }
  
  .empty-title {
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
  }
  
  .empty-description {
    color: var(--el-text-color-regular);
    line-height: 1.6;
    
    p {
      margin: 0;
    }
    
    ul {
      text-align: left;
      display: inline-block;
      margin: 0.5rem 0;
      padding-left: 1.5rem;
      
      li {
        margin-bottom: 0.25rem;
      }
    }
  }
  
  .empty-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    
    .el-button + .el-button {
      margin-left: 0;
    }
    
    // 水平排列按钮
    &.actions-horizontal {
      flex-direction: row;
      justify-content: center;
      
      .el-button + .el-button {
        margin-left: 0.75rem;
      }
    }
  }
}

// 特定类型的样式
.empty-container {
  &[data-type="search"] {
    .empty-icon {
      color: var(--el-color-info);
    }
  }
  
  &[data-type="error"] {
    .empty-icon {
      color: var(--el-color-danger);
    }
  }
  
  &[data-type="network"] {
    .empty-icon {
      color: var(--el-color-warning);
    }
  }
  
  &[data-type="loading"] {
    .empty-icon {
      color: var(--el-color-primary);
      
      .el-icon {
        animation: rotate 2s linear infinite;
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .empty-content {
    padding: 1.5rem 0.75rem;
    max-width: 300px;
  }
  
  .empty-actions {
    &.actions-horizontal {
      flex-direction: column;
      
      .el-button + .el-button {
        margin-left: 0;
      }
    }
  }
}
</style> 