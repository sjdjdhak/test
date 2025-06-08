<template>
  <div class="home-page">
    <div class="search-section">
      <div class="search-container">
        <h1 class="page-title">AI导航</h1>
        <p class="page-subtitle">发现最优质的AI工具和资源</p>
        <div class="search-box">
          <input 
            v-model="searchQuery"
            @keyup.enter="handleSearch"
            placeholder="搜索AI工具、分类或标签..."
            class="search-input"
          />
          <button @click="handleSearch" class="search-btn">搜索</button>
        </div>
      </div>
    </div>

    <div class="content-section">
      <div class="section-header">
        <h2>推荐导航</h2>
      </div>
      
      <div class="navigation-grid">
        <div v-for="nav in sampleNavigations" :key="nav.id" class="nav-card">
          <h3>{{ nav.title }}</h3>
          <p>{{ nav.description }}</p>
          <a :href="nav.url" target="_blank" class="nav-link">访问</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')

// 示例数据
const sampleNavigations = ref([
  {
    id: 1,
    title: 'ChatGPT',
    description: '强大的AI对话助手',
    url: 'https://chat.openai.com'
  },
  {
    id: 2,
    title: 'Midjourney',
    description: 'AI图像生成工具',
    url: 'https://midjourney.com'
  },
  {
    id: 3,
    title: 'Claude',
    description: 'Anthropic的AI助手',
    url: 'https://claude.ai'
  },
  {
    id: 4,
    title: 'Stable Diffusion',
    description: '开源AI图像生成',
    url: 'https://stability.ai'
  }
])

const handleSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({
      name: 'Search',
      query: { q: searchQuery.value }
    })
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.search-section {
  background: linear-gradient(135deg, #1890ff 0%, #40a9ff 100%);
  padding: 80px 20px;
  text-align: center;
  color: white;
}

.search-container {
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
}

.page-subtitle {
  font-size: 1.2rem;
  margin-bottom: 40px;
  opacity: 0.9;
}

.search-box {
  display: flex;
  max-width: 600px;
  margin: 0 auto;
  gap: 12px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.search-btn {
  padding: 12px 24px;
  background: #fff;
  color: #1890ff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.search-btn:hover {
  background: #f0f0f0;
}

.content-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 20px;
}

.section-header {
  margin-bottom: 40px;
}

.section-header h2 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.navigation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.nav-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.nav-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.nav-card h3 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 8px;
}

.nav-card p {
  color: #666;
  margin-bottom: 16px;
  line-height: 1.5;
}

.nav-link {
  display: inline-block;
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-size: 14px;
  transition: background 0.3s;
}

.nav-link:hover {
  background: #40a9ff;
}

@media (max-width: 767px) {
  .page-title {
    font-size: 2rem;
  }
  
  .search-box {
    flex-direction: column;
  }
  
  .navigation-grid {
    grid-template-columns: 1fr;
  }
  
  .content-section {
    padding: 40px 16px;
  }
}
</style> 