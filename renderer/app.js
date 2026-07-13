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
  animation: [
    { duration: "00:05", name: "待机动画", tone: "silver" },
    { duration: "00:08", name: "冲刺动画", tone: "smoke" },
    { duration: "00:06", name: "攻击动画", tone: "graphite" },
  ],
};

const pageMeta = {
  home: { title: "概览", subtitle: "引擎工作区状态" },
  blueprint: { title: "蓝图", subtitle: "卡片预览与导入" },
  material: { title: "材质", subtitle: "卡片预览与导入" },
  plugin: { title: "插件", subtitle: "卡片预览与导入" },
  animation: { title: "动画", subtitle: "卡片预览与导入" },
  settings: { title: "设置", subtitle: "软件参数与路径" },
};

const engines = [
  {
    id: "unreal",
    name: "虚幻引擎",
    shortName: "UE",
    status: "connected",
    subtitle: "虚幻引擎资源库",
    pages: [
      { id: "home", label: "概览", icon: "home" },
      { id: "blueprint", label: "蓝图", icon: "blueprint" },
      { id: "material", label: "材质", icon: "grid" },
      { id: "plugin", label: "插件", icon: "plug" },
      { id: "animation", label: "动画", icon: "film" },
    ],
  },
  {
    id: "blender",
    name: "Blender",
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
    name: "AI 工具",
    shortName: "AI",
    status: "planned",
    subtitle: "规划中",
    pages: [],
  },
];

function activeEngine() {
  return engines.find((e) => e.id === state.activeEngine) || engines[0];
}

function isEngineConnected(engineId) {
  const engine = engines.find((e) => e.id === engineId);
  return engine?.status === "connected";
}

const state = {
  activePage: "home",
  activeEngine: "unreal",
  activeProjectPath: "",
  columns: 5,
  activeCardIndexByPage: {
    blueprint: 0,
    material: 0,
    plugin: 0,
    animation: 0,
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
  settings: {
    resourceRootPath: "",
    defaultPage: "home",
    defaultCardColumns: 5,
    cornerRadius: 28,
    motionStrength: "normal",
    visibleOnlyPlayback: true,
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
    cornerRadius: 28,
    motionStrength: "normal",
    visibleOnlyPlayback: true,
  },
  settingsMessage: "设置资源根目录后，软件就可以读取这个路径下的文件。",
  importState: {
    loading: false,
    conflicts: [],
    tempDir: "",
    contentDir: "",
    targetContentDir: "",
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
  contextMenu: {
    open: false,
    x: 0,
    y: 0,
    item: null,
    pageKey: "",
  },
  toast: {
    visible: false,
    message: "",
    type: "info",
  },
  blueprintLibrary: {
    items: [],
    message: "正在读取蓝图资源目录...",
    libraryRoot: "",
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

function createCard(item, index, pageKey) {
  const isLibraryCard = pageKey === "blueprint" && item && typeof item === "object" && "videoPath" in item;
  const isActive = (state.activeCardIndexByPage[pageKey] || 0) === index;
  const name = typeof item === "string" ? `${pageKey}-${index + 1}` : item.name;
  const tone = typeof item === "string" ? "graphite" : (item.tone || "graphite");
  const videoMarkup = isLibraryCard && item.videoUrl
    ? `<video class="card-video" src="${item.videoUrl}" muted loop playsinline preload="metadata"></video>`
    : "";

  return `
    <article class="card-shell" data-card-index="${index}" data-card-page="${pageKey}">
      <div class="card card-tone-${tone}${isActive ? " active" : ""}" data-card-index="${index}" data-card-page="${pageKey}">
        <div class="card-surface">
          ${videoMarkup}
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
  const isBlueprintLibrary = pageKey === "blueprint" && item && typeof item === "object" && "videoUrl" in item;
  const packageName = isBlueprintLibrary && item.packagePath
    ? item.packagePath.split(/[/\\]/).pop()
    : "未检测到压缩包";
  const previewMedia = isBlueprintLibrary && item.videoUrl
    ? `<video class="preview-video" src="${item.videoUrl}" muted loop playsinline autoplay controls></video>`
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
            <div class="preview-panel-head">
              <span class="preview-kicker">${pageKey === "blueprint" ? "蓝图资源" : "资源详情"}</span>
              <strong>${name}</strong>
              <p>当前资源会导入到已选中的虚幻项目中。你可以先预览视频，再执行导入。</p>
            </div>
            <div class="preview-details">
              <div class="preview-detail">
                <span>当前目标项目</span>
                <strong>${safeProjectName(activeProject())}</strong>
              </div>
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
                <strong>${isBlueprintLibrary && item.hasPackage ? "可导入" : "仅可预览"}</strong>
              </div>
            </div>
            <div class="preview-side-actions">
              <button class="action-btn primary preview-import-btn" type="button" ${state.importState.loading ? "disabled" : ""}>
                ${state.importState.loading ? "正在导入..." : "导入到项目"}
              </button>
            </div>
            <div class="import-progress" style="display: ${state.importState.loading ? "block" : "none"}">
              <div class="import-progress-info">
                <span class="import-progress-text">${buildProgressText(state.importState.progress)}</span>
                <button class="import-cancel-btn" type="button" ${state.importState.cancelled ? "disabled" : ""}>${state.importState.cancelled ? "正在取消..." : "取消"}</button>
              </div>
              <div class="import-progress-bar${state.importState.progress.percent === -1 ? " indeterminate" : ""}">
                <div class="import-progress-fill" style="width: ${state.importState.progress.percent > 0 ? state.importState.progress.percent : 0}%"></div>
              </div>
            </div>
            ${state.importState.message ? `<div class="preview-import-message">${state.importState.message}</div>` : ""}
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
          <button class="action-btn" type="button" data-conflict-resolution="overwrite">替换</button>
          <button class="action-btn" type="button" data-conflict-resolution="skip">跳过</button>
          <button class="action-btn primary" type="button" data-conflict-resolution="overwrite_all">全部替换</button>
          <button class="action-btn" type="button" data-conflict-resolution="skip_all">全部跳过</button>
        </div>
        ${isRunning ? `
          <div class="conflict-actions conflict-actions-secondary">
            <button class="action-btn conflict-close-replace-btn" type="button" data-conflict-resolution="close_and_replace">关掉项目全部替换</button>
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
  const isLibraryItem = typeof item === "object" && "folderPath" in item;
  const hasPackage = isLibraryItem && item.hasPackage;
  return `
    <div class="context-menu-backdrop" id="context-menu-backdrop">
      <div class="context-menu" style="left:${state.contextMenu.x}px;top:${state.contextMenu.y}px;">
        ${hasPackage ? `<button class="context-menu-item" type="button" data-context-action="import">导入到项目</button>` : ""}
        <button class="context-menu-item" type="button" data-context-action="folder">在文件夹中打开</button>
        <button class="context-menu-item" type="button" data-context-action="copy">复制路径</button>
        <button class="context-menu-item" type="button" data-context-action="details">查看详情</button>
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

function showToast(message, type = "info", duration = 3500) {
  console.log("[showToast] called:", message, type);
  const old = document.querySelector(".toast");
  if (old) old.remove();
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  console.log("[showToast] element appended to body:", toast);
  setTimeout(() => {
    if (toast.parentNode) {
      toast.remove();
    }
  }, duration);
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
    const result = await window.libraryBridge?.prepareImport({
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

    if (result.conflicts.length === 0) {
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
      const hadConflicts = state.importState.conflicts.length > 0;
      unregisterImportProgress();
      state.importState.conflicts = [];
      state.importState.tempDir = "";
      state.importState.contentDir = "";
      state.importState.targetContentDir = "";
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
        if (hadConflicts) {
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
  state.importState.loading = false;
  state.importState.cancelled = false;
  state.importState.progress = { stage: "", message: "", current: 0, total: 0, percent: 0 };
  render();
}

function closeContextMenu() {
  state.contextMenu = { open: false, x: 0, y: 0, item: null, pageKey: "" };
  render();
}

function handleContextMenuAction(action) {
  const item = state.contextMenu.item;
  const pageKey = state.contextMenu.pageKey;

  if (!item) {
    closeContextMenu();
    return;
  }

  if (action === "import" || action === "details") {
    closeContextMenu();
    openPreviewModal(pageKey, item);
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

function cardItemByIndex(pageKey, index) {
  const items = pageKey === "blueprint" ? state.blueprintLibrary.items : (mediaCards[pageKey] || []);
  return items[index] || null;
}

function projectCard(project) {
  const active = project.path === state.activeProjectPath;
  const running = project.status === "运行中";
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
        <button class="project-switch-btn" type="button" data-switch-project="${project.path}" ${active ? "disabled" : ""}>
          ${active ? "正在使用" : "切换项目"}
        </button>
        <button class="project-remove-btn" type="button" data-remove-project="${project.path}">清除项目</button>
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
              <p>${engine.id === "blender" ? "Blender 是下一个计划接入的引擎，敬请期待。" : "此引擎仍在规划中，后续版本将支持。"}</p>
            </div>
          </section>
        </div>
      </section>
    `;
  }

  const projectCount = state.projects.length;
  const resourceCount = state.blueprintLibrary.items.length;
  const pluginCount = (mediaCards.plugin || []).length;
  const current = activeProject();

  return `
    <section class="page${state.activePage === "home" ? " active" : ""}" data-page-panel="home">
      <div class="content scrollable">
        <section class="engine-overview-hero">
          <div class="engine-overview-copy">
            <div class="eyebrow">${engine.name} · 概览</div>
            <h1>${safeProjectName(current)}</h1>
            <p>当前目标项目已就绪，可从左侧选择资源类型进行预览和导入。</p>
          </div>
          <div class="engine-overview-actions">
            <button class="action-btn primary" type="button" id="scan-projects-btn">
              ${state.loadingProjects ? "检测中..." : "检测已打开项目"}
            </button>
            <button class="action-btn" type="button" id="add-project-btn">手动添加项目</button>
          </div>
        </section>

        <div class="engine-stats-grid">
          <div class="engine-stat-card">
            <div class="engine-stat-number">${projectCount}</div>
            <div class="engine-stat-label">已检测项目</div>
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
  const isBlueprint = key === "blueprint";
  const items = isBlueprint ? state.blueprintLibrary.items : (mediaCards[key] || []);
  return `
    <section class="page${state.activePage === key ? " active" : ""}" data-page-panel="${key}">
      <div class="content scrollable">
        ${isBlueprint ? `
          <section class="resource-hero">
            <div class="resource-hero-copy">
              <div class="eyebrow">蓝图资源库</div>
              <h2>以卡片方式预览、筛选并直接导入当前项目</h2>
            </div>
            <div class="resource-hero-meta">
              <div class="resource-stat">
                <span>当前项目</span>
                <strong>${safeProjectName(activeProject())}</strong>
              </div>
              <div class="resource-stat">
                <span>资源数量</span>
                <strong>${state.blueprintLibrary.items.length}</strong>
              </div>
            </div>
          </section>
        ` : ""}
        ${isBlueprint ? `<div class="panel-note library-note">${state.blueprintLibrary.message}</div>` : ""}
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

function settingsPage() {
  const pageOptions = [
    ["home", "主页"],
    ["blueprint", "蓝图"],
    ["material", "材质"],
    ["plugin", "插件"],
    ["animation", "动画"],
    ["settings", "设置"],
  ].map(([value, label]) => ({ value, label }));

  const columnOptions = [2, 3, 4, 5, 6, 7, 8].map((value) => ({ value: String(value), label: `${value} 列` }));
  const motionOptions = [
    ["soft", "柔和"],
    ["normal", "标准"],
    ["strong", "明显"],
  ].map(([value, label]) => ({ value, label }));

  return `
    <section class="page${state.activePage === "settings" ? " active" : ""}" data-page-panel="settings">
      <div class="content scrollable">
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
                <button class="action-btn primary" type="button" id="choose-resource-root-btn">选择目录</button>
                <button class="action-btn" type="button" id="save-resource-root-btn">保存全部设置</button>
                <button class="action-btn" type="button" id="reload-resource-root-btn">重新读取</button>
              </div>
            </div>
            <div class="settings-grid compact">
              <div class="settings-field">
                <span class="settings-label">默认打开哪个页面</span>
                ${customSelect("default-page", state.settingsDraft.defaultPage, pageOptions, "选择页面")}
              </div>
              <div class="settings-field">
                <span class="settings-label">每行卡片数量</span>
                ${customSelect("default-columns", String(state.settingsDraft.defaultCardColumns), columnOptions, "选择列数")}
                <div class="panel-note">修改后会立即应用，同时作为默认布局保存。</div>
              </div>
            </div>
            <div class="settings-grid compact">
              <div class="settings-field">
                <span class="settings-label">圆角大小</span>
                <input class="settings-range" id="corner-radius-range" type="range" min="12" max="36" step="2" value="${Number(state.settingsDraft.cornerRadius) || 28}" />
                <div class="panel-note">当前：${Number(state.settingsDraft.cornerRadius) || 28}px</div>
              </div>
              <div class="settings-field">
                <span class="settings-label">动效强度</span>
                ${customSelect("motion-strength", state.settingsDraft.motionStrength, motionOptions, "选择强度")}
              </div>
            </div>
            <div class="settings-grid compact">
              <label class="settings-toggle">
                <input type="checkbox" id="visible-playback-toggle" ${state.settingsDraft.visibleOnlyPlayback ? "checked" : ""} />
                <span>是否只播放当前悬停卡片</span>
              </label>
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
      ${engines
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
  if (state.activePage !== "blueprint") return "";
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
        <input type="checkbox" id="blueprint-playback-toggle" ${state.settings.visibleOnlyPlayback ? "checked" : ""} />
        <span class="vc-label">悬停播放</span>
      </label>
    </div>
  `;
}

function shellMarkup() {
  const meta = pageMeta[state.activePage] || { title: activeEngine().name, subtitle: activeEngine().subtitle };
  const motionScale = state.settings.motionStrength === "soft" ? 0.7 : state.settings.motionStrength === "strong" ? 1.35 : 1;
  const engine = activeEngine();
  const showTopbarCopy = ["home", "settings"].includes(state.activePage);
  const compactTopbar = !showTopbarCopy;

  return `
    <div class="window" style="--app-radius:${state.settings.cornerRadius || 28}px; --motion-scale:${motionScale};">
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

          ${homePage()}
          ${cardPage("blueprint")}
          ${cardPage("material")}
          ${cardPage("plugin")}
          ${cardPage("animation")}
          ${settingsPage()}
        </main>
      </div>
      ${previewModalMarkup()}
      ${conflictModalMarkup()}
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

  root.innerHTML = shellMarkup();
  bindEvents();
  syncRuntimeStyles();

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
      cornerRadius: Number(data?.cornerRadius) || 28,
      motionStrength: data?.motionStrength || "normal",
      visibleOnlyPlayback: data?.visibleOnlyPlayback !== false,
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

async function loadBlueprintLibrary() {
  try {
    const data = await window.libraryBridge?.getBlueprints();
    state.blueprintLibrary = {
      items: Array.isArray(data?.items) ? data.items : [],
      message: data?.message || "蓝图资源已读取。",
      libraryRoot: data?.libraryRoot || "",
    };
  } catch (error) {
    state.blueprintLibrary = {
      items: [],
      message: "蓝图资源读取失败。",
      libraryRoot: "",
    };
  }
  render();
}

async function scanProjects() {
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
  state.projectMessage = "正在等待选择 .uproject 文件...";
  render();

  try {
    const data = await window.projectBridge?.addProject();
    const count = Array.isArray(data?.projects) ? data.projects.length : 0;
    applyProjectState(data, count ? "项目已添加，可以作为当前导入目标使用。" : "未选择项目文件。");
  } catch (error) {
    state.projectMessage = "手动添加项目失败。";
  }

  render();
}

async function setActiveProject(projectPath) {
  try {
    const data = await window.projectBridge?.setActiveProject(projectPath);
    applyProjectState(data, "当前目标项目已切换。");
  } catch (error) {
    state.projectMessage = "切换当前项目失败。";
  }

  render();
}

async function removeProject(projectPath) {
  try {
    const data = await window.projectBridge?.removeProject(projectPath);
    applyProjectState(data, data?.projects?.length ? "项目已清除。" : "项目列表已清空。");
  } catch (error) {
    state.projectMessage = "清除项目失败。";
  }

  render();
}

function applySettingsState(data, message) {
  state.settings = data || state.settings;
  state.settingsDraft = {
    resourceRootPath: data?.resourceRootPath || "",
    defaultPage: data?.defaultPage || "home",
      defaultCardColumns: Number(data?.defaultCardColumns) || 5,
    cornerRadius: Number(data?.cornerRadius) || 28,
    motionStrength: data?.motionStrength || "normal",
    visibleOnlyPlayback: data?.visibleOnlyPlayback !== false,
  };
  state.columns = state.settingsDraft.defaultCardColumns;
  if (message) {
    state.settingsMessage = message;
  }
}

async function chooseResourceRoot() {
  try {
    const data = await window.settingsBridge?.chooseResourceRoot();
    applySettingsState(data, data?.resourceRootPath ? "资源目录已更新，并完成重新读取。" : "未选择资源目录。");
  } catch (error) {
    state.settingsMessage = "选择资源目录失败。";
  }
  await loadBlueprintLibrary();
  render();
}

async function saveResourceRoot() {
  try {
    const data = await window.settingsBridge?.saveAll(state.settingsDraft);
    applySettingsState(data, data?.resourceRootPath ? "设置已保存，并完成重新读取。" : "设置已保存。");
  } catch (error) {
    state.settingsMessage = "保存设置失败。";
  }
  await loadBlueprintLibrary();
  render();
}

function closeAllCustomSelects(event) {
  document.querySelectorAll(".custom-select.open").forEach((select) => {
    if (!select.contains(event.target)) {
      select.classList.remove("open");
    }
  });
}

let globalClickBound = false;

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
      const projectPath = item.dataset.projectPath;
      if (projectPath) {
        setActiveProject(projectPath);
      }
    });
  });

  document.querySelectorAll("[data-switch-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const projectPath = button.dataset.switchProject;
      if (projectPath) {
        setActiveProject(projectPath);
      }
    });
  });

  document.querySelectorAll("[data-remove-project]").forEach((button) => {
    button.addEventListener("click", (event) => {
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
    scanProjects();
  });

  document.getElementById("add-project-btn")?.addEventListener("click", () => {
    addProject();
  });

  document.getElementById("choose-resource-root-btn")?.addEventListener("click", () => {
    chooseResourceRoot();
  });

  document.getElementById("save-resource-root-btn")?.addEventListener("click", () => {
    saveResourceRoot();
  });

  document.getElementById("reload-resource-root-btn")?.addEventListener("click", () => {
    loadSettingsState();
    loadBlueprintLibrary();
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

      if (selectId === "default-page") {
        state.settingsDraft.defaultPage = value;
      }

      if (selectId === "default-columns") {
        state.settingsDraft.defaultCardColumns = Number(value);
        state.columns = Number(value);
      }

      if (selectId === "motion-strength") {
        state.settingsDraft.motionStrength = value;
      }

      render();
    });
  });

  document.getElementById("corner-radius-range")?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.settingsDraft.cornerRadius = value;
    state.settings.cornerRadius = value;
    const radiusNote = event.target.parentElement?.querySelector(".panel-note");
    if (radiusNote) {
      radiusNote.textContent = `当前：${value}px`;
    }
    syncRuntimeStyles();
  });

  document.getElementById("visible-playback-toggle")?.addEventListener("change", (event) => {
    state.settingsDraft.visibleOnlyPlayback = event.target.checked;
    state.settings.visibleOnlyPlayback = event.target.checked;
    applyPlaybackMode();
  });

  document.getElementById("blueprint-playback-toggle")?.addEventListener("change", (event) => {
    state.settingsDraft.visibleOnlyPlayback = event.target.checked;
    state.settings.visibleOnlyPlayback = event.target.checked;
    applyPlaybackMode();
  });

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const grid = card.closest(".card-grid");
      if (!grid) {
        return;
      }
      const pageKey = card.dataset.cardPage;
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
      const pageKey = card.dataset.cardPage;
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
    handleImportClick();
  });

  document.querySelectorAll("[data-conflict-resolution]").forEach((button) => {
    button.addEventListener("click", () => {
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
loadBlueprintLibrary();
