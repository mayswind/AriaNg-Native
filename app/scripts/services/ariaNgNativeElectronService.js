(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', ['ariaNgLogService', 'ariaNgLocalizationService', function (ariaNgLogService, ariaNgLocalizationService) {
        var electron = angular.isFunction(window.nodeRequire) ? nodeRequire('electron') : {};
        var ipcRenderer = electron.ipcRenderer || {};

        var onMainProcessEvent = function (channel, callback) {
            ipcRenderer.on && ipcRenderer.on(channel, callback);
        };

        var removeMainProcessEvent = function (channel, callback) {
            ipcRenderer.removeListener && ipcRenderer.removeListener(channel, callback);
        };

        var invokeMainProcessMethod = function (channel, ...args) {
            ipcRenderer.send && ipcRenderer.send(channel, ...args);
        };

        var invokeMainProcessMethodSync = function (channel, ...args) {
            if (!ipcRenderer.sendSync) {
                return null;
            }

            return ipcRenderer.sendSync(channel, ...args);
        };

        var invokeMainProcessMethodAsync = function (channel, ...args) {
            if (!ipcRenderer.invoke) {
                return null;
            }

            return ipcRenderer.invoke(channel, ...args);
        };

        return {
            getRuntimeEnvironment: function () {
                return invokeMainProcessMethodSync('render-sync-get-runtime-environment');
            },
            getVersion: function() {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'version');
            },
            getAriaNgVersion: function() {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'ariaNgVersion');
            },
            isDevMode: function () {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'isDevMode');
            },
            useCustomAppTitle: function () {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'useCustomAppTitle');
            },
            getWindowMaximizedAsync: function (callback) {
                return invokeMainProcessMethodAsync('render-get-native-window-maximized')
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
                var config = invokeMainProcessMethodSync('render-sync-get-native-config');
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
                return invokeMainProcessMethodSync('render-sync-get-package-file-content', path);
            },
            getLocalFSExistsAsync: function (fullpath, callback) {
                return invokeMainProcessMethodAsync('render-get-localfs-exists', fullpath)
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
                var info = angular.copy(invokeMainProcessMethodSync('render-sync-parse-bittorrent-info', data));
                info.type = 'bittorrent';

                ariaNgLogService.debug('[ariaNgNativeElectronService.parseBittorrentInfo] bittorrent info', info);

                return info;
            },
            notifyMainProcessViewLoaded: function (locationPath) {
                invokeMainProcessMethod('on-render-view-content-loaded', locationPath);
            },
            notifyMainProcessorNewDropFile: function (message) {
                invokeMainProcessMethod('on-render-new-drop-file', message);
            },
            notifyMainProcessorNewDropText: function (message) {
                invokeMainProcessMethod('on-render-new-drop-text', message);
            },
            onMainWindowMaximize: function (callback) {
                onMainProcessEvent('on-main-window-maximized', callback);
            },
            onMainWindowUnmaximize: function (callback) {
                onMainProcessEvent('on-main-window-unmaximized', callback);
            },
            onMainProcessShowError: function (callback) {
                onMainProcessEvent('on-main-show-error', callback);
            },
            onMainProcessNavigateTo: function (callback) {
                onMainProcessEvent('on-main-navigate-to', callback);
            },
            onMainProcessNewTaskFromFile: function (callback) {
                onMainProcessEvent('on-main-new-task-from-file', callback);
            },
            onMainProcessNewTaskFromText: function (callback) {
                onMainProcessEvent('on-main-new-task-from-text', callback);
            },
            removeMainProcessNewTaskFromFileCallback: function (callback) {
                removeMainProcessEvent('on-main-new-task-from-file', callback);
            },
            removeMainProcessNewTaskFromTextCallback: function (callback) {
                removeMainProcessEvent('on-main-new-task-from-text',  callback);
            }
        };
    }]);
}());
