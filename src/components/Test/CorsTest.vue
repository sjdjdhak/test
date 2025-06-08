<template>
  <div class="cors-test">
    <h3>CORS 测试</h3>
    <el-button @click="testLocalResource" type="primary">测试本地资源</el-button>
    <el-button @click="testProxyResource" type="success">测试代理资源</el-button>
    <div v-if="result" class="result">
      <h4>测试结果:</h4>
      <pre>{{ result }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'

const result = ref('')

const testLocalResource = async () => {
  try {
    const response = await axios.get('/test.json')
    result.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    result.value = `错误: ${error}`
  }
}

const testProxyResource = async () => {
  try {
    const response = await axios.get('/api/gitee/user', {
      headers: {
        'Authorization': 'token d8eed2a4b74a64d442d858ac30b8d494'
      }
    })
    result.value = JSON.stringify(response.data, null, 2)
  } catch (error) {
    result.value = `错误: ${error}`
  }
}
</script>

<style lang="scss" scoped>
.cors-test {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 20px;
}

.result {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 4px;
  
  pre {
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style> 