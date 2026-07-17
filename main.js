const { app, BrowserWindow, ipcMain, dialog, shell, clipboard } = require('electron')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const os = require('os')
const net = require('net')

let mainWindow = null
let importCancelled = false
const uePythonHost = '127.0.0.1'
const uePythonPort = 8765
const githubLatestReleaseUrl = 'https://api.github.com/repos/DLlongHJDJSAKDHKJW/dalong-tool-hub/releases/latest'

app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')
app.commandLine.appendSwitch('disable-gpu-sandbox')
app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor')
app.commandLine.appendSwitch('in-process-gpu')
app.disableHardwareAcceleration()

function ensureWritableDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
  const probePath = path.join(dirPath, '.write-test')
  fs.writeFileSync(probePath, 'ok', 'utf8')
  fs.unlinkSync(probePath)
  return dirPath
}

function resolvePreferredUserDataPath() {
  const appFolderPath = path.dirname(app.getPath('exe'))
  const localDataPath = path.join(appFolderPath, 'data')

  try {
    return ensureWritableDirectory(localDataPath)
  } catch (error) {
    const roamingDataPath = path.join(app.getPath('appData'), '大龙工具中枢')
    return ensureWritableDirectory(roamingDataPath)
  }
}

app.setPath('userData', resolvePreferredUserDataPath())

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
      cornerRadius: 22,
      motionStrength: 'soft',
      visibleOnlyPlayback: true,
      squarePreviewFill: true,
      showLibraryRootPath: true,
      visibleModules: ['ae', '3dmax', 'blender', 'c4d', 'maya', 'ps'],
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
        cornerRadius: Number(parsed.settings?.cornerRadius) || 22,
        motionStrength: typeof parsed.settings?.motionStrength === 'string' ? parsed.settings.motionStrength : 'soft',
        visibleOnlyPlayback: parsed.settings?.visibleOnlyPlayback !== undefined ? Boolean(parsed.settings.visibleOnlyPlayback) : true,
        squarePreviewFill: parsed.settings?.squarePreviewFill !== undefined ? Boolean(parsed.settings.squarePreviewFill) : true,
        showLibraryRootPath: parsed.settings?.showLibraryRootPath !== undefined ? Boolean(parsed.settings.showLibraryRootPath) : true,
        visibleModules: Array.isArray(parsed.settings?.visibleModules)
          ? parsed.settings.visibleModules
          : ['ae', '3dmax', 'blender', 'c4d', 'maya', 'ps'],
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
    appVersion: app.getVersion(),
  }
}

async function checkForUpdates() {
  const currentVersion = app.getVersion()
  const checkedAt = new Date().toISOString()
  const releasePageUrl = 'https://github.com/DLlongHJDJSAKDHKJW/dalong-tool-hub/releases'

  try {
    const response = await fetch(githubLatestReleaseUrl, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'dalong-tool-hub',
      },
    })

    if (response.status === 404) {
      return {
        success: true,
        currentVersion,
        latestVersion: '',
        hasUpdate: false,
        releaseUrl: releasePageUrl,
        downloadUrl: '',
        assetName: '',
        checkedAt,
        message: 'GitHub 仓库还没有创建 Release，创建发布版本后即可检查更新。',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        currentVersion,
        latestVersion: '',
        hasUpdate: false,
        releaseUrl: releasePageUrl,
        downloadUrl: '',
        assetName: '',
        checkedAt,
        message: `检查更新失败：GitHub 返回 ${response.status}。`,
      }
    }

    const release = await response.json()
    const assets = Array.isArray(release?.assets) ? release.assets : []
    const preferredAsset = assets.find((asset) => /setup-.*x64\.exe$/i.test(String(asset?.name || '')))
      || assets.find((asset) => /\.exe$/i.test(String(asset?.name || '')))
      || null
    const latestVersion = normalizeVersionText(release?.tag_name || release?.name || '')
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0
    const downloadUrl = String(preferredAsset?.browser_download_url || '')
    const assetName = String(preferredAsset?.name || '')
    return {
      success: true,
      currentVersion,
      latestVersion,
      hasUpdate,
      releaseUrl: release?.html_url || releasePageUrl,
      downloadUrl,
      assetName,
      checkedAt,
      message: hasUpdate
        ? (downloadUrl
          ? `发现新版本 v${latestVersion}，可直接下载最新安装包。`
          : `发现新版本 v${latestVersion}，但当前 Release 里还没有安装包附件。`)
        : `当前已经是最新版本 v${currentVersion}。`,
    }
  } catch (error) {
    return {
      success: false,
      currentVersion,
      latestVersion: '',
      hasUpdate: false,
      releaseUrl: releasePageUrl,
      downloadUrl: '',
      assetName: '',
      checkedAt,
      message: `检查更新失败：${error.message || '网络连接异常'}`,
    }
  }
}

async function downloadUpdatePackage(data) {
  const fallbackName = `大龙工具中枢-Setup-${normalizeVersionText(data?.latestVersion || app.getVersion()) || app.getVersion()}-x64.exe`
  const downloadUrl = String(data?.downloadUrl || '')
  const assetName = String(data?.assetName || fallbackName).trim() || fallbackName

  if (!/^https:\/\/github\.com\/DLlongHJDJSAKDHKJW\/dalong-tool-hub/i.test(downloadUrl)) {
    return { success: false, error: '没有可下载的安装包链接。' }
  }

  const saveDialog = await dialog.showSaveDialog(mainWindow, {
    title: '保存最新安装包',
    defaultPath: path.join(app.getPath('downloads'), assetName),
    filters: [
      { name: '安装程序', extensions: ['exe'] },
    ],
  })

  if (saveDialog.canceled || !saveDialog.filePath) {
    return { success: false, cancelled: true, error: '已取消下载。' }
  }

  try {
    const response = await fetch(downloadUrl, {
      headers: {
        'Accept': 'application/octet-stream',
        'User-Agent': 'dalong-tool-hub',
      },
    })

    if (!response.ok || !response.body) {
      return { success: false, error: `下载失败：GitHub 返回 ${response.status}。` }
    }

    await fs.promises.mkdir(path.dirname(saveDialog.filePath), { recursive: true })
    const fileStream = fs.createWriteStream(saveDialog.filePath)
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream)
      response.body.on('error', reject)
      fileStream.on('finish', resolve)
      fileStream.on('error', reject)
    })

    const openNow = await dialog.showMessageBox(mainWindow, {
      type: 'question',
      buttons: ['立即安装', '稍后安装'],
      defaultId: 0,
      cancelId: 1,
      title: '下载完成',
      message: '最新安装包已下载完成。',
      detail: saveDialog.filePath,
    })

    if (openNow.response === 0) {
      await shell.openPath(saveDialog.filePath)
    }

    return {
      success: true,
      savedPath: saveDialog.filePath,
      openedInstaller: openNow.response === 0,
    }
  } catch (error) {
    return { success: false, error: `下载安装包失败：${error.message || '未知错误'}` }
  }
}

function normalizeVersionText(value) {
  return String(value || '').trim().replace(/^v/i, '').match(/\d+(?:\.\d+){0,3}/)?.[0] || ''
}

function compareVersions(left, right) {
  const a = normalizeVersionText(left).split('.').map((item) => Number(item) || 0)
  const b = normalizeVersionText(right).split('.').map((item) => Number(item) || 0)
  const length = Math.max(a.length, b.length, 3)
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] || 0) - (b[index] || 0)
    if (diff !== 0) {
      return diff
    }
  }
  return 0
}

function uePythonRequest(payload, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const client = net.createConnection({ host: uePythonHost, port: uePythonPort })
    let buffer = ''
    let settled = false

    const finish = (data) => {
      if (settled) {
        return
      }
      settled = true
      clearTimeout(timer)
      client.destroy()
      resolve(data)
    }

    const timer = setTimeout(() => {
      finish({ ok: false, error: 'UE Python 服务连接超时。' })
    }, timeoutMs)

    client.setEncoding('utf8')
    client.on('connect', () => {
      client.write(`${JSON.stringify(payload)}\n`)
    })
    client.on('data', (chunk) => {
      buffer += chunk
      const lineEnd = buffer.indexOf('\n')
      if (lineEnd === -1) {
        return
      }
      const line = buffer.slice(0, lineEnd).trim()
      try {
        finish(JSON.parse(line))
      } catch (error) {
        finish({ ok: false, error: 'UE Python 服务返回了无效数据。' })
      }
    })
    client.on('error', () => {
      finish({ ok: false, error: 'UE Python 服务未连接。' })
    })
    client.on('close', () => {
      if (!settled) {
        finish({ ok: false, error: 'UE Python 服务已断开。' })
      }
    })
  })
}

function uePythonBootstrapCode() {
  return `exec(r'''
import json, socketserver, threading, queue, time, traceback, contextlib, io, sys, types
try:
    import unreal
except Exception:
    unreal = None
HOST = "127.0.0.1"
PORT = 8765
MODULE_NAME = "_dalong_ue_python_service"

old_service = sys.modules.get(MODULE_NAME)
if old_service and getattr(old_service, "server", None):
    try:
        old_service.server.shutdown()
        old_service.server.server_close()
    except Exception:
        pass

service = types.SimpleNamespace()
service.tasks = queue.Queue()
service.results = {}
service.busy = False
service.server = None
sys.modules[MODULE_NAME] = service

def _project_name():
    try:
        if unreal:
            return unreal.Paths.get_base_filename(unreal.Paths.get_project_file_path())
    except Exception:
        pass
    return ""

def _engine_version():
    try:
        if unreal:
            return unreal.SystemLibrary.get_engine_version()
    except Exception:
        pass
    return ""

def _execute(code, name):
    stdout = io.StringIO()
    stderr = io.StringIO()
    namespace = {"unreal": unreal, "__name__": "__dalong_remote__"}
    start = time.time()
    ok = True
    with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
        try:
            exec(code, namespace, namespace)
        except Exception:
            ok = False
            stderr.write(traceback.format_exc())
    if ok:
        _refresh_editor()
    return {
        "ok": ok,
        "scriptName": name,
        "stdout": stdout.getvalue(),
        "stderr": stderr.getvalue(),
        "durationMs": int((time.time() - start) * 1000),
    }

def _refresh_editor():
    if not unreal:
        return
    try:
        if hasattr(unreal, "EditorLevelLibrary") and hasattr(unreal.EditorLevelLibrary, "editor_invalidate_viewports"):
            unreal.EditorLevelLibrary.editor_invalidate_viewports()
    except Exception:
        pass
    try:
        subsystem_class = getattr(unreal, "LevelEditorSubsystem", None)
        if subsystem_class:
            subsystem = unreal.get_editor_subsystem(subsystem_class)
            if subsystem and hasattr(subsystem, "editor_invalidate_viewports"):
                subsystem.editor_invalidate_viewports()
    except Exception:
        pass
    try:
        if hasattr(unreal, "EditorLevelLibrary"):
            world = unreal.EditorLevelLibrary.get_editor_world()
            if world:
                unreal.SystemLibrary.execute_console_command(world, "RedrawAllViewports")
    except Exception:
        pass

def _tick(_delta):
    if service.busy:
        return
    try:
        request = service.tasks.get_nowait()
    except queue.Empty:
        return
    service.busy = True
    try:
        result = _execute(request.get("code", ""), request.get("scriptName", "remote.py"))
        result["requestId"] = request.get("requestId", "")
        service.results[result["requestId"]] = result
    finally:
        service.busy = False

if unreal:
    try:
        unreal.register_slate_post_tick_callback(_tick)
    except Exception:
        pass

def _response(payload):
    return (json.dumps(payload, ensure_ascii=False) + "\\n").encode("utf-8")

class _ThreadingServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True

class _Handler(socketserver.BaseRequestHandler):
    def handle(self):
        data = b""
        while b"\\n" not in data:
            chunk = self.request.recv(65536)
            if not chunk:
                break
            data += chunk
        try:
            request = json.loads(data.decode("utf-8").strip() or "{}")
        except Exception:
            self.request.sendall(_response({"ok": False, "error": "请求数据不是有效 JSON。"}))
            return
        kind = request.get("type")
        if kind == "ping" or kind == "get_status":
            self.request.sendall(_response({"ok": True, "type": "pong", "busy": service.busy, "project": _project_name(), "engine": _engine_version()}))
        elif kind == "execute_python":
            request_id = request.get("requestId") or str(time.time())
            service.tasks.put({"requestId": request_id, "scriptName": request.get("scriptName", "remote.py"), "code": request.get("code", "")})
            if request.get("async"):
                self.request.sendall(_response({"ok": True, "accepted": True, "requestId": request_id}))
                return
            deadline = time.time() + float(request.get("timeoutSec", 60))
            while time.time() < deadline:
                if request_id in service.results:
                    self.request.sendall(_response(service.results.pop(request_id)))
                    return
                time.sleep(0.05)
            self.request.sendall(_response({"ok": False, "requestId": request_id, "stderr": "执行超时", "durationMs": int(float(request.get("timeoutSec", 60)) * 1000)}))
        elif kind == "get_result":
            request_id = request.get("requestId", "")
            if request_id in service.results:
                self.request.sendall(_response({"ok": True, "done": True, "result": service.results.pop(request_id)}))
            else:
                self.request.sendall(_response({"ok": True, "done": False, "busy": service.busy}))
        elif kind == "shutdown":
            self.request.sendall(_response({"ok": True, "message": "UE Python 服务已停止。"}))
            threading.Thread(target=service.server.shutdown, daemon=True).start()
        else:
            self.request.sendall(_response({"ok": False, "error": "未知请求类型。"}))

def _serve():
    service.server = _ThreadingServer((HOST, PORT), _Handler)
    print("大龙工具 Python 服务已打开：%s:%s" % (HOST, PORT))
    try:
        service.server.serve_forever(poll_interval=0.2)
    finally:
        service.server.server_close()
        print("大龙工具 Python 服务已关闭")

threading.Thread(target=_serve, daemon=True).start()
''')`
}

function firstExistingPath(paths) {
  return paths.find((targetPath) => targetPath && fs.existsSync(targetPath)) || ''
}

const assetLibraryTypes = {
  blueprint: {
    label: '蓝图',
    folderNames: ['蓝图', 'Blueprint', 'Blueprints', 'blueprint', 'blueprints'],
  },
  material: {
    label: '材质',
    folderNames: ['材质', 'Material', 'Materials', 'material', 'materials'],
  },
  plugin: {
    label: '插件',
    folderNames: ['插件', 'Plugin', 'Plugins', 'plugin', 'plugins'],
  },
  script: {
    label: '脚本',
    folderNames: ['脚本', 'Script', 'Scripts', 'script', 'scripts'],
  },
  node: {
    label: '节点',
    folderNames: ['节点', 'Node', 'Nodes', 'node', 'nodes'],
  },
  project: {
    label: '工程',
    folderNames: ['工程', 'Project', 'Projects', 'project', 'projects'],
  },
}

const nodeSnippetCategories = {
  blueprint: { label: '蓝图', folderNames: ['蓝图', 'Blueprint', 'Blueprints', 'blueprint', 'blueprints'] },
  material: { label: '材质', folderNames: ['材质', 'Material', 'Materials', 'material', 'materials'] },
  effect: { label: '特效', folderNames: ['特效', 'Effect', 'Effects', 'VFX', 'vfx', 'effect', 'effects'] },
}

function unrealAssetRootPath(resourceRootPath) {
  const normalizedRoot = String(resourceRootPath || '').trim()
  if (!normalizedRoot) {
    return ''
  }

  return firstExistingPath([
    path.join(normalizedRoot, '虚幻引擎'),
    path.join(normalizedRoot, 'Unreal Engine'),
    path.join(normalizedRoot, 'UnrealEngine'),
    path.join(normalizedRoot, '资产', '虚幻引擎'),
    path.join(normalizedRoot, '资产', 'Unreal Engine'),
    path.join(normalizedRoot, '资产', 'UnrealEngine'),
    path.join(normalizedRoot, 'Assets', 'Unreal Engine'),
    path.join(normalizedRoot, 'Assets', 'UnrealEngine'),
    path.join(normalizedRoot, 'assets', 'unreal engine'),
    path.join(normalizedRoot, 'assets', 'unrealengine'),
    path.basename(normalizedRoot) === '虚幻引擎' ? normalizedRoot : '',
  ])
}

function preferredUnrealAssetRootPath(resourceRootPath) {
  const normalizedRoot = String(resourceRootPath || '').trim()
  if (!normalizedRoot) {
    return ''
  }

  if (path.basename(normalizedRoot) === '虚幻引擎') {
    return normalizedRoot
  }

  return path.join(normalizedRoot, '虚幻引擎')
}

function assetTypeRootPath(resourceRootPath, type) {
  const assetRoot = unrealAssetRootPath(resourceRootPath)
  const typeMeta = assetLibraryTypes[type] || assetLibraryTypes.blueprint
  if (!assetRoot) {
    return ''
  }

  return firstExistingPath(typeMeta.folderNames.map((folderName) => path.join(assetRoot, folderName)))
}

function preferredAssetTypeRootPath(resourceRootPath, type) {
  const assetRoot = preferredUnrealAssetRootPath(resourceRootPath)
  const typeMeta = assetLibraryTypes[type] || assetLibraryTypes.blueprint
  return assetRoot ? path.join(assetRoot, typeMeta.label) : ''
}

function nodeSnippetRootPath(resourceRootPath, category) {
  const nodeRoot = assetTypeRootPath(resourceRootPath, 'node') || preferredAssetTypeRootPath(resourceRootPath, 'node')
  const meta = nodeSnippetCategories[category] || nodeSnippetCategories.blueprint
  if (!nodeRoot) {
    return ''
  }
  return firstExistingPath(meta.folderNames.map((folderName) => path.join(nodeRoot, folderName))) || path.join(nodeRoot, meta.label)
}

function ensureNodeSnippetDirectory(resourceRootPath, category) {
  const nodeRoot = assetTypeRootPath(resourceRootPath, 'node') || preferredAssetTypeRootPath(resourceRootPath, 'node')
  if (!nodeRoot) {
    return ''
  }
  fs.mkdirSync(nodeRoot, { recursive: true })
  Object.keys(nodeSnippetCategories).forEach((key) => {
    const meta = nodeSnippetCategories[key]
    fs.mkdirSync(path.join(nodeRoot, meta.label), { recursive: true })
  })
  const targetDir = nodeSnippetRootPath(resourceRootPath, category)
  fs.mkdirSync(targetDir, { recursive: true })
  return targetDir
}

function ensureUnrealAssetDirectories(resourceRootPath) {
  const assetRoot = unrealAssetRootPath(resourceRootPath) || preferredUnrealAssetRootPath(resourceRootPath)
  if (!assetRoot) {
    return ''
  }

  fs.mkdirSync(assetRoot, { recursive: true })
  Object.keys(assetLibraryTypes).forEach((type) => {
    fs.mkdirSync(preferredAssetTypeRootPath(resourceRootPath, type), { recursive: true })
  })
  return assetRoot
}

function findPreviewFiles(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)

    const videoFile = files.find((fileName) => /\.(mp4|webm|mov|m4v)$/i.test(fileName)) || ''
    const imageFile = files.find((fileName) => /\.(jpe?g|png|webp|gif|bmp)$/i.test(fileName)) || ''
    const packageFile = files.find((fileName) => /\.(zip|7z|rar)$/i.test(fileName)) || ''
    const pythonFiles = files.filter((fileName) => /\.py$/i.test(fileName))

    return {
      videoPath: videoFile ? path.join(folderPath, videoFile) : '',
      imagePath: imageFile ? path.join(folderPath, imageFile) : '',
      packagePath: packageFile ? path.join(folderPath, packageFile) : '',
      pythonFiles: pythonFiles.map((fileName) => ({
        name: fileName,
        path: path.join(folderPath, fileName),
      })),
    }
  } catch (error) {
    return {
      videoPath: '',
      imagePath: '',
      packagePath: '',
      pythonFiles: [],
    }
  }
}

function normalizeUeVersionName(value) {
  const match = String(value || '').match(/(?:UE\s*)?(\d+(?:\.\d+)?)/i)
  return match?.[1] ? `UE${match[1]}` : ''
}

function displayUeVersionName(value) {
  const normalized = normalizeUeVersionName(value)
  return normalized || ''
}

function versionFromPackageName(fileName) {
  const baseName = path.basename(String(fileName || ''), path.extname(String(fileName || '')))
  const match = baseName.match(/(?:UE\s*)?(\d+(?:\.\d+)?)/i)
  return match?.[1] ? `UE${match[1]}` : ''
}

function pluginVersionPackages(folderPath) {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true })
    const flatPackages = entries
      .filter((entry) => entry.isFile() && /\.(zip|7z|rar)$/i.test(entry.name))
      .map((entry) => {
        const version = versionFromPackageName(entry.name)
        if (!version) {
          return null
        }
        return { version, folderPath, packagePath: path.join(folderPath, entry.name) }
      })
      .filter(Boolean)

    const folderPackages = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const version = normalizeUeVersionName(entry.name)
        if (!version || flatPackages.some((item) => item.version === version)) {
          return null
        }
        const versionPath = path.join(folderPath, entry.name)
        const previewFiles = findPreviewFiles(versionPath)
        return previewFiles.packagePath
          ? { version, folderPath: versionPath, packagePath: previewFiles.packagePath }
          : null
      })
      .filter(Boolean)

    return [...flatPackages, ...folderPackages]
      .sort((left, right) => left.version.localeCompare(right.version, 'zh-CN', { numeric: true }))
  } catch (error) {
    return []
  }
}

function assetLibraryState(type = 'blueprint') {
  const settings = settingsState()
  const typeKey = assetLibraryTypes[type] ? type : 'blueprint'
  const typeMeta = assetLibraryTypes[typeKey]

  if (!settings.resourceRootPath) {
    return {
      type: typeKey,
      label: typeMeta.label,
      resourceRootPath: '',
      unrealRoot: '',
      libraryRoot: '',
      items: [],
      message: '请先在设置中选择资源根目录。',
    }
  }

  let unrealRoot = ''
  let libraryRoot = ''
  try {
    unrealRoot = ensureUnrealAssetDirectories(settings.resourceRootPath)
    libraryRoot = assetTypeRootPath(settings.resourceRootPath, typeKey) || preferredAssetTypeRootPath(settings.resourceRootPath, typeKey)
  } catch (error) {
    return {
      type: typeKey,
      label: typeMeta.label,
      resourceRootPath: settings.resourceRootPath,
      unrealRoot: '',
      libraryRoot: '',
      items: [],
      message: `创建${typeMeta.label}资源目录失败，请检查资源根目录权限。`,
    }
  }

  if (!unrealRoot) {
    return {
      type: typeKey,
      label: typeMeta.label,
      resourceRootPath: settings.resourceRootPath,
      unrealRoot: '',
      libraryRoot: '',
      items: [],
      message: '未找到虚幻引擎资源目录，请确认资源根目录下存在“资产/虚幻引擎”文件夹。',
    }
  }

  if (!libraryRoot) {
    return {
      type: typeKey,
      label: typeMeta.label,
      resourceRootPath: settings.resourceRootPath,
      unrealRoot,
      libraryRoot: '',
      items: [],
      message: `未找到${typeMeta.label}资源目录，请确认“资产/虚幻引擎”下存在“${typeMeta.label}”文件夹。`,
    }
  }

  try {
    const libraryEntries = fs.readdirSync(libraryRoot, { withFileTypes: true })
    const rootPythonFiles = typeKey === 'script'
      ? libraryEntries
          .filter((entry) => entry.isFile() && /\.py$/i.test(entry.name))
          .map((entry) => ({
            name: entry.name,
            path: path.join(libraryRoot, entry.name),
          }))
      : []

    const rootScriptItems = rootPythonFiles.map((file) => ({
      name: path.basename(file.name, path.extname(file.name)),
      type: typeKey,
      label: typeMeta.label,
      folderPath: libraryRoot,
      videoPath: '',
      videoUrl: '',
      imagePath: '',
      imageUrl: '',
      packagePath: file.path,
      pluginVersions: [],
      pythonFiles: [file],
      mainScriptPath: file.path,
      hasInitScript: /^init_unreal\.py$/i.test(file.name),
      hasVideo: false,
      hasImage: false,
      hasPackage: true,
    }))

    const folders = libraryEntries
      .filter((entry) => entry.isDirectory())
      .map((entry) => {
        const folderPath = path.join(libraryRoot, entry.name)
        const previewFiles = findPreviewFiles(folderPath)
        const pluginVersions = typeKey === 'plugin' ? pluginVersionPackages(folderPath) : []
        const pythonFiles = typeKey === 'script' ? previewFiles.pythonFiles : []
        const fallbackPackagePath = typeKey === 'script'
          ? (pythonFiles[0]?.path || '')
          : (previewFiles.packagePath || pluginVersions[0]?.packagePath || '')
        return {
          name: entry.name,
          type: typeKey,
          label: typeMeta.label,
          folderPath,
          videoPath: previewFiles.videoPath,
          videoUrl: previewFiles.videoPath ? pathToFileURL(previewFiles.videoPath).href : '',
          imagePath: previewFiles.imagePath,
          imageUrl: previewFiles.imagePath ? pathToFileURL(previewFiles.imagePath).href : '',
          packagePath: fallbackPackagePath,
          pluginVersions,
          pythonFiles,
          mainScriptPath: pythonFiles.find((file) => /^init_unreal\.py$/i.test(file.name))?.path || pythonFiles[0]?.path || '',
          hasInitScript: pythonFiles.some((file) => /^init_unreal\.py$/i.test(file.name)),
          hasVideo: Boolean(previewFiles.videoPath),
          hasImage: Boolean(previewFiles.imagePath),
          hasPackage: Boolean(fallbackPackagePath),
        }
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))
    const items = [...rootScriptItems, ...folders].sort((left, right) => left.name.localeCompare(right.name, 'zh-CN'))

    return {
      type: typeKey,
      label: typeMeta.label,
      resourceRootPath: settings.resourceRootPath,
      unrealRoot,
      libraryRoot,
      items,
      message: items.length ? `已读取 ${items.length} 个${typeMeta.label}资源。` : `${typeMeta.label}目录存在，但还没有可用资源。`,
    }
  } catch (error) {
    return {
      type: typeKey,
      label: typeMeta.label,
      resourceRootPath: settings.resourceRootPath,
      unrealRoot,
      libraryRoot,
      items: [],
      message: `读取${typeMeta.label}资源目录失败。`,
    }
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#111111',
    frame: false,
    transparent: false,
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

  mainWindow.on('unresponsive', () => {
    console.error('[electron] main window became unresponsive')
  })

  mainWindow.on('responsive', () => {
    console.info('[electron] main window became responsive again')
  })

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[electron] renderer process gone', details)
  })

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.warn(`[renderer:${level}] ${message} (${sourceId}:${line})`)
    }
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

ipcMain.handle('window:always-on-top-toggle', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) {
    return false
  }

  const nextState = !win.isAlwaysOnTop()
  win.setAlwaysOnTop(nextState)
  return nextState
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

ipcMain.handle('settings:check-update', async () => {
  try {
    return await checkForUpdates()
  } catch (error) {
    return {
      success: false,
      currentVersion: app.getVersion(),
      latestVersion: '',
      hasUpdate: false,
      releaseUrl: '',
      downloadUrl: '',
      assetName: '',
      checkedAt: new Date().toISOString(),
      message: `检查更新失败：${error.message || '未知错误'}`,
    }
  }
})

ipcMain.handle('settings:download-update', async (event, data) => {
  try {
    return await downloadUpdatePackage(data)
  } catch (error) {
    return {
      success: false,
      error: `下载安装包失败：${error.message || '未知错误'}`,
    }
  }
})

ipcMain.handle('ue-python:get-bootstrap-code', () => {
  return {
    success: true,
    host: uePythonHost,
    port: uePythonPort,
    code: uePythonBootstrapCode(),
  }
})

ipcMain.handle('ue-python:ping', async () => {
  const result = await uePythonRequest({ type: 'ping' }, 2500)
  return {
    success: Boolean(result?.ok),
    host: uePythonHost,
    port: uePythonPort,
    ...result,
  }
})

ipcMain.handle('ue-python:execute', async (event, data) => {
  const code = String(data?.code || '')
  const scriptName = String(data?.scriptName || 'remote.py')
  if (!code.trim()) {
    return { success: false, ok: false, error: '脚本内容为空。' }
  }

  const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  const result = await uePythonRequest({
    type: 'execute_python',
    requestId,
    scriptName,
    code,
    async: true,
  }, 5000)

  return {
    success: Boolean(result?.ok),
    ...result,
  }
})

ipcMain.handle('ue-python:get-result', async (event, requestId) => {
  if (!requestId) {
    return { success: false, ok: false, error: '缺少执行请求 ID。' }
  }

  const result = await uePythonRequest({
    type: 'get_result',
    requestId,
  }, 3000)

  return {
    success: Boolean(result?.ok),
    ...result,
  }
})

ipcMain.handle('ue-python:shutdown', async () => {
  const result = await uePythonRequest({ type: 'shutdown' }, 2500)
  return {
    success: Boolean(result?.ok),
    ...result,
  }
})

ipcMain.handle('library:read-script-file', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !/\.py$/i.test(filePath)) {
    return { success: false, error: '未找到可执行的 Python 脚本。' }
  }

  try {
    const code = await fs.promises.readFile(filePath, 'utf8')
    return { success: true, code, name: path.basename(filePath), path: filePath }
  } catch (error) {
    return { success: false, error: `读取脚本失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:save-script-file', async (event, data) => {
  const filePath = data?.filePath || ''
  const code = String(data?.code ?? '')
  const createNew = Boolean(data?.createNew)
  if (!createNew && (!filePath || !fs.existsSync(filePath) || !/\.py$/i.test(filePath))) {
    return { success: false, error: '未找到可保存的 Python 脚本。' }
  }

  try {
    const settings = settingsState()
    if (createNew && !settings.resourceRootPath) {
      return { success: false, error: '请先在设置中选择资源根目录。' }
    }

    const parentDir = createNew
      ? (assetTypeRootPath(settings.resourceRootPath, 'script') || preferredAssetTypeRootPath(settings.resourceRootPath, 'script'))
      : path.dirname(filePath)
    if (!parentDir) {
      return { success: false, error: '未找到脚本资源目录。' }
    }
    await fs.promises.mkdir(parentDir, { recursive: true })

    const currentName = createNew ? '新建脚本' : path.basename(filePath, '.py')
    const nextBaseName = sanitizeResourceName(String(data?.nextName || currentName).replace(/\.py$/i, ''))
    if (!nextBaseName) {
      return { success: false, error: '脚本名称不能为空。' }
    }

    const targetPath = createNew ? uniqueScriptFilePath(parentDir, nextBaseName) : path.join(parentDir, `${nextBaseName}.py`)
    const samePath = targetPath.toLowerCase() === filePath.toLowerCase()
    if (!createNew && !samePath && fs.existsSync(targetPath)) {
      return { success: false, error: '同目录下已经存在同名脚本。' }
    }

    await fs.promises.writeFile(createNew ? targetPath : filePath, code, 'utf8')
    if (!createNew && !samePath) {
      await fs.promises.rename(filePath, targetPath)
    }

    return { success: true, path: targetPath, name: path.basename(targetPath) }
  } catch (error) {
    return { success: false, error: `保存脚本失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:delete-script-file', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !/\.py$/i.test(filePath)) {
    return { success: false, error: '未找到要删除的 Python 脚本。' }
  }

  try {
    const parentDir = path.dirname(filePath)
    const scriptRoot = assetTypeRootPath(settingsState().resourceRootPath, 'script') || preferredAssetTypeRootPath(settingsState().resourceRootPath, 'script')
    await fs.promises.rm(filePath, { force: true })

    if (scriptRoot && parentDir.toLowerCase() !== scriptRoot.toLowerCase()) {
      const remaining = fs.existsSync(parentDir) ? await fs.promises.readdir(parentDir) : []
      if (remaining.length === 0) {
        await fs.promises.rm(parentDir, { recursive: true, force: true })
      }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: `删除脚本失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:get-node-snippets', async (event, category) => {
  const categoryKey = nodeSnippetCategories[category] ? category : 'blueprint'
  const settings = settingsState()
  if (!settings.resourceRootPath) {
    return { success: false, items: [], libraryRoot: '', message: '请先在设置中选择资源根目录。' }
  }

  try {
    const libraryRoot = ensureNodeSnippetDirectory(settings.resourceRootPath, categoryKey)
    const entries = await fs.promises.readdir(libraryRoot, { withFileTypes: true })
    const items = entries
      .filter((entry) => entry.isFile() && /\.json$/i.test(entry.name))
      .map((entry) => ({
        name: path.basename(entry.name, path.extname(entry.name)),
        fileName: entry.name,
        path: path.join(libraryRoot, entry.name),
        category: categoryKey,
      }))
      .sort((left, right) => left.name.localeCompare(right.name, 'zh-CN', { numeric: true }))
    const label = nodeSnippetCategories[categoryKey].label
    return {
      success: true,
      items,
      libraryRoot,
      message: items.length ? `已读取 ${items.length} 个${label}节点。` : `${label}分类还没有节点片段。`,
    }
  } catch (error) {
    return { success: false, items: [], libraryRoot: '', message: `读取节点片段失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:read-node-snippet', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !/\.json$/i.test(filePath)) {
    return { success: false, error: '未找到节点片段文件。' }
  }

  try {
    const content = await fs.promises.readFile(filePath, 'utf8')
    return { success: true, content, name: path.basename(filePath, '.json'), path: filePath }
  } catch (error) {
    return { success: false, error: `读取节点片段失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:save-node-snippet', async (event, data) => {
  const categoryKey = nodeSnippetCategories[data?.category] ? data.category : 'blueprint'
  const filePath = data?.filePath || ''
  const content = String(data?.content ?? '')
  const createNew = Boolean(data?.createNew)
  if (!createNew && (!filePath || !fs.existsSync(filePath) || !/\.json$/i.test(filePath))) {
    return { success: false, error: '未找到可保存的节点片段。' }
  }

  try {
    const settings = settingsState()
    if (!settings.resourceRootPath) {
      return { success: false, error: '请先在设置中选择资源根目录。' }
    }
    const parentDir = createNew ? ensureNodeSnippetDirectory(settings.resourceRootPath, categoryKey) : path.dirname(filePath)
    const currentName = createNew ? '新建节点' : path.basename(filePath, '.json')
    const nextBaseName = sanitizeResourceName(String(data?.nextName || currentName).replace(/\.json$/i, ''))
    if (!nextBaseName) {
      return { success: false, error: '节点名称不能为空。' }
    }

    const targetPath = createNew ? uniqueJsonFilePath(parentDir, nextBaseName) : path.join(parentDir, `${nextBaseName}.json`)
    const samePath = targetPath.toLowerCase() === filePath.toLowerCase()
    if (!createNew && !samePath && fs.existsSync(targetPath)) {
      return { success: false, error: '同目录下已经存在同名节点。' }
    }

    await fs.promises.writeFile(createNew ? targetPath : filePath, content, 'utf8')
    if (!createNew && !samePath) {
      await fs.promises.rename(filePath, targetPath)
    }

    return { success: true, path: targetPath, name: path.basename(targetPath) }
  } catch (error) {
    return { success: false, error: `保存节点片段失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:delete-node-snippet', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !/\.json$/i.test(filePath)) {
    return { success: false, error: '未找到要删除的节点片段。' }
  }

  try {
    await fs.promises.rm(filePath, { force: true })
    return { success: true }
  } catch (error) {
    return { success: false, error: `删除节点片段失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:copy-node-snippet', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath) || !/\.json$/i.test(filePath)) {
    return { success: false, error: '未找到节点片段文件。' }
  }

  try {
    const content = await fs.promises.readFile(filePath, 'utf8')
    clipboard.writeText(content)
    return { success: true, name: path.basename(filePath, '.json') }
  } catch (error) {
    return { success: false, error: `复制节点片段失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:open-node-directory', async (event, category) => {
  const categoryKey = nodeSnippetCategories[category] ? category : 'blueprint'
  const settings = settingsState()
  if (!settings.resourceRootPath) {
    return { success: false, error: '请先在设置中选择资源根目录。' }
  }

  try {
    const libraryRoot = ensureNodeSnippetDirectory(settings.resourceRootPath, categoryKey)
    shell.openPath(libraryRoot)
    return { success: true, path: libraryRoot }
  } catch (error) {
    return { success: false, error: `打开节点目录失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:get-assets', (event, type) => {
  return assetLibraryState(type)
})

ipcMain.handle('library:add-asset-folder', async (event, type) => {
  const typeKey = assetLibraryTypes[type] ? type : 'blueprint'
  const settings = settingsState()
  if (!settings.resourceRootPath) {
    return { success: false, error: '请先在设置中选择资源根目录。' }
  }

  const targetRoot = preferredAssetTypeRootPath(settings.resourceRootPath, typeKey)
  fs.mkdirSync(targetRoot, { recursive: true })

  const result = await dialog.showOpenDialog(mainWindow, {
    title: `选择要添加的${assetLibraryTypes[typeKey].label}资源文件夹`,
    properties: ['openDirectory'],
  })

  if (result.canceled || !result.filePaths.length) {
    return { success: false, cancelled: true, error: '未选择资源文件夹。' }
  }

  const sourceDir = result.filePaths[0]
  const targetDir = uniqueResourcePath(targetRoot, path.basename(sourceDir))
  try {
    await copyDirRecursive(sourceDir, targetDir)
    return { success: true, targetPath: targetDir, library: assetLibraryState(typeKey) }
  } catch (error) {
    return { success: false, error: `添加资源失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:open-asset-root', (event, type) => {
  const typeKey = assetLibraryTypes[type] ? type : 'blueprint'
  const settings = settingsState()
  if (!settings.resourceRootPath) {
    return { success: false, error: '请先在设置中选择资源根目录。' }
  }

  const targetRoot = preferredAssetTypeRootPath(settings.resourceRootPath, typeKey)
  fs.mkdirSync(targetRoot, { recursive: true })
  shell.openPath(targetRoot)
  return { success: true, path: targetRoot }
})

ipcMain.handle('library:rename-asset', (event, data) => {
  const folderPath = data?.folderPath || ''
  const nextName = sanitizeResourceName(data?.nextName || '')
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, error: '资源文件夹不存在。' }
  }
  if (!nextName) {
    return { success: false, error: '资源名称不能为空。' }
  }

  const parentDir = path.dirname(folderPath)
  const targetPath = path.join(parentDir, nextName)
  if (targetPath.toLowerCase() !== folderPath.toLowerCase() && fs.existsSync(targetPath)) {
    return { success: false, error: '同名资源已存在。' }
  }

  try {
    fs.renameSync(folderPath, targetPath)
    return { success: true, targetPath }
  } catch (error) {
    return { success: false, error: `重命名失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('library:delete-asset', async (event, data) => {
  const folderPath = data?.folderPath || ''
  if (!folderPath || !fs.existsSync(folderPath)) {
    return { success: false, error: '资源文件夹不存在。' }
  }

  try {
    await Promise.race([
      shell.trashItem(folderPath),
      new Promise((_, reject) => setTimeout(() => reject(new Error('移到回收站超时')), 4500)),
    ])
    return { success: true }
  } catch (error) {
    try {
      await delay(500)
      await removeDirWithRetry(folderPath)
      return { success: true }
    } catch (removeError) {
      const reason = removeError.message || error.message || '未知错误'
      return { success: false, error: `删除失败：${reason}。请关闭正在预览或占用该资源的程序后再试。` }
    }
  }
})

ipcMain.handle('library:choose-asset-file', async (event, kind) => {
  const isVideo = kind === 'video'
  const isPluginPackages = kind === 'plugin-packages'
  const result = await dialog.showOpenDialog(mainWindow, {
    title: isVideo ? '选择预览文件' : isPluginPackages ? '选择插件压缩包' : '选择资源压缩包',
    properties: isPluginPackages ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [
      isVideo
        ? { name: 'Preview', extensions: ['mp4', 'webm', 'mov', 'm4v', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] }
        : { name: 'Archive', extensions: ['zip', '7z', 'rar'] },
    ],
  })

  if (result.canceled || !result.filePaths.length) {
    return { success: false, cancelled: true }
  }

  if (isPluginPackages) {
    return {
      success: true,
      files: result.filePaths.map((filePath) => ({
        name: path.basename(filePath),
        path: filePath,
        version: versionFromPackageName(filePath),
      })),
    }
  }

  const filePath = result.filePaths[0]
  const isImage = /\.(jpe?g|png|webp|gif|bmp)$/i.test(filePath)
  return {
    success: true,
    file: {
      name: path.basename(filePath),
      path: filePath,
      url: isVideo ? pathToFileURL(filePath).href : '',
      isImage,
    },
  }
})

ipcMain.handle('library:create-asset', async (event, data) => {
  const typeKey = assetLibraryTypes[data?.type] ? data.type : 'blueprint'
  const settings = settingsState()
  if (!settings.resourceRootPath) {
    return { success: false, error: '请先在设置中选择资源根目录。' }
  }

  const name = sanitizeResourceName(data?.name || '')
  if (!name) {
    return { success: false, error: '请填写资产名称。' }
  }

  const videoPath = data?.videoPath || ''
  const packagePath = data?.packagePath || ''
  const pluginVersion = displayUeVersionName(data?.pluginVersion || '')
  const pluginPackages = Array.isArray(data?.pluginPackages)
    ? data.pluginPackages
        .map((entry) => ({
          version: displayUeVersionName(entry?.version || versionFromPackageName(entry?.path || '')),
          path: entry?.path || '',
        }))
        .filter((entry) => entry.version && entry.path && fs.existsSync(entry.path))
    : []
  const hasVideo = videoPath && fs.existsSync(videoPath)
  const hasPackage = packagePath && fs.existsSync(packagePath)
  const hasPluginPackages = pluginPackages.length > 0
  if (!hasVideo && !hasPackage && !hasPluginPackages) {
    return { success: false, error: '请至少拖入预览视频或压缩包。' }
  }

  if (typeKey === 'plugin' && !hasPluginPackages && !hasPackage) {
    return { success: false, error: '请至少选择一个插件压缩包。' }
  }

  if (typeKey === 'plugin' && !hasPluginPackages && !pluginVersion) {
    return { success: false, error: '请选择插件适配的引擎版本。' }
  }

  if (hasVideo && !/\.(mp4|webm|mov|m4v|jpe?g|png|webp|gif|bmp)$/i.test(videoPath)) {
    return { success: false, error: '预览文件仅支持图片、mp4、webm、mov、m4v。' }
  }
  if (hasPackage && !/\.(zip|7z|rar)$/i.test(packagePath)) {
    return { success: false, error: '压缩包仅支持 zip、7z、rar。' }
  }
  const invalidPluginPackage = pluginPackages.find((entry) => !/\.(zip|7z|rar)$/i.test(entry.path))
  if (invalidPluginPackage) {
    return { success: false, error: `${invalidPluginPackage.version} 的压缩包仅支持 zip、7z、rar。` }
  }

  const targetRoot = preferredAssetTypeRootPath(settings.resourceRootPath, typeKey)
  const targetDir = path.join(targetRoot, name)
  if (typeKey !== 'plugin' && fs.existsSync(targetDir)) {
    return { success: false, error: '同名资产已存在，请换一个名称。' }
  }
  if (typeKey === 'plugin' && hasPluginPackages) {
    const duplicatedVersion = pluginPackages.find((entry) => pluginVersionPackages(targetDir).some((item) => item.version === entry.version))
    if (duplicatedVersion) {
      return { success: false, error: `${duplicatedVersion.version} 插件包已存在，请移除列表中的重复版本。` }
    }
  }

  try {
    fs.mkdirSync(targetDir, { recursive: true })
    await copyAssetFile(videoPath, targetDir, name)
    if (typeKey === 'plugin') {
      const packagesToSave = hasPluginPackages ? pluginPackages : [{ version: pluginVersion, path: packagePath }]
      for (const pluginPackage of packagesToSave) {
        const sourceName = path.basename(pluginPackage.path)
        const targetPackagePath = path.join(targetDir, sourceName)
        await fs.promises.copyFile(pluginPackage.path, targetPackagePath)
      }
    } else {
      await copyAssetFile(packagePath, targetDir, 'Content')
    }
    return { success: true, targetPath: targetDir, library: assetLibraryState(typeKey) }
  } catch (error) {
    if (typeKey === 'plugin' && fs.existsSync(targetDir)) {
      for (const pluginPackage of pluginPackages) {
        const copiedPath = path.join(targetDir, path.basename(pluginPackage.path))
        if (fs.existsSync(copiedPath)) {
          fs.rmSync(copiedPath, { force: true })
        }
      }
    } else {
      removeDirRecursive(targetDir)
    }
    return { success: false, error: `创建资产失败：${error.message || '未知错误'}` }
  }
})

ipcMain.handle('settings:open-external', async (event, url) => {
  const targetUrl = String(url || '')
  if (!/^https:\/\/github\.com\/DLlongHJDJSAKDHKJW\/dalong-tool-hub/i.test(targetUrl)) {
    return { success: false, error: '只能打开当前项目的 GitHub 页面。' }
  }
  await shell.openExternal(targetUrl)
  return { success: true }
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
  ensureUnrealAssetDirectories(store.settings.resourceRootPath)
  return settingsState()
})

ipcMain.handle('settings:save-resource-root', (event, resourceRootPath) => {
  const store = readStore()
  store.settings = store.settings || {}
  store.settings.resourceRootPath = String(resourceRootPath || '').trim()
  writeStore(store)
  if (store.settings.resourceRootPath) {
    ensureUnrealAssetDirectories(store.settings.resourceRootPath)
  }
  return settingsState()
})

ipcMain.handle('settings:save-all', (event, nextSettings) => {
  const store = readStore()
  store.settings = {
    ...(store.settings || {}),
    resourceRootPath: String(nextSettings?.resourceRootPath || '').trim(),
    defaultPage: String(nextSettings?.defaultPage || 'home'),
    defaultCardColumns: Math.min(5, Math.max(2, Number(nextSettings?.defaultCardColumns) || 5)),
    cornerRadius: Math.min(32, Math.max(10, Number(nextSettings?.cornerRadius) || 22)),
    motionStrength: ['soft', 'normal', 'strong'].includes(String(nextSettings?.motionStrength))
      ? String(nextSettings.motionStrength)
      : 'soft',
    visibleOnlyPlayback: Boolean(nextSettings?.visibleOnlyPlayback),
    squarePreviewFill: Boolean(nextSettings?.squarePreviewFill),
    showLibraryRootPath: nextSettings?.showLibraryRootPath !== false,
    visibleModules: Array.isArray(nextSettings?.visibleModules)
      ? nextSettings.visibleModules.filter((id) => ['ae', '3dmax', 'blender', 'c4d', 'maya', 'ps'].includes(id))
      : ['ae', '3dmax', 'blender', 'c4d', 'maya', 'ps'],
  }
  writeStore(store)
  if (store.settings.resourceRootPath) {
    ensureUnrealAssetDirectories(store.settings.resourceRootPath)
  }
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

function findPluginRootFolder(rootDir, maxDepth = 4) {
  function search(dir, depth) {
    if (depth > maxDepth) {
      return ''
    }
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true })
      if (entries.some((entry) => entry.isFile() && /\.uplugin$/i.test(entry.name))) {
        return dir
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

function inspectPluginPackage(rootDir) {
  const pluginRoot = findPluginRootFolder(rootDir)
  if (!pluginRoot) {
    return {
      ok: false,
      pluginRoot: '',
      issues: ['未找到 .uplugin 文件'],
      flags: {
        hasUplugin: false,
        hasBinaries: false,
        hasContent: false,
        hasResources: false,
        hasConfig: false,
      },
    }
  }

  const flags = {
    hasUplugin: true,
    hasBinaries: fs.existsSync(path.join(pluginRoot, 'Binaries')),
    hasContent: fs.existsSync(path.join(pluginRoot, 'Content')),
    hasResources: fs.existsSync(path.join(pluginRoot, 'Resources')),
    hasConfig: fs.existsSync(path.join(pluginRoot, 'Config')),
  }

  const issues = []
  if (!flags.hasBinaries && !flags.hasContent) {
    issues.push('缺少 Binaries 或 Content 目录')
  }

  return {
    ok: issues.length === 0,
    pluginRoot,
    issues,
    flags,
  }
}

async function extractArchiveToTemp(packagePath, event, label = '资源包') {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ue-import-'))
  try {
    event.sender.send('import:progress', { stage: 'extracting', message: `正在解压${label}...`, current: 0, total: 0, percent: -1 })
    const ext = path.extname(packagePath).toLowerCase()

    if (ext === '.zip') {
      const AdmZip = require('adm-zip')
      const zip = new AdmZip(packagePath)
      zip.extractAllTo(tempDir, true)
    } else if (ext === '.7z' || ext === '.rar') {
      const { execFile } = require('child_process')
      const sevenZip = require('7zip-bin')
      const sevenZipPath = sevenZip.path7za || sevenZip.path7x || sevenZip.path7zz
      if (!sevenZipPath || !fs.existsSync(sevenZipPath)) {
        throw new Error('未找到 7z 解压工具，无法解压 7z/rar 文件。')
      }

      await new Promise((resolve, reject) => {
        execFile(
          sevenZipPath,
          ['x', packagePath, `-o${tempDir}`, '-y'],
          { encoding: 'utf8', windowsHide: true, maxBuffer: 30 * 1024 * 1024 },
          (error, stdout, stderr) => {
            if (error) {
              const detail = (stderr || stdout || error.message || '').trim()
              reject(new Error(detail || '7z 解压工具返回失败。'))
              return
            }
            resolve()
          }
        )
      })
    } else {
      throw new Error('压缩包仅支持 zip、7z、rar。')
    }

    return tempDir
  } catch (error) {
    removeDirRecursive(tempDir)
    throw error
  }
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

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function removeDirWithRetry(dirPath, attempts = 8) {
  let lastError = null
  for (let index = 0; index < attempts; index += 1) {
    try {
      await fs.promises.rm(dirPath, { recursive: true, force: true, maxRetries: 2, retryDelay: 160 })
      return
    } catch (error) {
      lastError = error
      await delay(220 + index * 180)
    }
  }
  throw lastError || new Error('删除失败')
}

async function copyDirRecursive(sourceDir, targetDir) {
  await fs.promises.mkdir(targetDir, { recursive: true })
  const entries = await fs.promises.readdir(sourceDir, { withFileTypes: true })
  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name)
    const targetPath = path.join(targetDir, entry.name)
    if (entry.isDirectory()) {
      await copyDirRecursive(sourcePath, targetPath)
    } else if (entry.isFile()) {
      await fs.promises.copyFile(sourcePath, targetPath)
    }
    await new Promise((resolve) => setImmediate(resolve))
  }
}

function sanitizeResourceName(name) {
  return String(name || '').trim().replace(/[<>:"/\\|?*]/g, '')
}

function uniqueResourcePath(parentDir, baseName) {
  const cleanName = sanitizeResourceName(baseName) || '未命名资源'
  let targetPath = path.join(parentDir, cleanName)
  let index = 2
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(parentDir, `${cleanName}-${index}`)
    index += 1
  }
  return targetPath
}

function uniqueScriptFilePath(parentDir, baseName) {
  const cleanName = sanitizeResourceName(String(baseName || '').replace(/\.py$/i, '')) || '新建脚本'
  let targetPath = path.join(parentDir, `${cleanName}.py`)
  let index = 2
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(parentDir, `${cleanName}-${index}.py`)
    index += 1
  }
  return targetPath
}

function uniqueJsonFilePath(parentDir, baseName) {
  const cleanName = sanitizeResourceName(String(baseName || '').replace(/\.json$/i, '')) || '新建节点'
  let targetPath = path.join(parentDir, `${cleanName}.json`)
  let index = 2
  while (fs.existsSync(targetPath)) {
    targetPath = path.join(parentDir, `${cleanName}-${index}.json`)
    index += 1
  }
  return targetPath
}

async function copyAssetFile(sourcePath, targetDir, baseName) {
  if (!sourcePath || !fs.existsSync(sourcePath)) {
    return ''
  }

  const ext = path.extname(sourcePath)
  const targetPath = path.join(targetDir, `${baseName}${ext}`)
  await fs.promises.copyFile(sourcePath, targetPath)
  return targetPath
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
    tempDir = await extractArchiveToTemp(packagePath, event, '资源包')
  } catch (error) {
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

ipcMain.handle('library:prepare-plugin-import', async (event, data) => {
  importCancelled = false
  const projectPath = data?.projectPath || ''
  const projectVersion = normalizeUeVersionName(data?.projectVersion || '')
  const pluginVersions = Array.isArray(data?.pluginVersions) ? data.pluginVersions : []
  const fallbackPackagePath = data?.packagePath || ''

  const emptyResult = {
    success: false,
    tempDir: '',
    contentDir: '',
    targetContentDir: '',
    conflicts: [],
    totalFiles: 0,
    matchedVersion: '',
    availableVersions: pluginVersions.map((entry) => entry.version).filter(Boolean),
    packageCheck: null,
    error: '',
  }

  if (!projectPath || !fs.existsSync(projectPath)) {
    event.sender.send('import:progress', { stage: 'error', message: '当前目标项目无效，请先在主页选择或检测虚幻项目。' })
    return { ...emptyResult, error: '当前目标项目无效，请先在主页选择或检测虚幻项目。' }
  }

  const matched = pluginVersions.find((entry) => normalizeUeVersionName(entry.version) === projectVersion)
  const packagePath = matched?.packagePath || (!pluginVersions.length ? fallbackPackagePath : '')
  if (!packagePath || !fs.existsSync(packagePath)) {
    const versionText = projectVersion || '当前版本'
    const availableText = emptyResult.availableVersions.length ? `可用版本：${emptyResult.availableVersions.join('、')}` : '当前插件没有可用版本包。'
    event.sender.send('import:progress', { stage: 'error', message: `未找到 ${versionText} 对应插件包。${availableText}` })
    return { ...emptyResult, error: `未找到 ${versionText} 对应插件包。${availableText}` }
  }

  let tempDir = ''
  try {
    tempDir = await extractArchiveToTemp(packagePath, event, '插件包')
  } catch (error) {
    const errorMsg = `解压失败：${error.message || '未知错误'}`
    event.sender.send('import:progress', { stage: 'error', message: errorMsg })
    return { ...emptyResult, error: errorMsg }
  }

  const packageCheck = inspectPluginPackage(tempDir)
  if (!packageCheck.ok) {
    removeDirRecursive(tempDir)
    const issueText = packageCheck.issues.join('，')
    event.sender.send('import:progress', { stage: 'error', message: `插件包结构异常：${issueText}。` })
    return { ...emptyResult, packageCheck, error: `插件包结构异常：${issueText}。` }
  }
  const pluginRoot = packageCheck.pluginRoot

  const projectDir = path.dirname(projectPath)
  const pluginsDir = path.join(projectDir, 'Plugins')
  const targetPluginDir = path.join(pluginsDir, path.basename(pluginRoot))

  event.sender.send('import:progress', { stage: 'scanning', message: '正在扫描插件冲突文件...', current: 0, total: 0, percent: 0 })
  const { conflicts, totalFiles } = scanConflicts(pluginRoot, targetPluginDir)

  return {
    success: true,
    tempDir,
    contentDir: pluginRoot,
    targetContentDir: targetPluginDir,
    conflicts,
    totalFiles,
    matchedVersion: matched?.version || projectVersion || '通用版本',
    availableVersions: emptyResult.availableVersions,
    packageCheck,
    error: '',
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
