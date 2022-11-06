'use strict';

const startupCommandConstants = {
    outputLogLimit: 100
};

const ariaNgPageLocations = {
    NewTask: '/new',
    AriaNgSettings: '/settings/ariang'
};

const supportedFileExtensions = {
    '.torrent': 'torrent',
    '.meta4': 'metalink',
    '.metalink': 'metalink'
};

module.exports = {
    startupCommandConstants: startupCommandConstants,
    ariaNgPageLocations: ariaNgPageLocations,
    supportedFileExtensions: supportedFileExtensions
}
