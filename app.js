'use strict';

const os = require('os');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');

const pkgfile = require('./package');
const config = require('./config');
const core = require('./core');
const cmd = require('./cmd');
const tray = require('./tray');

const app = electron.app;
const ipcMain = electron.ipcMain;
const BrowserWindow = electron.BrowserWindow;

const singletonLock = app.requestSingleInstanceLock();

if (!singletonLock) {
    app.quit();
}

global.settings = {
    version: pkgfile.version,
    ariaNgVersion: pkgfile["ariang-version"],
    isDevMode: cmd.argv.development,
    useCustomAppTitle: false
};

if (!app.isPackaged) {
    global.settings.isDevMode = true;
}

if (os.platform() === 'win32') {
    global.settings.useCustomAppTitle = true;
}

app.setAppUserModelId(pkgfile.appId);

app.on('window-all-closed', () => {
    app.quit();
});

app.on('second-instance', (event, argv, workingDirectory) => {
    if (core.mainWindow) {
        if (core.mainWindow.isMinimized()) {
            core.mainWindow.restore();
        } else if (!core.mainWindow.isVisible()) {
            core.mainWindow.show();
        }

        core.mainWindow.focus();

        if (cmd.isContainsSupportedFileArg(argv[1])) {
            cmd.asyncNewTaskFromFile(argv[1]);
            cmd.navigateToNewTask();
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
        show: false
    });

    if (config.x || config.y) {
        core.mainWindow.setPosition(config.x, config.y);
    }

    if (config.maximized) {
        core.mainWindow.maximize();
    }

    if (os.platform() === 'darwin') {
        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+Z', () => {
            core.mainWindow.webContents.undo();
        });

        electronLocalshortcut.register(core.mainWindow, 'Shift+CmdOrCtrl+Z', () => {
            core.mainWindow.webContents.redo();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+X', () => {
            core.mainWindow.webContents.cut();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+C', () => {
            core.mainWindow.webContents.copy();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+V', () => {
            core.mainWindow.webContents.paste();
        });

        electronLocalshortcut.register(core.mainWindow, 'CmdOrCtrl+A', () => {
            core.mainWindow.webContents.selectAll();
        });
    }

    if (global.settings.isDevMode) {
        electronLocalshortcut.register(core.mainWindow, 'F12', () => {
            core.mainWindow.webContents.openDevTools();
        });
    }

    core.mainWindow.setMenu(null);

    if (cmd.isContainsSupportedFileArg(process.argv[1])) {
        cmd.asyncNewTaskFromFile(process.argv[1]);
        cmd.loadNewTaskUrl();
    } else {
        cmd.loadIndexUrl();
    }

    core.mainWindow.once('ready-to-show', () => {
        core.mainWindow.show();
    });

    core.mainWindow.on('resize', () => {
        var sizes = core.mainWindow.getSize();
        config.width = sizes[0];
        config.height = sizes[1];
    });

    core.mainWindow.on('maximize', () => {
        config.maximized = core.mainWindow.isMaximized();
    });

    core.mainWindow.on('unmaximize', () => {
        config.maximized = core.mainWindow.isMaximized();
    });

    core.mainWindow.on('move', () => {
        var positions = core.mainWindow.getPosition();
        config.x = positions[0];
        config.y = positions[1];
    });

    core.mainWindow.on('close',function (event) {
        if (tray.isEnabled() && !core.isConfirmExit) {
            event.preventDefault();
            core.mainWindow.hide();
            event.returnValue = false;
        }
    });

    core.mainWindow.on('closed', () => {
        if (!config.maximized) {
            config.save('width');
            config.save('height');
            config.save('x');
            config.save('y');
        }

        config.save('maximized');

        core.mainWindow = null;
    });

    ipcMain.on('new-drop-file', (event, arg) => {
        if (!arg) {
            return;
        }

        let filePath = arg.filePath;
        let location = arg.location;

        if (location.indexOf('/new') === 0) {
            cmd.newTaskFromFile(filePath);
        } else {
            cmd.asyncNewTaskFromFile(filePath);
            cmd.navigateToNewTask();
        }
    });

    ipcMain.on('new-drop-text', (event, arg) => {
        if (!arg) {
            return;
        }

        let text = arg.text;
        let location = arg.location;

        if (location.indexOf('/new') === 0) {
            cmd.newTaskFromText(text);
        } else {
            cmd.asyncNewTaskFromText(text);
            cmd.navigateToNewTask();
        }
    });
});
