'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');
const electron = require('electron');

const core = require('./core');

const ipcMain = electron.ipcMain;

const supportedFileExtensions = {
    '.torrent': 'torrent',
    '.meta4': 'metalink',
    '.metalink': 'metalink'
};

const argv = require('yargs')
    .usage('Usage: $0 [file] [options]')
    .option('d', {
        alias: 'development',
        type: 'boolean',
        describe: 'Enable Development Mode (press F12 to open DevTools)',
    })
    .help('h')
    .alias('h', 'help')
    .parse(process.argv.slice(1));

let cmd = (function () {
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
            pathname: path.join(__dirname, 'app', 'index.html')
        });
    };

    let loadIndexUrl = function () {
        core.mainWindow.loadURL(getIndexUrl());
    };

    let loadNewTaskUrl = function () {
        core.mainWindow.loadURL(getIndexUrl() + '#!/new');
    };

    let navigateTo = function (routeUrl) {
        core.mainWindow.webContents.send('navigate-to', routeUrl);
    };

    let navigateToNewTask = function () {
        navigateTo('/new');
    };

    let showErrorMessage = function (message) {
        core.mainWindow.webContents.send('show-error', message);
    };

    let newTaskFromFile = function (filePath, async) {
        let fileExtension = path.extname(filePath);

        if (!supportedFileExtensions[fileExtension]) {
            cmd.showErrorMessage('The selected file type is invalid!');
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

        core.mainWindow.webContents.send('new-task-from-file', result);
    };

    let asyncNewTaskFromFile = function (filePath) {
        if (!filePath) {
            return;
        }

        ipcMain.once('view-content-loaded', (event, arg) => {
            newTaskFromFile(filePath, true);
        });
    };

    let newTaskFromText = function (text, async) {
        let result = {
            text: text,
            async: !!async
        };

        core.mainWindow.webContents.send('new-task-from-text', result);
    };

    let asyncNewTaskFromText = function (text) {
        if (!text) {
            return;
        }

        ipcMain.once('view-content-loaded', (event, arg) => {
            newTaskFromText(text, true);
        });
    };

    return {
        argv: argv,
        isContainsSupportedFileArg: isContainsSupportedFileArg,
        loadIndexUrl: loadIndexUrl,
        loadNewTaskUrl: loadNewTaskUrl,
        navigateTo: navigateTo,
        navigateToNewTask: navigateToNewTask,
        showErrorMessage: showErrorMessage,
        newTaskFromFile: newTaskFromFile,
        asyncNewTaskFromFile: asyncNewTaskFromFile,
        newTaskFromText: newTaskFromText,
        asyncNewTaskFromText: asyncNewTaskFromText
    }
})();

module.exports = cmd;
