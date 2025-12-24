<script setup lang="ts">
import { ref } from 'vue'
import { 
  Layout, 
  Menu, 
  Breadcrumb, 
  Typography,
  Drawer
} from 'ant-design-vue'
import {
  CompressOutlined,
  SwapOutlined,
  ScissorOutlined,
  FilterOutlined,
  MenuOutlined
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
const mobileMenuVisible = ref(false)

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
  mobileMenuVisible.value = false
}

const getCurrentTitle = () => {
  const item = menuItems.find(item => item.key === selectedTool.value)
  return item?.title || '图片处理工具'
}

const toggleMobileMenu = () => {
  mobileMenuVisible.value = !mobileMenuVisible.value
}
</script>

<template>
  <Layout class="app-layout">
    <Header class="app-header">
      <div class="header-content">
        <div class="logo">
          <img src="/logo.svg" alt="Logo" />
          <span class="logo-text">图片处理平台</span>
        </div>
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <MenuOutlined />
        </button>
      </div>
    </Header>
    
    <Layout class="main-layout">
      <!-- 桌面端侧边栏 -->
      <Sider 
        v-model:collapsed="collapsed" 
        :trigger="null" 
        collapsible
        width="240"
        :collapsed-width="80"
        class="desktop-sider"
        breakpoint="lg"
        @breakpoint="(broken) => { if (broken) collapsed = false }"
      >
        <Menu
          :selectedKeys="selectedKeys"
          mode="inline"
          :inline-collapsed="collapsed"
          @click="handleMenuClick"
          class="side-menu"
        >
          <Menu.Item 
            v-for="item in menuItems" 
            :key="item.key"
            class="menu-item"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </Menu.Item>
        </Menu>
      </Sider>
      
      <!-- 移动端抽屉菜单 -->
      <Drawer
        v-model:open="mobileMenuVisible"
        placement="left"
        :closable="false"
        :width="240"
        class="mobile-drawer"
      >
        <Menu
          :selectedKeys="selectedKeys"
          mode="inline"
          @click="handleMenuClick"
          class="mobile-menu"
        >
          <Menu.Item 
            v-for="item in menuItems" 
            :key="item.key"
            class="menu-item"
          >
            <component :is="item.icon" />
            <span>{{ item.label }}</span>
          </Menu.Item>
        </Menu>
      </Drawer>
      
      <Layout class="content-layout">
        <Content class="app-content">
          <div class="content-wrapper">
            <Breadcrumb class="breadcrumb">
              <Breadcrumb.Item>图片处理</Breadcrumb.Item>
              <Breadcrumb.Item>{{ getCurrentTitle() }}</Breadcrumb.Item>
            </Breadcrumb>
            
            <div class="tool-content">
              <Title :level="2" class="tool-title">
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
.app-layout {
  min-height: 100vh;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo img {
  height: 32px;
  width: 32px;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  line-height: 1;
}

.main-layout {
  flex: 1;
}

.desktop-sider {
  overflow: auto;
  height: calc(100vh - 64px);
  position: sticky;
  top: 64px;
  left: 0;
}

.side-menu {
  height: 100%;
  border-right: 0;
}

.content-layout {
  min-height: calc(100vh - 64px);
}

.app-content {
  overflow-y: auto;
}

.content-wrapper {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

.breadcrumb {
  margin-bottom: 16px;
}

.tool-content {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  height: 100vh;
}

.tool-title {
  margin-bottom: 24px;
}

/* 移动端适配 */
@media (max-width: 992px) {
  .desktop-sider {
    display: none !important;
  }
  
  .mobile-menu-btn {
    display: block;
  }
  
  .content-wrapper {
    padding: 12px;
  }
  
  .tool-content {
    padding: 16px;
    border-radius: 6px;
  }
  
  .tool-title {
    font-size: 20px !important;
    margin-bottom: 16px;
  }
  
  .breadcrumb {
    font-size: 12px;
  }
}

@media (max-width: 576px) {
  .logo-text {
    font-size: 16px;
  }
  
  .logo img {
    height: 28px;
    width: 28px;
  }
  
  .content-wrapper {
    padding: 8px;
  }
  
  .tool-content {
    padding: 12px;
  }
  
  .tool-title {
    font-size: 18px !important;
  }
}
</style>
