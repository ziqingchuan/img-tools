<template>
  <div class="image-filter">
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
              <FilterOutlined style="font-size: 48px; color: #1890ff;" />
            </p>
            <p class="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p class="ant-upload-hint">为图片添加各种滤镜效果</p>
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

    <Row :gutter="24" v-if="file">
      <Col :span="8">
        <Card title="滤镜设置">
          <Form layout="vertical">
            <Form.Item label="预设滤镜">
              <Select v-model:value="selectedFilter" size="large" @change="applyPresetFilter">
                <Select.Option value="none">无滤镜</Select.Option>
                <Select.Option value="grayscale">黑白</Select.Option>
                <Select.Option value="sepia">复古</Select.Option>
                <Select.Option value="vintage">怀旧</Select.Option>
                <Select.Option value="cool">冷色调</Select.Option>
                <Select.Option value="warm">暖色调</Select.Option>
                <Select.Option value="bright">明亮</Select.Option>
                <Select.Option value="dark">暗黑</Select.Option>
              </Select>
            </Form.Item>
            
            <Divider>自定义调节</Divider>
            
            <Form.Item label="亮度">
              <Slider 
                v-model:value="brightness" 
                :min="0" 
                :max="200" 
                :step="1"
                @change="applyFilters"
                :tooltip-formatter="(value) => `${value}%`"
              />
            </Form.Item>
            
            <Form.Item label="对比度">
              <Slider 
                v-model:value="contrast" 
                :min="0" 
                :max="200" 
                :step="1"
                @change="applyFilters"
                :tooltip-formatter="(value) => `${value}%`"
              />
            </Form.Item>
            
            <Form.Item label="饱和度">
              <Slider 
                v-model:value="saturation" 
                :min="0" 
                :max="200" 
                :step="1"
                @change="applyFilters"
                :tooltip-formatter="(value) => `${value}%`"
              />
            </Form.Item>
            
            <Form.Item label="色相">
              <Slider 
                v-model:value="hue" 
                :min="0" 
                :max="360" 
                :step="1"
                @change="applyFilters"
                :tooltip-formatter="(value) => `${value}°`"
              />
            </Form.Item>
            
            <Form.Item label="模糊">
              <Slider 
                v-model:value="blur" 
                :min="0" 
                :max="10" 
                :step="0.1"
                @change="applyFilters"
                :tooltip-formatter="(value) => `${value}px`"
              />
            </Form.Item>
            
            <Form.Item>
              <Space direction="vertical" style="width: 100%;">
                <Button block @click="resetFilters">
                  <ReloadOutlined />
                  重置滤镜
                </Button>
                <Button 
                  type="primary" 
                  block 
                  :loading="isProcessing"
                  @click="exportImage"
                  :disabled="!hasFilters"
                >
                  <DownloadOutlined />
                  {{ isProcessing ? '处理中...' : '导出图片' }}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      
      <Col :span="16">
        <Card title="实时预览" v-if="originalImageUrl">
          <Row :gutter="16">
            <Col :span="12">
              <div class="preview-container">
                <div class="preview-header">
                  <Text strong>原始图片</Text>
                </div>
                <div class="preview-image-wrapper">
                  <img :src="originalImageUrl" class="preview-image" />
                </div>
              </div>
            </Col>
            <Col :span="12">
              <div class="preview-container">
                <div class="preview-header">
                  <Text strong>滤镜效果</Text>
                  <Tag v-if="selectedFilter !== 'none'" color="blue">{{ getFilterName(selectedFilter) }}</Tag>
                </div>
                <div class="preview-image-wrapper">
                  <img 
                    :src="originalImageUrl" 
                    class="preview-image filtered-image" 
                    :style="filterStyle"
                  />
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>

    <Row v-if="result" style="margin-top: 24px;">
      <Col :span="24">
        <Card title="导出结果">
          <div class="result-preview">
            <Image :src="resultImageUrl" :preview="true" style="max-width: 300px;" />
          </div>
          <div style="margin-top: 16px;">
            <Space>
              <Button type="primary" @click="downloadResult" size="large">
                <DownloadOutlined />
                下载处理后的图片
              </Button>
              <Button @click="reset">
                <ReloadOutlined />
                重新选择
              </Button>
            </Space>
          </div>
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
  Divider,
  message
} from 'ant-design-vue'
import {
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons-vue'

const { Text } = Typography

const fileList = ref([])
const file = ref<File | null>(null)
const originalImageUrl = ref('')
const result = ref<Blob | null>(null)
const resultImageUrl = ref('')
const isProcessing = ref(false)

// 滤镜参数
const selectedFilter = ref('none')
const brightness = ref(100)
const contrast = ref(100)
const saturation = ref(100)
const hue = ref(0)
const blur = ref(0)

const hasFilters = computed(() => {
  return selectedFilter.value !== 'none' || 
         brightness.value !== 100 || 
         contrast.value !== 100 || 
         saturation.value !== 100 || 
         hue.value !== 0 || 
         blur.value !== 0
})

const filterStyle = computed(() => {
  let filters = []
  
  if (brightness.value !== 100) {
    filters.push(`brightness(${brightness.value}%)`)
  }
  if (contrast.value !== 100) {
    filters.push(`contrast(${contrast.value}%)`)
  }
  if (saturation.value !== 100) {
    filters.push(`saturate(${saturation.value}%)`)
  }
  if (hue.value !== 0) {
    filters.push(`hue-rotate(${hue.value}deg)`)
  }
  if (blur.value !== 0) {
    filters.push(`blur(${blur.value}px)`)
  }
  
  return {
    filter: filters.join(' ')
  }
})

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getFilterName = (filter: string) => {
  const names: { [key: string]: string } = {
    'grayscale': '黑白',
    'sepia': '复古',
    'vintage': '怀旧',
    'cool': '冷色调',
    'warm': '暖色调',
    'bright': '明亮',
    'dark': '暗黑'
  }
  return names[filter] || filter
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

  const reader = new FileReader()
  reader.onload = (e) => {
    originalImageUrl.value = e.target?.result as string
  }
  reader.readAsDataURL(selectedFile)
}

const applyPresetFilter = () => {
  // 重置所有参数
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  hue.value = 0
  blur.value = 0
  
  // 应用预设
  switch (selectedFilter.value) {
    case 'grayscale':
      saturation.value = 0
      break
    case 'sepia':
      saturation.value = 80
      hue.value = 30
      contrast.value = 110
      break
    case 'vintage':
      brightness.value = 110
      contrast.value = 120
      saturation.value = 130
      hue.value = 15
      break
    case 'cool':
      hue.value = 200
      saturation.value = 120
      break
    case 'warm':
      hue.value = 30
      saturation.value = 120
      brightness.value = 110
      break
    case 'bright':
      brightness.value = 130
      contrast.value = 110
      break
    case 'dark':
      brightness.value = 70
      contrast.value = 130
      break
  }
}

const applyFilters = () => {
  // 实时预览通过 computed 属性自动更新
}

const resetFilters = () => {
  selectedFilter.value = 'none'
  brightness.value = 100
  contrast.value = 100
  saturation.value = 100
  hue.value = 0
  blur.value = 0
}

const exportImage = async () => {
  if (!file.value || !originalImageUrl.value) return
  
  isProcessing.value = true
  try {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = img.width
      canvas.height = img.height
      
      // 应用滤镜
      let filters = []
      if (brightness.value !== 100) {
        filters.push(`brightness(${brightness.value}%)`)
      }
      if (contrast.value !== 100) {
        filters.push(`contrast(${contrast.value}%)`)
      }
      if (saturation.value !== 100) {
        filters.push(`saturate(${saturation.value}%)`)
      }
      if (hue.value !== 0) {
        filters.push(`hue-rotate(${hue.value}deg)`)
      }
      if (blur.value !== 0) {
        filters.push(`blur(${blur.value}px)`)
      }
      
      ctx.filter = filters.join(' ')
      ctx.drawImage(img, 0, 0)
      
      canvas.toBlob((blob) => {
        if (blob) {
          result.value = blob
          resultImageUrl.value = URL.createObjectURL(blob)
          message.success('滤镜处理完成!')
        }
        isProcessing.value = false
      }, 'image/png')
    }
    img.src = originalImageUrl.value
  } catch (error) {
    console.error('滤镜处理失败:', error)
    message.error('滤镜处理失败，请重试')
    isProcessing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return
  
  const a = document.createElement('a')
  a.href = resultImageUrl.value
  a.download = `filtered_${file.value?.name || 'image.png'}`
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
  resetFilters()
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
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.result-preview {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}
</style>