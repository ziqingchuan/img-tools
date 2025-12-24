<template>
  <div class="image-compressor">
    <Row :gutter="[16, 16]">
      <Col :xs="24" :sm="24" :md="24" :lg="24">
        <Card title="上传图片" style="margin-bottom: 24px;">
          <Upload.Dragger
            v-model:fileList="fileList"
            :before-upload="beforeUpload"
            :show-upload-list="false"
            accept="image/*"
            @drop="handleDrop"
          >
            <p class="ant-upload-drag-icon">
              <InboxOutlined style="font-size: 48px; color: #1890ff;" />
            </p>
            <p class="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p class="ant-upload-hint">支持 JPG、PNG、WebP 等格式</p>
          </Upload.Dragger>
          
          <div v-if="file" style="margin-top: 16px;">
            <Descriptions :column="2" bordered size="small">
              <Descriptions.Item label="文件名">{{ file.name }}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{{ formatFileSize(file.size) }}</Descriptions.Item>
              <Descriptions.Item label="图片格式">{{ file.type.split('/')[1]?.toUpperCase() }}</Descriptions.Item>
              <Descriptions.Item label="最后修改">{{ new Date(file.lastModified).toLocaleString() }}</Descriptions.Item>
            </Descriptions>
          </div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]" v-if="file">
      <Col :xs="24" :sm="24" :md="8" :lg="8">
        <Card title="压缩设置">
          <Form layout="vertical">
            <Form.Item label="压缩质量">
              <Slider 
                v-model:value="quality" 
                :min="0.1" 
                :max="1" 
                :step="0.1"
                :tooltip-formatter="(value) => `${Math.round(value * 100)}%`"
              />
              <div style="text-align: center; margin-top: 8px;">
                <Tag color="blue">{{ Math.round(quality * 100) }}%</Tag>
              </div>
            </Form.Item>
            
            <Form.Item label="最大宽度 (像素)">
              <InputNumber 
                v-model:value="maxWidth" 
                :min="100" 
                :max="4000" 
                :step="100"
                style="width: 100%;"
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                block 
                :loading="isProcessing"
                @click="compress"
                :disabled="!file"
              >
                <CompressOutlined />
                {{ isProcessing ? '压缩中...' : '开始压缩' }}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      
      <Col :xs="24" :sm="24" :md="16" :lg="16">
        <Card title="预览对比" v-if="originalImageUrl">
          <Row :gutter="[16, 16]">
            <Col :xs="24" :sm="12" :md="12" :lg="12">
              <div class="preview-container">
                <div class="preview-header">
                  <Text strong>原始图片</Text>
                  <Tag v-if="file">{{ formatFileSize(file.size) }}</Tag>
                </div>
                <div class="preview-image-wrapper">
                  <Image :src="originalImageUrl" :preview="true" />
                </div>
              </div>
            </Col>
            <Col :xs="24" :sm="12" :md="12" :lg="12" v-if="result">
              <div class="preview-container">
                <div class="preview-header">
                  <Text strong>压缩后</Text>
                  <Tag color="green">{{ formatFileSize(result.size) }}</Tag>
                </div>
                <div class="preview-image-wrapper">
                  <Image :src="resultImageUrl" :preview="true" />
                </div>
                <div style="margin-top: 12px; text-align: center;">
                  <Statistic 
                    title="压缩率" 
                    :value="compressionRatio" 
                    suffix="%" 
                    :value-style="{ color: '#3f8600' }"
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row v-if="result" :gutter="[16, 16]">
      <Col :xs="24" :sm="24" :md="24" :lg="24">
        <Card title="下载结果">
          <Space>
            <Button type="primary" @click="downloadResult">
              <DownloadOutlined />
              下载压缩图片
            </Button>
            <Button @click="reset">
              <ReloadOutlined />
              重新选择
            </Button>
          </Space>
        </Card>
      </Col>
    </Row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  Row, 
  Col, 
  Card, 
  Upload, 
  Button, 
  Form, 
  Slider, 
  InputNumber, 
  Tag, 
  Image, 
  Typography, 
  Descriptions,
  Statistic,
  Space,
  message
} from 'ant-design-vue'
import {
  InboxOutlined,
  CompressOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'
import compressImage from '../utils/compressImage'

const { Text } = Typography

const fileList = ref([])
const file = ref<File | null>(null)
const originalImageUrl = ref('')
const result = ref<File | null>(null)
const resultImageUrl = ref('')
const isProcessing = ref(false)

// 压缩参数
const quality = ref(0.7)
const maxWidth = ref(1920)

const compressionRatio = computed(() => {
  if (!file.value || !result.value) return 0
  return Math.round((1 - result.value.size / file.value.size) * 100)
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件!')
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('图片大小不能超过 10MB!')
    return false
  }
  
  processFile(file)
  return false // 阻止自动上传
}

const handleDrop = (e: DragEvent) => {
  if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile.type.startsWith('image/')) {
      processFile(droppedFile)
    } else {
      message.error('只能上传图片文件!')
    }
  }
}

const processFile = (selectedFile: File) => {
  file.value = selectedFile
  result.value = null
  resultImageUrl.value = ''

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
    
    message.success(`压缩完成！文件大小减少了 ${compressionRatio.value}%`)
  } catch (error) {
    console.error('压缩失败:', error)
    message.error('压缩失败，请重试')
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
  message.success('下载开始')
}

const reset = () => {
  file.value = null
  result.value = null
  originalImageUrl.value = ''
  resultImageUrl.value = ''
  fileList.value = []
}
</script>

<style scoped>
.image-compressor {
  width: 100%;
}

.preview-container {
  text-align: center;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  gap: 8px;
}

.preview-image-wrapper {
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;
}

.preview-image-wrapper :deep(.ant-image) {
  width: 100%;
  display: block;
}

.preview-image-wrapper :deep(.ant-image img) {
  width: 100%;
  height: 200px;
  object-fit: contain;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .preview-image-wrapper :deep(.ant-image img) {
    height: 180px;
  }
}

@media (max-width: 576px) {
  .preview-image-wrapper :deep(.ant-image img) {
    height: 150px;
  }
  
  .preview-header {
    font-size: 14px;
  }
}
</style>