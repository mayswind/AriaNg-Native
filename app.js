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

const userSettingsStore = new Store({userSettingsSchema});

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
    isDevMode: false,
    useCustomAppTitle: false
};

if (!app.isPackaged) {
    global.settings.isDevMode = true;
}

if (os.platform() === 'win32') {
    global.settings.useCustomAppTitle = true;
}

app.on('window-all-closed', function () {
    app.quit();
});

app.on('ready', function () {
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
        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+Z', function () {
            mainWindow.webContents.undo();
        });

        electronLocalshortcut.register(mainWindow, 'Shift+CmdOrCtrl+Z', function () {
            mainWindow.webContents.redo();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+X', function () {
            mainWindow.webContents.cut();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+C', function () {
            mainWindow.webContents.copy();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+V', function () {
            mainWindow.webContents.paste();
        });

        electronLocalshortcut.register(mainWindow, 'CmdOrCtrl+A', function () {
            mainWindow.webContents.selectAll();
        });
    }

    if (global.settings.isDevMode) {
        electronLocalshortcut.register(mainWindow, 'F12', function () {
            mainWindow.webContents.openDevTools();
        });
    }

    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    mainWindow.once('ready-to-show', function () {
        mainWindow.show()
    });

    mainWindow.on('resize', function () {
        var sizes = mainWindow.getSize();
        windowConfig.width = sizes[0];
        windowConfig.height = sizes[1];
    });

    mainWindow.on('maximize', function () {
        windowConfig.maximized = mainWindow.isMaximized();
    });

    mainWindow.on('unmaximize', function () {
        windowConfig.maximized = mainWindow.isMaximized();
    });

    mainWindow.on('move', function () {
        var positions = mainWindow.getPosition();
        windowConfig.x = positions[0];
        windowConfig.y = positions[1];
    });

    mainWindow.on('closed', function () {
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
