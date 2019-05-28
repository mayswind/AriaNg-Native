'use strict';

const os = require('os');
const electron = require('electron');

const core = require('./core');

const app = electron.app;
const Menu = electron.Menu;

let init = function () {
    if (!core.mainWindow) {
        return;
    }
    
    if (os.platform() === 'darwin') {
        let menu = Menu.buildFromTemplate([
            {
                label: app.getName(),
                submenu: [
                    {
                        label: 'Quit AriaNg Native',
                        role: 'quit',
                        click: function () {
                            core.isConfirmExit = true;
                            app.quit();
                        }
                    }
                ]
            }
        ]);
        Menu.setApplicationMenu(menu);
    } else {
        core.mainWindow.setMenu(null);
    }
}

let setApplicationMenu = function (context) {
    if (core.mainWindow && os.platform() === 'darwin') {
        let menu = Menu.buildFromTemplate([
            {
                label: app.getName(),
                submenu: [
                    {
                        label: context.labels.Quit,
                        role: 'quit',
                        click: function () {
                            core.isConfirmExit = true;
                            app.quit();
                        }
                    }
                ]
            }
        ]);
        Menu.setApplicationMenu(menu);
    }
};

module.exports = {
    init: init,
    setApplicationMenu: setApplicationMenu
};