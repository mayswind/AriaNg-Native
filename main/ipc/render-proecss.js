'use strict';

const path = require('path');
const electron = require('electron');

const core = require('../core');
const constants = require('../config/constants');
const localfs = require('../lib/localfs');

const ipcMain = electron.ipcMain;

let notifyRenderProcessLogDebug = function (msg, object) {
    try {
        core.mainWindow.webContents.send('on-main-log-debug', msg, object);
    } catch (ex) {
        // Do Nothing
    }
};

let notifyRenderProcessLogInfo = function (msg, object) {
    try {
        core.mainWindow.webContents.send('on-main-log-info', msg, object);
    } catch (ex) {
        // Do Nothing
    }
};

let notifyRenderProcessLogWarn = function (msg, object) {
    try {
        core.mainWindow.webContents.send('on-main-log-warn', msg, object);
    } catch (ex) {
        // Do Nothing
    }
};

let notifyRenderProcessLogError = function (msg, object) {
    try {
        core.mainWindow.webContents.send('on-main-log-error', msg, object);
    } catch (ex) {
        // Do Nothing
    }
};

let notifyRenderProcessChangeDevMode = function (devMode) {
    core.mainWindow.webContents.send('on-main-change-dev-mode', devMode);
};

let notifyRenderProcessShowErrorMessage = function (message) {
    core.mainWindow.webContents.send('on-main-show-error', message);
};

let notifyRenderProcessNavigateToPath = function (routeUrl) {
    core.mainWindow.webContents.send('on-main-navigate-to', routeUrl);
};

let notifyRenderProcessNavigateToNewTask = function () {
    notifyRenderProcessNavigateToPath(constants.ariaNgPageLocations.NewTask);
};

let notifyRenderProcessNavigateToAriaNgSettings = function () {
    notifyRenderProcessNavigateToPath(constants.ariaNgPageLocations.AriaNgSettings);
};

let notifyRenderProcessNewTaskFromFile = function (filePath, async) {
    let fileExtension = path.extname(filePath);

    if (!constants.supportedFileExtensions[fileExtension]) {
        notifyRenderProcessShowErrorMessage('The selected file type is invalid!');
        return;
    }

    let result = null;

    try {
        result = {
            type: constants.supportedFileExtensions[fileExtension],
            fileName: path.basename(filePath),
            base64Content: localfs.getLocalFSFileBase64Content(filePath),
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

let onRenderProcessElectronServiceInited = function (callback) {
    ipcMain.on('on-render-electron-service-inited', callback);
};

let onRenderProcessNewDropFile = function (callback) {
    ipcMain.on('on-render-new-drop-file', callback);
};

let onRenderProcessNewDropText = function (callback) {
    ipcMain.on('on-render-new-drop-text', callback);
};

module.exports = {
    notifyRenderProcessLogDebug: notifyRenderProcessLogDebug,
    notifyRenderProcessLogInfo: notifyRenderProcessLogInfo,
    notifyRenderProcessLogWarn: notifyRenderProcessLogWarn,
    notifyRenderProcessLogError: notifyRenderProcessLogError,
    notifyRenderProcessChangeDevMode: notifyRenderProcessChangeDevMode,
    notifyRenderProcessShowErrorMessage: notifyRenderProcessShowErrorMessage,
    notifyRenderProcessNavigateToNewTask: notifyRenderProcessNavigateToNewTask,
    notifyRenderProcessNavigateToAriaNgSettings: notifyRenderProcessNavigateToAriaNgSettings,
    notifyRenderProcessNewTaskFromFile: notifyRenderProcessNewTaskFromFile,
    notifyRenderProcessNewTaskFromText: notifyRenderProcessNewTaskFromText,
    notifyRenderProcessNewNewTaskFromFileAfterViewLoaded: notifyRenderProcessNewNewTaskFromFileAfterViewLoaded,
    notifyRenderProcessNewNewTaskFromTextAfterViewLoaded: notifyRenderProcessNewNewTaskFromTextAfterViewLoaded,
    onRenderProcessElectronServiceInited: onRenderProcessElectronServiceInited,
    onRenderProcessNewDropFile: onRenderProcessNewDropFile,
    onRenderProcessNewDropText: onRenderProcessNewDropText
}
