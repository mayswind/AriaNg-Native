'use strict';

const pkgfile = require('../package');

const core = {
    appid: pkgfile.appId,
    version: pkgfile.version,
    ariaNgVersion: pkgfile['ariang-version'],
    mainWindow: null,
    isDevMode: false,
    useCustomAppTitle: false,
    startupCommandOutput: [],
    isConfirmExit: false
};

module.exports = core;
