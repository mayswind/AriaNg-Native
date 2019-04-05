(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', ['ariaNgLocalizationService', function (ariaNgLocalizationService) {
        var electron = angular.isFunction(window.nodeRequire) ? nodeRequire('electron') : {};
        var remote = electron.remote || {
            require: function () {
                return {};
            },
            getGlobal: function () {
                return {};
            },
            getCurrentWindow: function () {
                return {};
            }
        };
        var ipcRenderer = electron.ipcRenderer || {};
        var shell = electron.shell || {
            openExternal: function () {
                return false;
            }
        };
        var cmd = remote.require('./cmd');
        var tray = remote.require('./tray');
        var localfs = remote.require('./localfs');

        return {
            remote: remote,
            shell: shell,
            getSettings: function () {
                return remote.getGlobal('settings');
            },
            getRuntimeEnvironment: function () {
                if (!remote.process || !remote.process.versions) {
                    return null;
                }

                var versions = remote.process.versions;
                var items = [];

                items.push({name: 'Electron', value: versions.electron});
                items.push({name: 'Node.js', value: versions.node});
                items.push({name: 'Chrome', value: versions.chrome});
                items.push({name: 'V8', value: versions.v8});

                return items;
            },
            version: function() {
                return this.getSettings().version;
            },
            ariaNgVersion: function() {
                return this.getSettings().ariaNgVersion;
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
            isLocalFSExists: function (fullpath) {
                return localfs.isExists(fullpath);
            },
            openExternalLink: function (url) {
                return shell.openExternal(url);
            },
            openFileInDirectory: function (dir, filename) {
                var fullpath = localfs.getFullPath(dir, filename);
                return shell.showItemInFolder(fullpath);
            },
            registerEvent: function (event, callback) {
                this.getCurrentWindow().on && this.getCurrentWindow().on(event, callback);
            },
            onMessage: function (messageType, callback) {
                ipcRenderer.on && ipcRenderer.on(messageType, callback);
            },
            initTray: function () {
                tray.init({
                    labels: {
                        ShowAriaNgNative: ariaNgLocalizationService.getLocalizedText('tray.ShowAriaNgNative'),
                        Exit: ariaNgLocalizationService.getLocalizedText('tray.Exit')
                    }
                });
            },
            setTrayLanguage: function () {
                tray.destroy();
                this.initTray();
            },
            getAndClearToBeCreatedTaskFilePath: function () {
                return cmd.getAndClearToBeCreatedTaskFilePath();
            },
            isMaximized: function () {
                return this.getCurrentWindow().isMaximized && this.getCurrentWindow().isMaximized();
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
