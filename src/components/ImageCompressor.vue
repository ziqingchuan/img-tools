<template>
  <div class="image-compressor">
    <h2>图片压缩</h2>
    <p>上传图片进行压缩，优化加载速度</p>

    <div
        class="upload-area"
        @dragover.prevent="dragOver = true"
        @dragleave="dragOver = false"
        @drop.prevent="handleDrop"
        @click="openFileDialog()"
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
        <p>大小: {{ (file.size / 1024).toFixed(2) }} KB</p>
      </div>
    </div>

    <div class="controls" v-if="file">

      <button @click="compress" :disabled="isProcessing" class="action-button">
        {{ isProcessing ? '处理中...' : '开始压缩' }}
      </button>
    </div>

    <div class="result" v-if="result">
      <h3>压缩结果</h3>
      <div class="comparison">
        <div class="comparison-item">
          <h4>原始图片</h4>
          <img :src="originalImageUrl" class="preview-image"  alt="原始图片"/>
          <p v-if="file">{{ (file.size / 1024).toFixed(2) }} KB</p>
        </div>
        <div class="comparison-item">
          <h4>压缩后</h4>
          <img :src="resultImageUrl" class="preview-image"  alt="压缩后图片"/>
          <p>{{ (result.size / 1024).toFixed(2) }} KB</p>
          <p v-if="file">压缩率: {{ ((1 - result.size / file.size) * 100).toFixed(2) }}%</p>
        </div>
      </div>
      <button @click="downloadResult" class="action-button">下载压缩图片</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import compressImage from '../utils/compressImage'
const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>()
const originalImageUrl = ref('')
const result = ref<File | null>()
const resultImageUrl = ref('')
const isProcessing = ref(false)
const dragOver = ref(false)

// 压缩参数
const quality = ref(0.7)
const maxWidth = ref(1920)

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

// 添加打开文件对话框的方法
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

const compress = async () => {
  if (!file.value) return

  isProcessing.value = true
  try {
    const compressedFile = await compressImage(
        file.value,
        quality.value,
        maxWidth.value
    )

    result.value = compressedFile

    // 生成结果预览URL
    const reader = new FileReader()
    reader.onload = (e) => {
      resultImageUrl.value = e.target?.result as string
    }
    reader.readAsDataURL(compressedFile)
  } catch (error) {
    console.error('压缩失败:', error)
    alert('压缩失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return

  const url = URL.createObjectURL(result.value)
  const a = document.createElement('a')
  a.href = url
  a.download = `compressed_${file.value?.name || 'image'}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.image-compressor {
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

.control-group label {
  display: inline-block;
  width: 150px;
  margin-right: 1rem;
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