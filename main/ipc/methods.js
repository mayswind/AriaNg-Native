'use strict';

const electron = require('electron');

const core = require('../core');
const config = require('../config/config');
const menu = require('../components/menu');
const tray = require('../components/tray');
const http = require('../lib/http');
const localfs = require('../lib/localfs');
const bittorrent = require('../lib/bittorrent');

const shell = electron.shell;
const ipcMain = electron.ipcMain;

ipcMain.on('render-sync-get-runtime-environment', (event) => {
    if (!process || !process.versions) {
        return null;
    }

    var versions = process.versions;

    event.returnValue = [
        {
            name: 'Electron',
            value: versions.electron
        },
        {
            name: 'Node.js',
            value: versions.node
        },
        {
            name: 'Chrome',
            value: versions.chrome
        },
        {
            name: 'V8',
            value: versions.v8
        }
    ];
});

ipcMain.on('render-sync-get-global-setting', (event, key) => {
    event.returnValue = global.settings[key];
});

ipcMain.handle('render-get-native-window-maximized', (event) => {
    return core.mainWindow.isMaximized();
});

ipcMain.on('render-minimize-native-window', (event) => {
    core.mainWindow.minimize();
});

ipcMain.on('render-maximize-or-restore-native-window', (event) => {
    if (!core.mainWindow.isMaximized()) {
        core.mainWindow.maximize();
    } else {
        core.mainWindow.unmaximize();
    }
});

ipcMain.on('render-reload-native-window', (event) => {
    core.mainWindow.reload();
});

ipcMain.on('render-exit-native-app', (event) => {
    core.mainWindow.close();
});

ipcMain.on('render-update-app-menu-label', (event, labels) => {
    menu.setApplicationMenu({
        labels: labels
    });
});

ipcMain.on('render-update-tray-menu-label', (event, labels) => {
    tray.setContextMenu({
        labels: labels
    });
});

ipcMain.on('render-update-tray-tip', (event, tooltip) => {
    tray.setToolTip(tooltip);
});

ipcMain.on('render-sync-get-native-config', (event) => {
    event.returnValue = {
        defaultPosition: config.defaultPosition,
        minimizedToTray: config.minimizedToTray
    };
});

ipcMain.on('render-set-native-config-default-position', (event, value) => {
    config.defaultPosition = value;
    config.save('defaultPosition');
});

ipcMain.on('render-set-native-config-minimized-to-tray', (event, value) => {
    config.minimizedToTray = !!value;
    config.save('minimizedToTray');
});

ipcMain.handle('render-request-http', (event, requestContext) => {
    return http.request(requestContext);
});

ipcMain.on('render-open-external-url', (event, url) => {
    shell.openExternal(url);
});

ipcMain.on('render-sync-get-package-file-content', (event, path) => {
    event.returnValue = localfs.readPackageFile(path);
});

ipcMain.handle('render-get-localfs-exists', (event, fullpath) => {
    return localfs.isExists(fullpath);
});

ipcMain.on('render-open-local-directory', (event, dir, filename) => {
    let fullpath = localfs.getFullPath(dir, filename);

    if (localfs.isExists(fullpath)) {
        shell.showItemInFolder(fullpath);
    } else {
        shell.openItem(dir);
    }
});

ipcMain.on('render-sync-parse-bittorrent-info', (event, data) => {
    event.returnValue = bittorrent.parseBittorrentInfo(data);
});
