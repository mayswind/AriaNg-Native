(function () {
    'use strict';

    angular.module('ariaNg').controller('DownloadListController', ['$rootScope', '$scope', '$window', '$location', '$route', '$interval', 'dragulaService', 'aria2RpcErrors', 'ariaNgCommonService', 'ariaNgSettingService', 'aria2TaskService', function ($rootScope, $scope, $window, $location, $route, $interval, dragulaService, aria2RpcErrors, ariaNgCommonService, ariaNgSettingService, aria2TaskService) {
        var location = $location.path().substring(1);
        // /completed and /stopped both fetch via tellStopped, then filter by status.
        // aria2 emits three terminal statuses in tellStopped: 'complete', 'error', 'removed'.
        var fetchType = (location === 'completed') ? 'stopped' : location;
        var statusFilter = null;
        if (location === 'completed') {
            statusFilter = function (task) { return task.status === 'complete'; };
        } else if (location === 'stopped') {
            statusFilter = function (task) { return task.status === 'error' || task.status === 'removed'; };
        }
        var downloadTaskRefreshPromise = null;
        var pauseDownloadTaskRefresh = false;
        var needRequestWholeInfo = true;

        var refreshDownloadTask = function (silent) {
            if (pauseDownloadTaskRefresh) {
                return;
            }

            return aria2TaskService.getTaskList(fetchType, needRequestWholeInfo, function (response) {
                if (pauseDownloadTaskRefresh) {
                    return;
                }

                if (!response.success) {
                    if (response.data.message === aria2RpcErrors.Unauthorized.message) {
                        $interval.cancel(downloadTaskRefreshPromise);
                    }

                    return;
                }

                var isRequestWholeInfo = response.context.requestWholeInfo;
                var taskList = response.data;

                // Apply status filter for /completed and /stopped
                if (statusFilter && angular.isArray(taskList)) {
                    taskList = taskList.filter(statusFilter);
                }

                if (isRequestWholeInfo) {
                    $rootScope.taskContext.list = taskList;
                    // For filtered routes, keep requesting full info so we always have
                    // complete status to filter against — avoids stale cross-contamination
                    // between /completed and /stopped.
                    needRequestWholeInfo = !!statusFilter;
                } else {
                    if ($rootScope.taskContext.list && $rootScope.taskContext.list.length > 0) {
                        for (var i = 0; i < $rootScope.taskContext.list.length; i++) {
                            var task = $rootScope.taskContext.list[i];
                            delete task.verifiedLength;
                            delete task.verifyIntegrityPending;
                        }
                    }

                    if (ariaNgCommonService.extendArray(taskList, $rootScope.taskContext.list, 'gid')) {
                        needRequestWholeInfo = false;
                    } else {
                        needRequestWholeInfo = true;
                    }
                }

                if ($rootScope.taskContext.list && $rootScope.taskContext.list.length > 0) {
                    aria2TaskService.processDownloadTasks($rootScope.taskContext.list);

                    if (!isRequestWholeInfo) {
                        var hasFullStruct = false;

                        for (var i = 0; i < $rootScope.taskContext.list.length; i++) {
                            var task = $rootScope.taskContext.list[i];

                            if (task.hasTaskName || task.files || task.bittorrent) {
                                hasFullStruct = true;
                                break;
                            }
                        }

                        if (!hasFullStruct) {
                            needRequestWholeInfo = true;
                            $rootScope.taskContext.list.length = 0;
                            return;
                        }
                    }
                }

                $rootScope.taskContext.enableSelectAll = $rootScope.taskContext.list && $rootScope.taskContext.list.length > 0;
            }, silent);
        };

        $scope.getOrderType = function () {
            return ariaNgSettingService.getDisplayOrder(location);
        };

        $scope.isSupportDragTask = function () {
            if (!ariaNgSettingService.getDragAndDropTasks()) {
                return false;
            }

            var displayOrder = ariaNgCommonService.parseOrderType(ariaNgSettingService.getDisplayOrder(location));

            return location === 'waiting' && displayOrder.type === 'default';
        };

        if (ariaNgSettingService.getDownloadTaskRefreshInterval() > 0) {
            downloadTaskRefreshPromise = $interval(function () {
                refreshDownloadTask(true);
            }, ariaNgSettingService.getDownloadTaskRefreshInterval());
        }

        dragulaService.options($scope, 'task-list', {
            revertOnSpill: true,
            moves: function () {
                return $scope.isSupportDragTask();
            }
        });

        $scope.$on('task-list.drop-model', function (el, target, source) {
            var element = angular.element(target);
            var gid = element.attr('data-gid');
            var index = element.index();

            pauseDownloadTaskRefresh = true;

            aria2TaskService.changeTaskPosition(gid, index, function () {
                pauseDownloadTaskRefresh = false;
            }, true);
        });

        $scope.$on('$destroy', function () {
            pauseDownloadTaskRefresh = true;

            if (downloadTaskRefreshPromise) {
                $interval.cancel(downloadTaskRefreshPromise);
            }
        });

        $rootScope.keydownActions.selectAll = function (event) {
            if (event.preventDefault) {
                event.preventDefault();
            }

            $scope.$apply(function () {
                $scope.selectAllTasks();
            });

            return false;
        };

        $rootScope.keydownActions.delete = function (event) {
            if (event.preventDefault) {
                event.preventDefault();
            }

            $scope.$apply(function () {
                $scope.removeTasks();
            });

            return false;
        }

        $rootScope.loadPromise = refreshDownloadTask(false);
    }]);
}());
