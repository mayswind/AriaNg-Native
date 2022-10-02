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

        var onMainProcessEvent = function (channel, callback) {
            ipcRenderer.on && ipcRenderer.on(channel, callback);
        };

        var removeMainProcessEvent = function (channel, callback) {
            ipcRenderer.removeListener && ipcRenderer.removeListener(channel, callback);
        };

        var invokeMainProcessMethod = function (channel, ...args) {
            ipcRenderer.send && ipcRenderer.send(channel, ...args);
        };

        var invokeSyncMainProcessMethod = function (channel, ...args) {
            if (!ipcRenderer.sendSync) {
                return null;
            }

            return ipcRenderer.sendSync(channel, ...args);
        };

        var invokeAsyncMainProcessMethod = function (channel, ...args) {
            if (!ipcRenderer.invoke) {
                return null;
            }

            return ipcRenderer.invoke(channel, ...args);
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
            getWindowMaximizedAsync: function (callback) {
                return invokeAsyncMainProcessMethod('render-get-native-window-maximized')
                    .then(function onReceive(maximized) {
                        if (callback) {
                            callback(maximized);
                        }
                    });
            },
            minimizeWindow: function () {
                invokeMainProcessMethod('render-minimize-native-window');
            },
            maximizeOrRestoreWindow: function () {
                invokeMainProcessMethod('render-maximize-or-restore-native-window');
            },
            reload: function () {
                invokeMainProcessMethod('render-reload-native-window');
            },
            exitApp: function () {
                invokeMainProcessMethod('render-exit-native-app');
            },
            setApplicationMenu: function () {
                invokeMainProcessMethod('render-update-app-menu-label', {
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
                });
            },
            setTrayMenu: function () {
                invokeMainProcessMethod('render-update-tray-menu-label', {
                    ShowAriaNgNative: ariaNgLocalizationService.getLocalizedText('tray.ShowAriaNgNative'),
                    Exit: ariaNgLocalizationService.getLocalizedText('tray.Exit')
                });
            },
            setTrayToolTip: function (value) {
                invokeMainProcessMethod('render-update-tray-tip', value);
            },
            setMainWindowLanguage: function () {
                this.setApplicationMenu();
                this.setTrayMenu();
            },
            getNativeConfig: function () {
                var config = invokeSyncMainProcessMethod('render-sync-get-native-config');
                var cfg = {};

                for (var key in config) {
                    if (!config.hasOwnProperty(key)) {
                        continue;
                    }

                    cfg[key] = angular.copy(config[key]);
                }

                return cfg;
            },
            setDefaultPosition: function (value) {
                invokeMainProcessMethod('render-set-native-config-default-position', value);
            },
            setMinimizedToTray: function (value) {
                invokeMainProcessMethod('render-set-native-config-minimized-to-tray', value);
            },
            openProjectLink: function () {
                invokeMainProcessMethod('render-open-external-url', 'https://github.com/mayswind/AriaNg-Native');
            },
            openProjectReleaseLink: function () {
                invokeMainProcessMethod('render-open-external-url', 'https://github.com/mayswind/AriaNg-Native/releases');
            },
            readPackageFile: function (path) {
                return invokeSyncMainProcessMethod('render-sync-get-package-file-content', path);
            },
            getLocalFSExists: function (fullpath, callback) {
                return invokeAsyncMainProcessMethod('render-get-localfs-exists', fullpath)
                    .then(function onReceive(exists) {
                        if (callback) {
                            callback(exists);
                        }
                    });
            },
            openFileInDirectory: function (dir, filename) {
                invokeMainProcessMethod('render-open-local-directory', dir, filename);
            },
            parseBittorrentInfo: function (data) {
                var info = angular.copy(invokeSyncMainProcessMethod('render-sync-parse-bittorrent-info', data));
                info.type = 'bittorrent';

                ariaNgLogService.debug('[ariaNgNativeElectronService.parseBittorrentInfo] bittorrent info', info);

                return info;
            },
            onMainWindowMaximize: function (callback) {
                onMainProcessEvent('on-main-window-maximized', callback);
            },
            onMainWindowUnmaximize: function (callback) {
                onMainProcessEvent('on-main-window-unmaximized', callback);
            },
            onMainProcessNavigateTo: function (callback) {
                onMainProcessEvent('navigate-to', callback);
            },
            onMainProcessShowError: function (callback) {
                onMainProcessEvent('show-error', callback);
            },
            onMainProcessNewTaskFromFile: function (callback) {
                onMainProcessEvent('new-task-from-file', callback);
            },
            onMainProcessNewTaskFromText: function (callback) {
                onMainProcessEvent('new-task-from-text', callback);
            },
            removeMainProcessNewTaskFromFileCallback: function (callback) {
                removeMainProcessEvent('new-task-from-file', callback);
            },
            removeMainProcessNewTaskFromTextCallback: function (callback) {
                removeMainProcessEvent('new-task-from-text',  callback);
            },
            sendViewLoadedMessageToMainProcess: function (message) {
                invokeMainProcessMethod('view-content-loaded', message);
            },
            sendNewDropFileMessageToMainProcess: function (message) {
                invokeMainProcessMethod('new-drop-file', message);
            },
            sendNewDropTextMessageToMainProcess: function (message) {
                invokeMainProcessMethod('new-drop-text', message);
            }
        };
    }]);
}());
