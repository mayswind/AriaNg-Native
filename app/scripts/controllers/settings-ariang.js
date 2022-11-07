(function () {
    'use strict';

    angular.module('ariaNg').controller('AriaNgSettingsController', ['$rootScope', '$scope', '$routeParams', '$window', '$interval', '$timeout', '$filter', 'clipboard', 'ariaNgLanguages', 'ariaNgCommonService', 'ariaNgVersionService', 'ariaNgKeyboardService', 'ariaNgNotificationService', 'ariaNgLocalizationService', 'ariaNgLogService', 'ariaNgFileService', 'ariaNgSettingService', 'ariaNgMonitorService', 'ariaNgTitleService', 'aria2SettingService', 'ariaNgNativeElectronService', function ($rootScope, $scope, $routeParams, $window, $interval, $timeout, $filter, clipboard, ariaNgLanguages, ariaNgCommonService, ariaNgVersionService, ariaNgKeyboardService, ariaNgNotificationService, ariaNgLocalizationService, ariaNgLogService, ariaNgFileService, ariaNgSettingService, ariaNgMonitorService, ariaNgTitleService, aria2SettingService, ariaNgNativeElectronService) {
        var extendType = $routeParams.extendType;
        var lastRefreshPageNotification = null;

        var getFinalTitle = function () {
            return ariaNgTitleService.getFinalTitleByGlobalStat({
                globalStat: ariaNgMonitorService.getCurrentGlobalStat(),
                currentRpcProfile: getCurrentRPCProfile()
            });
        };

        var getCurrentRPCProfile = function () {
            if (!$scope.context || !$scope.context.rpcSettings || $scope.context.rpcSettings.length < 1) {
                return null;
            }

            for (var i = 0; i < $scope.context.rpcSettings.length; i++) {
                var rpcSetting = $scope.context.rpcSettings[i];
                if (rpcSetting.isDefault) {
                    return rpcSetting;
                }
            }

            return null;
        };

        var getNativeSettings = function () {
            var originalConfig = ariaNgNativeElectronService.getNativeConfig();
            var config = {};

            config.defaultPosition = originalConfig.defaultPosition || 'last-position';

            if (!originalConfig.minimizedToTray) {
                config.afterMainWindowClosed = 'exit-application';
            } else {
                config.afterMainWindowClosed = 'minimize-to-tray';
            }

            config.notificationSound = originalConfig.notificationSound;
            config.execCommandOnStartup = originalConfig.execCommandOnStartup;
            config.execCommandArgumentsOnStartup = originalConfig.execCommandArgumentsOnStartup;

            if (!originalConfig.execDetachedCommandOnStartup) {
                config.execCommandOptionsOnStartup = 'as-child-process';
            } else {
                config.execCommandOptionsOnStartup = 'as-detached-process';
            }

            return config;
        };

        var setNeedRefreshPage = function () {
            if (lastRefreshPageNotification) {
                return;
            }

            lastRefreshPageNotification = ariaNgNotificationService.notifyInPage('', 'Configuration has been modified, please reload the page for the changes to take effect.', {
                delay: false,
                type: 'info',
                templateUrl: 'views/notification-reloadable.html',
                onClose: function () {
                    lastRefreshPageNotification = null;
                }
            });
        };

        $scope.context = {
            currentTab: 'global',
            ariaNgNativeVersion: ariaNgVersionService.getBuildVersion(),
            ariaNgVersion: ariaNgVersionService.getAriaNgVersion(),
            buildCommit: ariaNgVersionService.getBuildCommit(),
            isCurrentLatestVersion: false,
            runtimeEnvironment: ariaNgNativeElectronService.getRuntimeEnvironment(),
            runtimeEnvironmentCollapsed: true,
            languages: ariaNgLanguages,
            titlePreview: getFinalTitle(),
            availableTime: ariaNgCommonService.getTimeOptions([1000, 2000, 3000, 5000, 10000, 30000, 60000], true),
            trueFalseOptions: [{name: 'Enabled', value: true}, {name: 'Disabled', value: false}],
            showRpcSecret: false,
            isInsecureProtocolDisabled: ariaNgSettingService.isInsecureProtocolDisabled(),
            settings: ariaNgSettingService.getAllOptions(),
            nativeSettings: getNativeSettings(),
            sessionSettings: ariaNgSettingService.getAllSessionOptions(),
            rpcSettings: ariaNgSettingService.getAllRpcSettings(),
            isMacKeyboardLike: ariaNgKeyboardService.isMacKeyboardLike(),
            isSupportReconnect: aria2SettingService.canReconnect(),
            isSupportBlob: ariaNgFileService.isSupportBlob(),
            isSupportDarkMode: ariaNgSettingService.isBrowserSupportDarkMode(),
            importSettings: null,
            exportSettings: null,
            exportSettingsCopied: false,
            exportCommandApiOptions: null
        };

        $scope.context.titlePreview = getFinalTitle();
        $scope.context.showDebugMode = false; // AriaNg Native does not allow to disable debug mode when current is in debug mode

        $scope.changeGlobalTab = function () {
            $scope.context.currentTab = 'global';
        };

        $scope.isCurrentGlobalTab = function () {
            return $scope.context.currentTab === 'global';
        };

        $scope.changeRpcTab = function (rpcIndex) {
            $scope.context.currentTab = 'rpc' + rpcIndex;
        };

        $scope.isCurrentRpcTab = function (rpcIndex) {
            return $scope.context.currentTab === 'rpc' + rpcIndex;
        };

        $scope.getCurrentRpcTabIndex = function () {
            if ($scope.isCurrentGlobalTab()) {
                return -1;
            }

            return parseInt($scope.context.currentTab.substring(3));
        };

        $scope.checkUpdate = function () {
            return ariaNgVersionService.getTheLatestVersion()
                .then(function onSuccess(response) {
                    ariaNgLogService.debug('[AriaNgSettingsController.checkUpdate] latest version info', response);

                    if (!response || !response.data || !response.data.tag_name) {
                        ariaNgLogService.warn('[AriaNgSettingsController.checkUpdate] data format of latest version is invalid', response);
                        ariaNgCommonService.showError('Failed to get latest version!');
                        return;
                    }

                    var latestVersion = response.data.tag_name;

                    if (ariaNgVersionService.compareVersion($scope.context.ariaNgNativeVersion, latestVersion) >= 0) {
                        ariaNgCommonService.showInfo('Check Update', 'You have installed the latest version!');
                        $scope.context.isCurrentLatestVersion = true;
                    } else {
                        ariaNgNativeElectronService.openProjectReleaseLink();
                    }
                }).catch(function onError(response) {
                    ariaNgLogService.error('[AriaNgSettingsController.checkUpdate] failed to get latest version', response);
                    ariaNgCommonService.showError('Failed to get latest version!');
                });
        };

        $scope.updateTitlePreview = function () {
            $scope.context.titlePreview = getFinalTitle();
        };

        $rootScope.swipeActions.extendLeftSwipe = function () {
            var tabIndex = -1;

            if (!$scope.isCurrentGlobalTab()) {
                tabIndex = parseInt($scope.getCurrentRpcTabIndex());
            }

            if (tabIndex < $scope.context.rpcSettings.length - 1) {
                $scope.changeRpcTab(tabIndex + 1);
                return true;
            } else {
                return false;
            }
        };

        $rootScope.swipeActions.extendRightSwipe = function () {
            var tabIndex = -1;

            if (!$scope.isCurrentGlobalTab()) {
                tabIndex = parseInt($scope.getCurrentRpcTabIndex());
            }

            if (tabIndex > 0) {
                $scope.changeRpcTab(tabIndex - 1);
                return true;
            } else if (tabIndex === 0) {
                $scope.changeGlobalTab();
                return true;
            } else {
                return false;
            }
        };

        $scope.isSupportNotification = function () {
            return ariaNgNotificationService.isSupportBrowserNotification() &&
                ariaNgSettingService.isCurrentRpcUseWebSocket($scope.context.settings.protocol);
        };

        $scope.setLanguage = function (value) {
            if (ariaNgSettingService.setLanguage(value)) {
                ariaNgLocalizationService.applyLanguage(value);
            }

            $scope.updateTitlePreview();
        };

        $scope.setAutoCheckUpdates = function (value) {
            ariaNgSettingService.setAutoCheckUpdates(value);
        };

        $scope.setTheme = function (value) {
            ariaNgSettingService.setTheme(value);
            $rootScope.setTheme(value);
        };

        $scope.setDebugMode = function (value) {
            ariaNgSettingService.setDebugMode(value);
        };

        $scope.setTitle = function (value) {
            ariaNgSettingService.setTitle(value);
        };

        $scope.setEnableBrowserNotification = function (value) {
            ariaNgSettingService.setBrowserNotification(value);

            if (value && !ariaNgNotificationService.hasBrowserPermission()) {
                ariaNgNotificationService.requestBrowserPermission(function (result) {
                    if (!result.granted) {
                        $scope.context.settings.browserNotification = false;
                        ariaNgCommonService.showError('You have disabled notification in your browser. You should change your browser\'s settings before you enable this function.');
                    }
                });
            }
        };

        $scope.setBrowserNotificationSound = function (value) {
            ariaNgSettingService.setBrowserNotificationSound(value);
            ariaNgNativeElectronService.setNotificationSound(value);
        };

        $scope.setBrowserNotificationFrequency = function (value) {
            ariaNgSettingService.setBrowserNotificationFrequency(value);
        };

        $scope.setWebSocketReconnectInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setWebSocketReconnectInterval(value);
        };

        $scope.setTitleRefreshInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setTitleRefreshInterval(value);
        };

        $scope.setGlobalStatRefreshInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setGlobalStatRefreshInterval(value);
        };

        $scope.setDownloadTaskRefreshInterval = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setDownloadTaskRefreshInterval(value);
        };

        $scope.setRPCListDisplayOrder = function (value) {
            setNeedRefreshPage();
            ariaNgSettingService.setRPCListDisplayOrder(value);
        };

        $scope.setKeyboardShortcuts = function (value) {
            ariaNgSettingService.setKeyboardShortcuts(value);
        };

        $scope.setSwipeGesture = function (value) {
            ariaNgSettingService.setSwipeGesture(value);
        };

        $scope.setDragAndDropTasks = function (value) {
            ariaNgSettingService.setDragAndDropTasks(value);
        };

        $scope.setAfterCreatingNewTask = function (value) {
            ariaNgSettingService.setAfterCreatingNewTask(value);
        };

        $scope.setRemoveOldTaskAfterRetrying = function (value) {
            ariaNgSettingService.setRemoveOldTaskAfterRetrying(value);
        };

        $scope.setConfirmTaskRemoval = function (value) {
            ariaNgSettingService.setConfirmTaskRemoval(value);
        };

        $scope.setIncludePrefixWhenCopyingFromTaskDetails = function (value) {
            ariaNgSettingService.setIncludePrefixWhenCopyingFromTaskDetails(value);
        };

        $scope.setShowPiecesInfoInTaskDetailPage = function (value) {
            ariaNgSettingService.setShowPiecesInfoInTaskDetailPage(value);
        };

        $scope.setAfterRetryingTask = function (value) {
            ariaNgSettingService.setAfterRetryingTask(value);
        };

        $scope.setDefaultPosition = function (value) {
            ariaNgNativeElectronService.setDefaultPosition(value);
        }

        $scope.setExecCommandOnStartup = function (value) {
            ariaNgNativeElectronService.setExecCommandOnStartup(value);
        };

        $scope.setExecCommandArgumentsOnStartup = function (value) {
            ariaNgNativeElectronService.setExecCommandArgumentsOnStartup(value);
        };

        $scope.setExecCommandOptionsOnStartup = function (value) {
            if (value === 'as-child-process') {
                ariaNgNativeElectronService.setExecDetachedCommandOnStartup(false);
            } else if (value === 'as-detached-process') {
                ariaNgNativeElectronService.setExecDetachedCommandOnStartup(true);
            }
        };

        $scope.browseAndSetExecCommandOnStartup = function () {
            ariaNgNativeElectronService.showOpenFileDialogAsync([{
                name: ariaNgLocalizationService.getLocalizedText('All Files'),
                extensions: ['*']
            }], function (result) {
                if (result && !result.canceled && angular.isArray(result.filePaths) && result.filePaths.length) {
                    var filePath = result.filePaths[0];

                    $scope.$apply(function () {
                        $scope.context.nativeSettings.execCommandOnStartup = filePath;
                        $scope.setExecCommandOnStartup(filePath);
                    });
                }
            });
        }

        $scope.setAfterMainWindowClosed = function (value) {
            if (value === 'minimize-to-tray') {
                ariaNgNativeElectronService.setMinimizedToTray(true);
            } else if (value === 'exit-application') {
                ariaNgNativeElectronService.setMinimizedToTray(false);
            }
        };

        $scope.showImportSettingsModal = function () {
            $scope.context.importSettings = null;
            angular.element('#import-settings-modal').modal();
        };

        $('#import-settings-modal').on('hide.bs.modal', function (e) {
            $scope.context.importSettings = null;
        });

        $scope.openAriaNgConfigFile = function () {
            ariaNgFileService.openFileContent({
                scope: $scope,
                fileFilter: '.json',
                fileType: 'text'
            }, function (result) {
                $scope.context.importSettings = result.content;
            }, function (error) {
                ariaNgCommonService.showError(error);
            }, angular.element('#import-file-holder'));
        };

        $scope.importSettings = function (settings) {
            var settingsObj = null;

            try {
                settingsObj = JSON.parse(settings);
            } catch (e) {
                ariaNgLogService.error('[AriaNgSettingsController.importSettings] parse settings json error', e);
                ariaNgCommonService.showError('Invalid settings data format!');
                return;
            }

            if (!angular.isObject(settingsObj) || angular.isArray(settingsObj)) {
                ariaNgLogService.error('[AriaNgSettingsController.importSettings] settings json is not object');
                ariaNgCommonService.showError('Invalid settings data format!');
                return;
            }

            if (settingsObj) {
                ariaNgCommonService.confirm('Confirm Import', 'Are you sure you want to import all settings?', 'warning', function () {
                    ariaNgSettingService.importAllOptions(settingsObj);
                    ariaNgNativeElectronService.setNotificationSound(!!settingsObj.browserNotificationSound);
                    $window.location.reload();
                });
            }
        };

        $scope.showExportSettingsModal = function () {
            $scope.context.exportSettings = $filter('json')(ariaNgSettingService.exportAllOptions());
            $scope.context.exportSettingsCopied = false;
            angular.element('#export-settings-modal').modal();
        };

        $('#export-settings-modal').on('hide.bs.modal', function (e) {
            $scope.context.exportSettings = null;
            $scope.context.exportSettingsCopied = false;
        });

        $scope.copyExportSettings = function () {
            clipboard.copyText($scope.context.exportSettings, {
                container: angular.element('#export-settings-modal')[0]
            });
            $scope.context.exportSettingsCopied = true;
        };

        $scope.addNewRpcSetting = function () {
            setNeedRefreshPage();

            var newRpcSetting = ariaNgSettingService.addNewRpcSetting();
            $scope.context.rpcSettings.push(newRpcSetting);

            $scope.changeRpcTab($scope.context.rpcSettings.length - 1);
        };

        $scope.updateRpcSetting = function (setting, field) {
            setNeedRefreshPage();
            ariaNgSettingService.updateRpcSetting(setting, field);
        };

        $scope.removeRpcSetting = function (setting) {
            var rpcName = (setting.rpcAlias ? setting.rpcAlias : setting.rpcHost + ':' + setting.rpcPort);

            ariaNgCommonService.confirm('Confirm Remove', 'Are you sure you want to remove rpc setting "{rpcName}"?', 'warning', function () {
                setNeedRefreshPage();

                var currentIndex = $scope.getCurrentRpcTabIndex();
                var index = $scope.context.rpcSettings.indexOf(setting);
                ariaNgSettingService.removeRpcSetting(setting);
                $scope.context.rpcSettings.splice(index, 1);

                if (currentIndex >= $scope.context.rpcSettings.length) {
                    $scope.changeRpcTab($scope.context.rpcSettings.length - 1);
                } else if (currentIndex <= 0 || currentIndex <= index) {
                    ; // Do Nothing
                } else { // currentIndex > index
                    $scope.changeRpcTab(currentIndex - 1);
                }
            }, false, {
                textParams: {
                    rpcName: rpcName
                }
            });
        };

        $scope.showExportCommandAPIModal = function (setting) {
            $scope.context.exportCommandApiOptions = {
                type: 'setting',
                data: setting
            };
        };

        $scope.setDefaultRpcSetting = function (setting) {
            if (setting.isDefault) {
                return;
            }

            ariaNgSettingService.setDefaultRpcSetting(setting);
            $window.location.reload();
        };

        $scope.resetSettings = function () {
            ariaNgCommonService.confirm('Confirm Reset', 'Are you sure you want to reset all settings?', 'warning', function () {
                ariaNgSettingService.resetSettings();
                $window.location.reload();
            });
        };

        $scope.clearHistory = function () {
            ariaNgCommonService.confirm('Confirm Clear', 'Are you sure you want to clear all settings history?', 'warning', function () {
                aria2SettingService.clearSettingsHistorys();
                $window.location.reload();
            });
        };

        $scope.reloadApp = function () {
            ariaNgNativeElectronService.reload();
        };

        angular.element('[data-toggle="popover"]').popover();

        $rootScope.loadPromise = $timeout(function () {}, 100);
    }]);
}());
