'use strict';

const fs = require('fs');
const path = require('path');

let localfs = (function () {
    let getFullPath = function (dir, filename) {
        return path.join(dir, filename);
    };

    let isExists = function (fullpath) {
        return fs.existsSync(fullpath);
    };

    return {
        getFullPath: getFullPath,
        isExists: isExists
    }
})();

module.exports = localfs;
