'use strict';

const startupCommandConstants = {
    outputLogLimit: 100
};

const ariaNgPageLocations = {
    NewTask: '/new',
    AriaNgSettings: '/settings/ariang'
};

const ariaNgNativeConstants = {
    appPrefix: 'AriaNg-Native',
};

const aria2Constants = {
    rpcServiceName: 'aria2'
};

const supportedFileExtensions = {
    '.torrent': 'torrent',
    '.meta4': 'metalink',
    '.metalink': 'metalink'
};

module.exports = {
    startupCommandConstants: startupCommandConstants,
    ariaNgPageLocations: ariaNgPageLocations,
    ariaNgNativeConstants: ariaNgNativeConstants,
    aria2Constants: aria2Constants,
    supportedFileExtensions: supportedFileExtensions
}
