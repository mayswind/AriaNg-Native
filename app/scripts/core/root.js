(function () {
    'use strict';

    angular.module('ariaNg').run(['$window', '$rootScope', '$location', '$document', '$timeout', 'ariaNgSupportedAudioFileTypes', 'ariaNgCommonService', 'ariaNgKeyboardService', 'ariaNgNotificationService', 'ariaNgLogService', 'ariaNgLocalizationService', 'ariaNgSettingService', 'aria2TaskService', 'ariaNgNativeElectronService', 'ariaNgVersionService', function ($window, $rootScope, $location, $document, $timeout, ariaNgSupportedAudioFileTypes, ariaNgCommonService, ariaNgKeyboardService, ariaNgNotificationService, ariaNgLogService, ariaNgLocalizationService, ariaNgSettingService, aria2TaskService, ariaNgNativeElectronService, ariaNgVersionService) {
        var autoRefreshAfterPageLoad = false;

        var isAnyTextboxOrTextareaFocus = function () {
            return angular.element('input[type="text"],textarea').is(':focus');
        };

        var isUrlMatchUrl2 = function (url, url2) {
            if (url === url2) {
                return true;
            }

            var index = url2.indexOf(url);

            if (index !== 0) {
                return false;
            }

            var lastPart = url2.substring(url.length);

            if (lastPart.indexOf('/') === 0) {
                return true;
            }

            return false;
        };

        var setLightTheme = function () {
            $rootScope.currentTheme = 'light';
            angular.element('body').removeClass('theme-dark');
        };

        var setDarkTheme = function () {
            $rootScope.currentTheme = 'dark';
            angular.element('body').addClass('theme-dark');
        };

        var setThemeBySystemSettings = function () {
            if (!ariaNgSettingService.isBrowserSupportDarkMode()) {
                setLightTheme();
                return;
            }

            var matchPreferColorScheme = $window.matchMedia('(prefers-color-scheme: dark)');

            ariaNgLogService.info('[root.setThemeBySystemSettings] system uses ' + (matchPreferColorScheme.matches ? 'dark' : 'light') + ' theme');

            if (matchPreferColorScheme.matches) {
                setDarkTheme();
            } else {
                setLightTheme();
            }
        };

        var initTheme = function () {
            if (ariaNgSettingService.getTheme() === 'system') {
                ariaNgNativeElectronService.setNativeTheme('system');
                setThemeBySystemSettings();
            } else if (ariaNgSettingService.getTheme() === 'dark') {
                ariaNgNativeElectronService.setNativeTheme('dark');
                setDarkTheme();
            } else {
                ariaNgNativeElectronService.setNativeTheme('light');
                setLightTheme();
            }
        };

        var initCheck = function () {
            var browserFeatures = ariaNgSettingService.getBrowserFeatures();

            if (!browserFeatures.localStroage) {
                ariaNgLogService.warn('[root.initCheck] LocalStorage is not supported!');
            }

            if (!browserFeatures.cookies) {
                ariaNgLogService.warn('[root.initCheck] Cookies is not supported!');
            }

            if (!ariaNgSettingService.isBrowserSupportStorage()) {
                angular.element('body').prepend('<div class="disable-overlay"></div>');
                angular.element('.main-sidebar').addClass('blur');
                angular.element('.navbar').addClass('blur');
                angular.element('.content-body').addClass('blur');
                ariaNgNotificationService.notifyInPage('', 'You cannot use AriaNg because this browser does not meet the minimum requirements for data storage.', {
                    type: 'error',
                    delay: false
                });

                throw new Error('You cannot use AriaNg because this browser does not meet the minimum requirements for data storage.');
            }
        };

        var initNavbar = function () {
            angular.element('section.sidebar > ul > li[data-href-match] > a').click(function () {
                angular.element('section.sidebar > ul li').removeClass('active');
                angular.element(this).parent().addClass('active');
            });

            angular.element('section.sidebar > ul > li.treeview > ul.treeview-menu > li[data-href-match] > a').click(function () {
                angular.element('section.sidebar > ul li').removeClass('active');
                angular.element(this).parent().addClass('active').parent().parent().addClass('active');
            });
        };

        var setNavbarSelected = function (location) {
            angular.element('section.sidebar > ul li').removeClass('active');
            angular.element('section.sidebar > ul > li[data-href-match]').each(function (index, element) {
                var match = angular.element(element).attr('data-href-match');

                if (isUrlMatchUrl2(match, location)) {
                    angular.element(element).addClass('active');
                }
            });

            angular.element('section.sidebar > ul > li.treeview > ul.treeview-menu > li[data-href-match]').each(function (index, element) {
                var match = angular.element(element).attr('data-href-match');

                if (isUrlMatchUrl2(match, location)) {
                    angular.element(element).addClass('active').parent().parent().addClass('active');
                }
            });
        };

        var initContentWrapper = function () {
            //copy from AdminLTE app.js
            var defaultNavbarWithAppTitleHeight = 74; // defined in "min-height" of ".custom-app-title .main-header .navbar" in app-title.css
            var defaultNavbarHeight = 50; // defined in "min-height" of ".main-header .navbar" in AdminLTE.css
            var defaultFooterHeight = 1 + 15 + 15 + 17; // defined in "border-top" of ".main-footer" in AdminLTE.css, "padding" of ".main-footer" in AdminLTE.css and "line-height" of ".skin-aria-ng .main-footer > .navbar > .navbar-toolbar > .nav > li > a" in default.css;

            var windowHeight = $(window).height();
            var headerHeight  = $('.main-header').outerHeight() || (ariaNgNativeElectronService.useCustomAppTitle() ? defaultNavbarWithAppTitleHeight : defaultNavbarHeight);
            var footerHeight = $('.main-footer').outerHeight() || defaultFooterHeight;
            var neg = headerHeight + footerHeight;

            $('.content-wrapper').css('min-height', windowHeight - footerHeight);
            $('.content-body').css('height', windowHeight - neg);
        };

        var initFileDragSupport = function () {
            var getDropFile = function (e) {
                if (!e || !e.dataTransfer) {
                    return null;
                }

                if (e.dataTransfer.items && e.dataTransfer.items[0] && e.dataTransfer.items[0].kind === 'file') {
                    return e.dataTransfer.items[0].getAsFile();
                } else if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    return e.dataTransfer.files[0];
                } else {
                    return null;
                }
            };

            var getDropText = function (e) {
                if (!e || !e.dataTransfer) {
                    return null;
                }

                return e.dataTransfer.getData('text');
            };

            var dropzone = angular.element('#dropzone');
            var dropzoneFileZone = angular.element('#dropzone-filezone');

            angular.element($window).on('dragenter', function (e) {
                ariaNgCommonService.closeAllDialogs();
                dropzone.show();
                e.preventDefault();
            });

            dropzoneFileZone.on('drag dragstart dragend dragover dragenter dragleave drop', function(e) {
                e.preventDefault();
                e.stopPropagation();
            }).on('dragleave dragend drop', function() {
                dropzone.hide();
            }).on('drop', function(e) {
                var file = getDropFile(e.originalEvent);

                if (file) {
                    ariaNgNativeElectronService.notifyMainProcessorNewDropFile({
                        filePath: file.path,
                        location: $location.url()
                    });
                    return;
                }

                var text = getDropText(e.originalEvent);

                if (text) {
                    ariaNgNativeElectronService.notifyMainProcessorNewDropText({
                        text: text,
                        location: $location.url()
                    });
                }
            });
        };

        var showSidebar = function () {
            angular.element('body').removeClass('sidebar-collapse').addClass('sidebar-open');
        };

        var hideSidebar = function () {
            angular.element('body').addClass('sidebar-collapse').removeClass('sidebar-open');
        };

        var isSidebarShowInSmallScreen = function () {
            return angular.element('body').hasClass('sidebar-open');
        };

        var toggleMaximizeButton = function () {
            angular.element('#native-title-maximize-icon').addClass('fa-window-maximize').removeClass('fa-window-restore');
            angular.element('#native-title-maximize-btn').attr('title', ariaNgLocalizationService.getLocalizedText('Maximize'));
        };

        var toggleRestoreButton = function () {
            angular.element('#native-title-maximize-icon').addClass('fa-window-restore').removeClass('fa-window-maximize');
            angular.element('#native-title-maximize-btn').attr('title', ariaNgLocalizationService.getLocalizedText('Restore Down'));
        };

        var autoCheckUpdates = function () {
            ariaNgVersionService.getTheLatestVersion()
                .then(function onSuccess(response) {
                    ariaNgLogService.debug('[root.autoCheckUpdates] latest version info', response);

                    if (!response || !response.data || !response.data.tag_name) {
                        return;
                    }

                    var latestVersion = response.data.tag_name;

                    if (ariaNgVersionService.compareVersion(ariaNgVersionService.getBuildVersionNumber(), latestVersion) < 0) {
                        if (ariaNgSettingService.getBrowserNotification()) {
                            ariaNgNotificationService.notifyViaBrowser('AriaNg Native Updates', 'A new version has been released', {
                                contentParams: {
                                    version: latestVersion
                                }
                            });
                        } else {
                            ariaNgNotificationService.notifyInPage('', 'A new version has been released', {
                                delay: false,
                                type: 'info',
                                contentParams: {
                                    version: latestVersion
                                }
                            });
                        }
                    }
                }).catch(function onError(response) {
                    ariaNgLogService.error('[root.autoCheckUpdates] failed to get latest version', response);
                });
        };

        var playSoundAfterDownloadFinished = function () {
            if (!ariaNgSettingService.getPlaySoundAfterDownloadFinished()) {
                return;
            }

            if ($rootScope.soundContext.isPlaying()) {
                ariaNgLogService.debug('[root.playSoundAfterDownloadFinished] background audio is already playing');
                return;
            }

            $rootScope.soundContext.playSound(ariaNgSettingService.getPlaySoundAfterDownloadFinished(), true);
        };

        $rootScope.currentTheme = 'light';

        $rootScope.searchContext = {
            text: '',
            setSearchBoxFocused: function () {
                angular.element('#search-box').focus();
            }
        };

        $rootScope.taskContext = {
            rpcStatus: 'Connecting',
            list: [],
            selected: {},
            enableSelectAll: false,
            getSelectedTaskIds: function () {
                var result = [];

                if (!this.list || !this.selected || this.list.length < 1) {
                    return result;
                }

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (this.selected[task.gid]) {
                        result.push(task.gid);
                    }
                }

                return result;
            },
            getSelectedTasks: function () {
                var result = [];

                if (!this.list || !this.selected || this.list.length < 1) {
                    return result;
                }

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (this.selected[task.gid]) {
                        result.push(task);
                    }
                }

                return result;
            },
            isAllSelected: function () {
                var isAllSelected = true;

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if (!this.selected[task.gid]) {
                        isAllSelected = false;
                        break;
                    }
                }

                return isAllSelected;
            },
            hasRetryableTask: function () {
                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if ($rootScope.isTaskRetryable(task)) {
                        return true;
                    }
                }

                return false;
            },
            hasCompletedTask: function () {
                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if (task.status === 'complete') {
                        return true;
                    }
                }

                return false;
            },
            selectAll: function () {
                if (!this.list || !this.selected || this.list.length < 1) {
                    return;
                }

                if (!this.enableSelectAll) {
                    return;
                }

                var isAllSelected = this.isAllSelected();

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    this.selected[task.gid] = !isAllSelected;
                }
            },
            selectAllFailed: function () {
                if (!this.list || !this.selected || this.list.length < 1) {
                    return;
                }

                if (!this.enableSelectAll) {
                    return;
                }

                var isAllFailedSelected = true;

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if (!$rootScope.isTaskRetryable(task)) {
                        continue;
                    }

                    if (!this.selected[task.gid]) {
                        isAllFailedSelected = false;
                    }
                }

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if (!$rootScope.isTaskRetryable(task)) {
                        this.selected[task.gid] = false;
                        continue;
                    }

                    this.selected[task.gid] = !isAllFailedSelected;
                }
            },
            selectAllCompleted: function () {
                if (!this.list || !this.selected || this.list.length < 1) {
                    return;
                }

                if (!this.enableSelectAll) {
                    return;
                }

                var isAllFailedSelected = true;

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if (task.status !== 'complete') {
                        continue;
                    }

                    if (!this.selected[task.gid]) {
                        isAllFailedSelected = false;
                    }
                }

                for (var i = 0; i < this.list.length; i++) {
                    var task = this.list[i];

                    if (!$rootScope.filterTask(task)) {
                        continue;
                    }

                    if (task.status !== 'complete') {
                        this.selected[task.gid] = false;
                        continue;
                    }

                    this.selected[task.gid] = !isAllFailedSelected;
                }
            }
        };

        $rootScope.soundContext = {
            currentSoundFile: '',
            loadSoundFile: function (filePath, callback, silent) {
                var player = angular.element('#background-audio')[0];

                if (filePath) {
                    ariaNgNativeElectronService.getLocalFSFileBufferAsync(filePath, function (buffer) {
                        if (buffer) {
                            var soundExtension = ariaNgCommonService.getFileExtension(filePath);
                            var mimeType = ariaNgSupportedAudioFileTypes[soundExtension];
                            var blob = new Blob([buffer], { type: mimeType });
                            player.src = URL.createObjectURL(blob);
                            $rootScope.soundContext.currentSoundFile = filePath;
                            ariaNgLogService.debug('[root.soundContext.loadSoundFile] background audio is set to ' + filePath);

                            if (angular.isFunction(callback)) {
                                callback(filePath);
                            }
                        } else {
                            player.src = '';
                            $rootScope.soundContext.currentSoundFile = '';
                            ariaNgLogService.warn('[root.soundContext.loadSoundFile] background audio is set to empty due to the file buffer is null');

                            if (!silent) {
                                ariaNgCommonService.showError('Sound file not exists.');
                            }
                        }
                    });
                } else {
                    player.src = '';
                    $rootScope.soundContext.currentSoundFile = '';
                    ariaNgLogService.debug('[root.soundContext.loadSoundFile] background audio is set to empty');
                }
            },
            isPlaying: function () {
                var player = angular.element('#background-audio')[0];

                return !player.paused;
            },
            playSound: function (filePath, silent) {
                if (!filePath) {
                    return;
                }

                var player = angular.element('#background-audio')[0];

                player.pause();
                player.volume = 1.0;

                if (this.currentSoundFile !== filePath) {
                    this.loadSoundFile(filePath, function () {
                        player.currentTime = 0;
                        player.play().catch(function (error) {
                            ariaNgLogService.error('[root.soundContext.playSound] cannot play sound, because ' + error);

                            if (!silent) {
                                ariaNgCommonService.showError('Cannot play this sound file.');
                            }
                        });
                    }, !!silent);
                } else {
                    player.currentTime = 0;
                    player.play().catch(function (error) {
                        ariaNgLogService.error('[root.soundContext.playSound] cannot play sound, because ' + error);

                        if (!silent) {
                            ariaNgCommonService.showError('Cannot play this sound file.');
                        }
                    });
                }
            },
            stopPlayingSound: function () {
                var player = angular.element('#background-audio')[0];

                player.pause();
                player.currentTime = 0;
            }
        };

        $rootScope.filterTask = function (task) {
            if (!task || !angular.isString(task.taskName)) {
                return false;
            }

            if (!$rootScope.searchContext || !$rootScope.searchContext.text) {
                return true;
            }

            return (task.taskName.toLowerCase().indexOf($rootScope.searchContext.text.toLowerCase()) >= 0);
        };

        $rootScope.isTaskRetryable = function (task) {
            return task && task.status === 'error' && task.errorDescription && !task.bittorrent;
        };

        $rootScope.keydownActions = {
            find: function (event) {
                if (event.preventDefault) {
                    event.preventDefault();
                }

                $rootScope.searchContext.setSearchBoxFocused();

                return false;
            }
        };

        $rootScope.swipeActions = {
            leftSwipe: function () {
                if (!ariaNgSettingService.getSwipeGesture()) {
                    return;
                }

                if (isSidebarShowInSmallScreen()) {
                    hideSidebar();
                    return;
                }

                if (!this.extendLeftSwipe ||
                    (angular.isFunction(this.extendLeftSwipe) && !this.extendLeftSwipe())) {
                    hideSidebar();
                }
            },
            rightSwipe: function () {
                if (!ariaNgSettingService.getSwipeGesture()) {
                    return;
                }

                if (!this.extendRightSwipe ||
                    (angular.isFunction(this.extendRightSwipe) && !this.extendRightSwipe())) {
                    showSidebar();
                }
            }
        };

        $rootScope.refreshPage = function () {
            $window.location.reload();
        };

        $rootScope.setAutoRefreshAfterPageLoad = function () {
            autoRefreshAfterPageLoad = true;
        };

        $rootScope.setTheme = function (theme) {
            if (theme === 'system') {
                ariaNgNativeElectronService.setNativeTheme('system');
                setThemeBySystemSettings();
            } else if (theme === 'dark') {
                ariaNgNativeElectronService.setNativeTheme('dark');
                setDarkTheme();
            } else {
                ariaNgNativeElectronService.setNativeTheme('light');
                setLightTheme();
            }
        };

        $rootScope.useCustomAppTitle = ariaNgNativeElectronService.useCustomAppTitle();

        ariaNgNativeElectronService.getWindowMaximizedAsync(function (maximized) {
            if (maximized) {
                toggleRestoreButton();
            } else {
                toggleMaximizeButton();
            }
        });

        $window.addEventListener('contextmenu', function (event) {
            event.preventDefault();
            event.stopPropagation();

            var context = {};

            if (angular.isFunction($window.getSelection)) {
                var selection = $window.getSelection().toString();
                context.selected = !!selection && selection.length > 0;
            }

            if (angular.element(event.target).attr('readonly') === 'readonly') {
                context.editable = false;
            }

            if (angular.element(event.target).attr('data-support-force-delete-empty') === 'true'
                && angular.element(event.target).val() === '') {
                context.forceDeleteEmpty = true;
            }

            if (event.target.nodeName.match(/^(input|textarea)$/i) || event.target.isContentEditable) {
                ariaNgNativeElectronService.showTextboxContextMenu(context);
            }
        });

        $window.addEventListener('keydown', function (event) {
            if (!ariaNgSettingService.getKeyboardShortcuts()) {
                return;
            }

            var isTextboxOrTextareaFocus = isAnyTextboxOrTextareaFocus();

            if (ariaNgKeyboardService.isCtrlAPressed(event) && !isTextboxOrTextareaFocus) {
                if (angular.isFunction($rootScope.keydownActions.selectAll)) {
                    return $rootScope.keydownActions.selectAll(event);
                }
            } else if (ariaNgKeyboardService.isCtrlFPressed(event)) {
                if (angular.isFunction($rootScope.keydownActions.find)) {
                    return $rootScope.keydownActions.find(event);
                }
            } else if (ariaNgKeyboardService.isDeletePressed(event) && !isTextboxOrTextareaFocus) {
                if (angular.isFunction($rootScope.keydownActions.delete)) {
                    return $rootScope.keydownActions.delete(event);
                }
            } else if (ariaNgKeyboardService.isCtrlNPressed(event)) {
                $rootScope.$apply(function () {
                    $location.path('/new');
                });
            }
        }, true);

        ariaNgNativeElectronService.onMainWindowMaximize(function () {
            toggleRestoreButton();
        });

        ariaNgNativeElectronService.onMainWindowUnmaximize(function () {
            toggleMaximizeButton();
        });

        ariaNgNativeElectronService.onMainProcessNavigateTo(function (event, routeUrl) {
            angular.element('.modal.in:visible').modal('hide');
            angular.element('.modal-backdrop').remove();
            $rootScope.$apply(function () {
                $location.path(routeUrl);
            });
        });

        ariaNgNativeElectronService.onMainProcessShowError(function (event, message) {
            ariaNgCommonService.showError(message);
        });

        ariaNgNativeElectronService.onMainProcessChangeDevMode(function (event, devMode) {
            $rootScope.$apply(function () {
                ariaNgSettingService.setDebugMode(devMode);
            });
        });

        ariaNgSettingService.setDebugMode(ariaNgNativeElectronService.isDevMode());

        ariaNgSettingService.onFirstAccess(function () {
            ariaNgNotificationService.notifyInPage('', 'Tap to configure and get started with AriaNg.', {
                delay: false,
                onClose: function () {
                    $location.path('/settings/ariang');
                }
            });
        });

        aria2TaskService.onFirstSuccess(function (event) {
            ariaNgNotificationService.notifyInPage('', 'is connected', {
                type: 'success',
                contentPrefix: event.rpcName + ' '
            });
        });

        aria2TaskService.onConnectionSuccess(function () {
            $timeout(function () {
                if ($rootScope.taskContext.rpcStatus !== 'Connected') {
                    $rootScope.taskContext.rpcStatus = 'Connected';
                }
            });
        });

        aria2TaskService.onConnectionFailed(function () {
            $timeout(function () {
                if ($rootScope.taskContext.rpcStatus !== 'Disconnected') {
                    $rootScope.taskContext.rpcStatus = 'Disconnected';
                }
            });
        });

        aria2TaskService.onConnectionReconnecting(function () {
            $timeout(function () {
                if ($rootScope.taskContext.rpcStatus !== 'Reconnecting') {
                    $rootScope.taskContext.rpcStatus = 'Reconnecting';
                }
            });
        });

        aria2TaskService.onConnectionWaitingToReconnect(function () {
            $timeout(function () {
                if ($rootScope.taskContext.rpcStatus !== 'Waiting to reconnect') {
                    $rootScope.taskContext.rpcStatus = 'Waiting to reconnect';
                }
            });
        });

        aria2TaskService.onTaskCompleted(function (event) {
            playSoundAfterDownloadFinished(event.task);
            ariaNgNotificationService.notifyTaskComplete(event.task);
        });

        aria2TaskService.onBtTaskCompleted(function (event) {
            playSoundAfterDownloadFinished(event.task);
            ariaNgNotificationService.notifyBtTaskComplete(event.task);
        });

        aria2TaskService.onTaskErrorOccur(function (event) {
            playSoundAfterDownloadFinished(event.task);
            ariaNgNotificationService.notifyTaskError(event.task);
        });

        $rootScope.$on('$locationChangeStart', function (event) {
            ariaNgCommonService.closeAllDialogs();

            $rootScope.loadPromise = null;

            delete $rootScope.keydownActions.selectAll;
            delete $rootScope.keydownActions.delete;
            delete $rootScope.swipeActions.extendLeftSwipe;
            delete $rootScope.swipeActions.extendRightSwipe;

            if (angular.isArray($rootScope.taskContext.list) && $rootScope.taskContext.list.length > 0) {
                $rootScope.taskContext.list.length = 0;
            }

            if (angular.isObject($rootScope.taskContext.selected)) {
                $rootScope.taskContext.selected = {};
            }

            $rootScope.taskContext.enableSelectAll = false;
        });

        $rootScope.$on('$routeChangeStart', function (event, next, current) {
            var location = $location.path();

            setNavbarSelected(location);
            $document.unbind('keypress');
        });

        $rootScope.$on('$viewContentLoaded', function () {
            ariaNgNativeElectronService.notifyMainProcessViewLoaded($location.path());
        });

        $rootScope.$on('$translateChangeSuccess', function(event, current, previous) {
            ariaNgNativeElectronService.setMainWindowLanguage();
        });

        if (ariaNgSettingService.isBrowserSupportDarkMode()) {
            var matchPreferColorScheme = $window.matchMedia('(prefers-color-scheme: dark)');
            matchPreferColorScheme.addEventListener('change', function (e) {
                ariaNgLogService.info('[root] system switches to ' + (e.matches ? 'dark' : 'light') + ' theme');

                if (ariaNgSettingService.getTheme() === 'system') {
                    if (e.matches) {
                        setDarkTheme();
                    } else {
                        setLightTheme();
                    }
                }
            });
        }

        if (ariaNgSettingService.getAutoCheckUpdates() && ariaNgSettingService.getAutoCheckUpdates() !== 'never') {
            ariaNgNativeElectronService.getLastCheckUpdatesTimeAsync(function (lastCheckUpdatesTime) {
                var checkFrequency = ariaNgSettingService.getAutoCheckUpdates();
                var currentTime = parseInt(ariaNgCommonService.getCurrentUnixTime());
                var oneDaySeconds = 86400; // s
                var needCheckUpdates = false;

                if (!angular.isNumber(lastCheckUpdatesTime)) {
                    needCheckUpdates = true;
                } else if (checkFrequency === 'daily' && (currentTime - lastCheckUpdatesTime) >= oneDaySeconds) {
                    needCheckUpdates = true;
                } else if (checkFrequency === 'weekly' && (currentTime - lastCheckUpdatesTime) >= oneDaySeconds * 7) {
                    needCheckUpdates = true;
                } else if (checkFrequency === 'monthly' && (currentTime - lastCheckUpdatesTime) >= oneDaySeconds * 31) {
                    needCheckUpdates = true;
                }

                if (needCheckUpdates) {
                    ariaNgLogService.debug('[root] need check for updates, last check time is ' + lastCheckUpdatesTime);
                    autoCheckUpdates();
                    ariaNgNativeElectronService.setLastCheckUpdatesTime(currentTime);
                } else {
                    ariaNgLogService.debug('[root] do not need check for updates, last check time is ' + lastCheckUpdatesTime);
                }
            });
        }

        $rootScope.$on('$locationChangeSuccess', function (event, newUrl) {
            if (autoRefreshAfterPageLoad) {
                $window.location.reload();
            }
        });

        initTheme();
        initCheck();
        initNavbar();
        initContentWrapper();
        initFileDragSupport();
    }]);
}());
