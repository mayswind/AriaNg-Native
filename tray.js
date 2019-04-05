const os = require('os');
const path = require('path');
const electron = require('electron');

const core = require('./core');

const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;

let tray = (function () {
    let instance = null;
    let iconPath = path.join(__dirname, 'assets', 'AriaNg.ico');

    let init = function (context) {
        if (instance == null && os.platform() === 'win32') {
            instance = new Tray(iconPath);
            instance.setToolTip('AriaNg Native');
            instance.setContextMenu(Menu.buildFromTemplate([
                {
                    label: context.labels.ShowAriaNgNative, click: function () {
                        core.mainWindow.show();
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: context.labels.Exit, click: function () {
                        core.isConfirmExit = true;
                        app.quit();
                    }
                }
            ]));
            instance.on('double-click', () => {
                if (!core.mainWindow.isVisible()) {
                    core.mainWindow.show();
                    core.mainWindow.focus();
                } else {
                    core.mainWindow.hide();
                }
            });
        }
    };

    let destroy = function () {
        if (instance != null) {
            instance.destroy();
            instance = null;
        }
    };

    return {
        isEnabled: function () {
            return !!instance;
        },
        init: init,
        destroy: destroy
    }
}());

module.exports = tray;
