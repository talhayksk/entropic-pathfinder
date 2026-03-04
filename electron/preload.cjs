const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    search: (query) => ipcRenderer.invoke('winget-search', query),
    install: (id) => ipcRenderer.invoke('winget-install', id),
    uninstall: (id) => ipcRenderer.invoke('winget-uninstall', id),
    listInstalled: () => ipcRenderer.invoke('winget-list-installed'),
    checkUpdates: () => ipcRenderer.invoke('winget-check-updates'),
    upgrade: (id) => ipcRenderer.invoke('winget-upgrade', id),
    upgradeAll: () => ipcRenderer.invoke('winget-upgrade-all'),
});
