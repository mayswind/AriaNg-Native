const os = require('os');
const electron = require('electron');
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

    if ( os.platform() == 'darwin' ){
         let template = [{
             label: "Application",
             submenu: [
                 { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
                 { type: "separator" },
                 { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
             ]}, {
             label: "Edit",
             submenu: [
                 { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
                 { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
                 { type: 'separator' },
                 { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
                 { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
                 { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
                 { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' },
             ]}
         ];
 
         Menu.setApplicationMenu(Menu.buildFromTemplate(template));
    }

    mainWindow.setMenu(null);
    mainWindow.loadURL('file://' + __dirname + '/app/index.html');

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
});
