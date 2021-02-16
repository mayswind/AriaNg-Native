'use strict';

const fs = require('fs');
const path = require('path');

let getFullPath = function (dir, fileName) {
    return path.join(dir, fileName);
};

let isExists = function (fullPath) {
    return fs.existsSync(fullPath);
};

let readPackageFile = function (filePath) {
    return fs.readFileSync(path.join(__dirname, '../app/', filePath), 'UTF-8');
};

module.exports = {
    getFullPath: getFullPath,
    isExists: isExists,
    readPackageFile: readPackageFile
};
