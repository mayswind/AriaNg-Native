(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNativeElectronService', ['$q', 'ariaNgLogService', 'ariaNgLocalizationService', function ($q, ariaNgLogService, ariaNgLocalizationService) {
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

        onMainProcessEvent('on-main-log-debug', function (event, msg, obj) {
            ariaNgLogService.debug(msg, obj);
        });

        onMainProcessEvent('on-main-log-info', function (event, msg, obj) {
            ariaNgLogService.info(msg, obj);
        });

        onMainProcessEvent('on-main-log-warn', function (event, msg, obj) {
            ariaNgLogService.warn(msg, obj);
        });

        onMainProcessEvent('on-main-log-error', function (event, msg, obj) {
            ariaNgLogService.error(msg, obj);
        });

        invokeMainProcessMethod('on-render-electron-service-inited');

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
            getBuildCommit: function () {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'buildCommit');
            },
            isDevMode: function () {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'isDevMode');
            },
            useCustomAppTitle: function () {
                return invokeMainProcessMethodSync('render-sync-get-global-setting', 'useCustomAppTitle');
            },
            setNativeTheme: function (theme) {
                invokeMainProcessMethod('render-set-native-theme', theme);
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
            showTextboxContextMenu: function (context) {
                invokeMainProcessMethod('render-show-textbox-context-menu', context);
            },
            showSystemNotification: function (context) {
                invokeMainProcessMethod('render-show-system-notification', context);
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
            setExecCommandOnStartup: function (value) {
                invokeMainProcessMethod('render-set-native-config-exec-command-on-startup', value);
            },
            setExecCommandArgumentsOnStartup: function (value) {
                invokeMainProcessMethod('render-set-native-config-exec-command-arguments-on-startup', value);
            },
            setExecDetachedCommandOnStartup: function (value) {
                invokeMainProcessMethod('render-set-native-config-exec-detached-command-on-startup', value);
            },
            getLastCheckUpdatesTimeAsync: function (callback) {
                return invokeMainProcessMethodAsync('render-get-native-config-last-check-updates-time')
                    .then(function onReceive(lastCheckUpdatesTime) {
                        if (callback) {
                            callback(lastCheckUpdatesTime);
                        }
                    });
            },
            setLastCheckUpdatesTime: function (value) {
                invokeMainProcessMethod('render-set-native-config-last-check-updates-time', value);
            },
            getStartupCommandOutputAsync: function () {
                return invokeMainProcessMethodAsync('render-get-startup-command-process-output');
            },
            requestHttp: function (requestContext) {
                var deferred = $q.defer();

                invokeMainProcessMethodAsync('render-request-http', requestContext)
                    .then(function onReceive(result) {
                        if (result && result.success) {
                            deferred.resolve(result.response);
                        } else {
                            deferred.reject(result.response);
                        }
                    }).catch(function onError() {
                        deferred.reject({});
                    });

                return deferred.promise;
            },
            createWebSocketClient: function (rpcUrl, options) {
                var WebSocketClient = function (rpcUrl, options) {
                    var openCallback = null;
                    var closeCallback = null;
                    var messageCallback = null;

                    Object.defineProperty(WebSocketClient.prototype, 'readyState', {
                        get: function get() {
                            return invokeMainProcessMethodSync('render-get-websocket-readystate');
                        },
                        set: function set() {
                            throw new Error('The \"readyState\" property is readonly.');
                        }
                    });

                    this.send = function (request) {
                        invokeMainProcessMethod('render-send-websocket-message', {
                            url: rpcUrl,
                            data: request
                        });
                    };

                    this.reconnect = function () {
                        invokeMainProcessMethod('render-reconnect-websocket', rpcUrl, options);
                    };

                    this.onOpen = function (callback) {
                        openCallback = callback;
                    };

                    this.onClose = function (callback) {
                        closeCallback = callback;
                    };

                    this.onMessage = function (callback) {
                        messageCallback = callback;
                    };

                    onMainProcessEvent('on-main-websocket-open', function (event, e) {
                        if (e.url !== rpcUrl) {
                            ariaNgLogService.debug('[ariaNgNativeElectronService.websocket.onOpen] event dropped, because rpc url not equals, excepted url: ' + rpcUrl + ", actual url: " + e.url);
                            return;
                        }

                        if (angular.isFunction(openCallback)) {
                            openCallback(e);
                        }
                    });

                    onMainProcessEvent('on-main-websocket-close', function (event, e) {
                        if (e.url !== rpcUrl) {
                            ariaNgLogService.debug('[ariaNgNativeElectronService.websocket.onClose] event dropped, because rpc url not equals, excepted url: ' + rpcUrl + ", actual url: " + e.url);
                            return;
                        }

                        if (angular.isFunction(closeCallback)) {
                            closeCallback(e);
                        }
                    });

                    onMainProcessEvent('on-main-websocket-message', function (event, message) {
                        if (message.url !== rpcUrl) {
                            ariaNgLogService.debug('[ariaNgNativeElectronService.websocket.onMessage] event dropped, because rpc url not equals, excepted url: ' + rpcUrl + ", actual url: " + message.url, message.data);
                            return;
                        }

                        if (angular.isFunction(messageCallback)) {
                            messageCallback(message);
                        }
                    });

                    invokeMainProcessMethod('render-connect-websocket', rpcUrl, options);
                };

                return new WebSocketClient(rpcUrl, options);
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
            getLocalFSFileBufferAsync: function (fullpath, callback) {
                return invokeMainProcessMethodAsync('render-get-localfs-file-buffer', fullpath)
                    .then(function onReceive(buffer) {
                        if (callback) {
                            callback(buffer);
                        }
                    });
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
            showOpenFileDialogAsync: function (filters, callback) {
                return invokeMainProcessMethodAsync('render-show-open-file-dialog', filters)
                    .then(function onReceive(result) {
                        if (callback) {
                            callback({
                                canceled: result.canceled,
                                filePaths: result.filePaths
                            });
                        }
                    });
            },
            showDevTools: function () {
                invokeMainProcessMethod('render-show-dev-tools');
            },
            parseBittorrentInfo: function (data) {
                var info = angular.copy(invokeMainProcessMethodSync('render-sync-parse-bittorrent-info', data));

                if (info) {
                    info.type = 'bittorrent';
                    ariaNgLogService.debug('[ariaNgNativeElectronService.parseBittorrentInfo] bittorrent info', info);
                } else {
                    ariaNgLogService.debug('[ariaNgNativeElectronService.parseBittorrentInfo] cannot parse bittorrent info', info);
                }

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
            onMainProcessChangeDevMode: function (callback) {
                onMainProcessEvent('on-main-change-dev-mode', callback);
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
