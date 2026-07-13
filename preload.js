const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('desktopWindow', {
  minimize: () => ipcRenderer.send('window:minimize'),
  maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
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
})

contextBridge.exposeInMainWorld('libraryBridge', {
  getBlueprints: () => ipcRenderer.invoke('library:get-blueprints'),
  prepareImport: (data) => ipcRenderer.invoke('library:prepare-import', data),
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
