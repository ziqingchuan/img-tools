<template>
  <div class="image-cropper">
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
              <ScissorOutlined style="font-size: 48px; color: #1890ff;" />
            </p>
            <p class="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p class="ant-upload-hint">支持裁剪为不同尺寸和比例</p>
          </Upload.Dragger>
          
          <div v-if="file" style="margin-top: 16px;">
            <Descriptions :column="2" bordered size="small">
              <Descriptions.Item label="文件名">{{ file.name }}</Descriptions.Item>
              <Descriptions.Item label="文件大小">{{ formatFileSize(file.size) }}</Descriptions.Item>
              <Descriptions.Item label="图片尺寸">{{ imageWidth }} × {{ imageHeight }}</Descriptions.Item>
              <Descriptions.Item label="图片格式">{{ file.type.split('/')[1]?.toUpperCase() }}</Descriptions.Item>
            </Descriptions>
          </div>
        </Card>
      </Col>
    </Row>

    <Row :gutter="[16, 16]" v-if="file">
      <Col :xs="24" :sm="24" :md="8" :lg="8">
        <Card title="裁剪设置">
          <Form layout="vertical">
            <Form.Item label="裁剪比例">
              <Select v-model:value="aspectRatio" size="large" @change="updateCropArea">
                <Select.Option value="free">自由裁剪</Select.Option>
                <Select.Option value="1:1">正方形 (1:1)</Select.Option>
                <Select.Option value="4:3">标准 (4:3)</Select.Option>
                <Select.Option value="16:9">宽屏 (16:9)</Select.Option>
                <Select.Option value="3:4">竖屏 (3:4)</Select.Option>
                <Select.Option value="9:16">手机竖屏 (9:16)</Select.Option>
              </Select>
            </Form.Item>
            
            <Form.Item label="输出尺寸">
              <Space direction="vertical" style="width: 100%;">
                <div>
                  <Text>宽度:</Text>
                  <InputNumber 
                    v-model:value="outputWidth" 
                    :min="50" 
                    :max="2000" 
                    style="width: 100%; margin-top: 4px;"
                  />
                </div>
                <div>
                  <Text>高度:</Text>
                  <InputNumber 
                    v-model:value="outputHeight" 
                    :min="50" 
                    :max="2000" 
                    style="width: 100%; margin-top: 4px;"
                  />
                </div>
              </Space>
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                block 
                :loading="isProcessing"
                @click="cropImage"
                :disabled="!file"
              >
                <ScissorOutlined />
                {{ isProcessing ? '裁剪中...' : '开始裁剪' }}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
      
      <Col :xs="24" :sm="24" :md="16" :lg="16">
        <Card title="裁剪预览" v-if="originalImageUrl">
          <div class="crop-container">
            <canvas 
              ref="cropCanvas"
              :width="canvasWidth"
              :height="canvasHeight"
              @mousedown="startCrop"
              @mousemove="updateCrop"
              @mouseup="endCrop"
              style="border: 1px solid #d9d9d9; cursor: crosshair;"
            ></canvas>
          </div>
          
          <div v-if="result" style="margin-top: 16px;">
            <Divider>裁剪结果</Divider>
            <div class="result-preview">
              <Image :src="resultImageUrl" :preview="true" />
              <div style="margin-top: 8px; text-align: center;">
                <Text type="secondary">{{ outputWidth }} × {{ outputHeight }}</Text>
              </div>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <Row v-if="result" :gutter="[16, 16]">
      <Col :xs="24" :sm="24" :md="24" :lg="24">
        <Card title="下载结果">
          <Space>
            <Button type="primary" @click="downloadResult">
              <DownloadOutlined />
              下载裁剪图片
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
import { ref, nextTick } from 'vue'
import { 
  Row, 
  Col, 
  Card, 
  Upload, 
  Button, 
  Form, 
  Select, 
  InputNumber, 
  Image, 
  Typography, 
  Descriptions,
  Space,
  Divider,
  message
} from 'ant-design-vue'
import {
  ScissorOutlined,
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
const cropCanvas = ref<HTMLCanvasElement | null>(null)

// 图片信息
const imageWidth = ref(0)
const imageHeight = ref(0)
const canvasWidth = ref(400)
const canvasHeight = ref(300)

// 裁剪参数
const aspectRatio = ref('free')
const outputWidth = ref(400)
const outputHeight = ref(300)

// 裁剪区域
const cropArea = ref({
  x: 50,
  y: 50,
  width: 200,
  height: 150
})

const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

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

  const reader = new FileReader()
  reader.onload = (e) => {
    originalImageUrl.value = e.target?.result as string
    loadImageToCanvas()
  }
  reader.readAsDataURL(selectedFile)
}

const loadImageToCanvas = () => {
  const img = document.createElement('img')
  img.onload = () => {
    imageWidth.value = img.width
    imageHeight.value = img.height
    
    // 计算画布尺寸，保持比例
    const maxWidth = 500
    const maxHeight = 400
    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
    
    canvasWidth.value = img.width * ratio
    canvasHeight.value = img.height * ratio
    
    nextTick(() => {
      drawCanvas(img)
    })
  }
  img.src = originalImageUrl.value
}

const drawCanvas = (img: HTMLImageElement) => {
  const canvas = cropCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 绘制图片
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  
  // 绘制裁剪框
  ctx.strokeStyle = '#1890ff'
  ctx.lineWidth = 2
  ctx.setLineDash([5, 5])
  ctx.strokeRect(cropArea.value.x, cropArea.value.y, cropArea.value.width, cropArea.value.height)
  
  // 绘制遮罩
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
  ctx.fillRect(0, 0, canvas.width, cropArea.value.y)
  ctx.fillRect(0, cropArea.value.y, cropArea.value.x, cropArea.value.height)
  ctx.fillRect(cropArea.value.x + cropArea.value.width, cropArea.value.y, canvas.width - cropArea.value.x - cropArea.value.width, cropArea.value.height)
  ctx.fillRect(0, cropArea.value.y + cropArea.value.height, canvas.width, canvas.height - cropArea.value.y - cropArea.value.height)
}

const updateCropArea = () => {
  if (aspectRatio.value === 'free') return
  
  const ratios: { [key: string]: number } = {
    '1:1': 1,
    '4:3': 4/3,
    '16:9': 16/9,
    '3:4': 3/4,
    '9:16': 9/16
  }
  
  const ratio = ratios[aspectRatio.value]
  if (ratio) {
    cropArea.value.height = cropArea.value.width / ratio
    outputHeight.value = Math.round(outputWidth.value / ratio)
  }
  
  // 重新绘制
  const img = document.createElement('img')
  img.onload = () => drawCanvas(img)
  img.src = originalImageUrl.value
}

const startCrop = (e: MouseEvent) => {
  const canvas = cropCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  isDragging.value = true
  dragStart.value = { x, y }
  cropArea.value.x = x
  cropArea.value.y = y
  cropArea.value.width = 0
  cropArea.value.height = 0
}

const updateCrop = (e: MouseEvent) => {
  if (!isDragging.value) return
  
  const canvas = cropCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  cropArea.value.width = Math.abs(x - dragStart.value.x)
  cropArea.value.height = Math.abs(y - dragStart.value.y)
  cropArea.value.x = Math.min(x, dragStart.value.x)
  cropArea.value.y = Math.min(y, dragStart.value.y)
  
  // 应用比例约束
  if (aspectRatio.value !== 'free') {
    const ratios: { [key: string]: number } = {
      '1:1': 1,
      '4:3': 4/3,
      '16:9': 16/9,
      '3:4': 3/4,
      '9:16': 9/16
    }
    
    const ratio = ratios[aspectRatio.value]
    if (ratio) {
      cropArea.value.height = cropArea.value.width / ratio
    }
  }
  
  // 重新绘制
  const img = document.createElement('img')
  img.onload = () => drawCanvas(img)
  img.src = originalImageUrl.value
}

const endCrop = () => {
  isDragging.value = false
}

const cropImage = async () => {
  if (!file.value || !cropCanvas.value) return
  
  isProcessing.value = true
  try {
    const img = document.createElement('img')
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      canvas.width = outputWidth.value
      canvas.height = outputHeight.value
      
      // 计算实际裁剪区域
      const scaleX = imageWidth.value / canvasWidth.value
      const scaleY = imageHeight.value / canvasHeight.value
      
      const sourceX = cropArea.value.x * scaleX
      const sourceY = cropArea.value.y * scaleY
      const sourceWidth = cropArea.value.width * scaleX
      const sourceHeight = cropArea.value.height * scaleY
      
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,
        0, 0, outputWidth.value, outputHeight.value
      )
      
      canvas.toBlob((blob) => {
        if (blob) {
          result.value = blob
          resultImageUrl.value = URL.createObjectURL(blob)
          message.success('裁剪完成!')
        }
        isProcessing.value = false
      }, 'image/png')
    }
    img.src = originalImageUrl.value
  } catch (error) {
    console.error('裁剪失败:', error)
    message.error('裁剪失败，请重试')
    isProcessing.value = false
  }
}

const downloadResult = () => {
  if (!result.value) return
  
  const a = document.createElement('a')
  a.href = resultImageUrl.value
  a.download = `cropped_${file.value?.name || 'image.png'}`
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
.image-cropper {
  width: 100%;
}

.crop-container {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
  overflow-x: auto;
}

.crop-container canvas {
  max-width: 100%;
  height: auto;
}

.result-preview {
  text-align: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 6px;
}

.result-preview :deep(.ant-image) {
  max-width: 200px;
  max-height: 200px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .crop-container {
    padding: 12px;
  }
  
  .result-preview :deep(.ant-image) {
    max-width: 150px;
    max-height: 150px;
  }
}

@media (max-width: 576px) {
  .crop-container {
    padding: 8px;
  }
  
  .crop-container canvas {
    width: 100% !important;
    height: auto !important;
  }
}
</style>