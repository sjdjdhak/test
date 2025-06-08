<template>
  <header class="app-header">
    <div class="header-left">
      <el-button 
        type="text" 
        :icon="Menu" 
        @click="toggleSidebar"
        class="sidebar-toggle"
      />
      <div class="logo">
        <img src="/logo.svg" alt="AI导航" class="logo-img" />
        <span class="logo-text">AI导航</span>
      </div>
    </div>
    
    <div class="header-center">
      <SearchBox />
    </div>
    
    <div class="header-right">
      <el-button 
        type="text" 
        :icon="isDark ? Sunny : Moon" 
        @click="toggleTheme"
        class="theme-toggle"
      />
      <el-dropdown>
        <el-button type="text" :icon="Setting" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="goToAdmin">管理后台</el-dropdown-item>
            <el-dropdown-item divided>关于我们</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Menu, Sunny, Moon, Setting } from '@element-plus/icons-vue'
import SearchBox from '@/components/Search/SearchBox.vue'

const router = useRouter()
const isDark = ref(false)

const emit = defineEmits<{
  toggleSidebar: []
}>()

const toggleSidebar = () => {
  emit('toggleSidebar')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

const goToAdmin = () => {
  router.push('/admin')
}
</script>

<style lang="scss" scoped>
.app-header {
  height: 64px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-lg);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  
  .logo-img {
    width: 32px;
    height: 32px;
  }
  
  .logo-text {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--primary-color);
  }
}

.header-center {
  flex: 1;
  max-width: 600px;
  margin: 0 var(--spacing-xl);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.sidebar-toggle,
.theme-toggle {
  width: 40px;
  height: 40px;
}

@include mobile {
  .header-center {
    display: none;
  }
  
  .logo-text {
    display: none;
  }
}
</style> 