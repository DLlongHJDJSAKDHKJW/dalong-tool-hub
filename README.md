# 大龙工具中枢

大龙工具中枢是一个基于 Electron 的桌面工具，当前主要面向虚幻引擎资源管理工作流。它把蓝图、材质、插件、脚本、节点片段和工程包集中到一个本地工具里，方便预览、整理、复制和导入。

> 当前项目仍在迭代中，功能以虚幻引擎模块为主，其他软件入口属于后续扩展预留。

## 功能概览

### 虚幻引擎模块

| 页面 | 功能 |
| --- | --- |
| 概述 | 检测正在运行的 Unreal Editor 项目，手动添加 `.uproject`，切换当前目标项目 |
| 蓝图 | 读取蓝图资源卡片，支持视频/图片预览，支持压缩包导入到当前 UE 项目 |
| 材质 | 读取材质资源卡片，逻辑与蓝图资源一致 |
| 插件 | 按 UE 版本匹配插件压缩包，导入到项目 `Plugins` 目录，导入后提示是否重启引擎 |
| 脚本 | 管理 UE Python 脚本，连接本机 UE Python 服务后可远程执行脚本 |
| 节点 | 管理节点片段 `.json`，点击按钮复制内容到剪贴板，方便粘贴到 UE 中 |
| 工程 | 管理工程资源包，只做预览和打开目录，不导入到项目 |
| 设置 | 配置资源根目录、顶部模块显示、检查更新入口 |

## 资源目录规范

软件会读取资源根目录下的 `虚幻引擎` 文件夹。推荐结构如下：

```text
资源根目录/
  虚幻引擎/
    蓝图/
      资源名称/
        Content.zip
        Preview.mp4
    材质/
      资源名称/
        Content.zip
        Preview.png
    插件/
      插件名称/
        PluginName5.3.7z
        PluginName5.4.7z
        Preview.mp4
    脚本/
      随机旋转.py
    节点/
      蓝图/
        开门逻辑.json
      材质/
        材质混合.json
      特效/
        Niagara片段.json
    工程/
      工程名称/
        Content.zip
        Preview.mp4
```

说明：

- 蓝图、材质、工程资源：一个资源文件夹中放一个压缩包和一个预览视频或图片。
- 插件资源：压缩包文件名需要包含 UE 版本号，例如 `NodeStorage5.3.7z`、`NodeStorage5.4.7z`。
- 脚本资源：读取 `.py` 文件，支持根目录脚本和一级文件夹内脚本。
- 节点资源：读取 `节点/蓝图`、`节点/材质`、`节点/特效` 下的 `.json` 文件，点击按钮会复制文件原始内容。

## UE Python 服务

脚本页使用本机 Socket 与虚幻引擎通信。

基本流程：

1. 在软件脚本页点击 `复制启动代码`。
2. 把代码粘贴到 Unreal Engine Python 控制台执行。
3. 点击软件中的 `检测连接`。
4. 点击脚本按钮，软件会把 `.py` 内容发送到 UE 执行。

服务只监听本机：

```text
127.0.0.1:8765
```

## 安装与运行

### 环境要求

- Node.js 18 或更高版本
- npm

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm start
```

如果 Electron 在某些环境中以 Node 模式启动，可以先清理环境变量：

```powershell
$env:ELECTRON_RUN_AS_NODE=$null
npm start
```

## 项目结构

```text
.
├── app.html
├── main.js              # Electron 主进程，负责文件系统、IPC、UE 项目检测、导入逻辑
├── preload.js           # contextBridge 安全桥接
├── package.json
├── package-lock.json
├── renderer/
│   ├── app.js           # 前端状态、页面渲染、事件逻辑
│   └── styles.css       # 界面样式
└── README.md
```

## 上传 GitHub 前建议

这些目录不要上传：

```text
node_modules/
.workbuddy/
.agents/
.vs/
dist/
build/
out/
```

其中：

- `node_modules/` 是依赖目录，使用 `npm install` 重新安装。
- `.workbuddy/` 是运行时用户数据和缓存。
- `.agents/` 是本地 Agent 工作目录。
- `.vs/` 是 Visual Studio 缓存目录。

## 检查更新

当前检查更新功能已经有界面入口，但还没有接入线上更新源。后续可以选择两种方式：

- 使用 GitHub Releases：读取仓库最新 Release 版本，与 `package.json` 中的 `version` 比较。
- 使用自定义 `version.json`：在服务器或静态托管上放版本文件，软件请求后进行版本比对。

推荐上传 GitHub 后使用 GitHub Releases 方案。

## 技术栈

- Electron 37
- 原生 HTML/CSS/JavaScript
- Electron IPC
- `contextIsolation: true`
- `nodeIntegration: false`
- `adm-zip`
- `7zip-bin`

## 开发状态

当前项目处于持续迭代阶段，主要目标是让虚幻引擎资源管理和常用工具脚本更加集中、快速和稳定。

