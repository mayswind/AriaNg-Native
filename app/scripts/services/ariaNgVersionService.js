(function () {
    'use strict';

    angular.module('ariaNg').factory('ariaNgVersionService', ['ariaNgNativeElectronService', function (ariaNgNativeElectronService) {
        var latestApi = 'https://api.github.com/repos/mayswind/AriaNg-Native/releases/latest';

        var getTheLatestVersion = function () {
            return ariaNgNativeElectronService.requestHttp({
                url: latestApi,
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            })
        };

        var compareVersion = function (version1, version2) {
            var parts1 = version1.split('.');
            var parts2 = version2.split('.');

            for (var i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                if (parts1[i] && angular.isUndefined(parts2[i])) { // 1.1.1 > 1.1, 1.1.0 == 1.1
                    return 1; // version1 > version2
                }

                if (parts2[i] && angular.isUndefined(parts1[i])) {
                    return -1; // version1 < version2
                }

                if (parts2[i].indexOf('-') > 0 && parts1[i].indexOf('-') < 0) { // 1.1.0 > 1.1.0-beta1
                    return 1; // version1 > version2
                } else if (parts1[i].indexOf('-') > 0 && parts2[i].indexOf('-') < 0) {
                    return -1; // version1 < version2
                }

                var subParts1 = parts1[i].split('-');
                var subParts2 = parts2[i].split('-');

                var subPart0CompareResult = String.naturalCompare(subParts1[0], subParts2[0]);

                if (subPart0CompareResult > 0) { // 1.1.1 > 1.1.0
                    return 1; // version1 > version2
                } else if (subPart0CompareResult < 0) {
                    return -1; // version1 < version2
                }

                if (!angular.isUndefined(subParts1[1]) && !angular.isUndefined(subParts2[1])) {
                    var subPart1CompareResult = String.naturalCompare(subParts1[1], subParts2[1]);

                    if (subPart1CompareResult > 0) { // 1.1.0-beta2 > 1.1.0-beta1
                        return 1; // version1 > version2
                    } else if (subPart1CompareResult < 0) {
                        return -1; // version1 < version2
                    }
                }
            }

            return 0;
        };

        return {
            getBuildVersion: function () {
                return ariaNgNativeElectronService.getVersion();
            },
            getAriaNgVersion: function() {
                return ariaNgNativeElectronService.getAriaNgVersion();
            },
            getBuildCommit: function () {
                return '';
            },
            getTheLatestVersion: getTheLatestVersion,
            compareVersion: compareVersion
        };
    }]);
}());
