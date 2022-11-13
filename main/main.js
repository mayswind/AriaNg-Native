'use strict';

const os = require('os');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');

const pkgfile = require('../package');

const core = require('./core');
const cmd = require('./cmd');
const config = require('./config/config');
const constants = require('./config/constants');
const menu = require('./components/menu');
const tray = require('./components/tray');
const file = require('./lib/file');
const page = require('./lib/page');
const websocket = require('./lib/websocket');
const process = require('./lib/process');
const ipcRender = require('./ipc/render-proecss');
require('./ipc/main-process');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const singletonLock = app.requestSingleInstanceLock({
    argv: cmd.argv
});

if (!singletonLock) {
    app.quit();
    return;
}

let filePathInCommandLine = cmd.argv.file;

function isEnableCloseToHide() {
    return (tray.isEnabled() || os.platform() === 'darwin') && config.minimizedToTray;
}

global.settings = {
    version: pkgfile.version,
    ariaNgVersion: pkgfile['ariang-version'],
    isDevMode: cmd.argv.development,
    useCustomAppTitle: false
};

if (!app.isPackaged) {
    global.settings.isDevMode = true;
}

app.setAppUserModelId(pkgfile.appId);

if (os.platform() === 'win32' && !cmd.argv.classic) {
    global.settings.useCustomAppTitle = true;
}

if (os.platform() === 'darwin') {
    app.on('will-finish-launching', () => {
        app.on('open-file', (event, filePath) => {
            if (filePath) {
                filePathInCommandLine = filePath;
            }
        });
    });

    app.on('before-quit', () => {
        core.isConfirmExit = true;
    });

    app.on('activate', () => {
        if (core.mainWindow) {
            core.mainWindow.show();
        }
    });
}

if (config.execCommandOnStartup) {
    const options = {
        command: config.execCommandOnStartup,
        args: config.execCommandArgumentsOnStartup,
        detached: config.execDetachedCommandOnStartup,
    };

    options.onoutput = function (output) {
        if (!global.settings.isDevMode) {
            return;
        }

        const lastOutput = (core.startupCommandOutput.length > 1 ? core.startupCommandOutput[core.startupCommandOutput.length - 1] : null);

        if (lastOutput && lastOutput.source === output.source && lastOutput.content === output.content) {
            lastOutput.count++
        } else {
            if (core.startupCommandOutput.length >= constants.startupCommandConstants.outputLogLimit) {
                core.startupCommandOutput.shift();
            }

            core.startupCommandOutput.push({
                time: new Date(),
                type: 'output',
                source: output.source,
                content: output.content,
                count: output.count
            });
        }
    };

    options.onerror = function (error) {
        if (!global.settings.isDevMode) {
            return;
        }

        if (core.startupCommandOutput.length >= constants.startupCommandConstants.outputLogLimit) {
            core.startupCommandOutput.shift();
        }

        core.startupCommandOutput.push({
            time: new Date(),
            type: 'error',
            source: error.type,
            content: error.error
        });
    };

    process.execCommandAsync(options);
}

app.on('window-all-closed', () => {
    app.quit();
});

app.on('second-instance', (event, argv, workingDirectory, additionalData) => {
    if (core.mainWindow) {
        if (core.mainWindow.isMinimized()) {
            core.mainWindow.restore();
        } else if (!core.mainWindow.isVisible()) {
            core.mainWindow.show();
        }

        core.mainWindow.focus();

        let secondInstanceArgv = null;

        if (additionalData) {
            secondInstanceArgv = additionalData.argv;
        }

        if (!secondInstanceArgv) {
            secondInstanceArgv = cmd.parseArguments(argv);
        }

        if (secondInstanceArgv && secondInstanceArgv.development) {
            global.settings.isDevMode = !!secondInstanceArgv.development;
            ipcRender.notifyRenderProcessChangeDevMode(!!secondInstanceArgv.development);
        }

        if (secondInstanceArgv && secondInstanceArgv.file && file.isContainsSupportedFileArg(secondInstanceArgv.file)) {
            let location = '';

            if (core.mainWindow.webContents) {
                location = page.parseLocationFromFullUrl(core.mainWindow.webContents.getURL())
            }

            if (location.indexOf('/new') === 0) {
                ipcRender.notifyRenderProcessNewTaskFromFile(secondInstanceArgv.file);
            } else {
                ipcRender.notifyRenderProcessNewNewTaskFromFileAfterViewLoaded(secondInstanceArgv.file);
                ipcRender.notifyRenderProcessNavigateToNewTask();
            }
        }
    }
});

app.on('ready', () => {
    core.mainWindow = new BrowserWindow({
        title: 'AriaNg Native',
        width: config.width,
        height: config.height,
        minWidth: 800,
        minHeight: 400,
        fullscreenable: false,
        frame: !global.settings.useCustomAppTitle,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            spellcheck: false
        }
    });

    let displays = electron.screen.getAllDisplays();
    let isLastPositionInScreen = false;

    if (config.x >= 0 && config.y >= 0) {
        for (let i = 0; i < displays.length; i++) {
            let x1 = displays[i].bounds.x;
            let x2 = x1 + displays[i].workAreaSize.width;
            let y1 = displays[i].bounds.y;
            let y2 = y1 + displays[i].workAreaSize.height;

            if (config.x >= x1 && config.x <= x2 && config.y >= y1 && config.y <= y2) {
                isLastPositionInScreen = true;
                break;
            }
        }
    }

    if (config.defaultPosition === 'last-position' && isLastPositionInScreen) {
        core.mainWindow.setPosition(config.x, config.y);
    } else if (config.defaultPosition === 'screen-center') {
        core.mainWindow.center();
    }

    if (config.maximized) {
        core.mainWindow.maximize();
    }

    if (global.settings.isDevMode) {
        electronLocalshortcut.register(core.mainWindow, 'F12', () => {
            core.mainWindow.webContents.openDevTools();
        });
    }

    menu.init();
    tray.init();

    if (file.isContainsSupportedFileArg(filePathInCommandLine)) {
        ipcRender.notifyRenderProcessNewNewTaskFromFileAfterViewLoaded(filePathInCommandLine);
        core.mainWindow.loadURL(page.getPageFullUrl(constants.ariaNgPageLocations.NewTask));
    } else {
        core.mainWindow.loadURL(page.getPageFullUrl());
    }

    core.mainWindow.once('ready-to-show', () => {
        core.mainWindow.show();
    });

    core.mainWindow.on('resize', () => {
        let sizes = core.mainWindow.getSize();
        config.width = sizes[0];
        config.height = sizes[1];
    });

    core.mainWindow.on('maximize', () => {
        config.maximized = core.mainWindow.isMaximized();
        ipcRender.notifyRenderProcessWindowMaximized(core.mainWindow.isMaximized());
    });

    core.mainWindow.on('unmaximize', () => {
        config.maximized = core.mainWindow.isMaximized();
        ipcRender.notifyRenderProcessWindowUnmaximized(core.mainWindow.isMaximized());
    });

    core.mainWindow.on('move', () => {
        let positions = core.mainWindow.getPosition();
        config.x = positions[0];
        config.y = positions[1];
    });

    core.mainWindow.on('close', (event) => {
        if (isEnableCloseToHide() && !core.isConfirmExit) {
            event.preventDefault();
            core.mainWindow.hide();
            event.returnValue = false;
        }
    });

    core.mainWindow.on('closed', () => {
        try {
            if (!config.maximized) {
                if (config.width > 0) {
                    config.save('width');
                }

                if (config.height > 0) {
                    config.save('height');
                }

                if (config.x > 0 && config.y > 0) {
                    config.save('x');
                    config.save('y');
                }
            }

            config.save('maximized');
        } catch (ex) {
            ; // Do Nothing
        }

        core.mainWindow = null;
    });

    ipcRender.onRenderProcessElectronServiceInited((event) => {
        websocket.init();
    });

    ipcRender.onRenderProcessNewDropFile((event, arg) => {
        if (!arg) {
            return;
        }

        let filePath = arg.filePath;
        let location = arg.location;

        if (location.indexOf('/new') === 0) {
            ipcRender.notifyRenderProcessNewTaskFromFile(filePath);
        } else {
            ipcRender.notifyRenderProcessNewNewTaskFromFileAfterViewLoaded(filePath);
            ipcRender.notifyRenderProcessNavigateToNewTask();
        }
    });

    ipcRender.onRenderProcessNewDropText((event, arg) => {
        if (!arg) {
            return;
        }

        let text = arg.text;
        let location = arg.location;

        if (location.indexOf('/new') === 0) {
            ipcRender.notifyRenderProcessNewTaskFromText(text);
        } else {
            ipcRender.notifyRenderProcessNewNewTaskFromTextAfterViewLoaded(text);
            ipcRender.notifyRenderProcessNavigateToNewTask();
        }
    });
});
