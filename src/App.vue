<script setup lang="ts">
import { ref } from 'vue'
import { 
  Layout, 
  Menu, 
  Breadcrumb, 
  Typography
} from 'ant-design-vue'
import {
  CompressOutlined,
  SwapOutlined,
  ScissorOutlined,
  FilterOutlined,
} from '@ant-design/icons-vue'
import ImageCompressor from './components/ImageCompressor.vue'
import ImageConverter from './components/ImageConverter.vue'
import ImageCropper from './components/ImageCropper.vue'
import ImageFilter from './components/ImageFilter.vue'

const { Header, Sider, Content } = Layout
const { Title } = Typography

type ToolName = 'compressor' | 'converter' | 'cropper' | 'filter'

const selectedTool = ref<ToolName>('compressor')
const selectedKeys = ref<string[]>(['compressor'])
const collapsed = ref(false)

const menuItems = [
  {
    key: 'compressor',
    icon: CompressOutlined,
    label: '图片压缩',
    title: '图片压缩'
  },
  {
    key: 'converter', 
    icon: SwapOutlined,
    label: '格式转换',
    title: '格式转换'
  },
  {
    key: 'cropper',
    icon: ScissorOutlined,
    label: '图片裁剪',
    title: '图片裁剪'
  },
  {
    key: 'filter',
    icon: FilterOutlined,
    label: '滤镜效果',
    title: '滤镜效果'
  }
]


const handleMenuClick = (info: any) => {
  const key = String(info.key)
  selectedTool.value = key as ToolName
  selectedKeys.value = [key]
}

const getCurrentTitle = () => {
  const item = menuItems.find(item => item.key === selectedTool.value)
  return item?.title || '图片处理工具'
}
</script>

<template>
  <Layout>
    <Header>
      <div class="header-content">
        <div class="logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span style="margin-left: 12px;">图片处理平台</span>
        </div>
      </div>
    </Header>
    
    <Layout>
      <Sider 
        v-model:collapsed="collapsed" 
        :trigger="null" 
        collapsible
        width="240"
        :collapsed-width="80"
      >
        <Menu
          :selectedKeys="selectedKeys"
          mode="inline"
          :inline-collapsed="collapsed"
          @click="handleMenuClick"
          style="height: 100%; border-right: 0;"
        >
          <Menu.Item 
            v-for="item in menuItems" 
            :key="item.key"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </Menu.Item>
        </Menu>
      </Sider>
      
      <Layout>
        <Content>
          <div class="content-wrapper">
            <Breadcrumb style="margin-bottom: 16px;">
              <Breadcrumb.Item>图片处理</Breadcrumb.Item>
              <Breadcrumb.Item>{{ getCurrentTitle() }}</Breadcrumb.Item>
            </Breadcrumb>
            
            <div class="tool-content">
              <Title :level="2" style="margin-bottom: 24px;">
                {{ getCurrentTitle() }}
              </Title>
              
              <ImageCompressor v-if="selectedTool === 'compressor'" />
              <ImageConverter v-else-if="selectedTool === 'converter'" />
              <ImageCropper v-else-if="selectedTool === 'cropper'" />
              <ImageFilter v-else-if="selectedTool === 'filter'" />
            </div>
          </div>
        </Content>
      </Layout>
    </Layout>
  </Layout>
</template>

<style scoped>
.ant-dropdown-link {
  color: rgba(0, 0, 0, 0.85);
  text-decoration: none;
}

.ant-dropdown-link:hover {
  color: #1890ff;
}
</style>
