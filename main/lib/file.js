'use strict';

const fs = require('fs');
const path = require('path');

const constants = require('../config/constants');

let isContainsSupportedFileArg = function (arg) {
    if (!arg) {
        return false;
    }

    let fileExtension = path.extname(arg);

    if (!constants.supportedFileExtensions[fileExtension]) {
        return false;
    }

    return fs.existsSync(arg);
};

module.exports = {
    isContainsSupportedFileArg: isContainsSupportedFileArg
}
