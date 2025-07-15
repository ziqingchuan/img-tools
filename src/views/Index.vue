<template>
  <div class="container">
    <h1>图片处理工具</h1>

    <div class="tools-grid">
      <ToolCard
          title="图片压缩"
          description="压缩图片大小，优化加载速度"
          icon="📦"
          :active="activeTool === 'compressor'"
          @click="activeTool = 'compressor'"
      />
      <ToolCard
          title="格式转换"
          description="转换图片格式，支持 JPG、PNG、WebP"
          icon="🔄"
          :active="activeTool === 'converter'"
          @click="activeTool = 'converter'"
      />
      <ToolCard
          title="背景处理"
          description="替换或移除图片背景颜色"
          icon="🎨"
          :active="activeTool === 'background'"
          @click="activeTool = 'background'"
      />
    </div>

    <div class="tool-container">
      <ImageCompressor v-if="activeTool === 'compressor'" />
      <ImageConverter v-else-if="activeTool === 'converter'" />
      <ImageBackgroundProcessor v-else-if="activeTool === 'background'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import ImageCompressor from '../components/ImageCompressor.vue'
import ImageConverter from '../components/ImageConverter.vue'
import ImageBackgroundProcessor from '../components/ImageBackgroundProcessor.vue'

type ToolName = 'compressor' | 'converter' | 'background'

const activeTool = ref<ToolName | null>('compressor')
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin: 3rem auto;
  max-width: 1000px;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.tool-container {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-top: 2rem;
}
</style>