'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const electron = require('electron');

const pkgfile = require('../package');
const core = require('./core');
const config = require('./config/config');
const menu = require('./components/menu');
const tray = require('./components/tray');
const localfs = require('./lib/localfs');
const bittorrent = require('./lib/bittorrent');

const shell = electron.shell;
const ipcMain = electron.ipcMain;

const supportedFileExtensions = {
    '.torrent': 'torrent',
    '.meta4': 'metalink',
    '.metalink': 'metalink'
};

let isContainsSupportedFileArg = function (arg) {
    if (!arg) {
        return false;
    }

    let fileExtension = path.extname(arg);

    if (!supportedFileExtensions[fileExtension]) {
        return false;
    }

    return fs.existsSync(arg);
};

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '..', pkgfile.entry)
    });
};

let loadIndexUrl = function () {
    core.mainWindow.loadURL(getIndexUrl());
};

let loadNewTaskUrl = function () {
    core.mainWindow.loadURL(getIndexUrl() + '#!/new');
};

let notifyRenderProcessWindowMaximized = function (maximized) {
    core.mainWindow.webContents.send('on-main-window-maximized', maximized);
};

let notifyRenderProcessWindowUnmaximized = function (maximized) {
    core.mainWindow.webContents.send('on-main-window-unmaximized', maximized);
};

let notifyRenderProcessShowErrorMessage = function (message) {
    core.mainWindow.webContents.send('on-main-show-error', message);
};

let notifyRenderProcessNavigateToPath = function (routeUrl) {
    core.mainWindow.webContents.send('on-main-navigate-to', routeUrl);
};

let notifyRenderProcessNavigateToNewTask = function () {
    notifyRenderProcessNavigateToPath('/new');
};

let notifyRenderProcessNavigateToAriaNgSettings = function () {
    notifyRenderProcessNavigateToPath('/settings/ariang');
};

let notifyRenderProcessNewTaskFromFile = function (filePath, async) {
    let fileExtension = path.extname(filePath);

    if (!supportedFileExtensions[fileExtension]) {
        notifyRenderProcessShowErrorMessage('The selected file type is invalid!');
        return;
    }

    let result = null;

    try {
        let fileContent = fs.readFileSync(filePath);

        result = {
            type: supportedFileExtensions[fileExtension],
            fileName: path.basename(filePath),
            base64Content: Buffer.from(fileContent).toString('base64'),
            async: !!async
        };
    } catch (e) {
        result = {
            exception: e
        }
    }

    core.mainWindow.webContents.send('on-main-new-task-from-file', result);
};

let notifyRenderProcessNewTaskFromText = function (text, async) {
    let result = {
        text: text,
        async: !!async
    };

    core.mainWindow.webContents.send('on-main-new-task-from-text', result);
};

let notifyRenderProcessNewNewTaskFromFileAfterViewLoaded = function (filePath) {
    if (!filePath) {
        return;
    }

    ipcMain.once('on-render-view-content-loaded', (event, arg) => {
        notifyRenderProcessNewTaskFromFile(filePath, true);
    });
};

let notifyRenderProcessNewNewTaskFromTextAfterViewLoaded = function (text) {
    if (!text) {
        return;
    }

    ipcMain.once('on-render-view-content-loaded', (event, arg) => {
        notifyRenderProcessNewTaskFromText(text, true);
    });
};

let onRenderProcessNewDropFile = function (callback) {
    ipcMain.on('on-render-new-drop-file', callback);
};

let onRenderProcessNewDropText = function (callback) {
    ipcMain.on('on-render-new-drop-text', callback);
};

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

module.exports = {
    isContainsSupportedFileArg: isContainsSupportedFileArg,
    loadIndexUrl: loadIndexUrl,
    loadNewTaskUrl: loadNewTaskUrl,
    notifyRenderProcessWindowMaximized: notifyRenderProcessWindowMaximized,
    notifyRenderProcessWindowUnmaximized: notifyRenderProcessWindowUnmaximized,
    notifyRenderProcessShowErrorMessage: notifyRenderProcessShowErrorMessage,
    notifyRenderProcessNavigateToNewTask: notifyRenderProcessNavigateToNewTask,
    notifyRenderProcessNavigateToAriaNgSettings: notifyRenderProcessNavigateToAriaNgSettings,
    notifyRenderProcessNewTaskFromFile: notifyRenderProcessNewTaskFromFile,
    notifyRenderProcessNewTaskFromText: notifyRenderProcessNewTaskFromText,
    notifyRenderProcessNewNewTaskFromFileAfterViewLoaded: notifyRenderProcessNewNewTaskFromFileAfterViewLoaded,
    notifyRenderProcessNewNewTaskFromTextAfterViewLoaded: notifyRenderProcessNewNewTaskFromTextAfterViewLoaded,
    onRenderProcessNewDropFile: onRenderProcessNewDropFile,
    onRenderProcessNewDropText: onRenderProcessNewDropText
};
