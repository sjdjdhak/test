<template>
  <div class="app-layout">
    <AppHeader />
    <div class="layout-container">
      <AppSidebar v-model:collapsed="sidebarCollapsed" />
      <main class="main-content" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/Layout/Header.vue'
import AppSidebar from '@/components/Layout/Sidebar.vue'

const sidebarCollapsed = ref(false)
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.layout-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.main-content {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  transition: margin-left var(--transition-normal);
  
  &.sidebar-collapsed {
    margin-left: -200px;
    
    @include mobile {
      margin-left: 0;
    }
  }
}
</style> 