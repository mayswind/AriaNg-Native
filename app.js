const package = require('./package');
const os = require('os');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const config = require('./config');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

const singletonLock = app.requestSingleInstanceLock();

if (!singletonLock) {
    app.quit();
}

let mainWindow = null;
let tray = null;

global.settings = {
    version: package.version,
    ariaNgVersion: package["ariang-version"],
    isDevMode: false,
    useCustomAppTitle: false
};

if (!app.isPackaged) {
    global.settings.isDevMode = true;
}

if (os.platform() === 'win32') {
    global.settings.useCustomAppTitle = true;
}

app.on('window-all-closed', () => {
    app.quit();
});

app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }

        mainWindow.focus();
    }
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
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
        mainWindow.setPosition(config.x, config.y);
    }

    if (config.maximized) {
        mainWindow.maximize();
    }

    if (os.platform() === 'darwin') {
        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+Z', () => {
            mainWindow.webContents.undo();
        });

        electronLocalshortcut.register(mainWindow, 'Shift+CmdOrCtrl+Z', () => {
            mainWindow.webContents.redo();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+X', () => {
            mainWindow.webContents.cut();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+C', () => {
            mainWindow.webContents.copy();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+V', () => {
            mainWindow.webContents.paste();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+A', () => {
            mainWindow.webContents.selectAll();
        });
    }

    if (global.settings.isDevMode) {
        electronLocalshortcut.register(mainWindow, 'F12', () => {
            mainWindow.webContents.openDevTools();
        });
    }

    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('resize', () => {
        var sizes = mainWindow.getSize();
        config.width = sizes[0];
        config.height = sizes[1];
    });

    mainWindow.on('maximize', () => {
        config.maximized = mainWindow.isMaximized();
    });

    mainWindow.on('unmaximize', () => {
        config.maximized = mainWindow.isMaximized();
    });

    mainWindow.on('move', () => {
        var positions = mainWindow.getPosition();
        config.x = positions[0];
        config.y = positions[1];
    });

    mainWindow.on('closed', () => {
        if (!config.maximized) {
            config.save('width');
            config.save('height');
            config.save('x');
            config.save('y');
        }

        config.save('maximized');

        mainWindow = null;
    });
});
