const mediaCards = {
  blueprint: [
    { duration: "00:10", name: "交互蓝图", tone: "graphite" },
    { duration: "00:07", name: "战斗逻辑", tone: "smoke" },
    { duration: "00:09", name: "UI 控制器", tone: "silver" },
    { duration: "00:08", name: "移动组件", tone: "graphite" },
    { duration: "00:11", name: "拾取系统", tone: "smoke" },
    { duration: "00:06", name: "任务节点", tone: "silver" },
    { duration: "00:12", name: "状态机", tone: "graphite" },
    { duration: "00:05", name: "伤害处理", tone: "smoke" },
    { duration: "00:09", name: "技能释放", tone: "silver" },
    { duration: "00:08", name: "镜头逻辑", tone: "graphite" },
  ],
  material: [
    { duration: "00:08", name: "金属材质", tone: "silver" },
    { duration: "00:06", name: "地表材质", tone: "smoke" },
    { duration: "00:09", name: "磨损层", tone: "graphite" },
  ],
  plugin: [
    { duration: "00:12", name: "输入增强", tone: "graphite" },
    { duration: "00:09", name: "性能工具", tone: "silver" },
    { duration: "00:07", name: "打包插件", tone: "smoke" },
  ],
};

const pageMeta = {
  home: { title: "概览", subtitle: "引擎工作区状态" },
  blueprint: { title: "蓝图", subtitle: "卡片预览与导入" },
  material: { title: "材质", subtitle: "卡片预览与导入" },
  plugin: { title: "插件", subtitle: "卡片预览与导入" },
  script: { title: "脚本", subtitle: "卡片预览与导入" },
  node: { title: "节点", subtitle: "节点片段库与剪贴板" },
  project: { title: "工程", subtitle: "工程包预览与目录查看" },
  settings: { title: "设置", subtitle: "软件参数与路径" },
};

const assetPageKeys = ["blueprint", "material", "plugin", "script", "node", "project"];
const optionalModuleIds = ["ae", "3dmax", "blender", "c4d", "maya", "ps"];
const pluginVersionOptions = ["UE5.0", "UE5.1", "UE5.2", "UE5.3", "UE5.4", "UE5.5", "UE5.6"];
const nodeCategoryOptions = [
  { key: "blueprint", label: "蓝图" },
  { key: "material", label: "材质" },
  { key: "effect", label: "特效" },
];

const engines = [
  {
    id: "unreal",
    name: "虚幻引擎",
    shortName: "UE",
    status: "connected",
    subtitle: "虚幻引擎资源库",
    pages: [
      { id: "home", label: "概述", icon: "home" },
      { id: "blueprint", label: "蓝图", icon: "blueprint" },
      { id: "material", label: "材质", icon: "grid" },
      { id: "plugin", label: "插件", icon: "plug" },
      { id: "script", label: "脚本", icon: "film" },
      { id: "node", label: "节点", icon: "grid" },
      { id: "project", label: "工程", icon: "home" },
    ],
  },
  {
    id: "ae",
    name: "AE",
    shortName: "AE",
    status: "pending",
    subtitle: "待接入",
    pages: [],
  },
  {
    id: "3dmax",
    name: "3Dmax",
    shortName: "3D",
    status: "planned",
    subtitle: "规划中",
    pages: [],
  },
  {
    id: "blender",
    name: "blender",
    shortName: "Bl",
    status: "pending",
    subtitle: "待接入",
    pages: [],
  },
  {
    id: "c4d",
    name: "C4D",
    shortName: "4D",
    status: "planned",
    subtitle: "规划中",
    pages: [],
  },
  {
    id: "ai",
    name: "AI工具",
    shortName: "AI",
    status: "planned",
    subtitle: "规划中",
    pages: [],
  },
  {
    id: "maya",
    name: "MAYA",
    shortName: "MY",
    status: "planned",
    subtitle: "规划中",
    pages: [],
  },
  {
    id: "ps",
    name: "PS",
    shortName: "PS",
    status: "planned",
    subtitle: "规划中",
    pages: [],
  },
];

function activeEngine() {
  return engines.find((e) => e.id === state.activeEngine) || engines[0];
}

function visibleEngines() {
  const visibleModules = Array.isArray(state.settings.visibleModules) ? state.settings.visibleModules : optionalModuleIds;
  return engines.filter((engine) => engine.id === "unreal" || engine.id === "ai" || visibleModules.includes(engine.id));
}

function isEngineConnected(engineId) {
  const engine = engines.find((e) => e.id === engineId);
  return engine?.status === "connected";
}

const state = {
  activePage: "home",
  activeEngine: "unreal",
  activeProjectPath: "",
  alwaysOnTop: false,
  columns: 5,
  activeCardIndexByPage: {
    blueprint: 0,
    material: 0,
    plugin: 0,
    script: 0,
    node: 0,
    project: 0,
  },
  activeNodeCategory: "blueprint",
  nodeLibrary: {
    loading: false,
    message: "正在读取节点片段目录...",
    libraryRoot: "",
    items: [],
  },
  previewModal: {
    open: false,
    pageKey: "",
    item: null,
  },
  sidebarCollapsed: false,
  projects: [],
  projectMessage: "点击检测已打开项目，或者手动添加 .uproject 文件。",
  loadingProjects: false,
  addingProject: false,
  switchingProject: false,
  removingProject: false,
  choosingResourceRoot: false,
  savingSettings: false,
  openingAssetRootByPage: {},
  settings: {
    resourceRootPath: "",
    defaultPage: "home",
    defaultCardColumns: 5,
    cornerRadius: 22,
    motionStrength: "soft",
    visibleOnlyPlayback: true,
    squarePreviewFill: true,
    showLibraryRootPath: true,
    visibleModules: [...optionalModuleIds],
    directory: {
      exists: false,
      fileCount: 0,
      folderCount: 0,
      samples: [],
    },
  },
  settingsDraft: {
    resourceRootPath: "",
    defaultPage: "home",
    defaultCardColumns: 5,
    cornerRadius: 22,
    motionStrength: "soft",
    visibleOnlyPlayback: true,
    squarePreviewFill: true,
    showLibraryRootPath: true,
    visibleModules: [...optionalModuleIds],
  },
  settingsMessage: "设置资源根目录后，软件就可以读取这个路径下的文件。",
  updateInfo: {
    checking: false,
    currentVersion: "",
    latestVersion: "",
    hasUpdate: false,
    checkedAt: "",
    releaseUrl: "",
    message: "可以在这里检查是否有新版本。",
  },
  importState: {
    loading: false,
    conflicts: [],
    tempDir: "",
    contentDir: "",
    targetContentDir: "",
    mode: "content",
    matchedVersion: "",
    totalFiles: 0,
    message: "",
    progress: {
      stage: "",
      message: "",
      current: 0,
      total: 0,
      percent: 0,
    },
    cancelled: false,
  },
  conflictModalOpen: false,
  pluginRestartConfirm: {
    open: false,
    projectName: "",
    projectPath: "",
    loading: false,
    message: "",
  },
  uePython: {
    connected: false,
    checking: false,
    executing: false,
    busy: false,
    project: "",
    engine: "",
    host: "127.0.0.1",
    port: 8765,
    lastCheckedAt: "",
    failures: 0,
    output: "",
    message: "等待检测 UE Python 服务。",
    requestId: "",
    activeScriptPath: "",
  },
  contextMenu: {
    open: false,
    x: 0,
    y: 0,
    item: null,
    pageKey: "",
  },
  deleteConfirm: {
    open: false,
    item: null,
    pageKey: "",
    loading: false,
    message: "",
  },
  scriptEditor: {
    open: false,
    name: "",
    filePath: "",
    code: "",
    isNew: false,
    loading: false,
    saving: false,
    message: "",
  },
  nodeEditor: {
    open: false,
    category: "blueprint",
    name: "",
    filePath: "",
    code: "",
    isNew: false,
    loading: false,
    saving: false,
    message: "",
  },
  assetCreate: {
    open: false,
    pageKey: "",
    name: "",
    pluginVersion: "UE5.3",
    pluginPackages: [],
    video: null,
    package: null,
    loading: false,
    message: "",
  },
  toast: {
    visible: false,
    message: "",
    type: "info",
  },
  assetLibraries: {
    blueprint: { items: [], message: "正在读取蓝图资源目录...", libraryRoot: "", label: "蓝图", loading: false },
    material: { items: [], message: "正在读取材质资源目录...", libraryRoot: "", label: "材质", loading: false },
    plugin: { items: [], message: "正在读取插件资源目录...", libraryRoot: "", label: "插件", loading: false },
    script: { items: [], message: "正在读取脚本资源目录...", libraryRoot: "", label: "脚本", loading: false },
    node: { items: [], message: "正在读取节点资源目录...", libraryRoot: "", label: "节点", loading: false },
    project: { items: [], message: "正在读取工程资源目录...", libraryRoot: "", label: "工程", loading: false },
  },
};

function playVideoElement(video) {
  const play = () => video.play().catch(() => {});

  if (video.readyState >= 2) {
    play();
  } else {
    video.addEventListener("loadeddata", play, { once: true });
    video.load();
  }
}

function applyPlaybackMode() {
  const hoverOnly = state.settingsDraft.visibleOnlyPlayback !== false;
  const allVideos = document.querySelectorAll(".card-video");

  if (hoverOnly) {
    allVideos.forEach((video) => {
      video.pause();
    });
    return;
  }

  allVideos.forEach((video) => {
    playVideoElement(video);
  });
}

function activeProject() {
  return state.projects.find((project) => project.path === state.activeProjectPath) || null;
}

function sortedProjects() {
  return [...state.projects].sort((left, right) => {
    const leftRunning = left.status === "运行中" ? 1 : 0;
    const rightRunning = right.status === "运行中" ? 1 : 0;

    if (leftRunning !== rightRunning) {
      return rightRunning - leftRunning;
    }

    return left.name.localeCompare(right.name, "zh-CN");
  });
}

function safeProjectName(project) {
  return project?.name || "未选择项目";
}

function normalizedProjectVersion(project) {
  const match = String(project?.version || "").match(/(?:UE\s*)?(\d+(?:\.\d+)?)/i);
  return match?.[1] ? `UE${match[1]}` : "";
}

function defaultPluginVersion() {
  return normalizedProjectVersion(activeProject()) || "UE5.3";
}

function assetLibrary(pageKey) {
  return state.assetLibraries?.[pageKey] || { items: [], message: "", libraryRoot: "", label: pageMeta[pageKey]?.title || "资源" };
}

function navButton(page, label, icon, active = false) {
  return `
    <button class="nav-btn${active ? " active" : ""}" type="button" data-page="${page}" title="${label}">
      <span class="nav-icon icon-${icon}"></span>
      <span class="nav-label">${label}</span>
    </button>
  `;
}

function customSelect(id, value, options, placeholder = "") {
  const active = options.find((option) => option.value === value);
  return `
    <div class="custom-select" data-select-id="${id}">
      <button class="custom-select-trigger" type="button" data-select-trigger="${id}">
        <span>${active?.label || placeholder}</span>
      </button>
      <div class="custom-select-menu" data-select-menu="${id}">
        ${options.map((option) => `
          <button
            class="custom-select-option${option.value === value ? " active" : ""}"
            type="button"
            data-select-option="${id}"
            data-value="${option.value}"
          >
            ${option.label}
          </button>
        `).join("")}
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scriptDisplayName(name) {
  return String(name || "未命名脚本").replace(/\.py$/i, "");
}

function highlightPythonCode(code) {
  const source = String(code ?? "");
  const tokenPattern = /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b|\b(?:print|len|range|str|int|float|format|random|unreal|self|Exception)\b|\b\d+(?:\.\d+)?\b)/g;
  let output = "";
  let lastIndex = 0;

  for (const match of source.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index || 0;
    output += escapeHtml(source.slice(lastIndex, index));

    let className = "py-number";
    if (token.startsWith("#")) {
      className = "py-comment";
    } else if (token.startsWith("\"") || token.startsWith("'")) {
      className = "py-string";
    } else if (/^(print|len|range|str|int|float|format|random|unreal|self|Exception)$/.test(token)) {
      className = "py-builtin";
    } else if (/^(True|False|None)$/.test(token)) {
      className = "py-constant";
    } else if (!/^\d/.test(token)) {
      className = "py-keyword";
    }

    output += `<span class="${className}">${escapeHtml(token)}</span>`;
    lastIndex = index + token.length;
  }

  output += escapeHtml(source.slice(lastIndex));
  return output || "&nbsp;";
}

function createCard(item, index, pageKey) {
  const isLibraryCard = item && typeof item === "object" && "folderPath" in item;
  const isActive = (state.activeCardIndexByPage[pageKey] || 0) === index;
  const name = typeof item === "string" ? `${pageKey}-${index + 1}` : item.name;
  const tone = typeof item === "string" ? "graphite" : (item.tone || "graphite");
  const previewMarkup = isLibraryCard && item.videoUrl
    ? `<video class="card-preview-media card-video" src="${item.videoUrl}" muted loop playsinline preload="metadata"></video>`
    : isLibraryCard && item.imageUrl
      ? `<img class="card-preview-media card-image" src="${item.imageUrl}" alt="${name}" loading="lazy" />`
    : "";

  return `
    <article class="card-shell" data-card-index="${index}" data-card-page="${pageKey}">
      <div class="card card-tone-${tone}${isActive ? " active" : ""}${previewMarkup ? " has-preview" : ""}" data-card-index="${index}" data-card-page="${pageKey}">
        <div class="card-surface">
          ${previewMarkup}
          <div class="card-gridlines"></div>
          <div class="card-rings"></div>
        </div>
        <div class="play"></div>
      </div>
      <div class="card-caption">${name}</div>
    </article>
  `;
}

function previewModalMarkup() {
  const item = state.previewModal.item;
  const pageKey = state.previewModal.pageKey;

  if (!state.previewModal.open || !item) {
    return "";
  }

  const name = typeof item === "string" ? `${pageKey}` : item.name;
  const isLibraryResource = item && typeof item === "object" && "folderPath" in item;
  const resourceLabel = item.label || pageMeta[pageKey]?.title || "资源";
  const currentProject = activeProject();
  const isPluginResource = pageKey === "plugin";
  const isProjectResource = pageKey === "project";
  const projectVersion = normalizedProjectVersion(currentProject);
  const matchedPluginVersion = isPluginResource
    ? (item.pluginVersions || []).find((entry) => normalizedProjectVersion({ version: entry.version }) === projectVersion)
    : null;
  const pluginVersionText = isPluginResource
    ? (matchedPluginVersion?.version || `未匹配 ${projectVersion || "当前版本"}`)
    : "";
  const availablePluginVersions = isPluginResource
    ? (item.pluginVersions || []).map((entry) => entry.version).filter(Boolean)
    : [];
  const displayPackagePath = isPluginResource && matchedPluginVersion?.packagePath
    ? matchedPluginVersion.packagePath
    : item.packagePath;
  const packageExt = displayPackagePath ? (displayPackagePath.match(/\.[^./\\]+$/)?.[0] || "") : "";
  const packageName = isLibraryResource && displayPackagePath
    ? (isPluginResource ? `Content${packageExt || ".zip"}` : displayPackagePath.split(/[/\\]/).pop())
    : "未检测到压缩包";
  const previewMedia = isLibraryResource && item.videoUrl
    ? `<div class="preview-media-frame"><video class="preview-video" src="${item.videoUrl}" muted loop playsinline autoplay controls></video></div>`
    : isLibraryResource && item.imageUrl
      ? `<div class="preview-media-frame"><img class="preview-image" src="${item.imageUrl}" alt="${name}" /></div>`
    : `
      <div class="preview-placeholder card-tone-${item.tone || "graphite"}">
        <div class="card-gridlines"></div>
        <div class="card-rings"></div>
      </div>
    `;

  return `
    <div class="modal-backdrop" id="preview-modal-backdrop">
      <section class="preview-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="preview-close-btn" aria-label="关闭预览">×</button>
        <div class="preview-layout">
          <div class="preview-media">
            ${previewMedia}
          </div>
          <aside class="preview-side">
            <div class="preview-scroll">
              <div class="preview-panel-head">
                <span class="preview-kicker">${resourceLabel}资源</span>
                <strong>${name}</strong>
              </div>
              <div class="preview-details">
                ${!isProjectResource ? `
                  <div class="preview-detail">
                    <span>当前目标项目</span>
                    <strong>${safeProjectName(currentProject)}</strong>
                  </div>
                  <div class="preview-detail">
                    <span>当前引擎版本</span>
                    <strong>${currentProject?.version || "UE 未知版本"}</strong>
                  </div>
                ` : ""}
                ${isPluginResource ? `
                  <div class="preview-detail">
                    <span>匹配插件版本</span>
                    <strong>${pluginVersionText}</strong>
                  </div>
                  <div class="preview-detail">
                    <span>可用插件版本</span>
                    <strong>${availablePluginVersions.length ? availablePluginVersions.join(" / ") : "未识别到版本包"}</strong>
                  </div>
                ` : ""}
                <div class="preview-detail">
                  <span>资源文件夹</span>
                  <strong>${item.folderPath || "暂无目录"}</strong>
                </div>
                <div class="preview-detail">
                  <span>压缩包文件</span>
                  <strong>${packageName}</strong>
                </div>
                <div class="preview-detail">
                  <span>资源状态</span>
                  <strong>${isProjectResource ? "可查看目录" : (isLibraryResource && item.hasPackage ? "可导入" : "仅可预览")}</strong>
                </div>
              </div>
            </div>
            <div class="preview-footer">
              <div class="preview-side-actions">
                ${isProjectResource ? `
                  <button class="action-btn primary preview-folder-btn" type="button">打开资源目录</button>
                ` : `
                  <button class="action-btn primary preview-import-btn" type="button" ${state.importState.loading ? "disabled" : ""}>
                    ${state.importState.loading ? "正在导入..." : "导入到项目"}
                  </button>
                `}
              </div>
              <div class="import-progress" style="display: ${!isProjectResource && state.importState.loading ? "block" : "none"}">
                <div class="import-progress-info">
                  <span class="import-progress-text">${buildProgressText(state.importState.progress)}</span>
                  <button class="import-cancel-btn" type="button" ${state.importState.cancelled ? "disabled" : ""}>${state.importState.cancelled ? "正在取消..." : "取消"}</button>
                </div>
                <div class="import-progress-bar${state.importState.progress.percent === -1 ? " indeterminate" : ""}">
                  <div class="import-progress-fill" style="width: ${state.importState.progress.percent > 0 ? state.importState.progress.percent : 0}%"></div>
                </div>
              </div>
              ${!isProjectResource && state.importState.message ? `<div class="preview-import-message">${state.importState.message}</div>` : ""}
            </div>
          </aside>
        </div>
      </section>
    </div>
  `;
}

function openPreviewModal(pageKey, item) {
  state.previewModal = {
    open: true,
    pageKey,
    item,
  };
  state.importState.message = "";
  state.importState.loading = false;
  render();
}

function closePreviewModal() {
  if (state.importState.loading) {
    return;
  }
  state.previewModal = {
    open: false,
    pageKey: "",
    item: null,
  };
  render();
}

function conflictModalMarkup() {
  if (!state.conflictModalOpen) {
    return "";
  }

  const conflicts = state.importState.conflicts;
  const totalFiles = state.importState.totalFiles;
  const isRunning = activeProject()?.status === "运行中";

  return `
    <div class="conflict-modal-backdrop" id="conflict-modal-backdrop">
      <section class="conflict-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="conflict-close-btn" aria-label="关闭">×</button>
        <div class="conflict-modal-head">
          <span class="preview-kicker">导入冲突</span>
          <strong>检测到 ${conflicts.length} 个同名文件</strong>
          <p>以下文件在目标项目中已存在，请选择处理方式。本次共 ${totalFiles} 个文件待导入。</p>
        </div>
        <div class="conflict-file-list">
          ${conflicts.map((filePath) => `<div class="conflict-file-item" title="${filePath}">${filePath}</div>`).join("")}
        </div>
        <div class="conflict-actions">
          <button class="action-btn" type="button" data-conflict-resolution="overwrite" ${state.importState.loading ? "disabled" : ""}>替换</button>
          <button class="action-btn" type="button" data-conflict-resolution="skip" ${state.importState.loading ? "disabled" : ""}>跳过</button>
          <button class="action-btn primary" type="button" data-conflict-resolution="overwrite_all" ${state.importState.loading ? "disabled" : ""}>全部替换</button>
          <button class="action-btn" type="button" data-conflict-resolution="skip_all" ${state.importState.loading ? "disabled" : ""}>全部跳过</button>
        </div>
        ${isRunning ? `
          <div class="conflict-actions conflict-actions-secondary">
            <button class="action-btn conflict-close-replace-btn" type="button" data-conflict-resolution="close_and_replace" ${state.importState.loading ? "disabled" : ""}>关掉项目全部替换</button>
          </div>
        ` : ""}
      </section>
    </div>
  `;
}

function contextMenuMarkup() {
  if (!state.contextMenu.open || !state.contextMenu.item) {
    return "";
  }
  const item = state.contextMenu.item;
  const isScriptFile = state.contextMenu.pageKey === "script-file";
  const isNodeSnippet = state.contextMenu.pageKey === "node-snippet";
  const isProjectResource = state.contextMenu.pageKey === "project";
  const isLibraryItem = typeof item === "object" && "folderPath" in item;
  const hasPackage = isLibraryItem && item.hasPackage;
  return `
    <div class="context-menu-backdrop" id="context-menu-backdrop">
      <div class="context-menu" style="left:${state.contextMenu.x}px;top:${state.contextMenu.y}px;">
        ${isScriptFile || isNodeSnippet ? `
          <button class="context-menu-item" type="button" data-context-action="${isNodeSnippet ? "edit-node" : "edit-script"}">编辑</button>
          <button class="context-menu-item danger" type="button" data-context-action="delete">删除</button>
        ` : `
          ${hasPackage && !isProjectResource ? `<button class="context-menu-item" type="button" data-context-action="import">导入到项目</button>` : ""}
          <button class="context-menu-item" type="button" data-context-action="edit">修改</button>
          <button class="context-menu-item" type="button" data-context-action="rename">重命名</button>
          <button class="context-menu-item danger" type="button" data-context-action="delete">删除</button>
          <button class="context-menu-item" type="button" data-context-action="folder">在文件夹中打开</button>
          <button class="context-menu-item" type="button" data-context-action="copy">复制路径</button>
          <button class="context-menu-item" type="button" data-context-action="details">查看详情</button>
        `}
      </div>
    </div>
  `;
}

function toastMarkup() {
  if (!state.toast.visible) {
    return "";
  }
  return `
    <div class="toast toast-${state.toast.type}">
      <span>${state.toast.message}</span>
    </div>
  `;
}

function deleteConfirmMarkup() {
  if (!state.deleteConfirm.open || !state.deleteConfirm.item) {
    return "";
  }

  const item = state.deleteConfirm.item;
  return `
    <div class="conflict-modal-backdrop" id="delete-confirm-backdrop">
      <section class="conflict-modal delete-confirm-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="delete-confirm-close-btn" aria-label="关闭">×</button>
        <div class="conflict-modal-head">
          <span class="preview-kicker">删除确认</span>
          <strong>确定删除这个资源吗？</strong>
          <p>删除后会移除整个资源文件夹，当前操作不可撤销。</p>
        </div>
        <div class="preview-import-message">
          <strong>${item.name || "未命名资源"}</strong><br />
          ${item.folderPath || ""}
        </div>
        ${state.deleteConfirm.message ? `<div class="preview-import-message">${state.deleteConfirm.message}</div>` : ""}
        <div class="conflict-actions">
          <button class="action-btn" type="button" id="delete-confirm-cancel-btn" ${state.deleteConfirm.loading ? "disabled" : ""}>取消</button>
          <button class="action-btn danger-action" type="button" id="delete-confirm-submit-btn" ${state.deleteConfirm.loading ? "disabled" : ""}>
            ${state.deleteConfirm.loading ? "正在删除..." : "确认删除"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function pluginRestartConfirmMarkup() {
  if (!state.pluginRestartConfirm.open) {
    return "";
  }

  const projectName = state.pluginRestartConfirm.projectName || "当前项目";
  return `
    <div class="conflict-modal-backdrop" id="plugin-restart-backdrop">
      <section class="conflict-modal delete-confirm-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="plugin-restart-close-btn" aria-label="关闭">×</button>
        <div class="conflict-modal-head">
          <span class="preview-kicker">插件导入完成</span>
          <strong>是否现在重启引擎？</strong>
          <p>插件已导入到 ${projectName}，重启虚幻引擎后插件会正式生效。</p>
        </div>
        ${state.pluginRestartConfirm.message ? `<div class="preview-import-message">${state.pluginRestartConfirm.message}</div>` : ""}
        <div class="conflict-actions">
          <button class="action-btn" type="button" id="plugin-restart-cancel-btn" ${state.pluginRestartConfirm.loading ? "disabled" : ""}>稍后重启</button>
          <button class="action-btn primary" type="button" id="plugin-restart-submit-btn" ${state.pluginRestartConfirm.loading ? "disabled" : ""}>
            ${state.pluginRestartConfirm.loading ? "正在重启..." : "立即重启"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function scriptEditorMarkup() {
  if (!state.scriptEditor.open) {
    return "";
  }

  return `
    <div class="modal-backdrop" id="script-editor-backdrop">
      <section class="script-editor-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="script-editor-close-btn" aria-label="关闭">×</button>
        <label class="script-editor-name-row">
          <span>脚本名称</span>
          <input
            class="settings-input"
            id="script-editor-name-input"
            type="text"
            value="${escapeHtml(scriptDisplayName(state.scriptEditor.name))}"
            placeholder="请输入脚本名称"
            ${state.scriptEditor.loading || state.scriptEditor.saving ? "disabled" : ""}
          />
        </label>
        <div class="script-code-shell">
          <pre class="script-code-highlight" id="script-code-highlight" aria-hidden="true">${highlightPythonCode(state.scriptEditor.code)}</pre>
          <textarea class="script-code-editor" id="script-code-editor" spellcheck="false" ${state.scriptEditor.loading || state.scriptEditor.saving ? "disabled" : ""}>${escapeHtml(state.scriptEditor.code)}</textarea>
        </div>
        ${state.scriptEditor.message ? `<div class="preview-import-message">${state.scriptEditor.message}</div>` : ""}
        <div class="asset-create-actions">
          <button class="action-btn" type="button" id="script-editor-cancel-btn" ${state.scriptEditor.saving ? "disabled" : ""}>取消</button>
          <button class="action-btn primary" type="button" id="script-editor-save-btn" ${state.scriptEditor.loading || state.scriptEditor.saving ? "disabled" : ""}>
            ${state.scriptEditor.saving ? "保存中..." : "保存"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function nodeEditorMarkup() {
  if (!state.nodeEditor.open) {
    return "";
  }

  return `
    <div class="modal-backdrop" id="node-editor-backdrop">
      <section class="script-editor-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="node-editor-close-btn" aria-label="关闭">×</button>
        <label class="script-editor-name-row">
          <span>节点名称</span>
          <input
            class="settings-input"
            id="node-editor-name-input"
            type="text"
            value="${escapeHtml(scriptDisplayName(state.nodeEditor.name).replace(/\.json$/i, ""))}"
            placeholder="请输入节点名称"
            ${state.nodeEditor.loading || state.nodeEditor.saving ? "disabled" : ""}
          />
        </label>
        <div class="script-code-shell node-code-shell">
          <pre class="script-code-highlight" id="node-code-highlight" aria-hidden="true">${escapeHtml(state.nodeEditor.code) || "&nbsp;"}</pre>
          <textarea class="script-code-editor" id="node-code-editor" spellcheck="false" wrap="soft" ${state.nodeEditor.loading || state.nodeEditor.saving ? "disabled" : ""}>${escapeHtml(state.nodeEditor.code)}</textarea>
        </div>
        ${state.nodeEditor.message ? `<div class="preview-import-message">${state.nodeEditor.message}</div>` : ""}
        <div class="asset-create-actions">
          <button class="action-btn" type="button" id="node-editor-cancel-btn" ${state.nodeEditor.saving ? "disabled" : ""}>取消</button>
          <button class="action-btn primary" type="button" id="node-editor-save-btn" ${state.nodeEditor.loading || state.nodeEditor.saving ? "disabled" : ""}>
            ${state.nodeEditor.saving ? "保存中..." : "保存"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function assetCreateMarkup() {
  if (!state.assetCreate.open) {
    return "";
  }

  const pageKey = state.assetCreate.pageKey;
  const label = assetLibrary(pageKey).label || pageMeta[pageKey]?.title || "资源";
  const video = state.assetCreate.video;
  const packageFile = state.assetCreate.package;
  const isPluginCreate = pageKey === "plugin";
  const pluginPackages = Array.isArray(state.assetCreate.pluginPackages) ? state.assetCreate.pluginPackages : [];
  return `
    <div class="modal-backdrop" id="asset-create-backdrop">
      <section class="asset-create-modal" role="dialog" aria-modal="true">
        <button class="preview-close" type="button" id="asset-create-close-btn" aria-label="关闭">×</button>
        <div class="asset-create-head">
          <span class="preview-kicker">${label}资产</span>
          <strong>添加资产</strong>
        </div>
        <div class="asset-create-body">
          <label class="asset-create-field">
            <span>资产名称</span>
            <input class="settings-input" id="asset-create-name-input" type="text" value="${state.assetCreate.name}" placeholder="输入资产名称" />
          </label>
          <div class="asset-drop-grid${isPluginCreate ? " plugin-create-grid" : ""}">
            <div class="asset-drop-zone${video ? " has-file" : ""}" data-asset-drop="video">
              <span>预览文件</span>
              <strong>${video ? video.name : "拖入图片 / mp4 / webm / mov / m4v"}</strong>
              ${video?.url ? (video.isImage ? `<img class="asset-drop-preview" src="${video.url}" alt="${video.name}" />` : `<video class="asset-drop-preview" src="${video.url}" muted loop playsinline autoplay></video>`) : ""}
              <div class="asset-drop-actions">
                <button class="asset-file-btn" type="button" data-asset-file-action="choose" data-asset-file-kind="video">选择文件</button>
                ${video ? `<button class="asset-file-btn ghost" type="button" data-asset-file-action="clear" data-asset-file-kind="video">清除</button>` : ""}
              </div>
            </div>
            <div class="asset-drop-zone${isPluginCreate ? (pluginPackages.length ? " has-file" : "") : (packageFile ? " has-file" : "")}" data-asset-drop="${isPluginCreate ? "plugin-packages" : "package"}">
              <span>${isPluginCreate ? "插件压缩包" : "资源压缩包"}</span>
              <strong>${isPluginCreate ? "拖入多个 zip / 7z / rar" : (packageFile ? packageFile.name : "拖入 zip / 7z / rar")}</strong>
              <div class="asset-package-mark">${isPluginCreate ? `${pluginPackages.length} 个版本包` : (packageFile ? "已选择压缩包" : "等待文件")}</div>
              <div class="asset-drop-actions">
                <button class="asset-file-btn" type="button" data-asset-file-action="choose" data-asset-file-kind="${isPluginCreate ? "plugin-packages" : "package"}">${isPluginCreate ? "选择多个文件" : "选择文件"}</button>
                ${isPluginCreate && pluginPackages.length ? `<button class="asset-file-btn ghost" type="button" data-asset-file-action="clear" data-asset-file-kind="plugin-packages">清除</button>` : ""}
                ${!isPluginCreate && packageFile ? `<button class="asset-file-btn ghost" type="button" data-asset-file-action="clear" data-asset-file-kind="package">清除</button>` : ""}
              </div>
            </div>
          </div>
          ${isPluginCreate ? `
            <div class="plugin-package-builder">
              <small class="asset-create-hint">压缩包文件名需要包含版本号，例如 NodeStorage5.3.7z、NodeStorage5.4.7z。</small>
              <div class="plugin-package-list">
                ${pluginPackages.length ? pluginPackages.map((entry) => `
                  <div class="plugin-package-row">
                    <strong>${entry.version || "未识别"}</strong>
                    <span>${entry.name}</span>
                    <button class="asset-file-btn ghost" type="button" data-plugin-package-remove="${entry.path}">移除</button>
                  </div>
                `).join("") : `<div class="plugin-package-empty">还没有选择插件压缩包</div>`}
              </div>
            </div>
          ` : ""}
          ${state.assetCreate.message ? `<div class="preview-import-message">${state.assetCreate.message}</div>` : ""}
        </div>
        <div class="asset-create-actions">
          <button class="action-btn" type="button" id="asset-create-cancel-btn" ${state.assetCreate.loading ? "disabled" : ""}>取消</button>
          <button class="action-btn primary" type="button" id="asset-create-submit-btn" ${state.assetCreate.loading ? "disabled" : ""}>
            ${state.assetCreate.loading ? "正在保存..." : "保存资产"}
          </button>
        </div>
      </section>
    </div>
  `;
}

function showToast(message, type = "info", duration = 3500) {
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  toastTimer = setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
    toastTimer = null;
  }, duration);
}

function releaseMediaElements(root = document) {
  root.querySelectorAll("video, audio").forEach((media) => {
    try {
      media.pause();
      media.removeAttribute("src");
      media.load();
    } catch (error) {
      // 忽略浏览器媒体释放错误。
    }
  });
}

function buildProgressText(progress) {
  if (!progress || !progress.stage) {
    return "";
  }
  if (progress.stage === "copying") {
    return `正在复制文件... ${progress.current || 0}/${progress.total || 0}`;
  }
  if (progress.stage === "error") {
    return `导入失败：${progress.message || "未知错误"}`;
  }
  return progress.message || "";
}

function registerImportProgress() {
  if (!window.libraryBridge?.onImportProgress) {
    return;
  }
  window.libraryBridge.onImportProgress((data) => {
    updateImportProgressDOM(data);
  });
}

function unregisterImportProgress() {
  if (window.libraryBridge?.offImportProgress) {
    window.libraryBridge.offImportProgress();
  }
}

function updateImportProgressDOM(progress) {
  if (!progress) {
    return;
  }
  state.importState.progress = {
    stage: progress.stage || "",
    message: progress.message || "",
    current: progress.current || 0,
    total: progress.total || 0,
    percent: progress.percent || 0,
  };

  const text = buildProgressText(state.importState.progress);
  const percent = state.importState.progress.percent || 0;
  const textEl = document.querySelector(".import-progress-text");
  const fillEl = document.querySelector(".import-progress-fill");

  // 进度元素不在 DOM 中时只更新 state，不触发 render 避免覆盖 toast
  if (!textEl || !fillEl) {
    return;
  }

  textEl.textContent = text;

  const barEl = document.querySelector(".import-progress-bar");
  if (percent === -1) {
    if (barEl) barEl.classList.add("indeterminate");
    if (fillEl) fillEl.style.width = "100%";
  } else {
    if (barEl) barEl.classList.remove("indeterminate");
    if (fillEl) fillEl.style.width = `${percent}%`;
  }
}

async function handleImportClick() {
  if (state.importState.loading) {
    return;
  }
  if (state.previewModal.pageKey === "project") {
    state.importState.message = "工程资源只能查看目录，不能导入到项目。";
    render();
    return;
  }
  const item = state.previewModal.item;
  if (!item || !item.packagePath) {
    state.importState.message = "当前资源没有压缩包，无法导入。";
    render();
    return;
  }

  const projectPath = state.activeProjectPath;
  if (!projectPath) {
    state.importState.message = "请先在主页选择目标项目。";
    render();
    return;
  }

  state.importState.loading = true;
  state.importState.message = "";
  state.importState.cancelled = false;
  state.importState.progress = { stage: "", message: "", current: 0, total: 0, percent: 0 };
  render();

  registerImportProgress();

  try {
    const isPluginImport = state.previewModal.pageKey === "plugin";
    const result = isPluginImport
      ? await window.libraryBridge?.preparePluginImport({
          projectPath,
          projectVersion: activeProject()?.version || "",
          packagePath: item.packagePath,
          pluginVersions: item.pluginVersions || [],
        })
      : await window.libraryBridge?.prepareImport({
          packagePath: item.packagePath,
          projectPath: projectPath,
        });

    if (state.importState.cancelled) {
      if (result?.tempDir) {
        try {
          await window.libraryBridge?.cancelImport({ tempDir: result.tempDir });
        } catch (cleanupError) {
          // 忽略清理错误
        }
      }
      state.importState.loading = false;
      state.importState.tempDir = "";
      state.importState.message = "导入已取消。";
      unregisterImportProgress();
      render();
      return;
    }

    if (!result?.success) {
      state.importState.loading = false;
      state.importState.message = result?.error || "导入准备失败，请重试。";
      unregisterImportProgress();
      render();
      return;
    }

    state.importState.tempDir = result.tempDir;
    state.importState.contentDir = result.contentDir;
    state.importState.targetContentDir = result.targetContentDir;
    state.importState.totalFiles = result.totalFiles;
    state.importState.mode = isPluginImport ? "plugin" : "content";
    state.importState.matchedVersion = result.matchedVersion || "";

    if (result.conflicts.length === 0) {
      state.importState.loading = false;
      await executeImportWithResolution("overwrite_all");
    } else {
      state.importState.conflicts = result.conflicts;
      state.importState.loading = false;
      state.conflictModalOpen = true;
      render();
    }
  } catch (error) {
    state.importState.loading = false;
    state.importState.message = "导入过程中出现错误，请重试。";
    unregisterImportProgress();
    render();
  }
}

async function executeImportWithResolution(resolution) {
  if (state.importState.loading) {
    return;
  }
  let actualResolution = resolution;
  let editorPath = "";

  if (resolution === "close_and_replace") {
    state.importState.loading = true;
    state.importState.cancelled = false;
    state.conflictModalOpen = false;
    state.importState.progress = { stage: "closing", message: "正在关闭 UE 编辑器...", current: 0, total: 0, percent: -1 };
    render();

    const projectPath = state.activeProjectPath;
    const closeResult = await window.libraryBridge?.closeEditor({ projectPath });

    if (!closeResult?.success) {
      state.importState.loading = false;
      state.importState.message = "关闭 UE 编辑器失败，请手动关闭后重试。";
      render();
      return;
    }

    editorPath = closeResult.editorPath || "";
    actualResolution = "overwrite_all";
  }

  state.importState.loading = true;
  state.importState.cancelled = false;
  state.conflictModalOpen = false;
  render();

  try {
    const result = await window.libraryBridge?.executeImport({
      tempDir: state.importState.tempDir,
      contentDir: state.importState.contentDir,
      targetContentDir: state.importState.targetContentDir,
      resolution: actualResolution,
    });

    state.importState.loading = false;

    if (result?.success) {
      const projectName = safeProjectName(activeProject());
      const projectPath = state.activeProjectPath;
      const hadConflicts = state.importState.conflicts.length > 0;
      const importMode = state.importState.mode;
      const matchedVersion = state.importState.matchedVersion;
      unregisterImportProgress();
      state.importState.conflicts = [];
      state.importState.tempDir = "";
      state.importState.contentDir = "";
      state.importState.targetContentDir = "";
      state.importState.mode = "content";
      state.importState.matchedVersion = "";
      state.importState.message = "";
      state.importState.cancelled = false;
      state.importState.progress = { stage: "", message: "", current: 0, total: 0, percent: 0 };
      state.previewModal = { open: false, pageKey: "", item: null };

      if (resolution === "close_and_replace" && editorPath) {
        render();
        showToast(`已导入到 ${projectName} 项目，正在打开项目...`, "success", 6000);
        setTimeout(async () => {
          await window.libraryBridge?.openProject({
            projectPath: state.activeProjectPath,
            editorPath: editorPath,
          });
        }, 1500);
      } else {
        const skippedNote = result.skippedCount > 0 ? `（跳过 ${result.skippedCount} 个同名文件）` : "";
        render();
        if (importMode === "plugin") {
          const versionNote = matchedVersion ? `（${matchedVersion}）` : "";
          state.pluginRestartConfirm = {
            open: true,
            projectName,
            projectPath,
            loading: false,
            message: `插件已导入到 Plugins${versionNote}${skippedNote}`,
          };
          render();
        } else if (hadConflicts) {
          showToast(`已导入到 ${projectName} 项目${skippedNote}，重启 UE 编辑器后可见`, "success");
        } else {
          showToast(`已导入到 ${projectName} 项目，可以在编辑器内查看`, "success");
        }
      }
    } else if (result?.cancelled) {
      unregisterImportProgress();
      state.importState.conflicts = [];
      state.importState.tempDir = "";
      state.importState.contentDir = "";
      state.importState.targetContentDir = "";
      state.importState.mode = "content";
      state.importState.matchedVersion = "";
      state.importState.cancelled = false;
      state.importState.progress = { stage: "", message: "", current: 0, total: 0, percent: 0 };
      state.importState.message = "导入已取消。";
      render();
    } else {
      unregisterImportProgress();
      state.importState.cancelled = false;
      state.importState.progress = { stage: "", message: "", current: 0, total: 0, percent: 0 };
      state.importState.message = result?.error || "导入失败，请重试。";
      render();
    }
  } catch (error) {
    state.importState.loading = false;
    state.importState.message = "导入执行失败，请重试。";
    unregisterImportProgress();
    render();
  }
}

async function closeConflictModal() {
  unregisterImportProgress();
  if (state.importState.tempDir) {
    try {
      await window.libraryBridge?.cancelImport({ tempDir: state.importState.tempDir });
    } catch (error) {
      // 忽略清理错误
    }
  }
  state.conflictModalOpen = false;
  state.importState.conflicts = [];
  state.importState.tempDir = "";
  state.importState.contentDir = "";
  state.importState.targetContentDir = "";
  state.importState.mode = "content";
  state.importState.matchedVersion = "";
  state.importState.loading = false;
  state.importState.cancelled = false;
  state.importState.progress = { stage: "", message: "", current: 0, total: 0, percent: 0 };
  render();
}

function closeContextMenu() {
  state.contextMenu = { open: false, x: 0, y: 0, item: null, pageKey: "" };
  render();
}

function openDeleteConfirm(pageKey, item) {
  state.deleteConfirm = {
    open: true,
    item,
    pageKey,
    loading: false,
    message: "",
  };
  render();
}

function closeDeleteConfirm() {
  if (state.deleteConfirm.loading) {
    return;
  }
  state.deleteConfirm = {
    open: false,
    item: null,
    pageKey: "",
    loading: false,
    message: "",
  };
  render();
}

function closePluginRestartConfirm() {
  if (state.pluginRestartConfirm.loading) {
    return;
  }
  state.pluginRestartConfirm = {
    open: false,
    projectName: "",
    projectPath: "",
    loading: false,
    message: "",
  };
  render();
}

async function restartEngineForPlugin() {
  if (state.pluginRestartConfirm.loading) {
    return;
  }

  const projectPath = state.pluginRestartConfirm.projectPath || state.activeProjectPath;
  if (!projectPath) {
    state.pluginRestartConfirm.message = "没有找到目标项目路径，请手动重启虚幻引擎。";
    render();
    return;
  }

  state.pluginRestartConfirm.loading = true;
  state.pluginRestartConfirm.message = "正在关闭当前虚幻引擎...";
  render();

  try {
    const closeResult = await window.libraryBridge?.closeEditor({ projectPath });
    if (!closeResult?.success || !closeResult.editorPath) {
      state.pluginRestartConfirm.loading = false;
      state.pluginRestartConfirm.message = "没有找到正在运行的引擎，请手动重新打开项目。";
      render();
      return;
    }

    state.pluginRestartConfirm.message = "正在重新打开项目...";
    render();
    await window.libraryBridge?.openProject({
      projectPath,
      editorPath: closeResult.editorPath,
    });

    state.pluginRestartConfirm = {
      open: false,
      projectName: "",
      projectPath: "",
      loading: false,
      message: "",
    };
    render();
    showToast("已开始重启虚幻引擎", "success", 6000);
  } catch (error) {
    state.pluginRestartConfirm.loading = false;
    state.pluginRestartConfirm.message = "重启引擎失败，请手动重新打开项目。";
    render();
  }
}

function handleContextMenuAction(action) {
  const item = state.contextMenu.item;
  const pageKey = state.contextMenu.pageKey;

  if (!item) {
    closeContextMenu();
    return;
  }

  if (pageKey === "script-file") {
    if (action === "edit-script" && item.scriptPath) {
      closeContextMenu();
      openScriptEditor(item);
      return;
    } else if (action === "delete" && item.scriptPath) {
      closeContextMenu();
      deleteScriptFile(item.scriptPath);
      return;
    }
    closeContextMenu();
    return;
  }

  if (pageKey === "node-snippet") {
    if (action === "edit-node" && item.path) {
      closeContextMenu();
      openNodeEditor(item);
      return;
    } else if (action === "delete" && item.path) {
      closeContextMenu();
      deleteNodeSnippet(item.path);
      return;
    }
    closeContextMenu();
    return;
  }

  if (action === "import" || action === "details") {
    closeContextMenu();
    openPreviewModal(pageKey, item);
  } else if (action === "edit") {
    if (item.folderPath) {
      window.libraryBridge?.showInFolder(item.folderPath);
    }
    closeContextMenu();
  } else if (action === "rename") {
    closeContextMenu();
    renameAssetItem(pageKey, item);
  } else if (action === "delete") {
    closeContextMenu();
    openDeleteConfirm(pageKey, item);
  } else if (action === "folder") {
    if (item.folderPath) {
      window.libraryBridge?.showInFolder(item.folderPath);
    }
    closeContextMenu();
  } else if (action === "copy") {
    if (item.folderPath) {
      window.libraryBridge?.copyPath(item.folderPath);
      showToast("路径已复制到剪贴板", "info");
    }
    closeContextMenu();
  } else {
    closeContextMenu();
  }
}

async function confirmDeleteAsset() {
  const item = state.deleteConfirm.item;
  const pageKey = state.deleteConfirm.pageKey;
  if (!item?.folderPath || !pageKey) {
    closeDeleteConfirm();
    return;
  }

  state.deleteConfirm.loading = true;
  state.deleteConfirm.message = "";
  document.querySelectorAll("video").forEach((video) => {
    video.pause();
    video.removeAttribute("src");
    video.load();
  });
  if (state.previewModal.open && state.previewModal.item?.folderPath === item.folderPath) {
    state.previewModal = { open: false, pageKey: "", item: null };
  }
  render();

  try {
    const result = await window.libraryBridge?.deleteAsset({ folderPath: item.folderPath });
    if (result?.success) {
      state.deleteConfirm = {
        open: false,
        item: null,
        pageKey: "",
        loading: false,
        message: "",
      };
      showToast("资源已删除", "success");
      await loadAssetLibrary(pageKey);
      return;
    }

    state.deleteConfirm.loading = false;
    state.deleteConfirm.message = result?.error || "删除失败";
    render();
  } catch (error) {
    state.deleteConfirm.loading = false;
    state.deleteConfirm.message = "删除失败，请稍后再试。";
    render();
  }
}

function revokeAssetCreateVideo() {
  if (state.assetCreate.video?.url) {
    URL.revokeObjectURL(state.assetCreate.video.url);
  }
}

function openAssetCreate(pageKey) {
  revokeAssetCreateVideo();
  state.assetCreate = {
    open: true,
    pageKey,
    name: "",
    pluginVersion: pageKey === "plugin" ? defaultPluginVersion() : "",
    pluginPackages: [],
    video: null,
    package: null,
    loading: false,
    message: "",
  };
  render();
}

function closeAssetCreate(force = false) {
  if (state.assetCreate.loading && !force) {
    return;
  }
  revokeAssetCreateVideo();
  state.assetCreate = {
    open: false,
    pageKey: "",
    name: "",
    pluginVersion: "",
    pluginPackages: [],
    video: null,
    package: null,
    loading: false,
    message: "",
  };
  render();
}

function assetNameFromFileName(fileName) {
  return String(fileName || "").replace(/\.[^.]+$/, "").trim();
}

function pluginVersionFromFileName(fileName) {
  const baseName = assetNameFromFileName(fileName);
  const match = baseName.match(/(?:UE\s*)?(\d+(?:\.\d+)?)/i);
  return match?.[1] ? `UE${match[1]}` : "";
}

function maybeFillAssetName(fileName) {
  if (!state.assetCreate.name.trim()) {
    state.assetCreate.name = assetNameFromFileName(fileName);
  }
}

function clearAssetCreateFile(kind) {
  if (kind === "video") {
    revokeAssetCreateVideo();
    state.assetCreate.video = null;
  }
  if (kind === "package") {
    state.assetCreate.package = null;
  }
  if (kind === "plugin-packages") {
    state.assetCreate.pluginPackages = [];
  }
  state.assetCreate.message = "";
  render();
}

function setPluginPackagesFromFiles(files) {
  const incoming = Array.from(files || [])
    .map((file) => {
      const filePath = file.path || window.libraryBridge?.filePath(file) || "";
      const fileName = file.name || filePath.split(/[/\\]/).pop() || "";
      return {
        version: file.version || pluginVersionFromFileName(fileName),
        name: fileName,
        path: filePath,
      };
    })
    .filter((file) => file.path && /\.(zip|7z|rar)$/i.test(file.name));

  if (!incoming.length) {
    state.assetCreate.message = "插件压缩包仅支持 zip、7z、rar。";
    render();
    return;
  }

  const unrecognized = incoming.find((file) => !file.version);
  if (unrecognized) {
    state.assetCreate.message = `${unrecognized.name} 没有识别到版本号，请按 NodeStorage5.3.7z 这种方式命名。`;
    render();
    return;
  }

  const packages = Array.isArray(state.assetCreate.pluginPackages) ? state.assetCreate.pluginPackages : [];
  state.assetCreate.pluginPackages = [...packages, ...incoming]
    .filter((entry, index, list) => list.findIndex((item) => item.version === entry.version) === index)
    .sort((left, right) => left.version.localeCompare(right.version, "zh-CN", { numeric: true }));
  maybeFillAssetName(incoming[0].name.replace(/\d+(?:\.\d+)?(?=\.[^.]+$)/, ""));
  state.assetCreate.message = `已识别 ${incoming.length} 个插件版本包。`;
  render();
}

function removePluginPackageFromCreate(packagePath) {
  state.assetCreate.pluginPackages = (state.assetCreate.pluginPackages || []).filter((entry) => entry.path !== packagePath);
  state.assetCreate.message = "";
  render();
}

function setAssetCreateFileFromPath(kind, fileInfo) {
  if (!fileInfo?.path) {
    return;
  }

  const isVideo = kind === "video";
  if (isVideo) {
    revokeAssetCreateVideo();
    state.assetCreate.video = {
      name: fileInfo.name,
      path: fileInfo.path,
      url: fileInfo.url || "",
      isImage: Boolean(fileInfo.isImage),
    };
  } else if (kind === "plugin-packages") {
    setPluginPackagesFromFiles([fileInfo]);
    return;
  } else {
    state.assetCreate.package = {
      name: fileInfo.name,
      path: fileInfo.path,
    };
  }
  maybeFillAssetName(fileInfo.name);
  state.assetCreate.message = "";
  render();
}

async function chooseAssetCreateFile(kind) {
  const result = await window.libraryBridge?.chooseAssetFile(kind);
  if (result?.success && kind === "plugin-packages") {
    setPluginPackagesFromFiles(result.files || []);
  } else if (result?.success) {
    setAssetCreateFileFromPath(kind, result.file);
  }
}

function setAssetCreateFile(kind, file) {
  if (!file) {
    return;
  }

  if (kind === "plugin-packages") {
    setPluginPackagesFromFiles(Array.from(file instanceof FileList ? file : [file]));
    return;
  }

  const filePath = window.libraryBridge?.filePath(file) || "";
  if (!filePath) {
    state.assetCreate.message = "无法读取文件路径，请从本地磁盘拖入文件。";
    render();
    return;
  }

  const isVideo = kind === "video";
  const allowed = isVideo ? /\.(mp4|webm|mov|m4v|jpe?g|png|webp|gif|bmp)$/i : /\.(zip|7z|rar)$/i;
  if (!allowed.test(file.name)) {
    state.assetCreate.message = isVideo ? "预览文件仅支持图片、mp4、webm、mov、m4v。" : "压缩包仅支持 zip、7z、rar。";
    render();
    return;
  }

  if (isVideo) {
    revokeAssetCreateVideo();
    state.assetCreate.video = {
      name: file.name,
      path: filePath,
      url: URL.createObjectURL(file),
      isImage: /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name),
    };
  } else {
    state.assetCreate.package = {
      name: file.name,
      path: filePath,
    };
  }
  maybeFillAssetName(file.name);
  state.assetCreate.message = "";
  render();
}

async function submitAssetCreate() {
  const createState = state.assetCreate;
  if (state.assetCreate.loading) {
    return;
  }
  if (!createState.name.trim()) {
    state.assetCreate.message = "请填写资产名称。";
    render();
    return;
  }

  const pluginPackages = createState.pageKey === "plugin"
    ? (state.assetCreate.pluginPackages || [])
    : [];
  if (createState.pageKey === "plugin" && pluginPackages.length === 0) {
    state.assetCreate.message = "请至少选择一个插件压缩包。";
    render();
    return;
  }

  state.assetCreate.loading = true;
  state.assetCreate.message = "";
  render();

  const result = await window.libraryBridge?.createAsset({
    type: createState.pageKey,
    name: createState.name,
    pluginVersion: createState.pluginVersion,
    pluginPackages,
    videoPath: createState.video?.path || "",
    packagePath: createState.package?.path || "",
  });

  if (result?.success) {
    const pageKey = createState.pageKey;
    closeAssetCreate(true);
    showToast("资产已添加", "success");
    await loadAssetLibrary(pageKey);
    return;
  }

  state.assetCreate.loading = false;
  state.assetCreate.message = result?.error || "添加资产失败。";
  render();
}

async function addAssetToPage(pageKey) {
  if (pageKey === "script") {
    openNewScriptEditor();
    return;
  }
  openAssetCreate(pageKey);
}

async function openAssetRoot(pageKey) {
  if (state.openingAssetRootByPage[pageKey]) {
    return;
  }
  state.openingAssetRootByPage = {
    ...state.openingAssetRootByPage,
    [pageKey]: true,
  };
  render();

  try {
    const result = await window.libraryBridge?.openAssetRoot(pageKey);
    if (!result?.success) {
      showToast(result?.error || "打开目录失败", "error");
    }
  } finally {
    state.openingAssetRootByPage = {
      ...state.openingAssetRootByPage,
      [pageKey]: false,
    };
    render();
  }
}

async function refreshAssetPage(pageKey) {
  if (assetLibrary(pageKey).loading) {
    return;
  }
  await loadAssetLibrary(pageKey);
  showToast("资源列表已刷新", "info");
}

async function checkUePythonConnection(silent = false) {
  if (state.uePython.checking) {
    return;
  }
  state.uePython.checking = !silent;
  if (!silent) {
    state.uePython.message = "正在检测 UE Python 服务...";
    render();
  }

  try {
    const result = await window.uePythonBridge?.ping();
    if (result?.success) {
      state.uePython.connected = true;
      state.uePython.busy = Boolean(result.busy);
      state.uePython.project = result.project || "";
      state.uePython.engine = result.engine || "";
      state.uePython.host = result.host || "127.0.0.1";
      state.uePython.port = result.port || 8765;
      state.uePython.failures = 0;
      state.uePython.message = "UE Python 服务已连接。";
    } else {
      state.uePython.failures += 1;
      if (state.uePython.failures >= 2 || !silent) {
        state.uePython.connected = false;
      }
      state.uePython.message = result?.error || "UE Python 服务未连接。";
    }
  } catch (error) {
    state.uePython.failures += 1;
    if (state.uePython.failures >= 2 || !silent) {
      state.uePython.connected = false;
    }
    state.uePython.message = "UE Python 服务未连接。";
  } finally {
    state.uePython.checking = false;
    state.uePython.lastCheckedAt = new Date().toISOString();
    if (!silent || !state.scriptEditor.open) {
      render();
    }
  }
}

async function copyUePythonBootstrapCode() {
  const result = await window.uePythonBridge?.getBootstrapCode();
  if (!result?.success || !result.code) {
    showToast("启动代码生成失败", "error");
    return;
  }
  await window.libraryBridge?.copyPath(result.code);
  state.uePython.message = `启动代码已复制，粘贴到 UE Python 控制台执行。`;
  render();
  showToast("UE Python 启动代码已复制", "success");
}

async function shutdownUePythonService() {
  const result = await window.uePythonBridge?.shutdown();
  state.uePython.connected = false;
  state.uePython.message = result?.success ? "UE Python 服务已关闭。" : (result?.error || "停止服务失败。");
  render();
}

async function executePythonScript(scriptPath) {
  if (!scriptPath || state.uePython.executing) {
    return;
  }
  if (!state.uePython.connected) {
    showToast("请先连接 UE Python 服务", "error");
    return;
  }

  state.uePython.executing = true;
  state.uePython.activeScriptPath = scriptPath;
  state.uePython.output = "正在读取脚本并发送到 UE...";
  state.uePython.message = "正在发送脚本到 UE...";
  render();

  try {
    const script = await window.libraryBridge?.readScriptFile(scriptPath);
    if (!script?.success) {
      state.uePython.output = script?.error || "读取脚本失败。";
      state.uePython.executing = false;
      state.uePython.activeScriptPath = "";
      render();
      return;
    }

    state.uePython.output = `正在执行 ${script.name} ...`;
    render();
    const result = await window.uePythonBridge?.execute({
      scriptName: script.name,
      code: script.code,
    });

    if (!result?.success || !result.requestId) {
      state.uePython.output = `执行提交失败：${result?.error || "UE Python 服务没有返回任务 ID。"}`;
      state.uePython.connected = false;
      state.uePython.executing = false;
      state.uePython.activeScriptPath = "";
      render();
      return;
    }

    state.uePython.requestId = result.requestId;
    state.uePython.output = `${script.name} 已发送到 UE，正在等待执行结果...`;
    state.uePython.message = `${script.name} 正在 UE 中执行...`;
    render();
    pollPythonExecutionResult(result.requestId, script.name);
  } catch (error) {
    state.uePython.connected = false;
    state.uePython.output = "执行失败：UE Python 服务没有响应。";
    state.uePython.message = "UE Python 服务连接中断。";
    state.uePython.executing = false;
    state.uePython.activeScriptPath = "";
    render();
  }
}

async function pollPythonExecutionResult(requestId, scriptName, attempts = 0) {
  if (!requestId || state.uePython.requestId !== requestId) {
    return;
  }

  if (attempts >= 240) {
    state.uePython.executing = false;
    state.uePython.activeScriptPath = "";
    state.uePython.output = `${scriptName} 执行超时，UE 可能仍在处理脚本。`;
    state.uePython.message = "脚本执行超时。";
    render();
    return;
  }

  try {
    const response = await window.uePythonBridge?.getResult(requestId);
    if (response?.success && response.done && response.result) {
      const result = response.result;
      const stdout = result.stdout ? `输出：\n${result.stdout}` : "";
      const stderr = result.stderr ? `错误：\n${result.stderr}` : "";
      const status = result.ok ? `执行成功，用时 ${result.durationMs || 0}ms` : "执行失败：请查看错误信息";
      state.uePython.output = [status, stdout, stderr].filter(Boolean).join("\n\n");
      state.uePython.message = result.ok ? "脚本执行完成。" : "脚本执行失败。";
      state.uePython.executing = false;
      state.uePython.requestId = "";
      state.uePython.activeScriptPath = "";
      showToast(result.ok ? "脚本执行完成" : "脚本执行失败", result.ok ? "success" : "error");
      render();
      return;
    }

    if (!response?.success) {
      state.uePython.executing = false;
      state.uePython.activeScriptPath = "";
      state.uePython.connected = false;
      state.uePython.output = response?.error || "获取执行结果失败。";
      state.uePython.message = "UE Python 服务连接中断。";
      render();
      return;
    }
  } catch (error) {
    state.uePython.executing = false;
    state.uePython.activeScriptPath = "";
    state.uePython.connected = false;
    state.uePython.output = "获取执行结果失败：UE Python 服务没有响应。";
    state.uePython.message = "UE Python 服务连接中断。";
    render();
    return;
  }

  setTimeout(() => pollPythonExecutionResult(requestId, scriptName, attempts + 1), 500);
}

async function openScriptEditor(item) {
  state.scriptEditor = {
    open: true,
    name: scriptDisplayName(item.scriptName || "Python 脚本"),
    filePath: item.scriptPath || "",
    code: "",
    isNew: false,
    loading: true,
    saving: false,
    message: "正在读取脚本...",
  };
  render();

  const result = await window.libraryBridge?.readScriptFile(item.scriptPath);
  if (result?.success) {
    state.scriptEditor.code = result.code || "";
    state.scriptEditor.loading = false;
    state.scriptEditor.message = "";
  } else {
    state.scriptEditor.loading = false;
    state.scriptEditor.message = result?.error || "读取脚本失败。";
  }
  render();
  document.getElementById("script-code-editor")?.focus();
}

function openNewScriptEditor() {
  state.scriptEditor = {
    open: true,
    name: "新建脚本",
    filePath: "",
    code: [
      "import unreal",
      "",
      "unreal.log(\"大龙工具：新建脚本执行成功\")",
      "",
    ].join("\n"),
    isNew: true,
    loading: false,
    saving: false,
    message: "",
  };
  render();
  document.getElementById("script-editor-name-input")?.focus();
}

function closeScriptEditor(force = false) {
  if (state.scriptEditor.saving && !force) {
    return;
  }
  state.scriptEditor = {
    open: false,
    name: "",
    filePath: "",
    code: "",
    isNew: false,
    loading: false,
    saving: false,
    message: "",
  };
  render();
}

async function saveScriptEditor() {
  if (state.scriptEditor.loading || state.scriptEditor.saving) {
    return;
  }

  state.scriptEditor.saving = true;
  state.scriptEditor.message = "";
  render();

  const result = await window.libraryBridge?.saveScriptFile({
    filePath: state.scriptEditor.filePath,
    nextName: state.scriptEditor.name,
    code: state.scriptEditor.code,
    createNew: state.scriptEditor.isNew,
  });

  if (result?.success) {
    closeScriptEditor(true);
    showToast("脚本已保存", "success");
    await loadAssetLibrary("script");
    return;
  }

  state.scriptEditor.saving = false;
  state.scriptEditor.message = result?.error || "保存脚本失败。";
  render();
}

async function deleteScriptFile(scriptPath) {
  const result = await window.libraryBridge?.deleteScriptFile(scriptPath);
  if (result?.success) {
    showToast("脚本已删除", "success");
    await loadAssetLibrary("script");
    return;
  }
  showToast(result?.error || "删除脚本失败", "error");
}

async function loadNodeLibrary(category = state.activeNodeCategory) {
  if (state.nodeLibrary.loading) {
    return;
  }
  state.nodeLibrary = {
    ...state.nodeLibrary,
    loading: true,
    message: "正在读取节点片段...",
  };
  render();

  try {
    const result = await window.libraryBridge?.getNodeSnippets(category);
    state.nodeLibrary = {
      loading: false,
      message: result?.message || "节点片段已读取。",
      libraryRoot: result?.libraryRoot || "",
      items: Array.isArray(result?.items) ? result.items : [],
    };
  } catch (error) {
    state.nodeLibrary = {
      loading: false,
      message: "节点片段读取失败。",
      libraryRoot: "",
      items: [],
    };
  }
  render();
}

async function switchNodeCategory(category) {
  if (!nodeCategoryOptions.some((item) => item.key === category) || state.activeNodeCategory === category) {
    return;
  }
  state.activeNodeCategory = category;
  await loadNodeLibrary(category);
}

async function copyNodeSnippet(filePath) {
  if (!filePath) {
    return;
  }
  const result = await window.libraryBridge?.copyNodeSnippet(filePath);
  if (result?.success) {
    showToast(`已复制节点：${result.name || "节点片段"}`, "success");
    return;
  }
  showToast(result?.error || "复制节点失败", "error");
}

async function openNodeDirectory() {
  const result = await window.libraryBridge?.openNodeDirectory(state.activeNodeCategory);
  if (!result?.success) {
    showToast(result?.error || "打开节点目录失败", "error");
  }
}

function openNewNodeEditor() {
  state.nodeEditor = {
    open: true,
    category: state.activeNodeCategory,
    name: "新建节点",
    filePath: "",
    code: "",
    isNew: true,
    loading: false,
    saving: false,
    message: "",
  };
  render();
  document.getElementById("node-editor-name-input")?.focus();
}

async function openNodeEditor(item) {
  state.nodeEditor = {
    open: true,
    category: state.activeNodeCategory,
    name: String(item.name || "节点片段").replace(/\.json$/i, ""),
    filePath: item.path || "",
    code: "",
    isNew: false,
    loading: true,
    saving: false,
    message: "正在读取节点内容...",
  };
  render();

  const result = await window.libraryBridge?.readNodeSnippet(item.path);
  if (result?.success) {
    state.nodeEditor.code = result.content || "";
    state.nodeEditor.loading = false;
    state.nodeEditor.message = "";
  } else {
    state.nodeEditor.loading = false;
    state.nodeEditor.message = result?.error || "读取节点失败。";
  }
  render();
  document.getElementById("node-code-editor")?.focus();
}

function closeNodeEditor(force = false) {
  if (state.nodeEditor.saving && !force) {
    return;
  }
  state.nodeEditor = {
    open: false,
    category: state.activeNodeCategory,
    name: "",
    filePath: "",
    code: "",
    isNew: false,
    loading: false,
    saving: false,
    message: "",
  };
  render();
}

async function saveNodeEditor() {
  if (state.nodeEditor.loading || state.nodeEditor.saving) {
    return;
  }
  state.nodeEditor.saving = true;
  state.nodeEditor.message = "";
  render();

  const result = await window.libraryBridge?.saveNodeSnippet({
    category: state.nodeEditor.category,
    filePath: state.nodeEditor.filePath,
    nextName: state.nodeEditor.name,
    content: state.nodeEditor.code,
    createNew: state.nodeEditor.isNew,
  });

  if (result?.success) {
    closeNodeEditor(true);
    showToast("节点片段已保存", "success");
    await loadNodeLibrary(state.activeNodeCategory);
    return;
  }

  state.nodeEditor.saving = false;
  state.nodeEditor.message = result?.error || "保存节点失败。";
  render();
}

async function deleteNodeSnippet(filePath) {
  const result = await window.libraryBridge?.deleteNodeSnippet(filePath);
  if (result?.success) {
    showToast("节点片段已删除", "success");
    await loadNodeLibrary(state.activeNodeCategory);
    return;
  }
  showToast(result?.error || "删除节点失败", "error");
}

async function renameAssetItem(pageKey, item) {
  if (!item?.folderPath) {
    return;
  }

  const nextName = window.prompt("输入新的资源名称", item.name || "");
  if (nextName === null) {
    return;
  }

  const result = await window.libraryBridge?.renameAsset({
    folderPath: item.folderPath,
    nextName,
  });

  if (result?.success) {
    showToast("资源已重命名", "success");
    await loadAssetLibrary(pageKey);
  } else {
    showToast(result?.error || "重命名失败", "error");
  }
}

function cardItemByIndex(pageKey, index) {
  const libraryItems = assetLibrary(pageKey).items;
  const items = assetPageKeys.includes(pageKey) ? libraryItems : (mediaCards[pageKey] || []);
  return items[index] || null;
}

function projectCard(project) {
  const active = project.path === state.activeProjectPath;
  const running = project.status === "运行中";
  const busy = state.switchingProject || state.removingProject;
  return `
    <article class="project-row${active ? " active" : ""}" data-project-path="${project.path}">
      <div class="project-indicator${running ? " running" : ""}"></div>
      <div class="project-info">
        <div class="project-row-head">
          <div class="project-row-name">${project.name}</div>
          <div class="project-tags">
            ${active ? '<span class="project-tag strong">当前目标</span>' : ""}
            ${running ? '<span class="project-tag">运行中</span>' : ""}
            ${!running && project.version ? `<span class="project-tag">${project.version}</span>` : ""}
          </div>
        </div>
        <div class="project-row-sub">${project.path}</div>
      </div>
      <div class="project-actions">
        <button class="project-switch-btn" type="button" data-switch-project="${project.path}" ${active || busy ? "disabled" : ""}>
          ${active ? "正在使用" : state.switchingProject ? "切换中..." : "切换项目"}
        </button>
        <button class="project-remove-btn" type="button" data-remove-project="${project.path}" ${busy ? "disabled" : ""}>${state.removingProject ? "清除中..." : "清除项目"}</button>
      </div>
    </article>
  `;
}

function statusPanel() {
  const current = activeProject();
  return `
    <div class="hero-status">
      <div class="status-panel">
        <strong>当前目标</strong>
        <p>${current ? "已选中项目后，其他资源页面会直接导入到这个项目。" : "当前还没有目标项目，请先检测或手动添加。"}
        </p>
        <div class="status-stack">
          <div class="status-item">
            <span>项目名称</span>
            <strong>${current?.name || "未选择项目"}</strong>
          </div>
          <div class="status-item">
            <span>引擎版本</span>
            <strong>${current?.version || "UE 未知版本"}</strong>
          </div>
          <div class="status-item">
            <span>项目路径</span>
            <strong>${current?.path || "暂无路径"}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}

function homePage() {
  const engine = activeEngine();
  const isConnected = engine.status === "connected";

  if (!isConnected) {
    return `
      <section class="page${state.activePage === "home" ? " active" : ""}" data-page-panel="home">
        <div class="content scrollable">
          <section class="engine-placeholder-panel">
            <div class="engine-placeholder-copy">
              <div class="eyebrow">${engine.name}</div>
              <h1>该引擎尚未接入</h1>
              <p>此模块仍在规划中，后续版本将支持。</p>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  const projectCount = state.projects.length;
  const resourceCount = assetLibrary("blueprint").items.length;
  const pluginCount = assetLibrary("plugin").items.length;
  const current = activeProject();
  const currentVersion = current?.version || "UE 未知版本";

  return `
    <section class="page${state.activePage === "home" ? " active" : ""}" data-page-panel="home">
      <div class="content scrollable">
        <section class="engine-overview-hero">
          <div class="engine-overview-copy">
            <div class="eyebrow">${engine.name} · 概览</div>
            <h1>${safeProjectName(current)}</h1>
            <p>当前目标项目已就绪，当前引擎版本：${currentVersion}。</p>
          </div>
          <div class="engine-overview-actions">
            <button class="action-btn primary" type="button" id="scan-projects-btn" ${state.loadingProjects ? "disabled" : ""}>
              ${state.loadingProjects ? "检测中..." : "检测已打开项目"}
            </button>
            <button class="action-btn" type="button" id="add-project-btn" ${state.addingProject ? "disabled" : ""}>${state.addingProject ? "等待选择..." : "手动添加项目"}</button>
          </div>
        </section>

        <div class="engine-stats-grid">
          <div class="engine-stat-card">
            <div class="engine-stat-number">${projectCount}</div>
            <div class="engine-stat-label">已检测项目</div>
          </div>
          <div class="engine-stat-card">
            <div class="engine-stat-number engine-stat-version">${currentVersion}</div>
            <div class="engine-stat-label">当前引擎版本</div>
          </div>
          <div class="engine-stat-card">
            <div class="engine-stat-number">${resourceCount}</div>
            <div class="engine-stat-label">蓝图资源</div>
          </div>
          <div class="engine-stat-card">
            <div class="engine-stat-number">${pluginCount}</div>
            <div class="engine-stat-label">插件资源</div>
          </div>
        </div>

        <div class="panel-note">${state.projectMessage}</div>

        <section class="panel">
          <div class="panel-head">
            <div class="panel-title">已检测到的项目</div>
            <div class="panel-note">切换后只高亮当前目标，不改变列表顺序</div>
          </div>
          <div class="project-list">
            ${state.projects.length ? sortedProjects().map(projectCard).join("") : '<div class="empty-panel">暂无项目，请先检测或手动添加。</div>'}
          </div>
        </section>
      </div>
    </section>
  `;
}

function cardPage(key) {
  const library = assetLibrary(key);
  const isAssetPage = assetPageKeys.includes(key);
  const label = library.label || pageMeta[key]?.title || "资源";
  const items = isAssetPage ? library.items : (mediaCards[key] || []);
  const showLibraryRoot = state.settings.showLibraryRootPath !== false;
  const openingRoot = Boolean(state.openingAssetRootByPage[key]);
  return `
    <section class="page${state.activePage === key ? " active" : ""}" data-page-panel="${key}">
      <div class="content scrollable">
        ${isAssetPage ? `
          <section class="resource-toolbar">
            <div class="resource-toolbar-main">
              <div class="resource-toolbar-actions">
                <button class="action-btn primary" type="button" data-asset-action="add" data-asset-page="${key}" ${library.loading ? "disabled" : ""}>添加</button>
                <button class="action-btn" type="button" data-asset-action="open-root" data-asset-page="${key}" ${openingRoot ? "disabled" : ""}>${openingRoot ? "打开中..." : "打开目录"}</button>
                <button class="action-btn" type="button" data-asset-action="refresh" data-asset-page="${key}" ${library.loading ? "disabled" : ""}>${library.loading ? "刷新中..." : "刷新"}</button>
              </div>
              ${showLibraryRoot ? `
                <div class="resource-root-bar">
                  <span>当前读取目录</span>
                  <strong title="${library.libraryRoot || "暂无目录"}">${library.libraryRoot || "暂无目录"}</strong>
                </div>
              ` : ""}
            </div>
            <div class="resource-toolbar-meta">
              <div class="resource-stat">
                <span>当前项目</span>
                <strong>${safeProjectName(activeProject())}</strong>
              </div>
              <div class="resource-stat">
                <span>资源数量</span>
                <strong>${items.length}</strong>
              </div>
            </div>
          </section>
        ` : ""}
        ${isAssetPage ? `<div class="panel-note library-note${library.loading ? " loading" : ""}">${library.loading ? `正在读取${label}资源...` : library.message}</div>` : ""}
        ${
          items.length
            ? `
              <div class="cards card-grid" data-page-grid="${key}" data-columns="${state.columns}">
                ${items.map((item, index) => createCard(item, index, key)).join("")}
              </div>
            `
            : '<div class="empty-panel">当前页面还没有可显示的资源。</div>'
        }
      </div>
    </section>
  `;
}

function scriptPage() {
  const library = assetLibrary("script");
  const items = library.items || [];
  const scripts = items.flatMap(scriptButtonsForResource);
  const showLibraryRoot = state.settings.showLibraryRootPath !== false;
  const openingRoot = Boolean(state.openingAssetRootByPage.script);
  const statusText = state.uePython.connected ? "已连接" : "未连接";
  const statusClass = state.uePython.connected ? "connected" : "disconnected";

  return `
    <section class="page${state.activePage === "script" ? " active" : ""}" data-page-panel="script">
      <div class="content scrollable script-workspace">
        <section class="script-console-panel">
          <div class="script-console-top">
            <div class="script-status-block">
              <span class="script-status-dot ${statusClass}"></span>
              <div>
                <div class="script-status-title">UE Python 服务${statusText}</div>
                <div class="script-status-sub">${state.uePython.connected ? `${state.uePython.project || "未知项目"} · ${state.uePython.engine || "未知版本"}` : state.uePython.message}</div>
              </div>
            </div>
            <div class="script-actions">
              <button class="action-btn" type="button" id="copy-ue-python-bootstrap-btn">复制启动代码</button>
              <button class="action-btn" type="button" id="check-ue-python-btn" ${state.uePython.checking ? "disabled" : ""}>${state.uePython.checking ? "检测中..." : "检测连接"}</button>
              <button class="action-btn" type="button" id="shutdown-ue-python-btn" ${!state.uePython.connected ? "disabled" : ""}>停止服务</button>
            </div>
          </div>
          <div class="script-help-strip">
            <span>1. 复制启动代码</span>
            <span>2. 粘贴到 UE Python 控制台执行</span>
            <span>3. 检测连接</span>
            <span>4. 点击脚本按钮执行</span>
          </div>
          <div class="script-console-bottom">
            <div class="resource-toolbar-actions">
              <button class="action-btn primary" type="button" data-asset-action="add" data-asset-page="script" ${library.loading ? "disabled" : ""}>添加</button>
              <button class="action-btn" type="button" data-asset-action="open-root" data-asset-page="script" ${openingRoot ? "disabled" : ""}>${openingRoot ? "打开中..." : "打开目录"}</button>
              <button class="action-btn" type="button" data-asset-action="refresh" data-asset-page="script" ${library.loading ? "disabled" : ""}>${library.loading ? "刷新中..." : "刷新"}</button>
            </div>
            ${showLibraryRoot ? `
              <div class="resource-root-bar">
                <span>当前读取目录</span>
                <strong title="${library.libraryRoot || "暂无目录"}">${library.libraryRoot || "暂无目录"}</strong>
              </div>
            ` : ""}
          </div>
        </section>

        <div class="script-section-head">
          <span class="panel-note library-note${library.loading ? " loading" : ""}">${library.loading ? "正在读取脚本资源..." : library.message}</span>
        </div>

        ${scripts.length ? `
          <div class="script-button-grid">
            ${scripts.map(scriptActionButton).join("")}
          </div>
        ` : '<div class="script-empty-state">当前页面还没有可执行的 Python 脚本。</div>'}
      </div>
    </section>
  `;
}

function scriptButtonsForResource(item) {
  return (item.pythonFiles || []).map((file) => ({
    resourceName: item.name,
    scriptName: file.name,
    scriptPath: file.path,
    folderPath: item.folderPath,
    isInit: /^init_unreal\.py$/i.test(file.name),
  }));
}

function scriptActionButton(script) {
  const isCurrent = state.uePython.requestId && state.uePython.activeScriptPath === script.scriptPath;
  const disabled = !state.uePython.connected || !script.scriptPath || (state.uePython.executing && !isCurrent);
  const label = isCurrent ? "执行中..." : scriptDisplayName(script.scriptName);
  const scriptPath = escapeHtml(script.scriptPath || "");
  const scriptName = escapeHtml(script.scriptName || "");
  const resourceName = escapeHtml(script.resourceName || "");
  const folderPath = escapeHtml(script.folderPath || "");
  return `
    <button
      class="script-exec-btn${isCurrent ? " running" : ""}${disabled ? " disabled" : ""}"
      type="button"
      data-script-execute="${scriptPath}"
      data-script-name="${scriptName}"
      data-script-resource="${resourceName}"
      data-script-folder="${folderPath}"
      data-script-disabled="${disabled ? "true" : "false"}"
      title="${scriptPath}"
    >
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function nodePage() {
  const category = nodeCategoryOptions.find((item) => item.key === state.activeNodeCategory) || nodeCategoryOptions[0];
  const library = state.nodeLibrary;
  const items = Array.isArray(library.items) ? library.items : [];
  const showLibraryRoot = state.settings.showLibraryRootPath !== false;

  return `
    <section class="page${state.activePage === "node" ? " active" : ""}" data-page-panel="node">
      <div class="content scrollable script-workspace">
        <section class="script-console-panel node-console-panel">
          <div class="script-console-top">
            <div class="script-status-block">
              <span class="script-status-dot connected"></span>
              <div>
                <div class="script-status-title">节点片段库 · ${category.label}</div>
                <div class="script-status-sub">点击按钮复制节点内容，到虚幻引擎中直接粘贴。</div>
              </div>
            </div>
            <div class="node-category-tabs">
              ${nodeCategoryOptions.map((option) => `
                <button class="node-category-tab${option.key === state.activeNodeCategory ? " active" : ""}" type="button" data-node-category="${option.key}">
                  ${option.label}
                </button>
              `).join("")}
            </div>
          </div>
          <div class="script-console-bottom">
            <div class="resource-toolbar-actions">
              <button class="action-btn primary" type="button" id="node-add-btn" ${library.loading ? "disabled" : ""}>添加</button>
              <button class="action-btn" type="button" id="node-open-dir-btn">打开目录</button>
              <button class="action-btn" type="button" id="node-refresh-btn" ${library.loading ? "disabled" : ""}>${library.loading ? "刷新中..." : "刷新"}</button>
            </div>
            ${showLibraryRoot ? `
              <div class="resource-root-bar">
                <span>当前读取目录</span>
                <strong title="${library.libraryRoot || "暂无目录"}">${library.libraryRoot || "暂无目录"}</strong>
              </div>
            ` : ""}
          </div>
        </section>

        <div class="script-section-head">
          <span class="panel-note library-note${library.loading ? " loading" : ""}">${library.loading ? "正在读取节点片段..." : library.message}</span>
        </div>

        ${items.length ? `
          <div class="script-button-grid">
            ${items.map(nodeActionButton).join("")}
          </div>
        ` : `<div class="script-empty-state">当前“${category.label}”分类还没有节点片段。</div>`}
      </div>
    </section>
  `;
}

function nodeActionButton(item) {
  const name = escapeHtml(String(item.name || "未命名节点").replace(/\.json$/i, ""));
  const filePath = escapeHtml(item.path || "");
  return `
    <button class="script-exec-btn node-copy-btn" type="button" data-node-copy="${filePath}" data-node-name="${name}" title="${filePath}">
      <span>${name}</span>
    </button>
  `;
}

function settingsPage() {
  const moduleOptions = [
    ["ae", "AE"],
    ["3dmax", "3Dmax"],
    ["blender", "Blender"],
    ["c4d", "C4D"],
    ["maya", "MAYA"],
    ["ps", "PS"],
  ];
  const checkedAtText = state.updateInfo.checkedAt
    ? new Date(state.updateInfo.checkedAt).toLocaleString("zh-CN", { hour12: false })
    : "尚未检查";

  return `
    <section class="page${state.activePage === "settings" ? " active" : ""}" data-page-panel="settings">
      <div class="content scrollable">
        <section class="panel settings-panel about-panel update-panel">
          <div class="panel-head">
            <div class="panel-title">检查更新</div>
            <div class="panel-note">检测当前软件是否有新版本</div>
          </div>
          <div class="about-block">
            <div class="about-main">
              <strong>大龙工具中枢</strong>
              <span>当前版本 v${state.settings.appVersion || state.updateInfo.currentVersion || "未知"}</span>
              <p>${state.updateInfo.message}</p>
            </div>
            <div class="about-meta-row">
              <div class="about-meta">
                <span>最新版本</span>
                <strong>${state.updateInfo.latestVersion ? `v${state.updateInfo.latestVersion}` : "未配置"}</strong>
              </div>
              <div class="about-meta">
                <span>最近检查</span>
                <strong>${checkedAtText}</strong>
              </div>
            </div>
            <div class="settings-actions">
              <button class="action-btn primary" type="button" id="check-update-btn" ${state.updateInfo.checking ? "disabled" : ""}>
                ${state.updateInfo.checking ? "检查中..." : "检查更新"}
              </button>
            </div>
          </div>
        </section>
        <section class="panel settings-panel">
          <div class="panel-head">
            <div class="panel-title">资源路径设置</div>
            <div class="panel-note">软件会读取这里的资源文件</div>
          </div>
          <div class="settings-stack">
            <div class="settings-field">
              <span class="settings-label">资源根目录</span>
              <input class="settings-input" id="resource-root-input" type="text" value="${state.settingsDraft.resourceRootPath || ""}" placeholder="请选择或输入资源根目录路径" />
              <div class="settings-actions settings-actions-inline">
                <button class="action-btn primary" type="button" id="choose-resource-root-btn" ${state.choosingResourceRoot ? "disabled" : ""}>${state.choosingResourceRoot ? "选择中..." : "选择目录"}</button>
                <button class="action-btn" type="button" id="save-resource-root-btn" ${state.savingSettings ? "disabled" : ""}>${state.savingSettings ? "保存中..." : "保存全部设置"}</button>
                <button class="action-btn" type="button" id="reload-resource-root-btn" ${assetPageKeys.some((pageKey) => assetLibrary(pageKey).loading) ? "disabled" : ""}>重新读取</button>
              </div>
            </div>
            <div class="settings-grid compact">
              <label class="settings-toggle">
                <input type="checkbox" id="show-library-root-toggle" ${state.settingsDraft.showLibraryRootPath ? "checked" : ""} />
                <span>顶部是否显示当前读取目录</span>
              </label>
            </div>
            <div class="settings-field">
              <span class="settings-label">顶部功能显示</span>
              <div class="module-toggle-group">
                ${moduleOptions.map(([id, label]) => `
                  <button
                    class="module-toggle${state.settingsDraft.visibleModules.includes(id) ? " active" : ""}"
                    type="button"
                    data-module-toggle="${id}"
                  >
                    ${label}
                  </button>
                `).join("")}
              </div>
              <div class="panel-note">选中的功能会显示在顶部栏，虚幻引擎始终显示。</div>
            </div>
            <div class="panel-note">${state.settingsMessage}</div>
          </div>
        </section>
      </div>
    </section>
  `;
}

function sidebarNavMarkup() {
  const engine = activeEngine();
  if (engine.status !== "connected" || !engine.pages.length) {
    return '<div class="sidebar-placeholder">该引擎尚未接入</div>';
  }
  return engine.pages
    .map((page) => navButton(page.id, page.label, page.icon, state.activePage === page.id))
    .join("");
}

function engineSwitcherMarkup() {
  return `
    <div class="engine-tabs">
      ${visibleEngines()
        .map((eng) => {
          const isActive = eng.id === state.activeEngine;
          const isDisabled = eng.status !== "connected";
          return `
            <button
              class="engine-tab${isActive ? " active" : ""}${isDisabled ? " disabled" : ""}"
              type="button"
              data-engine="${eng.id}"
              title="${eng.name}${isDisabled ? "（未接入）" : ""}"
            >
              <span class="engine-tab-name">${eng.name}</span>
              ${eng.status === "connected" ? '<span class="engine-tab-dot"></span>' : ""}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function viewControlsMarkup() {
  if (!assetPageKeys.includes(state.activePage) || state.activePage === "script" || state.activePage === "node") return "";
  const columnOptions = [2, 3, 4, 5, 6, 7, 8];
  return `
    <div class="view-controls">
      <span class="vc-label">每行</span>
      <div class="col-picker">
        ${columnOptions.map((n) => `
          <button class="col-btn${state.columns === n ? " active" : ""}" type="button" data-columns="${n}">${n}</button>
        `).join("")}
      </div>
      <div class="vc-divider"></div>
      <label class="vc-toggle">
        <input type="checkbox" id="resource-playback-toggle" ${state.settings.visibleOnlyPlayback ? "checked" : ""} />
        <span class="vc-label">悬停播放</span>
      </label>
      <div class="preview-fit-toggle" role="group" aria-label="预览显示方式">
        <button class="fit-btn${state.settings.squarePreviewFill ? "" : " active"}" type="button" data-preview-fit="contain">完整显示</button>
        <button class="fit-btn${state.settings.squarePreviewFill ? " active" : ""}" type="button" data-preview-fit="cover">方形填充</button>
      </div>
    </div>
  `;
}

function shellMarkup() {
  const meta = pageMeta[state.activePage] || { title: activeEngine().name, subtitle: activeEngine().subtitle };
  const motionScale = state.settings.motionStrength === "soft" ? 0.7 : state.settings.motionStrength === "strong" ? 1.35 : 1;
  const engine = activeEngine();
  const showTopbarCopy = ["home", "settings"].includes(state.activePage);
  const compactTopbar = !showTopbarCopy;
  const activePageMarkup = state.activePage === "home"
    ? homePage()
    : state.activePage === "script"
      ? scriptPage()
      : state.activePage === "node"
        ? nodePage()
        : state.activePage === "settings"
          ? settingsPage()
          : cardPage(state.activePage);

  return `
    <div class="window${state.settings.squarePreviewFill ? " square-preview-fill" : ""}" style="--app-radius:${state.settings.cornerRadius || 28}px; --motion-scale:${motionScale};">
      <div class="shell${state.sidebarCollapsed ? " sidebar-collapsed" : ""}">
        <div class="titlebar">
          <div class="titlebar-left">
            <div class="titlebar-mark"></div>
            <div class="titlebar-copy">
              <strong>大龙工具中枢</strong>
              <span>多引擎工具平台</span>
            </div>
          </div>
          ${engineSwitcherMarkup()}
          <div class="window-controls">
            <button class="window-btn pin${state.alwaysOnTop ? " active" : ""}" type="button" title="${state.alwaysOnTop ? "取消置顶" : "置顶"}" data-window-action="pin"><span aria-hidden="true"></span></button>
            <button class="window-btn min" type="button" title="最小化" data-window-action="minimize"></button>
            <button class="window-btn max" type="button" title="最大化" data-window-action="maximize"></button>
            <button class="window-btn close" type="button" title="关闭" data-window-action="close"></button>
          </div>
        </div>

        <aside class="sidebar">
          <div class="sidebar-head">
            <button class="menu-btn" id="sidebar-toggle" type="button" title="菜单">
              <span class="menu-glyph"><span></span></span>
            </button>
            <div class="sidebar-brand">
              <strong>${engine.name}</strong>
              <span>${engine.subtitle}</span>
            </div>
          </div>
          <div class="sidebar-nav">
            ${sidebarNavMarkup()}
          </div>
          <div class="sidebar-footer">
            ${navButton("settings", "设置", "settings", state.activePage === "settings")}
          </div>
        </aside>

        <main class="main${compactTopbar ? " main-compact" : ""}">
          <div class="topbar${compactTopbar ? " topbar-compact" : ""}">
            ${showTopbarCopy ? `
              <div class="toolbar-copy">
                <strong>${meta.title}</strong>
                <span>${meta.subtitle}</span>
              </div>
            ` : `
              <div class="toolbar-copy">
                <strong>${meta.title}</strong>
              </div>
              ${viewControlsMarkup()}
            `}
          </div>

          ${activePageMarkup}
        </main>
      </div>
      ${previewModalMarkup()}
      ${conflictModalMarkup()}
      ${deleteConfirmMarkup()}
      ${pluginRestartConfirmMarkup()}
      ${scriptEditorMarkup()}
      ${nodeEditorMarkup()}
      ${assetCreateMarkup()}
      ${toastMarkup()}
      ${contextMenuMarkup()}
    </div>
  `;
}

function render() {
  const root = document.getElementById("app");
  if (!root) {
    return;
  }
  const activeScroll = document.querySelector(`[data-page-panel="${state.activePage}"] .content.scrollable`);
  const activeScrollTop = activeScroll?.scrollTop || 0;

  // 保存当前所有 video 的播放状态，防止重绘后视频跳回开头
  const videoStates = {};
  document.querySelectorAll(".card-video").forEach((video) => {
    const card = video.closest(".card");
    if (card) {
      const key = `${card.dataset.cardPage}-${card.dataset.cardIndex}`;
      // 无条件保存所有视频状态（包括未播放的）
      videoStates[key] = {
        currentTime: video.currentTime || 0,
        paused: video.paused,
      };
    }
  });

  releaseMediaElements(root);
  root.innerHTML = shellMarkup();
  bindEvents();
  syncRuntimeStyles();
  const restoredScroll = document.querySelector(`[data-page-panel="${state.activePage}"] .content.scrollable`);
  if (restoredScroll) {
    restoredScroll.scrollTop = activeScrollTop;
  }

  // 恢复 video 播放状态
  document.querySelectorAll(".card-video").forEach((video) => {
    const card = video.closest(".card");
    if (!card) return;
    const key = `${card.dataset.cardPage}-${card.dataset.cardIndex}`;
    const saved = videoStates[key];
    if (!saved) return;
    const restore = () => {
      try {
        video.currentTime = saved.currentTime;
        if (!saved.paused) {
          playVideoElement(video);
        }
      } catch (e) {
        // 忽略
      }
    };
    if (video.readyState >= 1) {
      restore();
    } else {
      video.addEventListener("loadedmetadata", restore, { once: true });
    }
  });
}

function syncRuntimeStyles() {
  const windowShell = document.querySelector(".window");
  if (!windowShell) {
    return;
  }

  const motionScale = state.settings.motionStrength === "soft" ? 0.7 : state.settings.motionStrength === "strong" ? 1.35 : 1;
  windowShell.style.setProperty("--app-radius", `${state.settings.cornerRadius || 28}px`);
  windowShell.style.setProperty("--motion-scale", String(motionScale));
}

function applyProjectState(data, message) {
  state.projects = Array.isArray(data?.projects) ? data.projects : [];
  state.activeProjectPath = data?.activeProjectPath || state.projects[0]?.path || "";
  if (message) {
    state.projectMessage = message;
  }
}

async function loadProjectState() {
  try {
    const data = await window.projectBridge?.getState();
    applyProjectState(data, state.projects.length ? state.projectMessage : "点击检测已打开项目，或者手动添加 .uproject 文件。");
  } catch (error) {
    state.projectMessage = "项目状态读取失败。";
  }
  render();
}

async function loadSettingsState() {
  try {
    const data = await window.settingsBridge?.getSettings();
    state.settings = data || state.settings;
    state.settingsDraft = {
      resourceRootPath: data?.resourceRootPath || "",
      defaultPage: data?.defaultPage || "home",
      defaultCardColumns: Number(data?.defaultCardColumns) || 5,
      cornerRadius: Number(data?.cornerRadius) || 22,
      motionStrength: data?.motionStrength || "soft",
      visibleOnlyPlayback: data?.visibleOnlyPlayback !== false,
      squarePreviewFill: data?.squarePreviewFill !== false,
      showLibraryRootPath: data?.showLibraryRootPath !== false,
      visibleModules: Array.isArray(data?.visibleModules) ? data.visibleModules : [...optionalModuleIds],
    };
    state.columns = state.settingsDraft.defaultCardColumns;
    if (!state.activePage || state.activePage === "home") {
      state.activePage = state.settingsDraft.defaultPage || "home";
    }
  } catch (error) {
    state.settingsMessage = "设置读取失败。";
  }
  render();
}

async function loadAllAssetLibraries() {
  await loadAssetLibraries();
}

async function loadAssetLibrary(pageKey) {
  if (assetLibrary(pageKey).loading) {
    return;
  }
  const label = pageMeta[pageKey]?.title || "资源";
  state.assetLibraries[pageKey] = {
    ...assetLibrary(pageKey),
    loading: true,
    message: `正在读取${label}资源...`,
  };
  render();

  try {
    const data = await window.libraryBridge?.getAssets(pageKey);
    state.assetLibraries[pageKey] = {
      items: Array.isArray(data?.items) ? data.items : [],
      message: data?.message || `${pageMeta[pageKey]?.title || "资源"}资源已读取。`,
      libraryRoot: data?.libraryRoot || "",
      label: data?.label || pageMeta[pageKey]?.title || "资源",
      loading: false,
    };
  } catch (error) {
    state.assetLibraries[pageKey] = {
      items: [],
      message: `${pageMeta[pageKey]?.title || "资源"}资源读取失败。`,
      libraryRoot: "",
      label: pageMeta[pageKey]?.title || "资源",
      loading: false,
    };
  }
  render();
}

async function loadAssetLibraries() {
  if (assetPageKeys.some((pageKey) => assetLibrary(pageKey).loading)) {
    return;
  }
  assetPageKeys.forEach((pageKey) => {
    const label = pageMeta[pageKey]?.title || "资源";
    state.assetLibraries[pageKey] = {
      ...assetLibrary(pageKey),
      loading: true,
      message: `正在读取${label}资源...`,
    };
  });
  render();

  const requests = assetPageKeys.map(async (pageKey) => {
    try {
      const data = await window.libraryBridge?.getAssets(pageKey);
      return [
        pageKey,
        {
          items: Array.isArray(data?.items) ? data.items : [],
          message: data?.message || `${pageMeta[pageKey]?.title || "资源"}资源已读取。`,
          libraryRoot: data?.libraryRoot || "",
          label: data?.label || pageMeta[pageKey]?.title || "资源",
          loading: false,
        },
      ];
    } catch (error) {
      return [
        pageKey,
        {
          items: [],
          message: `${pageMeta[pageKey]?.title || "资源"}资源读取失败。`,
          libraryRoot: "",
          label: pageMeta[pageKey]?.title || "资源",
          loading: false,
        },
      ];
    }
  });

  const entries = await Promise.all(requests);
  entries.forEach(([pageKey, library]) => {
    state.assetLibraries[pageKey] = library;
  });
  render();
}

async function scanProjects() {
  if (state.loadingProjects) {
    return;
  }
  state.loadingProjects = true;
  state.projectMessage = "正在检测本地已打开的虚幻项目...";
  render();

  try {
    const data = await window.projectBridge?.scanOpenProjects();
    const count = Array.isArray(data?.projects) ? data.projects.length : 0;
    applyProjectState(data, count ? `已检测到 ${count} 个项目，可直接切换当前目标。` : "未检测到正在打开的虚幻项目。");
  } catch (error) {
    state.projectMessage = "项目检测失败，请稍后再试。";
  }

  state.loadingProjects = false;
  render();
}

async function addProject() {
  if (state.addingProject) {
    return;
  }
  state.addingProject = true;
  state.projectMessage = "正在等待选择 .uproject 文件...";
  render();

  try {
    const data = await window.projectBridge?.addProject();
    const count = Array.isArray(data?.projects) ? data.projects.length : 0;
    applyProjectState(data, count ? "项目已添加，可以作为当前导入目标使用。" : "未选择项目文件。");
  } catch (error) {
    state.projectMessage = "手动添加项目失败。";
  } finally {
    state.addingProject = false;
  }

  render();
}

async function setActiveProject(projectPath) {
  if (state.switchingProject) {
    return;
  }
  state.switchingProject = true;
  render();

  try {
    const data = await window.projectBridge?.setActiveProject(projectPath);
    applyProjectState(data, "当前目标项目已切换。");
  } catch (error) {
    state.projectMessage = "切换当前项目失败。";
  } finally {
    state.switchingProject = false;
  }

  render();
}

async function removeProject(projectPath) {
  if (state.removingProject) {
    return;
  }
  state.removingProject = true;
  render();

  try {
    const data = await window.projectBridge?.removeProject(projectPath);
    applyProjectState(data, data?.projects?.length ? "项目已清除。" : "项目列表已清空。");
  } catch (error) {
    state.projectMessage = "清除项目失败。";
  } finally {
    state.removingProject = false;
  }

  render();
}

function applySettingsState(data, message) {
  state.settings = data || state.settings;
  state.settingsDraft = {
    resourceRootPath: data?.resourceRootPath || "",
    defaultPage: data?.defaultPage || "home",
    defaultCardColumns: Number(data?.defaultCardColumns) || 5,
    cornerRadius: Number(data?.cornerRadius) || 22,
    motionStrength: data?.motionStrength || "soft",
    visibleOnlyPlayback: data?.visibleOnlyPlayback !== false,
    squarePreviewFill: data?.squarePreviewFill !== false,
    showLibraryRootPath: data?.showLibraryRootPath !== false,
    visibleModules: Array.isArray(data?.visibleModules) ? data.visibleModules : [...optionalModuleIds],
  };
  state.columns = state.settingsDraft.defaultCardColumns;
  state.updateInfo.currentVersion = data?.appVersion || state.updateInfo.currentVersion;
  if (message) {
    state.settingsMessage = message;
  }
}

async function checkForUpdates() {
  if (state.updateInfo.checking) {
    return;
  }
  state.updateInfo.checking = true;
  state.updateInfo.message = "正在检查远端版本...";
  render();

  try {
    const result = await window.settingsBridge?.checkForUpdates();
    state.updateInfo = {
      checking: false,
      currentVersion: result?.currentVersion || state.settings.appVersion || "",
      latestVersion: result?.latestVersion || "",
      hasUpdate: Boolean(result?.hasUpdate),
      checkedAt: result?.checkedAt || "",
      releaseUrl: result?.releaseUrl || "",
      message: result?.message || "检查完成。",
    };
  } catch (error) {
    state.updateInfo = {
      ...state.updateInfo,
      checking: false,
      checkedAt: new Date().toISOString(),
      message: "检查更新失败。",
    };
  }

  render();
}

async function chooseResourceRoot() {
  if (state.choosingResourceRoot) {
    return;
  }
  state.choosingResourceRoot = true;
  render();

  try {
    const data = await window.settingsBridge?.chooseResourceRoot();
    applySettingsState(data, data?.resourceRootPath ? "资源目录已更新，并完成重新读取。" : "未选择资源目录。");
  } catch (error) {
    state.settingsMessage = "选择资源目录失败。";
  } finally {
    state.choosingResourceRoot = false;
  }
  await loadAllAssetLibraries();
  render();
}

async function saveResourceRoot() {
  if (state.savingSettings) {
    return;
  }
  state.savingSettings = true;
  render();

  try {
    const data = await window.settingsBridge?.saveAll(state.settingsDraft);
    applySettingsState(data, data?.resourceRootPath ? "设置已保存，并完成重新读取。" : "设置已保存。");
  } catch (error) {
    state.settingsMessage = "保存设置失败。";
  } finally {
    state.savingSettings = false;
  }
  await loadAllAssetLibraries();
  render();
}

async function saveCurrentSettings() {
  try {
    const data = await window.settingsBridge?.saveAll(state.settingsDraft);
    applySettingsState(data);
  } catch (error) {
    state.settingsMessage = "设置保存失败。";
  }
}

function closeAllCustomSelects(event) {
  document.querySelectorAll(".custom-select.open").forEach((select) => {
    if (!select.contains(event.target)) {
      select.classList.remove("open");
    }
  });
}

let globalClickBound = false;
let uePythonHeartbeatTimer = null;
let toastTimer = null;

function bindEvents() {
  document.querySelectorAll("[data-engine]").forEach((button) => {
    button.addEventListener("click", () => {
      const engineId = button.dataset.engine;
      const engine = engines.find((e) => e.id === engineId);
      if (!engine) return;
      state.activeEngine = engineId;
      state.activePage = "home";
      render();
    });
  });

  document.querySelectorAll("[data-page]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePage = button.dataset.page;
      render();
      if (state.activePage === "node") {
        loadNodeLibrary(state.activeNodeCategory);
      }
    });
  });

  document.querySelectorAll("[data-columns]").forEach((button) => {
    button.addEventListener("click", () => {
      state.columns = Number(button.dataset.columns);
      render();
    });
  });

  document.querySelectorAll("[data-project-path]").forEach((item) => {
    item.addEventListener("click", () => {
      if (state.switchingProject || state.removingProject) {
        return;
      }
      const projectPath = item.dataset.projectPath;
      if (projectPath) {
        setActiveProject(projectPath);
      }
    });
  });

  document.querySelectorAll("[data-switch-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (button.disabled) {
        return;
      }
      event.stopPropagation();
      const projectPath = button.dataset.switchProject;
      if (projectPath) {
        setActiveProject(projectPath);
      }
    });
  });

  document.querySelectorAll("[data-remove-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
      if (button.disabled) {
        return;
      }
      event.stopPropagation();
      const projectPath = button.dataset.removeProject;
      if (projectPath) {
        removeProject(projectPath);
      }
    });
  });

  document.querySelectorAll("[data-window-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.windowAction;
      if (action === "minimize") {
        window.desktopWindow?.minimize();
      }
      if (action === "maximize") {
        window.desktopWindow?.maximizeToggle();
      }
      if (action === "pin") {
        window.desktopWindow?.alwaysOnTopToggle()?.then((isPinned) => {
          state.alwaysOnTop = Boolean(isPinned);
          render();
        });
      }
      if (action === "close") {
        window.desktopWindow?.close();
      }
    });
  });

  document.getElementById("sidebar-toggle")?.addEventListener("click", () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    render();
  });

  document.getElementById("scan-projects-btn")?.addEventListener("click", () => {
    if (state.loadingProjects) {
      return;
    }
    scanProjects();
  });

  document.getElementById("add-project-btn")?.addEventListener("click", () => {
    if (state.addingProject) {
      return;
    }
    addProject();
  });

  document.getElementById("choose-resource-root-btn")?.addEventListener("click", () => {
    if (state.choosingResourceRoot) {
      return;
    }
    chooseResourceRoot();
  });

  document.getElementById("save-resource-root-btn")?.addEventListener("click", () => {
    if (state.savingSettings) {
      return;
    }
    saveResourceRoot();
  });

  document.getElementById("reload-resource-root-btn")?.addEventListener("click", () => {
    if (assetPageKeys.some((pageKey) => assetLibrary(pageKey).loading)) {
      return;
    }
    loadSettingsState();
    loadAllAssetLibraries();
  });

  document.getElementById("check-update-btn")?.addEventListener("click", () => {
    if (state.updateInfo.checking) {
      return;
    }
    checkForUpdates();
  });

  document.getElementById("copy-ue-python-bootstrap-btn")?.addEventListener("click", () => {
    copyUePythonBootstrapCode();
  });

  document.getElementById("check-ue-python-btn")?.addEventListener("click", () => {
    checkUePythonConnection(false);
  });

  document.getElementById("shutdown-ue-python-btn")?.addEventListener("click", () => {
    shutdownUePythonService();
  });

  document.querySelectorAll("[data-script-execute]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.scriptDisabled === "true") {
        return;
      }
      executePythonScript(button.dataset.scriptExecute);
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const maxX = window.innerWidth - 180;
      const maxY = window.innerHeight - 160;
      state.contextMenu = {
        open: true,
        x: Math.min(event.clientX, maxX),
        y: Math.min(event.clientY, maxY),
        item: {
          scriptName: button.dataset.scriptName || "",
          scriptPath: button.dataset.scriptExecute || "",
          folderPath: button.dataset.scriptFolder || "",
        },
        pageKey: "script-file",
      };
      render();
    });
  });

  document.querySelectorAll("[data-node-category]").forEach((button) => {
    button.addEventListener("click", () => {
      switchNodeCategory(button.dataset.nodeCategory);
    });
  });

  document.getElementById("node-add-btn")?.addEventListener("click", () => {
    openNewNodeEditor();
  });

  document.getElementById("node-open-dir-btn")?.addEventListener("click", () => {
    openNodeDirectory();
  });

  document.getElementById("node-refresh-btn")?.addEventListener("click", () => {
    loadNodeLibrary(state.activeNodeCategory);
  });

  document.querySelectorAll("[data-node-copy]").forEach((button) => {
    button.addEventListener("click", () => {
      copyNodeSnippet(button.dataset.nodeCopy);
    });
    button.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      const maxX = window.innerWidth - 180;
      const maxY = window.innerHeight - 160;
      state.contextMenu = {
        open: true,
        x: Math.min(event.clientX, maxX),
        y: Math.min(event.clientY, maxY),
        item: {
          name: button.dataset.nodeName || "",
          path: button.dataset.nodeCopy || "",
        },
        pageKey: "node-snippet",
      };
      render();
    });
  });

  document.querySelectorAll("[data-asset-action]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }
      const action = button.dataset.assetAction;
      const pageKey = button.dataset.assetPage;
      if (!pageKey) return;

      if (action === "add") {
        addAssetToPage(pageKey);
      }
      if (action === "open-root") {
        openAssetRoot(pageKey);
      }
      if (action === "refresh") {
        refreshAssetPage(pageKey);
      }
    });
  });

  document.getElementById("resource-root-input")?.addEventListener("input", (event) => {
    state.settingsDraft.resourceRootPath = event.target.value;
  });

  document.querySelectorAll("[data-select-trigger]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectId = button.dataset.selectTrigger;
      document.querySelectorAll(".custom-select.open").forEach((select) => {
        if (select.dataset.selectId !== selectId) {
          select.classList.remove("open");
        }
      });
      button.closest(".custom-select")?.classList.toggle("open");
    });
  });

  document.querySelectorAll("[data-select-option]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const selectId = button.dataset.selectOption;
      const value = button.dataset.value || "";

      if (selectId === "default-columns") {
        state.settingsDraft.defaultCardColumns = Number(value);
        state.columns = Number(value);
      }

      render();
    });
  });

  document.getElementById("show-library-root-toggle")?.addEventListener("change", (event) => {
    state.settingsDraft.showLibraryRootPath = event.target.checked;
    state.settings.showLibraryRootPath = event.target.checked;
    render();
  });

  document.querySelectorAll("[data-module-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const moduleId = button.dataset.moduleToggle;
      const visible = new Set(state.settingsDraft.visibleModules);
      if (visible.has(moduleId)) {
        visible.delete(moduleId);
      } else {
        visible.add(moduleId);
      }

      state.settingsDraft.visibleModules = [...visible].filter((id) => optionalModuleIds.includes(id));
      state.settings.visibleModules = state.settingsDraft.visibleModules;
      if (optionalModuleIds.includes(state.activeEngine) && !state.settings.visibleModules.includes(state.activeEngine)) {
        state.activeEngine = "unreal";
        state.activePage = "home";
      }
      render();
    });
  });

  document.getElementById("resource-playback-toggle")?.addEventListener("change", (event) => {
    state.settingsDraft.visibleOnlyPlayback = event.target.checked;
    state.settings.visibleOnlyPlayback = event.target.checked;
    saveCurrentSettings();
    applyPlaybackMode();
  });

  document.querySelectorAll("[data-preview-fit]").forEach((button) => {
    button.addEventListener("click", () => {
      const shouldFill = button.dataset.previewFit === "cover";
      state.settingsDraft.squarePreviewFill = shouldFill;
      state.settings.squarePreviewFill = shouldFill;
      saveCurrentSettings();
      render();
    });
  });

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const pageKey = card.dataset.cardPage;
      if (state.importState.loading || state.deleteConfirm.loading || assetLibrary(pageKey).loading) {
        return;
      }
      const grid = card.closest(".card-grid");
      if (!grid) {
        return;
      }
      const cardIndex = Number(card.dataset.cardIndex || 0);

      if (pageKey) {
        state.activeCardIndexByPage[pageKey] = cardIndex;
        const item = cardItemByIndex(pageKey, cardIndex);
        openPreviewModal(pageKey, item);
      }
    });

    card.addEventListener("mouseenter", () => {
      if (!state.settingsDraft.visibleOnlyPlayback) {
        return;
      }

      card.querySelectorAll(".card-video").forEach((video) => {
        playVideoElement(video);
      });
    });

    card.addEventListener("mouseleave", () => {
      if (!state.settingsDraft.visibleOnlyPlayback) {
        return;
      }

      card.querySelectorAll(".card-video").forEach((video) => {
        video.pause();
      });
    });

    card.addEventListener("contextmenu", (event) => {
      if (state.importState.loading || state.deleteConfirm.loading) {
        return;
      }
      const pageKey = card.dataset.cardPage;
      if (assetLibrary(pageKey).loading) {
        return;
      }
      const cardIndex = Number(card.dataset.cardIndex || 0);
      const item = cardItemByIndex(pageKey, cardIndex);
      if (item && typeof item === "object" && "folderPath" in item) {
        event.preventDefault();
        const maxX = window.innerWidth - 180;
        const maxY = window.innerHeight - 200;
        state.contextMenu = {
          open: true,
          x: Math.min(event.clientX, maxX),
          y: Math.min(event.clientY, maxY),
          item: item,
          pageKey: pageKey,
        };
        render();
      }
    });
  });

  document.getElementById("context-menu-backdrop")?.addEventListener("click", () => {
    closeContextMenu();
  });

  document.querySelectorAll("[data-context-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.contextAction;
      handleContextMenuAction(action);
    });
  });

  document.querySelectorAll(".content.scrollable").forEach((container) => {
    container.addEventListener(
      "wheel",
      (event) => {
        const canScroll = container.scrollHeight > container.clientHeight;
        if (!canScroll) {
          return;
        }

        event.preventDefault();
        container.scrollTop += event.deltaY;
      },
      { passive: false }
    );
  });

  if (!globalClickBound) {
    document.addEventListener("click", closeAllCustomSelects);
    globalClickBound = true;
  }

  document.getElementById("preview-close-btn")?.addEventListener("click", () => {
    closePreviewModal();
  });

  document.getElementById("preview-modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "preview-modal-backdrop") {
      closePreviewModal();
    }
  });

  document.querySelector(".preview-import-btn")?.addEventListener("click", () => {
    if (state.importState.loading) {
      return;
    }
    handleImportClick();
  });

  document.querySelector(".preview-folder-btn")?.addEventListener("click", () => {
    const folderPath = state.previewModal.item?.folderPath;
    if (!folderPath) {
      showToast("没有找到资源目录", "error");
      return;
    }
    window.libraryBridge?.showInFolder(folderPath);
  });

  document.querySelectorAll("[data-conflict-resolution]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.importState.loading || button.disabled) {
        return;
      }
      const resolution = button.dataset.conflictResolution;
      if (resolution) {
        executeImportWithResolution(resolution);
      }
    });
  });

  document.getElementById("conflict-close-btn")?.addEventListener("click", () => {
    closeConflictModal();
  });

  document.getElementById("conflict-modal-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "conflict-modal-backdrop") {
      closeConflictModal();
    }
  });

  document.getElementById("delete-confirm-close-btn")?.addEventListener("click", () => {
    closeDeleteConfirm();
  });

  document.getElementById("delete-confirm-cancel-btn")?.addEventListener("click", () => {
    closeDeleteConfirm();
  });

  document.getElementById("delete-confirm-submit-btn")?.addEventListener("click", () => {
    if (state.deleteConfirm.loading) {
      return;
    }
    confirmDeleteAsset();
  });

  document.getElementById("delete-confirm-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "delete-confirm-backdrop") {
      closeDeleteConfirm();
    }
  });

  document.getElementById("plugin-restart-close-btn")?.addEventListener("click", () => {
    closePluginRestartConfirm();
  });

  document.getElementById("plugin-restart-cancel-btn")?.addEventListener("click", () => {
    closePluginRestartConfirm();
  });

  document.getElementById("plugin-restart-submit-btn")?.addEventListener("click", () => {
    restartEngineForPlugin();
  });

  document.getElementById("plugin-restart-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "plugin-restart-backdrop") {
      closePluginRestartConfirm();
    }
  });

  document.getElementById("script-code-editor")?.addEventListener("input", (event) => {
    state.scriptEditor.code = event.target.value;
    const highlight = document.getElementById("script-code-highlight");
    if (highlight) {
      highlight.innerHTML = highlightPythonCode(event.target.value);
    }
  });

  document.getElementById("script-code-editor")?.addEventListener("scroll", (event) => {
    const highlight = document.getElementById("script-code-highlight");
    if (!highlight) {
      return;
    }
    highlight.scrollTop = event.target.scrollTop;
    highlight.scrollLeft = event.target.scrollLeft;
  });

  document.getElementById("script-editor-name-input")?.addEventListener("input", (event) => {
    state.scriptEditor.name = event.target.value;
  });

  document.getElementById("script-editor-close-btn")?.addEventListener("click", () => {
    closeScriptEditor();
  });

  document.getElementById("script-editor-cancel-btn")?.addEventListener("click", () => {
    closeScriptEditor();
  });

  document.getElementById("script-editor-save-btn")?.addEventListener("click", () => {
    saveScriptEditor();
  });

  document.getElementById("script-editor-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "script-editor-backdrop") {
      closeScriptEditor();
    }
  });

  document.getElementById("node-code-editor")?.addEventListener("input", (event) => {
    state.nodeEditor.code = event.target.value;
    const highlight = document.getElementById("node-code-highlight");
    if (highlight) {
      highlight.textContent = event.target.value || " ";
    }
  });

  document.getElementById("node-code-editor")?.addEventListener("scroll", (event) => {
    const highlight = document.getElementById("node-code-highlight");
    if (!highlight) {
      return;
    }
    highlight.scrollTop = event.target.scrollTop;
    highlight.scrollLeft = event.target.scrollLeft;
  });

  document.getElementById("node-editor-name-input")?.addEventListener("input", (event) => {
    state.nodeEditor.name = event.target.value;
  });

  document.getElementById("node-editor-close-btn")?.addEventListener("click", () => {
    closeNodeEditor();
  });

  document.getElementById("node-editor-cancel-btn")?.addEventListener("click", () => {
    closeNodeEditor();
  });

  document.getElementById("node-editor-save-btn")?.addEventListener("click", () => {
    saveNodeEditor();
  });

  document.getElementById("node-editor-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "node-editor-backdrop") {
      closeNodeEditor();
    }
  });

  document.getElementById("asset-create-name-input")?.addEventListener("input", (event) => {
    state.assetCreate.name = event.target.value;
  });

  document.getElementById("asset-create-close-btn")?.addEventListener("click", () => {
    closeAssetCreate();
  });

  document.getElementById("asset-create-cancel-btn")?.addEventListener("click", () => {
    closeAssetCreate();
  });

  document.getElementById("asset-create-submit-btn")?.addEventListener("click", () => {
    if (state.assetCreate.loading) {
      return;
    }
    submitAssetCreate();
  });

  document.querySelectorAll("[data-plugin-package-remove]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.assetCreate.loading) {
        return;
      }
      removePluginPackageFromCreate(button.dataset.pluginPackageRemove);
    });
  });

  document.getElementById("asset-create-backdrop")?.addEventListener("click", (event) => {
    if (event.target.id === "asset-create-backdrop") {
      closeAssetCreate();
    }
  });

  document.getElementById("asset-create-backdrop")?.addEventListener("dragover", (event) => {
    event.preventDefault();
  });

  document.getElementById("asset-create-backdrop")?.addEventListener("drop", (event) => {
    event.preventDefault();
  });

  document.querySelectorAll("[data-asset-drop]").forEach((dropZone) => {
    dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
      dropZone.classList.add("drag-over");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("drag-over");
    });

    dropZone.addEventListener("drop", (event) => {
      event.preventDefault();
      dropZone.classList.remove("drag-over");
      const files = event.dataTransfer?.files;
      const kind = dropZone.dataset.assetDrop;
      setAssetCreateFile(kind, kind === "plugin-packages" ? files : files?.[0]);
    });
  });

  document.querySelectorAll("[data-asset-file-action]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const kind = button.dataset.assetFileKind;
      const action = button.dataset.assetFileAction;
      if (action === "choose") {
        chooseAssetCreateFile(kind);
      }
      if (action === "clear") {
        clearAssetCreateFile(kind);
      }
    });
  });

  document.querySelector(".import-cancel-btn")?.addEventListener("click", async () => {
    if (state.importState.cancelled || !state.importState.loading) {
      return;
    }
    state.importState.cancelled = true;
    const cancelBtn = document.querySelector(".import-cancel-btn");
    if (cancelBtn) {
      cancelBtn.disabled = true;
      cancelBtn.textContent = "正在取消...";
    }
    const progressTextEl = document.querySelector(".import-progress-text");
    if (progressTextEl) {
      progressTextEl.textContent = "正在取消...";
    }
    try {
      await window.libraryBridge?.cancelImport({ tempDir: state.importState.tempDir });
    } catch (error) {
      // 忽略取消错误
    }
  });

  applyPlaybackMode();
}

render();
loadProjectState();
loadSettingsState();
uePythonHeartbeatTimer = setInterval(() => {
  if (state.activePage === "script" && !state.uePython.executing && !state.scriptEditor.open) {
    checkUePythonConnection(true);
  }
}, 3000);
loadAllAssetLibraries();
loadNodeLibrary(state.activeNodeCategory);
