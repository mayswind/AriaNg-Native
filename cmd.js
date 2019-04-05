'use strict';

const fs = require('fs');
const path = require('path');
const url = require('url');

const core = require('./core');

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
    let toBeCreatedTaskFilePath = null;

    let isContainsSupportedFileArg = function (arg) {
        if (!arg) {
            return false;
        }

        var fileExtension = path.extname(arg);

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
        toBeCreatedTaskFilePath = filePath;
    };

    let getAndClearToBeCreatedTaskFilePath = function () {
        let result = null;
        let filePath = toBeCreatedTaskFilePath;

        if (!filePath) {
            return result;
        }

        toBeCreatedTaskFilePath = null;

        try {
            let fileExtension = path.extname(filePath);
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

        return result;
    };

    return {
        argv: argv,
        isContainsSupportedFileArg: isContainsSupportedFileArg,
        loadIndexUrl: loadIndexUrl,
        loadNewTaskUrl: loadNewTaskUrl,
        navigateTo: navigateTo,
        navigateToNewTask: navigateToNewTask,
        asyncNewTaskFromFile: asyncNewTaskFromFile,
        getAndClearToBeCreatedTaskFilePath: getAndClearToBeCreatedTaskFilePath
    }
})();

module.exports = cmd;
