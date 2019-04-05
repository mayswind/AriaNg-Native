const package = require('./package');
const os = require('os');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');
const Store = require('electron-store');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Tray = electron.Tray;

const userSettingsSchema = {
    width: {
        type: 'number',
        minimum: 800
    },
    height: {
        type: 'number',
        minimum: 400
    },
    maximized: {
        type: 'boolean'
    },
    pos_x: {
        type: 'number'
    },
    pos_y: {
        type: 'number'
    }
};

const singletonLock = app.requestSingleInstanceLock();
const userSettingsStore = new Store({userSettingsSchema});

if (!singletonLock) {
    app.quit();
}

let mainWindow = null;
let tray = null;
let windowConfig = {
    width: userSettingsStore.get('width') || 950,
    height: userSettingsStore.get('height') || 600,
    x: userSettingsStore.get('pos_x'),
    y: userSettingsStore.get('pos_y'),
    maximized: !!userSettingsStore.get('maximized')
};

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

        mainWindow.focus()
    }
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        title: 'AriaNg Native',
        width: windowConfig.width,
        height: windowConfig.height,
        minWidth: 800,
        minHeight: 400,
        fullscreenable: false,
        frame: !global.settings.useCustomAppTitle,
        show: false
    });

    if (windowConfig.x || windowConfig.y) {
        mainWindow.setPosition(windowConfig.x, windowConfig.y);
    }

    if (windowConfig.maximized) {
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
        mainWindow.show()
    });

    mainWindow.on('resize', () => {
        var sizes = mainWindow.getSize();
        windowConfig.width = sizes[0];
        windowConfig.height = sizes[1];
    });

    mainWindow.on('maximize', () => {
        windowConfig.maximized = mainWindow.isMaximized();
    });

    mainWindow.on('unmaximize', () => {
        windowConfig.maximized = mainWindow.isMaximized();
    });

    mainWindow.on('move', () => {
        var positions = mainWindow.getPosition();
        windowConfig.x = positions[0];
        windowConfig.y = positions[1];
    });

    mainWindow.on('closed', () => {
        if (!windowConfig.maximized) {
            userSettingsStore.set('width', windowConfig.width);
            userSettingsStore.set('height', windowConfig.height);
            userSettingsStore.set('pos_x', windowConfig.x);
            userSettingsStore.set('pos_y', windowConfig.y);
        }

        userSettingsStore.set('maximized', windowConfig.maximized);

        mainWindow = null;
    });
});
