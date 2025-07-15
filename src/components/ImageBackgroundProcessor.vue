<template>
  <div class="image-background-processor">
    <h2>图片背景处理</h2>
    <p>替换或移除图片背景色</p>

    <div
        class="upload-area"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="handleDrop"
        @click="openFileDialog"
        :class="{ 'drag-over': dragOver }"
    >
      <input
          type="file"
          accept="image/*"
          @change="handleFileChange"
          ref="fileInput"
          class="file-input"
      />
      <p v-if="!file">拖放图片到此处或点击选择文件</p>
      <div v-else class="file-info">
        <p>已选择: {{ file.name }}</p>
      </div>
    </div>

    <div class="controls" v-if="file">
      <div class="control-group">
        <label>替换后的颜色:</label>
        <input type="color" v-model="targetColor" />
        <input type="text" v-model="targetColor" class="color-text" />
      </div>

      <div class="control-group">
        <label>替换颜色透明度:</label>
        <input type="range" min="0" max="255" v-model.number="alpha" />
        <span>{{ alpha }}</span>
      </div>

      <div class="control-group">
        <label>颜色阈值 (0-255):</label>
        <input type="range" min="0" max="255" v-model.number="whiteMin" />
        <span>{{ whiteMin }}</span>
      </div>

      <button @click="process" :disabled="isProcessing" class="action-button">
        {{ isProcessing ? '处理中...' : '处理背景' }}
      </button>
    </div>

    <div class="result" v-if="result">
      <h3>处理结果</h3>
      <div class="comparison">
        <div class="comparison-item">
          <h4>原始图片</h4>
          <img :src="originalImageUrl" class="preview-image" />
        </div>
        <div class="comparison-item">
          <h4>处理后</h4>
          <img :src="resultImageUrl" class="preview-image" />
        </div>
      </div>
      <button @click="downloadResult" class="action-button">下载处理后的图片</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import processBackground from '../utils/processBackground'

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>()
const originalImageUrl = ref('')
const result = ref<Blob | null>(null)
const resultImageUrl = ref('')
const isProcessing = ref(false)
const dragOver = ref(false)
const targetColor = ref('#000000')
const alpha = ref(0)
const whiteMin = ref(220)

const rgbaColor = computed(() => {
  // 将十六进制颜色转换为RGB
  const hex = targetColor.value.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return [r, g, b, alpha.value]
})

const handleFileChange = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleDrop = (e: DragEvent) => {
  dragOver.value = false
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    processFile(e.dataTransfer.files[0])
  }
}

const openFileDialog = () => {
  fileInput.value?.click()
}

const processFile = (selectedFile: File) => {
  file.value = selectedFile
  result.value = null

  // 生成预览URL
  const reader = new FileReader()
  reader.onload = (e) => {
    originalImageUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(selectedFile)
}

const process = async () => {
  if (!file.value) return

  isProcessing.value = true
  try {
    const processedBlob = await processBackground(
        file.value,
        rgbaColor.value as [number, number, number, number],
        whiteMin.value
    )

    result.value = processedBlob

    // 生成结果预览URL
    resultImageUrl.value = URL.createObjectURL(processedBlob)
  } catch (error) {
    console.error('处理失败:', error)
    alert('背景处理失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return

  const a = document.createElement('a')
  a.href = resultImageUrl.value
  a.download = `processed_${file.value?.name || 'image'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
.image-background-processor {
  text-align: center;
}

h2 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.upload-area {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  margin: 1rem auto;
  max-width: 500px;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area.drag-over {
  border-color: #0077ff;
  background-color: #f0f7ff;
}

.file-input {
  display: none;
}

.file-info {
  margin-top: 1rem;
}

.controls {
  margin: 2rem auto;
  max-width: 500px;
  text-align: center;
}

.control-group {
  margin-bottom: 1rem;
}

.control-group label {
  display: inline-block;
  width: 150px;
  margin-right: 1rem;
}

.color-text {
  width: 80px;
  margin-left: 0.5rem;
}

.action-button {
  background-color: #0077ff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
  margin-top: 1rem;
}

.action-button:hover {
  background-color: #0055cc;
}

.action-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.result {
  margin-top: 2rem;
}

.comparison {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  flex-wrap: wrap;
}

.comparison-item {
  flex: 1;
  min-width: 250px;
}

.preview-image {
  max-width: 100%;
  max-height: 300px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin: 1rem 0;
}
</style>