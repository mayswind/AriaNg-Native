'use strict';

const pkgfile = require('../package');
const buildfile = require('../build');

const core = {
    appid: pkgfile.appId,
    version: pkgfile.version,
    ariaNgVersion: pkgfile['ariang-version'],
    buildCommit: buildfile.gitCommit,
    mainWindow: null,
    isDevMode: false,
    useCustomAppTitle: false,
    startupCommandOutput: [],
    isConfirmExit: false
};

module.exports = core;
