(function () {
    'use strict';

    angular.module('ariaNg').controller('NewTaskController', ['$rootScope', '$scope', '$location', '$timeout', 'ariaNgCommonService', 'ariaNgLocalizationService', 'ariaNgLogService', 'ariaNgFileService', 'ariaNgSettingService', 'aria2TaskService', 'aria2SettingService', 'ariaNgNativeElectronService', function ($rootScope, $scope, $location, $timeout, ariaNgCommonService, ariaNgLocalizationService, ariaNgLogService, ariaNgFileService, ariaNgSettingService, aria2TaskService, aria2SettingService, ariaNgNativeElectronService) {
        var tabOrders = ['links', 'options'];
        var parameters = $location.search();

        var saveDownloadPath = function (options) {
            if (!options || !options.dir) {
                return;
            }

            aria2SettingService.addSettingHistory('dir', options.dir);
        };

        var downloadByLinks = function (pauseOnAdded, responseCallback) {
            var urls = ariaNgCommonService.parseUrlsFromOriginInput($scope.context.urls);
            var options = angular.copy($scope.context.options);
            var tasks = [];

            for (var i = 0; i < urls.length; i++) {
                if (urls[i] === '' || urls[i].trim() === '') {
                    continue;
                }

                tasks.push({
                    urls: urls[i].trim().split(/\s+/),
                    options: options
                });
            }

            saveDownloadPath(options);

            return aria2TaskService.newUriTasks(tasks, pauseOnAdded, responseCallback);
        };

        var downloadByTorrent = function (pauseOnAdded, responseCallback) {
            var task = {
                content: $scope.context.uploadFile.base64Content,
                options: angular.copy($scope.context.options)
            };

            saveDownloadPath(task.options);

            return aria2TaskService.newTorrentTask(task, pauseOnAdded, responseCallback);
        };

        var downloadByMetalink = function (pauseOnAdded, responseCallback) {
            var task = {
                content: $scope.context.uploadFile.base64Content,
                options: angular.copy($scope.context.options)
            };

            saveDownloadPath(task.options);

            return aria2TaskService.newMetalinkTask(task, pauseOnAdded, responseCallback);
        };

        var openFileViaElectron = function (event, result) {
            $scope.$apply(function () {
                if (result && !result.exception) {
                    $scope.context.uploadFile = result;
                    $scope.context.taskType = result.type;

                    if (!result.async) {
                        $rootScope.loadPromise = $timeout(function () {}, 200);
                    }
                } else if (result && result.exception) {
                    ariaNgLogService.error('[NewTaskController] get file via electron error', result.exception);

                    if (result.exception.code === 'ENOENT') {
                        ariaNgLocalizationService.showError('native.error.file-not-found', null, {
                            textParams: {
                                filepath: result.exception.path
                            }
                        });
                    } else {
                        ariaNgLocalizationService.showError(result.exception.code);
                    }
                }
            });
        };

        var openUrlViaElectron = function (event, result) {
            $scope.$apply(function () {
                $scope.context.taskType = 'urls';
                $scope.context.urls = result.text;
                $scope.context.uploadFile = null;

                if (!result.async) {
                    $rootScope.loadPromise = $timeout(function () {}, 200);
                }
            });
        };

        $scope.context = {
            currentTab: 'links',
            taskType: 'urls',
            urls: '',
            uploadFile: null,
            availableOptions: (function () {
                var keys = aria2SettingService.getNewTaskOptionKeys();

                return aria2SettingService.getSpecifiedOptions(keys, {
                    disableRequired: true
                });
            })(),
            globalOptions: null,
            options: {},
            optionFilter: {
                global: true,
                http: false,
                bittorrent: false
            }
        };

        if (parameters.url) {
            try {
                $scope.context.urls = ariaNgCommonService.base64UrlDecode(parameters.url);
            } catch (ex) {
                ariaNgLogService.error('[NewTaskController] base64 decode error, url=' + parameters.url, ex);
            }
        }

        $scope.changeTab = function (tabName) {
            if (tabName === 'options') {
                $scope.loadDefaultOption();
            }

            $scope.context.currentTab = tabName;
        };

        $rootScope.swipeActions.extendLeftSwipe = function () {
            var tabIndex = tabOrders.indexOf($scope.context.currentTab);

            if (tabIndex < tabOrders.length - 1) {
                $scope.changeTab(tabOrders[tabIndex + 1]);
                return true;
            } else {
                return false;
            }
        };

        $rootScope.swipeActions.extendRightSwipe = function () {
            var tabIndex = tabOrders.indexOf($scope.context.currentTab);

            if (tabIndex > 0) {
                $scope.changeTab(tabOrders[tabIndex - 1]);
                return true;
            } else {
                return false;
            }
        };

        $scope.loadDefaultOption = function () {
            if ($scope.context.globalOptions) {
                return;
            }

            $rootScope.loadPromise = aria2SettingService.getGlobalOption(function (response) {
                if (response.success) {
                    $scope.context.globalOptions = response.data;
                }
            });
        };

        $scope.openTorrent = function () {
            ariaNgFileService.openFileContent({
                scope: $scope,
                fileFilter: '.torrent',
                fileType: 'binary'
            }, function (result) {
                $scope.context.uploadFile = result;
                $scope.context.taskType = 'torrent';
                $scope.changeTab('options');
            }, function (error) {
                ariaNgLocalizationService.showError(error);
            }, angular.element('#file-holder'));
        };

        $scope.openMetalink = function () {
            ariaNgFileService.openFileContent({
                scope: $scope,
                fileFilter: '.meta4,.metalink',
                fileType: 'binary'
            }, function (result) {
                $scope.context.uploadFile = result;
                $scope.context.taskType = 'metalink';
                $scope.changeTab('options');
            }, function (error) {
                ariaNgLocalizationService.showError(error);
            }, angular.element('#file-holder'));
        };

        $scope.startDownload = function (pauseOnAdded) {
            var responseCallback = function (response) {
                if (!response.hasSuccess && !response.success) {
                    return;
                }

                var firstTask = null;

                if (response.results && response.results.length > 0) {
                    firstTask = response.results[0];
                } else if (response) {
                    firstTask = response;
                }

                if (ariaNgSettingService.getAfterCreatingNewTask() === 'task-detail' && firstTask && firstTask.data) {
                    $location.path('/task/detail/' + firstTask.data);
                } else {
                    if (pauseOnAdded) {
                        $location.path('/waiting');
                    } else {
                        $location.path('/downloading');
                    }
                }
            };

            if ($scope.context.taskType === 'urls') {
                $rootScope.loadPromise = downloadByLinks(pauseOnAdded, responseCallback);
            } else if ($scope.context.taskType === 'torrent') {
                $rootScope.loadPromise = downloadByTorrent(pauseOnAdded, responseCallback);
            } else if ($scope.context.taskType === 'metalink') {
                $rootScope.loadPromise = downloadByMetalink(pauseOnAdded, responseCallback);
            }
        };

        $scope.setOption = function (key, value, optionStatus) {
            if (value !== '') {
                $scope.context.options[key] = value;
            } else {
                delete $scope.context.options[key];
            }

            optionStatus.setReady();
        };

        $scope.urlTextboxKeyDown = function (event) {
            if (event.keyCode === 13 && event.ctrlKey && $scope.newTaskForm.$valid) {
                $scope.startDownload();
            }
        };

        $scope.getValidUrlsCount = function () {
            var urls = ariaNgCommonService.parseUrlsFromOriginInput($scope.context.urls);
            return urls ? urls.length : 0;
        };

        ariaNgNativeElectronService.onMainProcessNewTaskFromFile(openFileViaElectron);
        ariaNgNativeElectronService.onMainProcessNewTaskFromText(openUrlViaElectron);

        $scope.$on('$destroy', function () {
            ariaNgNativeElectronService.removeMainProcessNewTaskFromFileCallback(openFileViaElectron);
            ariaNgNativeElectronService.removeMainProcessNewTaskFromTextCallback(openUrlViaElectron);
        });

        $rootScope.loadPromise = $timeout(function () {}, 100);
    }]);
}());
