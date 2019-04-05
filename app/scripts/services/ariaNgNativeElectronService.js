(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', ['ariaNgLocalizationService', function (ariaNgLocalizationService) {
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
        var tray = remote.require('./tray');

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
            openExternalLink: function (url) {
                return shell.openExternal(url);
            },
            registerEvent: function (event, callback) {
                this.getCurrentWindow().on && this.getCurrentWindow().on(event, callback);
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
