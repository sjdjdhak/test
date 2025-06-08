<template>
  <div class="loading-container" :class="containerClass">
    <!-- 全屏加载 -->
    <div v-if="fullscreen" class="loading-fullscreen">
      <div class="loading-content">
        <div class="loading-spinner">
          <el-icon class="is-loading">
            <Loading />
          </el-icon>
        </div>
        <div v-if="text" class="loading-text">{{ text }}</div>
      </div>
    </div>
    
    <!-- 内联加载 -->
    <div v-else class="loading-inline" :style="{ minHeight: `${minHeight}px` }">
      <div class="loading-content">
        <!-- 自定义加载动画 -->
        <div v-if="type === 'spinner'" class="loading-spinner">
          <el-icon class="is-loading" :size="size">
            <Loading />
          </el-icon>
        </div>
        
        <!-- 点状加载 -->
        <div v-else-if="type === 'dots'" class="loading-dots">
          <span class="dot"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
        
        <!-- 波浪加载 -->
        <div v-else-if="type === 'wave'" class="loading-wave">
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
          <div class="wave-bar"></div>
        </div>
        
        <!-- 脉冲加载 -->
        <div v-else-if="type === 'pulse'" class="loading-pulse">
          <div class="pulse-circle"></div>
        </div>
        
        <!-- 骨架屏 -->
        <div v-else-if="type === 'skeleton'" class="loading-skeleton">
          <el-skeleton :rows="skeletonRows" animated />
        </div>
        
        <!-- 默认加载 -->
        <div v-else class="loading-default">
          <el-icon class="is-loading" :size="size">
            <Loading />
          </el-icon>
        </div>
        
        <!-- 加载文本 -->
        <div v-if="text && type !== 'skeleton'" class="loading-text">{{ text }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Loading } from '@element-plus/icons-vue'

interface Props {
  type?: 'spinner' | 'dots' | 'wave' | 'pulse' | 'skeleton' | 'default'
  size?: number | string
  text?: string
  fullscreen?: boolean
  minHeight?: number
  skeletonRows?: number
  background?: string
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'spinner',
  size: 24,
  text: '',
  fullscreen: false,
  minHeight: 100,
  skeletonRows: 3,
  background: 'rgba(255, 255, 255, 0.9)',
  color: 'var(--primary-color)'
})

// 计算属性
const containerClass = computed(() => {
  return {
    'loading-fullscreen-container': props.fullscreen,
    'loading-inline-container': !props.fullscreen
  }
})
</script>

<style lang="scss" scoped>
.loading-container {
  position: relative;
}

.loading-fullscreen-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--z-loading);
}

.loading-inline-container {
  width: 100%;
}

.loading-fullscreen {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: v-bind(background);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.loading-inline {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
}

.loading-spinner {
  .el-icon {
    color: v-bind(color);
    font-size: v-bind(size + 'px');
  }
}

.loading-dots {
  display: flex;
  gap: var(--spacing-xs);
  
  .dot {
    width: 8px;
    height: 8px;
    background: v-bind(color);
    border-radius: 50%;
    animation: dotPulse 1.4s infinite ease-in-out;
    
    &:nth-child(1) {
      animation-delay: -0.32s;
    }
    
    &:nth-child(2) {
      animation-delay: -0.16s;
    }
    
    &:nth-child(3) {
      animation-delay: 0s;
    }
  }
}

.loading-wave {
  display: flex;
  gap: 4px;
  align-items: end;
  
  .wave-bar {
    width: 4px;
    height: 20px;
    background: v-bind(color);
    border-radius: 2px;
    animation: waveStretch 1.2s infinite ease-in-out;
    
    &:nth-child(1) {
      animation-delay: -1.2s;
    }
    
    &:nth-child(2) {
      animation-delay: -1.1s;
    }
    
    &:nth-child(3) {
      animation-delay: -1.0s;
    }
    
    &:nth-child(4) {
      animation-delay: -0.9s;
    }
    
    &:nth-child(5) {
      animation-delay: -0.8s;
    }
  }
}

.loading-pulse {
  .pulse-circle {
    width: 40px;
    height: 40px;
    background: v-bind(color);
    border-radius: 50%;
    animation: pulseScale 1.0s infinite ease-in-out;
  }
}

.loading-skeleton {
  width: 100%;
  max-width: 400px;
}

.loading-text {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  text-align: center;
  margin-top: var(--spacing-sm);
}

// 动画定义
@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes waveStretch {
  0%, 40%, 100% {
    transform: scaleY(0.4);
  }
  20% {
    transform: scaleY(1.0);
  }
}

@keyframes pulseScale {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}

// 响应式
@include mobile {
  .loading-content {
    gap: var(--spacing-sm);
  }
  
  .loading-text {
    font-size: var(--font-size-xs);
  }
  
  .loading-wave .wave-bar {
    width: 3px;
    height: 16px;
  }
  
  .loading-pulse .pulse-circle {
    width: 32px;
    height: 32px;
  }
}
</style> 