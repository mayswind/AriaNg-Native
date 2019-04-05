(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', [function () {
        var electron = angular.isFunction(window.nodeRequire) ? nodeRequire('electron') : {};
        var remote = electron.remote || {
            getGlobal: function () {
                return {};
            },
            getCurrentWindow: function () {
                return {};
            }
        };
        var shell = electron.shell || {
            openExternal: function () {
                return false;
            }
        };

        return {
            remote: remote,
            shell: shell,
            getSettings: function () {
                return remote.getGlobal('settings');
            },
            isDevMode: function () {
                return !!this.getSettings().isDevMode;
            },
            useCustomAppTitle: function () {
                return !!this.getSettings().useCustomAppTitle;
            },
            getCurrentWindow: function () {
                return remote.getCurrentWindow();
            },
            openExternalLink: function (url) {
                return shell.openExternal(url);
            },
            registerEvent: function (event, callback) {
                this.getCurrentWindow().on(event, callback);
            },
            minimizeWindow: function () {
                this.getCurrentWindow().minimize();
            },
            maximizeOrRestoreWindow: function () {
                if (!this.getCurrentWindow().isMaximized()) {
                    this.getCurrentWindow().maximize();
                } else {
                    this.getCurrentWindow().unmaximize();
                }
            },
            exitApp: function () {
                this.getCurrentWindow().close();
            }
        };
    }]);
}());
