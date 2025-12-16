# 企业级图片处理平台

一个基于 Vue 3 + TypeScript + Ant Design Vue 的现代化图片处理工具平台，采用企业级B端后台管理系统的UI设计风格。

## 🚀 功能特性

### 核心功能
- **图片压缩** - 智能压缩图片大小，支持质量和尺寸调节
- **格式转换** - 支持 JPEG、PNG、WebP 格式互转
- **图片裁剪** - 多种比例裁剪，支持自定义尺寸
- **滤镜效果** - 丰富的滤镜预设和自定义调节

### UI/UX 特性
- 🎨 企业级B端后台设计风格
- 📱 响应式布局，适配不同屏幕
- 🖼️ 实时预览和对比效果
- 📊 详细的文件信息展示
- 🎯 直观的拖拽上传体验
- ⚡ 流畅的交互动画

### 技术特性
- 🔧 基于 Vue 3 Composition API
- 📦 使用 Ant Design Vue 组件库
- 🎭 SVG 图标替代 Emoji
- 🛠️ TypeScript 类型安全
- ⚡ Vite 构建工具

## 🏗️ 项目结构

```
src/
├── components/           # 功能组件
│   ├── ImageCompressor.vue    # 图片压缩
│   ├── ImageConverter.vue     # 格式转换
│   ├── ImageCropper.vue       # 图片裁剪
│   └── ImageFilter.vue        # 滤镜效果
├── utils/               # 工具函数
│   ├── compressImage.ts       # 压缩逻辑
│   └── convertImage.ts        # 转换逻辑
├── App.vue             # 主应用布局
├── main.ts             # 应用入口
└── style.css           # 全局样式
```

## 🎯 使用说明

### 图片压缩
1. 上传图片文件
2. 调节压缩质量 (10%-100%)
3. 设置最大宽度限制
4. 实时预览压缩效果
5. 下载压缩后的图片

### 格式转换
1. 上传任意格式图片
2. 选择目标格式 (JPEG/PNG/WebP)
3. 调节输出质量 (JPEG/WebP)
4. 预览转换效果
5. 下载转换后的图片

### 图片裁剪
1. 上传图片文件
2. 选择裁剪比例或自由裁剪
3. 在画布上拖拽选择区域
4. 设置输出尺寸
5. 下载裁剪后的图片

### 滤镜效果
1. 上传图片文件
2. 选择预设滤镜或自定义调节
3. 调节亮度、对比度、饱和度等
4. 实时预览滤镜效果
5. 导出处理后的图片

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 📦 技术栈

- **前端框架**: Vue 3
- **开发语言**: TypeScript
- **构建工具**: Vite
- **UI 组件库**: Ant Design Vue
- **图标**: Ant Design Icons
- **图片处理**: Canvas API + CompressorJS

## 🎨 设计理念

采用企业级B端后台管理系统的设计规范：
- 左侧导航栏 + 右侧内容区域的经典布局
- 顶部面包屑导航和用户信息
- 卡片式内容组织
- 统一的色彩和间距规范
- 清晰的信息层级和视觉引导