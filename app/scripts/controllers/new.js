(function () {
    'use strict';

    angular.module('ariaNg').controller('NewTaskController', ['$rootScope', '$scope', '$location', '$timeout', 'ariaNgFileTypes', 'ariaNgCommonService', 'ariaNgLocalizationService', 'ariaNgLogService', 'ariaNgFileService', 'ariaNgSettingService', 'aria2TaskService', 'aria2SettingService', 'ariaNgNativeElectronService', function ($rootScope, $scope, $location, $timeout, ariaNgFileTypes, ariaNgCommonService, ariaNgLocalizationService, ariaNgLogService, ariaNgFileService, ariaNgSettingService, aria2TaskService, aria2SettingService, ariaNgNativeElectronService) {
        var tabStatusItems = [
            {
                name: 'links',
                show: true
            },
            {
                name: 'filelist',
                show: false
            },
            {
                name: 'options',
                show: true
            }
        ];
        var parameters = $location.search();

        var getVisibleTabOrders = function () {
            var items = [];

            for (var i = 0; i < tabStatusItems.length; i++) {
                if (tabStatusItems[i].show) {
                    items.push(tabStatusItems[i].name);
                }
            }

            return items;
        };

        var setTabItemShow = function (name, status) {
            for (var i = 0; i < tabStatusItems.length; i++) {
                if (tabStatusItems[i].name === name) {
                    tabStatusItems[i].show = status;
                    break;
                }
            }
        };

        var saveDownloadPath = function (options) {
            if (!options || !options.dir) {
                return;
            }

            aria2SettingService.addSettingHistory('dir', options.dir);
        };

        var getSelectedFilesIndex = function (files) {
            var selectedFileIndex = '';

            for (var i = 0; i < files.length; i++) {
                if (files[i].isDir || !files[i].selected) {
                    continue;
                }

                if (selectedFileIndex.length > 0) {
                    selectedFileIndex += ',';
                }

                selectedFileIndex += files[i].index;
            }

            return selectedFileIndex;
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
                    urls: [urls[i].trim()],
                    options: options
                });
            }

            saveDownloadPath(options);

            return aria2TaskService.newUriTasks(tasks, pauseOnAdded, responseCallback);
        };

        var downloadByTorrent = function (pauseOnAdded, responseCallback) {
            var options = angular.copy($scope.context.options);

            if ($scope.context.newTaskInfo && $scope.context.newTaskInfo.files && $scope.context.newTaskInfo.files.length) {
                options['select-file'] = getSelectedFilesIndex($scope.context.newTaskInfo.files);
            }

            var task = {
                content: $scope.context.uploadFile.base64Content,
                selectedFiles: [],
                options: options
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
                    var bittorrentInfo = null;

                    try {
                        bittorrentInfo = ariaNgNativeElectronService.parseBittorrentInfo(result.base64Content);
                        bittorrentInfo = aria2TaskService.processNewTaskFileList(bittorrentInfo);
                        ariaNgLogService.debug('[NewTaskController.openFileViaElectron] open torrent file ' + (result ? result.fileName : ''), bittorrentInfo);
                    } catch (ex) {
                        ariaNgLogService.error('[NewTaskController.openFileViaElectron] cannot parse torrent info ' + (result ? result.fileName : ''), ex);
                    }

                    $scope.context.uploadFile = result;
                    $scope.context.newTaskInfo = bittorrentInfo;
                    setTabItemShow('filelist', !!bittorrentInfo);

                    $scope.context.taskType = result.type;
                    $scope.changeTab('links');

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
                $scope.context.newTaskInfo = null;
                setTabItemShow('filelist', false);

                if (!result.async) {
                    $rootScope.loadPromise = $timeout(function () {}, 200);
                }
            });
        };

        var setSelectedNode = function (node, value) {
            if (!node) {
                return;
            }

            if (node.files && node.files.length) {
                for (var i = 0; i < node.files.length; i++) {
                    var fileNode = node.files[i];
                    fileNode.selected = value;
                }
            }

            if (node.subDirs && node.subDirs.length) {
                for (var i = 0; i < node.subDirs.length; i++) {
                    var dirNode = node.subDirs[i];
                    setSelectedNode(dirNode, value);
                }
            }

            node.selected = value;
            node.partialSelected = false;
        };

        var updateDirNodeSelectedStatus = function (node) {
            if (!node) {
                return;
            }

            var selectedSubNodesCount = 0;
            var partitalSelectedSubNodesCount = 0;

            if (node.files && node.files.length) {
                for (var i = 0; i < node.files.length; i++) {
                    var fileNode = node.files[i];
                    selectedSubNodesCount += (fileNode.selected ? 1 : 0);
                }
            }

            if (node.subDirs && node.subDirs.length) {
                for (var i = 0; i < node.subDirs.length; i++) {
                    var dirNode = node.subDirs[i];
                    updateDirNodeSelectedStatus(dirNode);
                    selectedSubNodesCount += (dirNode.selected ? 1 : 0);
                    partitalSelectedSubNodesCount += (dirNode.partialSelected ? 1 : 0);
                }
            }

            node.selected = (selectedSubNodesCount > 0 && selectedSubNodesCount === (node.subDirs.length + node.files.length));
            node.partialSelected = ((selectedSubNodesCount > 0 && selectedSubNodesCount < (node.subDirs.length + node.files.length)) || partitalSelectedSubNodesCount > 0);
        };

        var updateAllDirNodesSelectedStatus = function () {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.multiDir) {
                return;
            }

            for (var i = 0; i < $scope.context.newTaskInfo.files.length; i++) {
                var node = $scope.context.newTaskInfo.files[i];

                if (!node.isDir) {
                    continue;
                }

                updateDirNodeSelectedStatus(node);
            }
        };

        $scope.context = {
            currentTab: 'links',
            taskType: 'urls',
            urls: '',
            uploadFile: null,
            newTaskInfo: null,
            showChooseFilesToolbar: false,
            fileExtensions: [],
            collapsedDirs: {},
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
            var tabItems = getVisibleTabOrders();
            var tabIndex = tabItems.indexOf($scope.context.currentTab);

            if (tabIndex < tabItems.length - 1) {
                $scope.changeTab(tabItems[tabIndex + 1]);
                return true;
            } else {
                return false;
            }
        };

        $rootScope.swipeActions.extendRightSwipe = function () {
            var tabItems = getVisibleTabOrders();
            var tabIndex = tabItems.indexOf($scope.context.currentTab);

            if (tabIndex > 0) {
                $scope.changeTab(tabItems[tabIndex - 1]);
                return true;
            } else {
                return false;
            }
        };

        $scope.changeFileListDisplayOrder = function (type, autoSetReverse) {
            if ($scope.context.newTaskInfo && $scope.context.newTaskInfo.multiDir) {
                return;
            }

            var oldType = ariaNgCommonService.parseOrderType(ariaNgSettingService.getFileListDisplayOrder());
            var newType = ariaNgCommonService.parseOrderType(type);

            if (autoSetReverse && newType.type === oldType.type) {
                newType.reverse = !oldType.reverse;
            }

            ariaNgSettingService.setFileListDisplayOrder(newType.getValue());
        };

        $scope.isSetFileListDisplayOrder = function (type) {
            var orderType = ariaNgCommonService.parseOrderType(ariaNgSettingService.getFileListDisplayOrder());
            var targetType = ariaNgCommonService.parseOrderType(type);

            return orderType.equals(targetType);
        };

        $scope.getFileListOrderType = function () {
            if ($scope.context.newTaskInfo && $scope.context.newTaskInfo.multiDir) {
                return null;
            }

            return ariaNgSettingService.getFileListDisplayOrder();
        };

        $scope.showChooseFilesToolbar = function () {
            $scope.context.showChooseFilesToolbar = !$scope.context.showChooseFilesToolbar;
        };

        $scope.isAnyFileSelected = function () {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files) {
                return false;
            }

            for (var i = 0; i < $scope.context.newTaskInfo.files.length; i++) {
                var file = $scope.context.newTaskInfo.files[i];

                if (!file.isDir && file.selected) {
                    return true;
                }
            }

            return false;
        };

        $scope.isAllFileSelected = function () {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files) {
                return false;
            }

            for (var i = 0; i < $scope.context.newTaskInfo.files.length; i++) {
                var file = $scope.context.newTaskInfo.files[i];

                if (!file.isDir && !file.selected) {
                    return false;
                }
            }

            return true;
        };

        $scope.selectFiles = function (type) {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files) {
                return;
            }

            if (type === 'auto') {
                if ($scope.isAllFileSelected()) {
                    type = 'none';
                } else {
                    type = 'all';
                }
            }

            for (var i = 0; i < $scope.context.newTaskInfo.files.length; i++) {
                var file = $scope.context.newTaskInfo.files[i];

                if (file.isDir) {
                    continue;
                }

                if (type === 'all') {
                    file.selected = true;
                } else if (type === 'none') {
                    file.selected = false;
                } else if (type === 'reverse') {
                    file.selected = !file.selected;
                }
            }

            updateAllDirNodesSelectedStatus();
        };

        $scope.chooseSpecifiedFiles = function (type) {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files || !ariaNgFileTypes[type]) {
                return;
            }

            var files = $scope.context.newTaskInfo.files;
            var extensions = ariaNgFileTypes[type].extensions;
            var fileIndexes = [];
            var isAllSelected = true;

            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                if (file.isDir) {
                    continue;
                }

                var extension = ariaNgCommonService.getFileExtension(file.fileName);

                if (extension) {
                    extension = extension.toLowerCase();
                }

                if (extensions.indexOf(extension) >= 0) {
                    fileIndexes.push(i);

                    if (!file.selected) {
                        isAllSelected = false;
                    }
                }
            }

            for (var i = 0; i < fileIndexes.length; i++) {
                var index = fileIndexes[i];
                var file = files[index];

                if (file && !file.isDir) {
                    file.selected = !isAllSelected;
                }
            }

            updateAllDirNodesSelectedStatus();
        };

        $scope.hideChoosedFiles = function () {
            if ($scope.context.showChooseFilesToolbar) {
                $scope.context.showChooseFilesToolbar = false;
            }
        };

        $scope.showCustomChooseFileModal = function () {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files) {
                return;
            }

            var files = $scope.context.newTaskInfo.files;
            var extensionsMap = {};

            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                if (file.isDir) {
                    continue;
                }

                var extension = ariaNgCommonService.getFileExtension(file.fileName);

                if (extension) {
                    extension = extension.toLowerCase();
                }

                var extensionInfo = extensionsMap[extension];

                if (!extensionInfo) {
                    var extensionName = extension;

                    if (extensionName.length > 0 && extensionName.charAt(0) === '.') {
                        extensionName = extensionName.substring(1);
                    }

                    extensionInfo = {
                        extension: extensionName,
                        classified: false,
                        selected: false,
                        selectedCount: 0,
                        unSelectedCount: 0
                    };

                    extensionsMap[extension] = extensionInfo;
                }

                if (file.selected) {
                    extensionInfo.selected = true;
                    extensionInfo.selectedCount++;
                } else {
                    extensionInfo.unSelectedCount++;
                }
            }

            var allClassifiedExtensions = {};

            for (var type in ariaNgFileTypes) {
                if (!ariaNgFileTypes.hasOwnProperty(type)) {
                    continue;
                }

                var extensionTypeName = ariaNgFileTypes[type].name;
                var allExtensions = ariaNgFileTypes[type].extensions;
                var extensions = [];

                for (var i = 0; i < allExtensions.length; i++) {
                    var extension = allExtensions[i];
                    var extensionInfo = extensionsMap[extension];

                    if (extensionInfo) {
                        extensionInfo.classified = true;
                        extensions.push(extensionInfo);
                    }
                }

                if (extensions.length > 0) {
                    allClassifiedExtensions[type] = {
                        name: extensionTypeName,
                        extensions: extensions
                    };
                }
            }

            var unClassifiedExtensions = [];

            for (var extension in extensionsMap) {
                if (!extensionsMap.hasOwnProperty(extension)) {
                    continue;
                }

                var extensionInfo = extensionsMap[extension];

                if (!extensionInfo.classified) {
                    unClassifiedExtensions.push(extensionInfo);
                }
            }

            if (unClassifiedExtensions.length > 0) {
                allClassifiedExtensions.other = {
                    name: 'Other',
                    extensions: unClassifiedExtensions
                };
            }

            $scope.context.fileExtensions = allClassifiedExtensions;
            angular.element('#custom-choose-file-modal').modal();
        };

        $scope.setSelectedExtension = function (selectedExtension, selected) {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files) {
                return;
            }

            var files = $scope.context.newTaskInfo.files;

            for (var i = 0; i < files.length; i++) {
                var file = files[i];

                if (file.isDir) {
                    continue;
                }

                var extension = ariaNgCommonService.getFileExtension(file.fileName);

                if (extension) {
                    extension = extension.toLowerCase();
                }

                if (extension !== '.' + selectedExtension) {
                    continue;
                }

                file.selected = selected;
            }

            updateAllDirNodesSelectedStatus();
        };

        $('#custom-choose-file-modal').on('hide.bs.modal', function (e) {
            $scope.context.fileExtensions = null;
        });

        $scope.setSelectedFile = function () {
            updateAllDirNodesSelectedStatus();
        };

        $scope.collapseDir = function (dirNode, newValue, forceRecurse) {
            var nodePath = dirNode.nodePath;

            if (angular.isUndefined(newValue)) {
                newValue = !$scope.context.collapsedDirs[nodePath];
            }

            if (newValue || forceRecurse) {
                for (var i = 0; i < dirNode.subDirs.length; i++) {
                    $scope.collapseDir(dirNode.subDirs[i], newValue);
                }
            }

            if (nodePath) {
                $scope.context.collapsedDirs[nodePath] = newValue;
            }
        };

        $scope.collapseAllDirs = function (newValue) {
            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files) {
                return;
            }

            for (var i = 0; i < $scope.context.newTaskInfo.files.length; i++) {
                var node = $scope.context.newTaskInfo.files[i];

                if (!node.isDir) {
                    continue;
                }

                $scope.collapseDir(node, newValue, true);
            }
        };

        $scope.setSelectedNode = function (dirNode) {
            setSelectedNode(dirNode, dirNode.selected);
            updateAllDirNodesSelectedStatus();
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
                var bittorrentInfo = null;

                try {
                    bittorrentInfo = ariaNgNativeElectronService.parseBittorrentInfo(result.base64Content);
                    bittorrentInfo = aria2TaskService.processNewTaskFileList(bittorrentInfo);
                    ariaNgLogService.debug('[NewTaskController.openTorrent] open torrent file ' + (result ? result.fileName : ''), bittorrentInfo);
                } catch (ex) {
                    ariaNgLogService.error('[NewTaskController.openTorrent] cannot parse torrent info ' + (result ? result.fileName : ''), ex);
                }

                $scope.context.uploadFile = result;
                $scope.context.newTaskInfo = bittorrentInfo;
                setTabItemShow('filelist', !!bittorrentInfo);

                $scope.context.taskType = 'torrent';
                $scope.changeTab('links');
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
                $scope.context.newTaskInfo = null;
                setTabItemShow('filelist', false);

                $scope.context.taskType = 'metalink';
                $scope.changeTab('options');
            }, function (error) {
                ariaNgLocalizationService.showError(error);
            }, angular.element('#file-holder'));
        };

        $scope.isNewTaskValid = function () {
            if (!$scope.context.uploadFile) {
                return $scope.newTaskForm.$valid;
            }

            if (!$scope.context.newTaskInfo || !$scope.context.newTaskInfo.files || !$scope.context.newTaskInfo.files.length) {
                return true;
            }

            return $scope.isAnyFileSelected();
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
            var keyCode = event.keyCode || event.which || event.charCode;

            if ((event.code === 'Enter' || keyCode === 13) && event.ctrlKey && $scope.newTaskForm.$valid) {
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
