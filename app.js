const os = require('os');
const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;

var mainWindow = null;
var tray = null;

app.on('window-all-closed', function () {
    app.quit();
});

app.on('ready', function () {
    mainWindow = new BrowserWindow({
        title: 'AriaNg',
        width: 1000,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        webPreferences: {
            nodeIntegration: false
        }
    });

    if (os.platform() == 'darwin') {
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

    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});
