const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#00000000',
            symbolColor: '#ffffff',
            height: 30
        }
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (!app.isPackaged) {
        win.loadURL('http://localhost:5173');
    } else {
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('winget-search', async (event, query) => {
    return new Promise((resolve, reject) => {
        const command = `chcp 65001 >nul & winget search "${query}" --accept-source-agreements`;
        console.log(`Executing: ${command}`);

        exec(command, { encoding: 'utf8', env: { ...process.env, COLUMNS: '4096' } }, (error, stdout, stderr) => {
            if (error && !stdout) {
                console.error(`exec error: ${error}`);
                reject(stderr || error.message);
                return;
            }
            resolve(stdout);
        });
    });
});

ipcMain.handle('winget-install', async (event, id) => {
    return new Promise((resolve, reject) => {
        const command = `chcp 65001 >nul & winget install --id "${id}" --accept-package-agreements --accept-source-agreements`;
        console.log(`Executing: ${command}`);

        exec(command, { encoding: 'utf8', env: { ...process.env, COLUMNS: '4096' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(stderr || error.message);
                return;
            }
            resolve(stdout);
        });
    });
});

ipcMain.handle('winget-check-updates', async (event) => {
    return new Promise((resolve, reject) => {
        const command = `chcp 65001 >nul & winget upgrade --accept-source-agreements`;
        console.log(`Executing: ${command}`);

        exec(command, { encoding: 'utf8', env: { ...process.env, COLUMNS: '4096' } }, (error, stdout, stderr) => {
            if (error && error.code !== 1 && !stdout) {
                console.error(`exec error: ${error}`);
                reject(stderr || error.message);
                return;
            }
            resolve(stdout);
        });
    });
});

ipcMain.handle('winget-upgrade', async (event, id) => {
    return new Promise((resolve, reject) => {
        const command = `chcp 65001 >nul & winget upgrade --id "${id}" --accept-package-agreements --accept-source-agreements`;
        console.log(`Executing: ${command}`);

        exec(command, { encoding: 'utf8', env: { ...process.env, COLUMNS: '4096' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(stderr || error.message);
                return;
            }
            resolve(stdout);
        });
    });
});

ipcMain.handle('winget-upgrade-all', async (event) => {
    return new Promise((resolve, reject) => {
        const command = `chcp 65001 >nul & winget upgrade --all --accept-package-agreements --accept-source-agreements`;
        console.log(`Executing: ${command}`);

        exec(command, { encoding: 'utf8', env: { ...process.env, COLUMNS: '4096' } }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject(stderr || error.message);
                return;
            }
            resolve(stdout);
        });
    });
});
