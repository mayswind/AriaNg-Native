(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgNotificationService', ['$window', 'Notification', 'ariaNgLocalizationService', 'ariaNgSettingService', 'ariaNgNativeElectronService', function ($window, Notification, ariaNgLocalizationService, ariaNgSettingService, ariaNgNativeElectronService) {
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

        var showBrowserNotifaction = function (title, options) {
            ariaNgNativeElectronService.showSystemNotification({
                title: title,
                body: options.body
            });
        };

        var notifyViaBrowser = function (title, content, options) {
            if (!options) {
                options = {};
            }

            options.body = content;

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
