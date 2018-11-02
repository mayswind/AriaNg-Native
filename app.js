const electron = require('electron');
const electronLocalshortcut = require('electron-localshortcut');

const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const Menu = electron.Menu;
const Tray = electron.Tray;

const exec = require('child_process').exec;


let cmdStr = 'aria2c --conf-path=./aria2.conf';
let cmdPath = './assets/aria2/';
let aria2Process;
let processes = [];

let mainWindow = null;
let tray = null;

function runAria2() {
    if (process.platform === 'darwin') {
        cmdPath += 'osx/';
    } else if (process.platform === 'linux') {
        //forserver
    } else if (process.platform === 'win32') {
        if (process.arch === 'x64') {
            cmdPath += 'win64/';
        } else {
            cmdPath += 'win32/';
        }
    }
    aria2Process = exec(cmdStr, {cwd: cmdPath});
    processes.push(aria2Process);
    aria2Process.on("exit", function () {
        processes.splice(processes.indexOf(aria2Process), 1);
    });
}

app.on('window-all-closed', function () {
    processes.forEach(function (proc) {
        proc.kill();
    });
    app.quit();
});

app.on('ready', function () {
    runAria2();
    mainWindow = new BrowserWindow({
        title: 'AriaNg',
        width: 1000,
        height: 600,
        minWidth: 400,
        minHeight: 400,
        show: false,
        webPreferences: {
            nodeIntegration: false
        }
    });
    if (process.platform == 'darwin') {
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

    mainWindow.once('ready-to-show', function () {
        mainWindow.show()
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});


