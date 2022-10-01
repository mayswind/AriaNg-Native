(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', ['ariaNgLogService', 'ariaNgLocalizationService', function (ariaNgLogService, ariaNgLocalizationService) {
        var electron = angular.isFunction(window.nodeRequire) ? nodeRequire('electron') : {};
        var remote = angular.isFunction(window.nodeRequire) ? nodeRequire('@electron/remote') : {
            require: function () {
                return {};
            }
        };
        var ipcRenderer = electron.ipcRenderer || {};
        var shell = electron.shell || {};
        var config = remote.require('./config') || {};
        var menu = remote.require('./menu') || {};
        var tray = remote.require('./tray') || {};
        var localfs = remote.require('./localfs') || {};
        var bittorrent = remote.require('./bittorrent') || {};

        var getSetting = function (item) {
            if (!remote || !remote.getGlobal) {
                return null;
            }

            var settings = remote.getGlobal('settings');

            if (!settings) {
                return null;
            }

            return settings[item];
        };

        var getCurrentWindow = function () {
            if (!remote || !remote.getCurrentWindow) {
                return {};
            }

            return remote.getCurrentWindow();
        };

        var onMainWindowEvent = function (event, callback) {
            getCurrentWindow().on && getCurrentWindow().on(event, callback);
        };

        var onMainProcessMessage = function (channel, callback) {
            ipcRenderer.on && ipcRenderer.on(channel, callback);
        };

        var removeMainProcessCallback = function (channel, callback) {
            ipcRenderer.removeListener && ipcRenderer.removeListener(channel, callback);
        };

        var sendMessageToMainProcess = function (channel, message) {
            ipcRenderer.send && ipcRenderer.send(channel, message);
        };

        return {
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
            getVersion: function() {
                return getSetting('version');
            },
            getAriaNgVersion: function() {
                return getSetting('ariaNgVersion');
            },
            isDevMode: function () {
                return !!getSetting('isDevMode');
            },
            useCustomAppTitle: function () {
                return !!getSetting('useCustomAppTitle');
            },
            getNativeConfig: function () {
                var cfg = {};

                for (var key in config) {
                    if (!config.hasOwnProperty(key)) {
                        continue;
                    }

                    if (angular.isFunction(config[key])) {
                        continue;
                    }

                    cfg[key] = angular.copy(config[key]);
                }

                return cfg;
            },
            setDefaultPosition: function (value) {
                config.defaultPosition = value;
                config.save('defaultPosition');
            },
            setMinimizedToTray: function (value) {
                config.minimizedToTray = !!value;
                config.save('minimizedToTray');
            },
            setMainWindowLanguage: function () {
                this.setApplicationMenu();
                this.setTrayMenu();
            },
            isLocalFSExists: function (fullpath) {
                return localfs.isExists(fullpath);
            },
            readPackageFile: function (path) {
                return localfs.readPackageFile(path);
            },
            parseBittorrentInfo: function (path) {
                var info = angular.copy(bittorrent.parseBittorrentInfo(path));
                info.type = 'bittorrent';

                ariaNgLogService.debug('[ariaNgNativeElectronService.parseBittorrentInfo] bittorrent info', info);

                return info;
            },
            openProjectLink: function () {
                return shell.openExternal && shell.openExternal('https://github.com/mayswind/AriaNg-Native');
            },
            openProjectReleaseLink: function () {
                return shell.openExternal && shell.openExternal('https://github.com/mayswind/AriaNg-Native/releases');
            },
            openFileInDirectory: function (dir, filename) {
                var fullpath = localfs.getFullPath(dir, filename);

                if (localfs.isExists(fullpath)) {
                    return shell.showItemInFolder && shell.showItemInFolder(fullpath);
                } else {
                    return shell.openItem && shell.openItem(dir);
                }
            },
            onMainWindowMaximize: function (callback) {
                onMainWindowEvent('maximize', callback);
            },
            onMainWindowUnmaximize: function (callback) {
                onMainWindowEvent('unmaximize', callback);
            },
            onMainProcessNavigateTo: function (callback) {
                onMainProcessMessage('navigate-to', callback);
            },
            onMainProcessShowError: function (callback) {
                onMainProcessMessage('show-error', callback);
            },
            onMainProcessNewTaskFromFile: function (callback) {
                onMainProcessMessage('new-task-from-file', callback);
            },
            onMainProcessNewTaskFromText: function (callback) {
                onMainProcessMessage('new-task-from-text', callback);
            },
            removeMainProcessNewTaskFromFileCallback: function (callback) {
                removeMainProcessCallback('new-task-from-file', callback);
            },
            removeMainProcessNewTaskFromTextCallback: function (callback) {
                removeMainProcessCallback('new-task-from-text',  callback);
            },
            sendViewLoadedMessageToMainProcess: function (message) {
                sendMessageToMainProcess('view-content-loaded', message);
            },
            sendNewDropFileMessageToMainProcess: function (message) {
                sendMessageToMainProcess('new-drop-file', message);
            },
            sendNewDropTextMessageToMainProcess: function (message) {
                sendMessageToMainProcess('new-drop-text', message);
            },
            setApplicationMenu: function () {
                if (menu.setApplicationMenu) {
                    menu.setApplicationMenu({
                        labels: {
                            AboutAriaNgNative: ariaNgLocalizationService.getLocalizedText('menu.AboutAriaNgNative'),
                            Services: ariaNgLocalizationService.getLocalizedText('menu.Services'),
                            HideAriaNgNative: ariaNgLocalizationService.getLocalizedText('menu.HideAriaNgNative'),
                            HideOthers: ariaNgLocalizationService.getLocalizedText('menu.HideOthers'),
                            ShowAll: ariaNgLocalizationService.getLocalizedText('menu.ShowAll'),
                            QuitAriaNgNative: ariaNgLocalizationService.getLocalizedText('menu.QuitAriaNgNative'),
                            Edit: ariaNgLocalizationService.getLocalizedText('menu.Edit'),
                            Undo: ariaNgLocalizationService.getLocalizedText('menu.Undo'),
                            Redo: ariaNgLocalizationService.getLocalizedText('menu.Redo'),
                            Cut: ariaNgLocalizationService.getLocalizedText('menu.Cut'),
                            Copy: ariaNgLocalizationService.getLocalizedText('menu.Copy'),
                            Paste: ariaNgLocalizationService.getLocalizedText('menu.Paste'),
                            Delete: ariaNgLocalizationService.getLocalizedText('menu.Delete'),
                            SelectAll: ariaNgLocalizationService.getLocalizedText('menu.SelectAll'),
                            Window: ariaNgLocalizationService.getLocalizedText('menu.Window'),
                            Minimize: ariaNgLocalizationService.getLocalizedText('menu.Minimize'),
                            Zoom: ariaNgLocalizationService.getLocalizedText('menu.Zoom'),
                            BringAllToFront: ariaNgLocalizationService.getLocalizedText('menu.BringAllToFront')
                        }
                    });
                }
            },
            setTrayMenu: function () {
                if (tray.setContextMenu) {
                    tray.setContextMenu({
                        labels: {
                            ShowAriaNgNative: ariaNgLocalizationService.getLocalizedText('tray.ShowAriaNgNative'),
                            Exit: ariaNgLocalizationService.getLocalizedText('tray.Exit')
                        }
                    });
                }
            },
            setTrayToolTip: function (value) {
                if (tray.setToolTip) {
                    tray.setToolTip(value);
                }
            },
            reload: function () {
                getCurrentWindow().reload && getCurrentWindow().reload();
            },
            isMaximized: function () {
                return getCurrentWindow().isMaximized && getCurrentWindow().isMaximized();
            },
            minimizeWindow: function () {
                getCurrentWindow().minimize && getCurrentWindow().minimize();
            },
            maximizeOrRestoreWindow: function () {
                if (!this.isMaximized()) {
                    getCurrentWindow().maximize && getCurrentWindow().maximize();
                } else {
                    getCurrentWindow().unmaximize && getCurrentWindow().unmaximize();
                }
            },
            exitApp: function () {
                getCurrentWindow().close && getCurrentWindow().close();
            }
        };
    }]);
}());
