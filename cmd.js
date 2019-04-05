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

    let asyncNewTaskFromFile = function (filePath) {
        if (!filePath) {
            return;
        }

        let fileExtension = path.extname(filePath);

        if (!supportedFileExtensions[fileExtension]) {
            return;
        }

        ipcMain.once('view-content-loaded', (event, arg) => {
            let result = null;

            try {
                let fileContent = fs.readFileSync(filePath);

                result = {
                    type: supportedFileExtensions[fileExtension],
                    fileName: path.basename(filePath),
                    base64Content: Buffer.from(fileContent).toString('base64')
                };
            } catch (e) {
                result = {
                    exception: e
                }
            }

            event.sender.send('new-task-from-file', result)
        });
    };

    return {
        argv: argv,
        isContainsSupportedFileArg: isContainsSupportedFileArg,
        loadIndexUrl: loadIndexUrl,
        loadNewTaskUrl: loadNewTaskUrl,
        navigateTo: navigateTo,
        navigateToNewTask: navigateToNewTask,
        asyncNewTaskFromFile: asyncNewTaskFromFile
    }
})();

module.exports = cmd;
