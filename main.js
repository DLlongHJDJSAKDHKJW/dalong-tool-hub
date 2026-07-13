const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const os = require('os')

let mainWindow = null
let importCancelled = false

function storePath() {
  return path.join(app.getPath('userData'), 'projects-store.json')
}

function defaultStore() {
  return {
    activeProjectPath: '',
    projects: [],
    settings: {
      resourceRootPath: '',
      defaultPage: 'home',
      defaultCardColumns: 5,
      cornerRadius: 28,
      motionStrength: 'normal',
      visibleOnlyPlayback: true,
    },
  }
}

function readStore() {
  try {
    const raw = fs.readFileSync(storePath(), 'utf8')
    const parsed = JSON.parse(raw)
    return {
      activeProjectPath: typeof parsed.activeProjectPath === 'string' ? parsed.activeProjectPath : '',
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      settings: {
        resourceRootPath: typeof parsed.settings?.resourceRootPath === 'string' ? parsed.settings.resourceRootPath : '',
        defaultPage: typeof parsed.settings?.defaultPage === 'string' ? parsed.settings.defaultPage : 'home',
        defaultCardColumns: Number(parsed.settings?.defaultCardColumns) || 5,
        cornerRadius: Number(parsed.settings?.cornerRadius) || 28,
        motionStrength: typeof parsed.settings?.motionStrength === 'string' ? parsed.settings.motionStrength : 'normal',
        visibleOnlyPlayback: parsed.settings?.visibleOnlyPlayback !== undefined ? Boolean(parsed.settings.visibleOnlyPlayback) : true,
      },
    }
  } catch (error) {
    return defaultStore()
  }
}

function writeStore(store) {
  fs.writeFileSync(storePath(), JSON.stringify(store, null, 2), 'utf8')
}

function normalizeProject(project, statusFallback = '已识别') {
  const projectPath = project.path || ''
  const name = project.name || path.basename(projectPath, '.uproject') || '未命名项目'
  return {
    name,
    path: projectPath,
    version: project.version || detectProjectVersion(projectPath, ''),
    status: project.status || statusFallback,
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    return null
  }
}

function normalizeEngineVersion(rawVersion) {
  if (!rawVersion) {
    return ''
  }

  if (/^UE\s+/i.test(rawVersion)) {
    return rawVersion
  }

  if (/^\d+(\.\d+)?$/i.test(rawVersion)) {
    return `UE ${rawVersion}`
  }

  const engineMatch = String(rawVersion).match(/(\d+(?:\.\d+)?)/)
  if (engineMatch?.[1]) {
    return `UE ${engineMatch[1]}`
  }

  return String(rawVersion)
}

function detectVersionFromEditorPath(commandLine) {
  const cleaned = String(commandLine || '')
  const match = cleaned.match(/UE[_-](\d+(?:\.\d+)?)/i)
  return normalizeEngineVersion(match?.[1] || '')
}

function detectProjectVersion(projectPath, fallback = 'UE 未知版本') {
  if (!projectPath || !fs.existsSync(projectPath)) {
    return fallback
  }

  const projectJson = readJsonFile(projectPath)
  const engineAssociation = normalizeEngineVersion(projectJson?.EngineAssociation || '')
  if (engineAssociation) {
    return engineAssociation
  }

  return fallback
}

function dedupeProjects(projects) {
  const map = new Map()
  projects.forEach((project) => {
    if (!project.path) {
      return
    }
    map.set(project.path.toLowerCase(), normalizeProject(project))
  })
  return [...map.values()]
}

function mergeProjects(existing, incoming) {
  const map = new Map()
  existing.forEach((project) => {
    if (project.path) {
      map.set(project.path.toLowerCase(), normalizeProject(project))
    }
  })
  incoming.forEach((project) => {
    if (project.path) {
      map.set(project.path.toLowerCase(), normalizeProject(project, '运行中'))
    }
  })
  return [...map.values()]
}

function extractProjectFromCommandLine(commandLine) {
  if (!commandLine) {
    return null
  }

  const cleaned = String(commandLine).replace(/\r?\n/g, ' ').trim()
  const match =
    cleaned.match(/"([^"]+\.uproject)"/i) ||
    cleaned.match(/([A-Za-z]:\\.*?\.uproject)(?=\s|$)/i)
  const projectPath = match?.[1]

  if (!projectPath || !fs.existsSync(projectPath)) {
    return null
  }

  return {
    name: path.basename(projectPath, '.uproject'),
    path: projectPath,
    version: detectVersionFromEditorPath(cleaned) || detectProjectVersion(projectPath, 'UE 运行中'),
    status: '运行中',
  }
}

function scanOpenProjects() {
  const { execFileSync } = require('child_process')

  try {
    const script = `
      [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
      $processes = Get-CimInstance Win32_Process |
        Where-Object { $_.Name -like '*UnrealEditor*' -or $_.Name -like '*UE4Editor*' } |
        Select-Object -ExpandProperty CommandLine
      $processes | ConvertTo-Json -Compress
    `

    const powershellExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    const output = execFileSync(powershellExe, ['-NoProfile', '-Command', script], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
    }).trim()

    if (!output) {
      return []
    }

    const parsed = JSON.parse(output)
    const commandLines = Array.isArray(parsed) ? parsed : [parsed]

    return dedupeProjects(
      commandLines
        .map(extractProjectFromCommandLine)
        .filter(Boolean)
    )
  } catch (error) {
    return []
  }
}

function ensureActiveProject(store) {
  if (!store.projects.length) {
    store.activeProjectPath = ''
    return store
  }

  const activeExists = store.projects.some((project) => project.path === store.activeProjectPath)
  if (!activeExists) {
    store.activeProjectPath = store.projects[0].path
  }

  return store
}

function projectState() {
  const store = ensureActiveProject(readStore())
  writeStore(store)
  return store
}

function settingsState() {
  const store = readStore()
  return {
    ...store.settings,
  }
}

function firstExistingPath(paths) {
  return paths.find((targetPath) => targetPath && fs.existsSync(targetPath)) || ''
}

function blueprintRootPath(resourceRootPath) {
  const normalizedRoot = String(resourceRootPath || '').trim()
  if (!normalizedRoot) {
    return ''
  }

  return firstExistingPath([
    path.join(normalizedRoot, '蓝图'),
    path.join(normalizedRoot, '资产', '蓝图'),
    path.join(normalizedRoot, 'assets', 'blueprint'),
    path.join(normalizedRoot, 'Assets', 'Blueprint'),
    path.join(normalizedRoot, 'Blueprint'),
    path.join(normalizedRoot, 'blueprint'),
  ])
}

function findPreviewFiles(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)

    const videoFile = files.find((fileName) => /\.(mp4|webm|mov|m4v)$/i.test(fileName)) || ''
    const packageFile = files.find((fileName) => /\.(zip|7z|rar)$/i.test(fileName)) || ''

    return {
      videoPath: videoFile ? path.join(folderPath, videoFile) : '',
      packagePath: packageFile ? path.join(folderPath, packageFile) : '',
    }
  } catch (error) {
    return {
      videoPath: '',
      packagePath: '',
    }
  }
}

function blueprintLibraryState() {
  const settings = settingsState()
  const libraryRoot = blueprintRootPath(settings.resourceRootPath)

  if (!settings.resourceRootPath) {
    return {
      resourceRootPath: '',
      libraryRoot: '',
      items: [],
      message: '请先在设置中选择资源根目录。',
    }
  }

  if (!libraryRoot) {
    return {
      resourceRootPath: settings.resourceRootPath,
      libraryRoot: '',
      items: [],
      message: '未找到蓝图资源目录，请确认资源根目录下存在“蓝图”或“资产/蓝图”文件夹。',
    }
  }

  try {
    const folders = fs
      .readdirSync(libraryRoot, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const folderPath = path.join(libraryRoot, entry.name)
        const previewFiles = findPreviewFiles(folderPath)
        return {
          name: entry.name,
          folderPath,
          videoPath: previewFiles.videoPath,
          videoUrl: previewFiles.videoPath ? pathToFileURL(previewFiles.videoPath).href : '',
          packagePath: previewFiles.packagePath,
          hasVideo: Boolean(previewFiles.videoPath),
          hasPackage: Boolean(previewFiles.packagePath),
        }
      })
      .filter((item) => item.videoPath || item.packagePath)
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

    return {
      resourceRootPath: settings.resourceRootPath,
      libraryRoot,
      items: folders,
      message: folders.length ? `已读取 ${folders.length} 个蓝图资源文件夹。` : '蓝图目录存在，但还没有可用资源。',
    }
  } catch (error) {
    return {
      resourceRootPath: settings.resourceRootPath,
      libraryRoot,
      items: [],
      message: '读取蓝图资源目录失败。',
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#00000000',
    frame: false,
    transparent: true,
    roundedCorners: true,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    title: '大龙工具中枢',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.loadFile(path.join(__dirname, 'app.html'))
}

ipcMain.on('window:minimize', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize()
})

ipcMain.on('window:maximize-toggle', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) {
    return
  }

  if (win.isMaximized()) {
    win.unmaximize()
  } else {
    win.maximize()
  }
})

ipcMain.on('window:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close()
})

ipcMain.handle('projects:get-state', () => {
  return projectState()
})

ipcMain.handle('projects:scan-open', () => {
  const store = readStore()
  const scanned = scanOpenProjects()
  store.projects = dedupeProjects(scanned)
  if (scanned.length > 0) {
    store.activeProjectPath = scanned[0].path
  } else {
    store.activeProjectPath = ''
  }
  ensureActiveProject(store)
  writeStore(store)
  return store
})

ipcMain.handle('projects:add-manual', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择虚幻项目文件',
    properties: ['openFile'],
    filters: [
      { name: 'Unreal Project', extensions: ['uproject'] },
    ],
  })

  if (result.canceled || !result.filePaths.length) {
    return projectState()
  }

  const projectPath = result.filePaths[0]
  const store = readStore()
  store.projects = mergeProjects(store.projects, [
    {
      name: path.basename(projectPath, '.uproject'),
      path: projectPath,
      version: detectProjectVersion(projectPath, 'UE 已添加'),
      status: '已手动添加',
    },
  ])

  if (!store.activeProjectPath) {
    store.activeProjectPath = projectPath
  }

  ensureActiveProject(store)
  writeStore(store)
  return store
})

ipcMain.handle('projects:set-active', (event, projectPath) => {
  const store = readStore()
  const exists = store.projects.some((project) => project.path === projectPath)

  if (exists) {
    store.activeProjectPath = projectPath
    writeStore(store)
  }

  return ensureActiveProject(store)
})

ipcMain.handle('projects:remove', (event, projectPath) => {
  const store = readStore()
  store.projects = store.projects.filter((project) => project.path !== projectPath)
  if (store.activeProjectPath === projectPath) {
    store.activeProjectPath = store.projects[0]?.path || ''
  }
  ensureActiveProject(store)
  writeStore(store)
  return store
})

ipcMain.handle('settings:get', () => {
  return settingsState()
})

ipcMain.handle('library:get-blueprints', () => {
  return blueprintLibraryState()
})

ipcMain.handle('settings:choose-resource-root', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择资源根目录',
    properties: ['openDirectory'],
  })

  if (result.canceled || !result.filePaths.length) {
    return settingsState()
  }

  const store = readStore()
  store.settings = store.settings || {}
  store.settings.resourceRootPath = result.filePaths[0]
  writeStore(store)
  return settingsState()
})

ipcMain.handle('settings:save-resource-root', (event, resourceRootPath) => {
  const store = readStore()
  store.settings = store.settings || {}
  store.settings.resourceRootPath = String(resourceRootPath || '').trim()
  writeStore(store)
  return settingsState()
})

ipcMain.handle('settings:save-all', (event, nextSettings) => {
  const store = readStore()
  store.settings = {
    ...(store.settings || {}),
    resourceRootPath: String(nextSettings?.resourceRootPath || '').trim(),
    defaultPage: String(nextSettings?.defaultPage || 'home'),
    defaultCardColumns: Math.min(5, Math.max(2, Number(nextSettings?.defaultCardColumns) || 5)),
    cornerRadius: Math.min(36, Math.max(12, Number(nextSettings?.cornerRadius) || 28)),
    motionStrength: ['soft', 'normal', 'strong'].includes(String(nextSettings?.motionStrength))
      ? String(nextSettings.motionStrength)
      : 'normal',
    visibleOnlyPlayback: Boolean(nextSettings?.visibleOnlyPlayback),
  }
  writeStore(store)
  return settingsState()
})

// ===== 导入到项目：辅助函数 =====

/**
 * 在解压目录中递归查找名为 Content 的文件夹（不区分大小写）。
 * @param {string} rootDir - 解压根目录
 * @param {number} maxDepth - 最大搜索深度
 * @returns {string} Content 文件夹完整路径，未找到返回空字符串
 */
function findContentFolder(rootDir, maxDepth = 3) {
  function search(dir, depth) {
    if (depth > maxDepth) {
      return ''
    }
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name.toLowerCase() === 'content') {
          return path.join(dir, entry.name)
        }
      }
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const found = search(path.join(dir, entry.name), depth + 1)
          if (found) {
            return found
          }
        }
      }
    } catch (error) {
      // 忽略不可访问的目录
    }
    return ''
  }
  return search(rootDir, 0)
}

/**
 * 递归收集目录下所有文件的相对路径。
 * @param {string} dir - 当前遍历目录
 * @param {string} baseDir - 基准目录（用于计算相对路径）
 * @returns {string[]} 相对路径数组
 */
function collectRelativeFiles(dir, baseDir) {
  const results = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...collectRelativeFiles(fullPath, baseDir))
      } else if (entry.isFile()) {
        results.push(path.relative(baseDir, fullPath))
      }
    }
  } catch (error) {
    // 忽略不可访问的目录
  }
  return results
}

/**
 * 扫描源 Content 目录与目标 Content 目录之间的文件冲突。
 * @param {string} sourceContentDir - 解压出的 Content 路径
 * @param {string} targetContentDir - 项目 Content 路径
 * @returns {{ conflicts: string[], totalFiles: number }}
 */
function scanConflicts(sourceContentDir, targetContentDir) {
  const sourceFiles = collectRelativeFiles(sourceContentDir, sourceContentDir)
  const conflicts = []
  for (const relativePath of sourceFiles) {
    const targetPath = path.join(targetContentDir, relativePath)
    if (fs.existsSync(targetPath)) {
      conflicts.push(relativePath)
    }
  }
  return {
    conflicts,
    totalFiles: sourceFiles.length,
  }
}

/**
 * 递归复制源目录到目标目录，按冲突处理策略处理同名文件。
 * @param {string} sourceDir - 源目录
 * @param {string} targetDir - 目标目录
 * @param {string} resolution - 冲突处理策略：overwrite_all | skip_all | overwrite | skip
 * @param {(info: { current: number, total: number, skipped: number }) => void} [onProgress] - 每处理完一个文件时的进度回调
 * @param {{ current: number, total: number }} [counter] - 内部共享计数器，跨递归层级累计进度
 * @returns {Promise<{ importedCount: number, skippedCount: number }>}
 */
async function recursiveCopyWithResolution(sourceDir, targetDir, resolution, onProgress, counter) {
  let importedCount = 0
  let skippedCount = 0
  const shouldOverwrite = resolution === 'overwrite_all' || resolution === 'overwrite'
  const progressCounter = counter || { current: 0, total: 0 }
  try {
    const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true })
    for (const entry of entries) {
      if (importCancelled) {
        throw new Error('用户取消了导入')
      }
      const sourcePath = path.join(sourceDir, entry.name)
      const targetPath = path.join(targetDir, entry.name)
      if (entry.isDirectory()) {
        const result = await recursiveCopyWithResolution(sourcePath, targetPath, resolution, onProgress, progressCounter)
        importedCount += result.importedCount
        skippedCount += result.skippedCount
      } else if (entry.isFile()) {
        const isConflict = fs.existsSync(targetPath)
        if (isConflict && !shouldOverwrite) {
          skippedCount += 1
          progressCounter.current += 1
          if (onProgress) {
            onProgress({ current: progressCounter.current, total: progressCounter.total, skipped: skippedCount })
          }
        } else {
          await fs.promises.mkdir(path.dirname(targetPath), { recursive: true })
          await fs.promises.copyFile(sourcePath, targetPath)
          importedCount += 1
          progressCounter.current += 1
          if (onProgress) {
            onProgress({ current: progressCounter.current, total: progressCounter.total, skipped: skippedCount })
          }
        }
        await new Promise((resolve) => setImmediate(resolve))
      }
    }
  } catch (error) {
    if (importCancelled || error?.message === '用户取消了导入') {
      throw error
    }
  }
  return { importedCount, skippedCount }
}

/**
 * 递归删除目录及其内容。
 * @param {string} dirPath - 要删除的目录路径
 */
function removeDirRecursive(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true })
  } catch (error) {
    // 忽略清理错误
  }
}

// ===== 导入到项目：IPC 处理 =====

ipcMain.handle('library:prepare-import', async (event, data) => {
  importCancelled = false
  const packagePath = data?.packagePath || ''
  const projectPath = data?.projectPath || ''

  const emptyResult = {
    success: false,
    tempDir: '',
    contentDir: '',
    targetContentDir: '',
    conflicts: [],
    totalFiles: 0,
    error: '',
  }

  if (!packagePath || !fs.existsSync(packagePath)) {
    event.sender.send('import:progress', { stage: 'error', message: '未找到资源压缩包，请确认资源目录中包含 zip 文件。' })
    return { ...emptyResult, error: '未找到资源压缩包，请确认资源目录中包含 zip 文件。' }
  }

  if (!projectPath || !fs.existsSync(projectPath)) {
    event.sender.send('import:progress', { stage: 'error', message: '当前目标项目无效，请先在主页选择或检测虚幻项目。' })
    return { ...emptyResult, error: '当前目标项目无效，请先在主页选择或检测虚幻项目。' }
  }

  let tempDir = ''
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ue-import-'))
    event.sender.send('import:progress', { stage: 'extracting', message: '正在解压资源包...', current: 0, total: 0, percent: -1 })
    const { execFile } = require('child_process')
    const powershellExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    const safePackagePath = packagePath.replace(/'/g, "''")
    const safeTempDir = tempDir.replace(/'/g, "''")
    const psScript = `try { Expand-Archive -LiteralPath '${safePackagePath}' -DestinationPath '${safeTempDir}' -Force -ErrorAction Stop; [Console]::Out.WriteLine('EXTRACT_SUCCESS') } catch { [Console]::Out.WriteLine('EXTRACT_ERROR:' + $_.Exception.Message) }`
    const encodedCommand = Buffer.from(psScript, 'utf16le').toString('base64')
    await new Promise((resolve, reject) => {
      execFile(powershellExe, ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedCommand], { encoding: 'utf8', windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
        const out = (stdout || '').trim()
        if (out.includes('EXTRACT_ERROR:')) {
          reject(new Error(out.split('EXTRACT_ERROR:')[1].trim()))
        } else if (out.includes('EXTRACT_SUCCESS')) {
          resolve()
        } else if (error) {
          reject(new Error(stderr || error.message))
        } else {
          resolve()
        }
      })
    })
  } catch (error) {
    if (tempDir) {
      removeDirRecursive(tempDir)
    }
    const errorMsg = `解压失败：${error.message || '未知错误'}`
    event.sender.send('import:progress', { stage: 'error', message: errorMsg })
    return { ...emptyResult, error: errorMsg }
  }

  const contentDir = findContentFolder(tempDir)
  if (!contentDir) {
    removeDirRecursive(tempDir)
    event.sender.send('import:progress', { stage: 'error', message: '压缩包中未找到 Content 文件夹，请确认资源包结构正确。' })
    return { ...emptyResult, error: '压缩包中未找到 Content 文件夹，请确认资源包结构正确。' }
  }

  const projectDir = path.dirname(projectPath)
  const targetContentDir = path.join(projectDir, 'Content')

  event.sender.send('import:progress', { stage: 'scanning', message: '正在扫描冲突文件...', current: 0, total: 0, percent: 0 })
  const { conflicts, totalFiles } = scanConflicts(contentDir, targetContentDir)

  return {
    success: true,
    tempDir,
    contentDir,
    targetContentDir,
    conflicts,
    totalFiles,
    error: '',
  }
})

ipcMain.handle('library:execute-import', async (event, data) => {
  importCancelled = false
  const tempDir = data?.tempDir || ''
  const contentDir = data?.contentDir || ''
  const targetContentDir = data?.targetContentDir || ''
  const resolution = data?.resolution || 'skip_all'

  if (!contentDir || !fs.existsSync(contentDir)) {
    event.sender.send('import:progress', { stage: 'error', message: '解压内容不可用，请重新尝试导入。' })
    return { success: false, importedCount: 0, skippedCount: 0, error: '解压内容不可用，请重新尝试导入。' }
  }

  try {
    fs.mkdirSync(targetContentDir, { recursive: true })
  } catch (error) {
    const errorMsg = `无法创建目标目录：${error.message || '未知错误'}`
    event.sender.send('import:progress', { stage: 'error', message: errorMsg })
    return { success: false, importedCount: 0, skippedCount: 0, error: errorMsg }
  }

  const totalFiles = collectRelativeFiles(contentDir, contentDir).length
  const counter = { current: 0, total: totalFiles }

  const onProgress = (info) => {
    const percent = info.total > 0 ? Math.round((info.current / info.total) * 100) : 0
    // 文件数较多时降低推送频率，避免过度渲染
    const shouldSend = info.total <= 1000 || info.current % 10 === 0 || info.current === info.total
    if (!shouldSend) {
      return
    }
    event.sender.send('import:progress', {
      stage: 'copying',
      message: '正在复制文件...',
      current: info.current,
      total: info.total,
      percent: percent,
    })
  }

  try {
    const { importedCount, skippedCount } = await recursiveCopyWithResolution(contentDir, targetContentDir, resolution, onProgress, counter)

    event.sender.send('import:progress', {
      stage: 'cleaning',
      message: '正在清理临时文件...',
      current: counter.current,
      total: counter.total,
      percent: 100,
    })

    if (tempDir) {
      removeDirRecursive(tempDir)
    }

    event.sender.send('import:progress', {
      stage: 'done',
      message: '导入完成',
      current: counter.total,
      total: counter.total,
      percent: 100,
    })

    return {
      success: true,
      importedCount,
      skippedCount,
      error: '',
    }
  } catch (error) {
    if (tempDir) {
      removeDirRecursive(tempDir)
    }
    if (importCancelled || error?.message === '用户取消了导入') {
      event.sender.send('import:progress', { stage: 'error', message: '用户取消了导入' })
      return { success: false, cancelled: true, importedCount: 0, skippedCount: 0, error: '用户取消了导入' }
    }
    const errorMsg = `导入失败：${error.message || '未知错误'}`
    event.sender.send('import:progress', { stage: 'error', message: errorMsg })
    return { success: false, importedCount: 0, skippedCount: 0, error: errorMsg }
  }
})

ipcMain.handle('library:cancel-import', async (event, data) => {
  importCancelled = true
  const tempDir = data?.tempDir || ''
  if (tempDir) {
    removeDirRecursive(tempDir)
  }
  return { success: true, cancelled: true }
})

ipcMain.handle('library:close-editor', async (event, data) => {
  const projectPath = data?.projectPath || ''
  const { execFileSync } = require('child_process')
  const powershellExe = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')

  let editorPath = ''
  let targetPid = 0

  try {
    const findScript = `
      [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
      $procs = Get-CimInstance Win32_Process | Where-Object { $_.Name -like '*UnrealEditor*' }
      $procs | ForEach-Object { @{ Id=$_.ProcessId; Cmd=$_.CommandLine } } | ConvertTo-Json -Compress
    `
    const findOutput = execFileSync(powershellExe, ['-NoProfile', '-Command', findScript], {
      encoding: 'utf8', windowsHide: true, timeout: 10000
    }).trim()

    if (findOutput) {
      const parsed = JSON.parse(findOutput)
      const procList = Array.isArray(parsed) ? parsed : [parsed]
      const normalizedProject = (projectPath || '').toLowerCase().replace(/\//g, '\\')
      for (const proc of procList) {
        const cmd = proc.Cmd || ''
        const normalizedCmd = cmd.toLowerCase().replace(/\//g, '\\')
        if (projectPath && !normalizedCmd.includes(normalizedProject)) continue
        const match = cmd.match(/"([^"]+UnrealEditor\.exe)"/i) || cmd.match(/([A-Za-z]:[^\s"]*UnrealEditor\.exe)/i)
        if (match) { editorPath = match[1]; targetPid = proc.Id; break }
      }
    }
  } catch (e) {
    // 忽略查找错误
  }

  if (targetPid > 0) {
    try {
      const killScript = Buffer.from(
        `Stop-Process -Id ${targetPid} -Force`,
        'utf16le'
      ).toString('base64')
      execFileSync(powershellExe, ['-NoProfile', '-NonInteractive', '-EncodedCommand', killScript], {
        encoding: 'utf8', windowsHide: true, timeout: 15000
      })
    } catch (e) {
      // 忽略关闭错误
    }

    await new Promise((resolve) => {
      let attempts = 0
      const check = () => {
        attempts++
        try {
          const stillRunning = execFileSync(powershellExe, ['-NoProfile', '-Command',
            `if (Get-Process -Id ${targetPid} -ErrorAction SilentlyContinue) { 'running' } else { 'stopped' }`
          ], { encoding: 'utf8', windowsHide: true, timeout: 5000 }).trim()
          if (stillRunning === 'stopped' || attempts > 20) { resolve() } else { setTimeout(check, 500) }
        } catch (e) { resolve() }
      }
      check()
    })
  }

  return { success: true, editorPath }
})

ipcMain.handle('library:open-project', async (event, data) => {
  const projectPath = data?.projectPath || ''
  const editorPath = data?.editorPath || ''

  if (!projectPath || !fs.existsSync(projectPath)) {
    return { success: false, error: '项目路径无效' }
  }
  if (!editorPath || !fs.existsSync(editorPath)) {
    return { success: false, error: '编辑器路径无效' }
  }

  try {
    const { exec } = require('child_process')
    exec(`"${editorPath}" "${projectPath}"`, { windowsHide: false, detached: true })
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message || '打开项目失败' }
  }
})

ipcMain.handle('library:show-in-folder', (event, filePath) => {
  if (filePath) {
    shell.showItemInFolder(filePath)
  }
  return { success: true }
})

ipcMain.handle('library:copy-path', (event, text) => {
  clipboard.writeText(text || '')
  return { success: true }
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
