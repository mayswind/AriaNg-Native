(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNotificationService', ['$window', 'Notification', 'ariaNgConstants', 'ariaNgCommonService', 'ariaNgStorageService', 'ariaNgLocalizationService', 'ariaNgLogService', 'ariaNgSettingService', 'ariaNgNativeElectronService', function ($window, Notification,  ariaNgConstants, ariaNgCommonService, ariaNgStorageService, ariaNgLocalizationService, ariaNgLogService, ariaNgSettingService, ariaNgNativeElectronService) {
        var nativeNotificationPermission = 'granted';
        var isSupportBrowserNotification = true;

        var isBrowserNotifactionGranted = function (permission) {
            return permission === 'granted';
        };

        var getBrowserNotifactionPermission = function () {
            return nativeNotificationPermission;
        };

        var requestBrowserNotifactionPermission = function (callback) {
            var permission = nativeNotificationPermission;

            if (callback) {
                callback({
                    granted: isBrowserNotifactionGranted(permission),
                    permission: permission
                });
            }
        };

        var isReachBrowserNotificationFrequencyLimit = function () {
            if (!ariaNgSettingService.getBrowserNotificationFrequency() || ariaNgSettingService.getBrowserNotificationFrequency() === 'unlimited') {
                return false;
            }

            var lastNotifications = ariaNgStorageService.get(ariaNgConstants.browserNotificationHistoryStorageKey) || [];

            if (!angular.isArray(lastNotifications)) {
                return false;
            }

            if (lastNotifications.length < 1) {
                return false;
            }

            var oldestTime = null;
            var isReachLimit = false;

            if (ariaNgSettingService.getBrowserNotificationFrequency() === 'high') {
                if (lastNotifications.length < 10) {
                    return false;
                }

                oldestTime = lastNotifications[lastNotifications.length - 10].time;
                isReachLimit = ariaNgCommonService.isUnixTimeAfter(oldestTime, '-1', 'minute');
            } else if (ariaNgSettingService.getBrowserNotificationFrequency() === 'middle') {
                oldestTime = lastNotifications[lastNotifications.length - 1].time;
                isReachLimit = ariaNgCommonService.isUnixTimeAfter(oldestTime, '-1', 'minute');
            } else if (ariaNgSettingService.getBrowserNotificationFrequency() === 'low') {
                oldestTime = lastNotifications[lastNotifications.length - 1].time;
                isReachLimit = ariaNgCommonService.isUnixTimeAfter(oldestTime, '-5', 'minute');
            }

            if (isReachLimit) {
                ariaNgLogService.debug('[ariaNgNotificationService.isReachBrowserNotificationFrequencyLimit] reach frequency limit'
                    + (oldestTime ? ', the oldest time is ' + oldestTime : ''));
            }

            return isReachLimit;
        };

        var recordBrowserNotificationHistory = function () {
            if (!ariaNgSettingService.getBrowserNotificationFrequency() || ariaNgSettingService.getBrowserNotificationFrequency() === 'unlimited') {
                return;
            }

            var lastNotifications = ariaNgStorageService.get(ariaNgConstants.browserNotificationHistoryStorageKey) || [];

            if (!angular.isArray(lastNotifications)) {
                lastNotifications = [];
            }

            lastNotifications.push({
                time: ariaNgCommonService.getCurrentUnixTime()
            });

            if (lastNotifications.length > 10) {
                lastNotifications.splice(0, lastNotifications.length - 10);
            }

            ariaNgStorageService.set(ariaNgConstants.browserNotificationHistoryStorageKey, lastNotifications);
        };

        var showBrowserNotifaction = function (title, options) {
            if (isReachBrowserNotificationFrequencyLimit()) {
                return;
            }

            recordBrowserNotificationHistory();

            ariaNgNativeElectronService.showSystemNotification({
                title: title,
                body: options.body,
                silent: !!options.silent
            });
        };

        var notifyViaBrowser = function (title, content, options) {
            if (!options) {
                options = {};
            }

            options.body = content;

            if (!ariaNgSettingService.getBrowserNotificationSound()) {
                options.silent = true;
            }

            if (isSupportBrowserNotification && ariaNgSettingService.getBrowserNotification()) {
                showBrowserNotifaction(title, options);
            }
        };

        var notifyInPage = function (title, content, options) {
            if (!options) {
                options = {};
            }

            if (!content) {
                options.message = title;
            } else {
                options.title = title;
                options.message = content;
            }

            if (!options.type || !Notification[options.type]) {
                options.type = 'primary';
            }

            if (!options.positionY) {
                // AriaNg Native changes the notification position to right bottom of the page
                options.positionY = 'bottom';
            }

            return Notification[options.type](options);
        };

        return {
            isSupportBrowserNotification: function () {
                return isSupportBrowserNotification;
            },
            hasBrowserPermission: function () {
                if (!isSupportBrowserNotification) {
                    return false;
                }

                return isBrowserNotifactionGranted(getBrowserNotifactionPermission());
            },
            requestBrowserPermission: function (callback) {
                if (!isSupportBrowserNotification) {
                    return;
                }

                requestBrowserNotifactionPermission(function (result) {
                    if (!result.granted) {
                        ariaNgSettingService.setBrowserNotification(false);
                    }

                    if (callback) {
                        callback(result);
                    }
                });
            },
            notifyViaBrowser: function (title, content, options) {
                if (!options) {
                    options = {};
                }

                if (title) {
                    title = ariaNgLocalizationService.getLocalizedText(title, options.titleParams);
                }

                if (content) {
                    content = ariaNgLocalizationService.getLocalizedText(content, options.contentParams);
                }

                return notifyViaBrowser(title, content, options);
            },
            notifyTaskComplete: function (task) {
                this.notifyViaBrowser('Download Completed', (task && task.taskName ? task.taskName : ''));
            },
            notifyBtTaskComplete: function (task) {
                this.notifyViaBrowser('BT Download Completed', (task && task.taskName ? task.taskName : ''));
            },
            notifyTaskError: function (task) {
                this.notifyViaBrowser('Download Error', (task && task.taskName ? task.taskName : ''));
            },
            notifyInPage: function (title, content, options) {
                if (!options) {
                    options = {};
                }

                if (title) {
                    title = ariaNgLocalizationService.getLocalizedText(title, options.titleParams);
                }

                if (content) {
                    content = ariaNgLocalizationService.getLocalizedText(content, options.contentParams);

                    if (options.contentPrefix) {
                        content = options.contentPrefix + content;
                    }
                }

                return notifyInPage(title, content, options);
            },
            clearNotificationInPage: function () {
                Notification.clearAll();
            }
        };
    }]);
}());
