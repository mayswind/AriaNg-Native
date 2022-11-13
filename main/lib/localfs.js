'use strict';

const fs = require('fs');
const path = require('path');

let getFullPath = function (dir, fileName) {
    return path.join(dir, fileName);
};

let isExists = function (fullPath) {
    return fs.existsSync(fullPath);
};

let getPackageIconPath = function (iconName) {
    return path.join(__dirname, '../../assets/', iconName);
};

let readPackageFile = function (filePath) {
    return fs.readFileSync(path.join(__dirname, '../../app/', filePath), 'UTF-8');
};

let getLocalFSFileBuffer = function (fullpath) {
    try {
        return Buffer.from(fs.readFileSync(fullpath));
    } catch (ex) {
        return null;
    }
};

let getLocalFSFileBase64Content = function (fullpath) {
    try {
        const buffer = getLocalFSFileBuffer(fullpath);

        if (buffer) {
            return buffer.toString('base64');
        } else {
            return null;
        }
    } catch (ex) {
        return null;
    }
};

module.exports = {
    getFullPath: getFullPath,
    isExists: isExists,
    getPackageIconPath: getPackageIconPath,
    readPackageFile: readPackageFile,
    getLocalFSFileBuffer: getLocalFSFileBuffer,
    getLocalFSFileBase64Content: getLocalFSFileBase64Content
};
