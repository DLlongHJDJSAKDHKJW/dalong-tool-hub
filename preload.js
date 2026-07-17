const { contextBridge, ipcRenderer, webUtils } = require('electron')

contextBridge.exposeInMainWorld('desktopWindow', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
  alwaysOnTopToggle: () => ipcRenderer.invoke('window:always-on-top-toggle'),
  close: () => ipcRenderer.send('window:close'),
})

contextBridge.exposeInMainWorld('projectBridge', {
  getState: () => ipcRenderer.invoke('projects:get-state'),
  scanOpenProjects: () => ipcRenderer.invoke('projects:scan-open'),
  addProject: () => ipcRenderer.invoke('projects:add-manual'),
  setActiveProject: (projectPath) => ipcRenderer.invoke('projects:set-active', projectPath),
  removeProject: (projectPath) => ipcRenderer.invoke('projects:remove', projectPath),
})

contextBridge.exposeInMainWorld('settingsBridge', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  chooseResourceRoot: () => ipcRenderer.invoke('settings:choose-resource-root'),
  saveResourceRoot: (resourceRootPath) => ipcRenderer.invoke('settings:save-resource-root', resourceRootPath),
  saveAll: (settings) => ipcRenderer.invoke('settings:save-all', settings),
  checkForUpdates: () => ipcRenderer.invoke('settings:check-update'),
  performUpdate: (data) => ipcRenderer.invoke('settings:perform-update', data),
  openExternal: (url) => ipcRenderer.invoke('settings:open-external', url),
  onUpdateProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('settings:update-progress', handler)
    return () => ipcRenderer.removeListener('settings:update-progress', handler)
  },
  offUpdateProgress: () => {
    ipcRenderer.removeAllListeners('settings:update-progress')
  },
})

contextBridge.exposeInMainWorld('uePythonBridge', {
  getBootstrapCode: () => ipcRenderer.invoke('ue-python:get-bootstrap-code'),
  ping: () => ipcRenderer.invoke('ue-python:ping'),
  execute: (data) => ipcRenderer.invoke('ue-python:execute', data),
  getResult: (requestId) => ipcRenderer.invoke('ue-python:get-result', requestId),
  shutdown: () => ipcRenderer.invoke('ue-python:shutdown'),
})

contextBridge.exposeInMainWorld('libraryBridge', {
  getAssets: (type) => ipcRenderer.invoke('library:get-assets', type),
  addAssetFolder: (type) => ipcRenderer.invoke('library:add-asset-folder', type),
  openAssetRoot: (type) => ipcRenderer.invoke('library:open-asset-root', type),
  renameAsset: (data) => ipcRenderer.invoke('library:rename-asset', data),
  deleteAsset: (data) => ipcRenderer.invoke('library:delete-asset', data),
  createAsset: (data) => ipcRenderer.invoke('library:create-asset', data),
  chooseAssetFile: (kind) => ipcRenderer.invoke('library:choose-asset-file', kind),
  readScriptFile: (filePath) => ipcRenderer.invoke('library:read-script-file', filePath),
  saveScriptFile: (data) => ipcRenderer.invoke('library:save-script-file', data),
  deleteScriptFile: (filePath) => ipcRenderer.invoke('library:delete-script-file', filePath),
  getNodeSnippets: (category) => ipcRenderer.invoke('library:get-node-snippets', category),
  readNodeSnippet: (filePath) => ipcRenderer.invoke('library:read-node-snippet', filePath),
  saveNodeSnippet: (data) => ipcRenderer.invoke('library:save-node-snippet', data),
  deleteNodeSnippet: (filePath) => ipcRenderer.invoke('library:delete-node-snippet', filePath),
  copyNodeSnippet: (filePath) => ipcRenderer.invoke('library:copy-node-snippet', filePath),
  openNodeDirectory: (category) => ipcRenderer.invoke('library:open-node-directory', category),
  filePath: (file) => webUtils.getPathForFile(file),
  prepareImport: (data) => ipcRenderer.invoke('library:prepare-import', data),
  preparePluginImport: (data) => ipcRenderer.invoke('library:prepare-plugin-import', data),
  executeImport: (data) => ipcRenderer.invoke('library:execute-import', data),
  cancelImport: (data) => ipcRenderer.invoke('library:cancel-import', data),
  closeEditor: (data) => ipcRenderer.invoke('library:close-editor', data),
  openProject: (data) => ipcRenderer.invoke('library:open-project', data),
  showInFolder: (filePath) => ipcRenderer.invoke('library:show-in-folder', filePath),
  copyPath: (text) => ipcRenderer.invoke('library:copy-path', text),
  onImportProgress: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('import:progress', handler)
    return () => ipcRenderer.removeListener('import:progress', handler)
  },
  offImportProgress: () => {
    ipcRenderer.removeAllListeners('import:progress')
  },
})
