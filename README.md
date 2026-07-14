# 大龙工具中枢 (dalong-tool-hub)

> 通用创意工具平台 — 引擎即模块，可插拔。

大龙工具中枢是一款基于 Electron 的桌面应用，为游戏开发者和创意工作者提供**统一的资源管理入口**。首个接入的引擎模块是**虚幻引擎 (Unreal Engine)**，后续将逐步接入 Blender、C4D 以及 AI 工具。

---

## 核心理念

不同引擎各自有独立的项目和资源体系。大龙工具中枢将每个引擎视为一个**可插拔的模块**，提供统一的资源预览、导入、插件管理体验 — 你只需要这一个工具，就能管理所有创意工作流。

---

## 功能概览

### 虚幻引擎模块（已接入 ✅）

| 功能 | 说明 |
|------|------|
| 🏠 **概览** | 项目检测与管理，自动扫描运行中的 UE 项目，一键切换 |
| 🔷 **蓝图** | 蓝图资源卡片预览（含视频演示），支持 zip 包一键导入到项目 |
| 🎨 **材质** | 材质资源卡片预览 |
| 🔌 **插件** | 插件资源管理 |
| 🎬 **动画** | 动画资源卡片预览 |
| 📥 **智能导入** | 解压 zip → 合并 Content/ 文件夹 → 冲突弹窗（替换/跳过/全部替换/全部跳过/关闭编辑器后替换） |
| ⚙️ **设置** | 资源根目录、默认页面、卡片列数、圆角、动画强度等可自定义 |

### 接入路线图

| 阶段 | 引擎/工具 | 状态 |
|------|-----------|------|
| 阶段 1 | 虚幻引擎 (Unreal Engine) | ✅ 已接入 |
| 阶段 2 | Blender | 🔜 下一个 |
| 阶段 3 | Cinema 4D | 📋 规划中 |
| 阶段 4 | AI 工具 | 📋 规划中 |

### 统一能力接口

每个引擎模块必须实现 4 项核心能力：

1. **项目检测与管理** — 进程匹配策略按引擎区分
2. **资源预览与导入** — 资源类型抽象（.uasset / .blend / .c4d）
3. **插件/脚本管理** — 安装、卸载、启用、版本管理
4. **AI 插件/Skill 管理** — 通用能力，与引擎解耦

---

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面框架 | Electron 37 |
| 前端 | 纯 HTML / CSS / JavaScript（无 React/Vue 框架） |
| 进程通信 | Electron IPC + contextBridge |
| 安全隔离 | `contextIsolation: true`, `nodeIntegration: false` |
| 解压依赖 | adm-zip |
| 数据持久化 | 本地 JSON 文件 (`%APPDATA%/userData/projects-store.json`) |
| 窗口控制 | 自定义标题栏（最小化/最大化/关闭） |

---

## 项目结构

```
dalong-tool-hub-desktop/
 ├── main.js              # Electron 主进程 — IPC handlers、文件系统操作、项目检测
 ├── preload.js           # contextBridge 安全桥接，暴露 API 给渲染进程
 ├── app.html             # 应用入口 HTML
 ├── package.json         # 项目配置与依赖
 ├── package-lock.json    # 依赖锁定文件
 ├── renderer/
 │   ├── app.js           # 前端逻辑（状态管理、渲染、事件绑定、导入流程）
 │   └── styles.css       # 样式（CSS Grid 布局、深色主题、响应式设计）
 └── README.md
```

---

## 运行项目

### 前置条件

- Node.js >= 18
- npm

### 安装与启动

```bash
# 克隆仓库
git clone https://github.com/DLlongHJDJSAKDHKJW/dalong-tool-hub-desktop.git
cd dalong-tool-hub-desktop

# 安装依赖
npm install

# 启动应用
npm start
```

> **注意**：如果在 WorkBuddy 沙盒环境中运行，需先 unset `ELECTRON_RUN_AS_NODE` 环境变量，否则 Electron 会以纯 Node 模式启动而无法显示 GUI 窗口。

---

## 主要特性

### 智能导入流程

资源包（zip 格式）导入项目的完整流程：

```
选择 zip → 解压到临时目录 → 扫描 Content/ 冲突
    → 无冲突 → 直接合并 → Toast 提示成功
    → 有冲突 → 弹窗逐文件询问：
        [替换] / [跳过] / [全部替换] / [全部跳过] / [关闭编辑器全部替换]
```

关闭编辑器全部替换流程：

```
点"关闭编辑器全部替换" → 关闭 UE 编辑器 → 合并文件 → Toast 提示 → 自动重新打开项目
```

### 项目检测

- 自动扫描运行中的 UE 进程
- 匹配 `.uproject` 文件路径
- 支持手动添加项目
- 一键切换活跃项目

### 自定义设置

- 资源根目录路径
- 默认启动页面
- 卡片列数（2-8 列）
- 界面圆角弧度
- 动画强度（无/减少/正常/增强）
- 仅可见卡片播放视频预览

---

## 开发说明

### 架构特点

- **纯原生前端**：不依赖 React、Vue 等框架，所有 DOM 操作直接通过原生 JS 完成
- **安全优先**：`contextIsolation: true` + `contextBridge`，渲染进程无法直接访问 Node.js API
- **深色主题**：CSS 变量驱动，统一配色方案

### 数据存储

用户数据存储在 `%APPDATA%/userData/projects-store.json`，包含：

- 活跃项目路径
- 已添加的项目列表
- 应用设置

### 已知限制

- 项目目录含中文路径可能在某些沙盒环境下遇到编码问题
- 材质/插件/动画页面目前使用硬编码假数据，待接入真实资源库

---

## License

MIT
