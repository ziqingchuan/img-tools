<template>
  <div class="image-converter">
    <Row :gutter="24">
      <Col :span="24">
        <Card title="上传图片" style="margin-bottom: 24px;">
          <Upload.Dragger
            v-model:fileList="fileList"
            :before-upload="beforeUpload"
            :show-upload-list="false"
            accept="image/*"
            @drop="handleDrop"
          >
            <p class="ant-upload-drag-icon">
              <SwapOutlined style="font-size: 48px; color: #1890ff;" />
            </p>
            <p class="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p class="ant-upload-hint">支持 JPG、PNG、WebP、BMP 等格式转换</p>
          </Upload.Dragger>
          
          <div v-if="file" style="margin-top: 16px;">
            <Descriptions :column="2" bordered size="small">
              <Descriptions.Item label="文件名">{{ file.name }}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{{ formatFileSize(file.size) }}</Descriptions.Item>
              <Descriptions.Item label="当前格式">
                <Tag color="blue">{{ originalFormat }}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="最后修改">{{ new Date(file.lastModified).toLocaleString() }}</Descriptions.Item>
            </Descriptions>
          </div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="24" v-if="file">
      <Col :span="8">
        <Card title="转换设置">
          <Form layout="vertical">
            <Form.Item label="目标格式">
              <Select v-model:value="targetFormat" size="large">
                <Select.Option value="jpeg">
                  <Space>
                    <FileOutlined />
                    JPEG
                  </Space>
                </Select.Option>
                <Select.Option value="png">
                  <Space>
                    <FileOutlined />
                    PNG
                  </Space>
                </Select.Option>
                <Select.Option value="webp">
                  <Space>
                    <FileOutlined />
                    WebP
                  </Space>
                </Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="输出质量" v-if="targetFormat === 'jpeg' || targetFormat === 'webp'">
              <Slider 
                v-model:value="quality" 
                :min="0.1" 
                :max="1" 
                :step="0.1"
                :tooltip-formatter="(value) => `${Math.round(value * 100)}%`"
              />
              <div style="text-align: center; margin-top: 8px;">
                <Tag color="green">{{ Math.round(quality * 100) }}%</Tag>
              </div>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                block 
                :loading="isProcessing"
                @click="convert"
                :disabled="!file || targetFormat === originalFormat.toLowerCase()"
              >
                <SwapOutlined />
                {{ isProcessing ? '转换中...' : '开始转换' }}
              </Button>
              <div v-if="targetFormat === originalFormat.toLowerCase()" style="margin-top: 8px;">
                <Text type="warning">
                  <ExclamationCircleOutlined />
                  目标格式与原格式相同
                </Text>
              </div>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      
      <Col :span="16">
        <Card title="预览对比" v-if="originalImageUrl">
          <Row :gutter="16">
            <Col :span="12">
              <div class="preview-container">
                <div class="preview-header">
                  <Text strong>原始图片</Text>
                  <Tag color="blue">{{ originalFormat }}</Tag>
                </div>
                <div class="preview-image-wrapper">
                  <Image :src="originalImageUrl" :preview="true" />
                </div>
                <div style="margin-top: 8px; text-align: center;">
                  <Text type="secondary">{{ formatFileSize(file.size) }}</Text>
                </div>
              </div>
            </Col>
            <Col :span="12" v-if="result">
              <div class="preview-container">
                <div class="preview-header">
                  <Text strong>转换后</Text>
                  <Tag color="green">{{ convertedFormat.toUpperCase() }}</Tag>
                </div>
                <div class="preview-image-wrapper">
                  <Image :src="resultImageUrl" :preview="true" />
                </div>
                <div style="margin-top: 8px; text-align: center;">
                  <Text type="secondary">{{ formatFileSize(result.size) }}</Text>
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row v-if="result" style="margin-top: 24px;">
      <Col :span="24">
        <Card title="下载结果">
          <Space>
            <Button type="primary" @click="downloadResult" size="large">
              <DownloadOutlined />
              下载转换后的图片
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
  Select, 
  Tag, 
  Image, 
  Typography, 
  Descriptions,
  Space,
  message
} from 'ant-design-vue'
import {
  SwapOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FileOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import convertImage from '../utils/convertImage'

const { Text } = Typography

const fileList = ref([])
const file = ref<File | null>(null)
const originalImageUrl = ref('')
const result = ref<Blob | null>(null)
const resultImageUrl = ref('')
const isProcessing = ref(false)
const targetFormat = ref<'jpeg' | 'png' | 'webp'>('jpeg')
const convertedFormat = ref('')
const quality = ref(0.8)

const originalFormat = computed(() => {
  if (!file.value) return ''
  return file.value.type.split('/')[1]?.toUpperCase() || ''
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
  return false
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
    resultImageUrl.value = URL.createObjectURL(convertedBlob)
    
    message.success(`转换完成！格式已从 ${originalFormat.value} 转换为 ${targetFormat.value.toUpperCase()}`)
  } catch (error) {
    console.error('转换失败:', error)
    message.error('转换失败，请重试')
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
</style>