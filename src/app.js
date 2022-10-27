/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0/
 */

const { app, ipcMain } = require('electron');
const { Microsoft } = require('minecraft-java-core');
const { autoUpdater } = require('electron-updater')

const path = require('path');
const fs = require('fs');

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");

let data
let dev = process.env.NODE_ENV === 'dev';

if (dev) {
    let appPath = path.resolve('./AppData/Launcher').replace(/\\/g, '/');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
    app.setPath('userData', appPath);
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(() => {
        UpdateWindow.createWindow();
    });
}

ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow())
ipcMain.on('update-window-dev-tools', () => UpdateWindow.getWindow().webContents.openDevTools())
ipcMain.on('main-window-open', () => MainWindow.createWindow())
ipcMain.on('main-window-dev-tools', () => MainWindow.getWindow().webContents.openDevTools())
ipcMain.on('main-window-close', () => MainWindow.destroyWindow())
ipcMain.on('main-window-progress', (event, options) => MainWindow.getWindow().setProgressBar(options.DL / options.totDL))
ipcMain.on('main-window-progress-reset', (event, options) => MainWindow.getWindow().setProgressBar(options.DL / options.totDL))
ipcMain.on('main-window-minimize', () => MainWindow.getWindow().minimize())

ipcMain.on('main-window-maximize', () => {
    if (MainWindow.getWindow().isMaximized()) {
        MainWindow.getWindow().unmaximize();
    } else {
        MainWindow.getWindow().maximize();
    }
})

ipcMain.on('main-window-hide', () => MainWindow.getWindow().hide())
ipcMain.on('main-window-show', () => MainWindow.getWindow().show())

ipcMain.handle('Microsoft-window', async(event, client_id) => {
    return await new Microsoft(client_id).getAuth();
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});


autoUpdater.autoDownload = false;

ipcMain.handle('update-app', () => {
    return new Promise(async(resolve, reject) => {
        autoUpdater.checkForUpdates().then(() => {
            resolve();
        }).catch(error => {
            resolve({
                error: true,
                message: error
            })
        })
    })
})

autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('updateAvailable');
});

ipcMain.on('start-update', () => {
    autoUpdater.downloadUpdate();
})

autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('download-progress', progress);
})


/// Partie de code rich presence Discord

const RPC = require('discord-rpc');// how this works lol
const rpc = new RPC.Client({
    transport: "ipc" // don't know what this does, I just read documentation
});

rpc.on("ready", () => {
    rpc.setActivity({
        details: "Joue à notre serveur 😎", // text under Application name
        state: "Rejoins notre Discord ! 😁", // text under details 
        startTimestamp: new Date(), // If you want to show how long the status has been running, if you don't want it, put // infront of the line or just delete this line
        largeImageKey: "logobouge", //must match images in the application
        largeImageText: "Akun.fr", // This is the text above the large image
        smallImageKey:"logobouge", //must match images in the application
        smallImageText: "url.akun.fr/dsgg", // this is the text above the small image
                buttons: [
            { label: "Discord 😁", url: "https://url.akun.fr/dsgg" }, //ex. { label: "My Dev Discord Server", url: "https://discord.gg/46HQ9rJ" },
            { label: "Site 😎", url: "https://akun.fr" } // ex. { label: "My Main Discord", url: "https://discord.gg/cEhU6VF" },
        ]
    });
    console.log("Rich Presence is now active"); // lets you know it worked
})

rpc.login({
    clientId: "1035161160829374474" //https://discord.com/developers/applications
})