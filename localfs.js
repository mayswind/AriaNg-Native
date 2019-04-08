'use strict';

const fs = require('fs');
const path = require('path');

let getFullPath = function (dir, fileName) {
    return path.join(dir, fileName);
};

let isExists = function (fullPath) {
    return fs.existsSync(fullPath);
};

module.exports = {
    getFullPath: getFullPath,
    isExists: isExists
};
