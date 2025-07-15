<template>
  <div class="image-converter">
    <h2>图片格式转换</h2>
    <p>上传图片并选择目标格式进行转换</p>

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
        <p>格式: {{ file.type.split('/')[1]?.toUpperCase() }}</p>
      </div>
    </div>

    <div class="controls" v-if="file">
      <div class="control-group">
        <label>目标格式:</label>
        <select v-model="targetFormat">
          <option value="jpeg">JPEG</option>
          <option value="png">PNG</option>
          <option value="webp">WebP</option>
        </select>
      </div>

      <div class="control-group" v-if="targetFormat === 'jpeg'">
        <label>JPEG 质量 (0-1):</label>
        <input type="range" min="0" max="1" step="0.1" v-model="quality" />
        <span>{{ quality }}</span>
      </div>

      <button @click="convert" :disabled="isProcessing" class="action-button">
        {{ isProcessing ? '转换中...' : '开始转换' }}
      </button>
    </div>

    <div class="result" v-if="result">
      <h3>转换结果</h3>
      <div class="comparison">
        <div class="comparison-item">
          <h4>原始图片 ({{ originalFormat }})</h4>
          <img :src="originalImageUrl" class="preview-image" />
        </div>
        <div class="comparison-item">
          <h4>转换后 ({{ String(convertedFormat).toUpperCase() }})</h4>
          <img :src="resultImageUrl" class="preview-image" />
        </div>
      </div>
      <button @click="downloadResult" class="action-button">下载转换后的图片</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import convertImage from '../utils/convertImage'

const fileInput = ref<HTMLInputElement | null>(null)
const file = ref<File | null>()
const originalImageUrl = ref('')
const result = ref<Blob | null>(null)
const resultImageUrl = ref('')
const isProcessing = ref(false)
const dragOver = ref(false)
const targetFormat = ref<'jpeg' | 'png' | 'webp'>('jpeg')
const convertedFormat = ref('')
const quality = ref(0.8)

const originalFormat = computed(() => {
  if (!file.value) return ''
  return file.value.type.split('/')[1]?.toUpperCase() || ''
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

const convert = async () => {
  if (!file.value) return

  isProcessing.value = true
  try {
    const convertedBlob = await convertImage(
        file.value,
        targetFormat.value,
        quality.value
    )

    result.value = convertedBlob
    convertedFormat.value = targetFormat.value
    // 生成结果预览URL
    resultImageUrl.value = URL.createObjectURL(convertedBlob)
  } catch (error) {
    console.error('转换失败:', error)
    alert('转换失败，请重试')
  } finally {
    isProcessing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return

  const extension = targetFormat.value === 'jpeg' ? 'jpg' : targetFormat.value
  const a = document.createElement('a')
  a.href = resultImageUrl.value
  a.download = `converted_${file.value?.name.replace(/\.[^/.]+$/, '')}.${extension}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
</script>

<style scoped>
.image-converter {
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

.control-group select {
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ccc;
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