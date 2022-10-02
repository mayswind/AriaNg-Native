'use strict';

const url = require('url');
const path = require('path');

const pkgfile = require('../../package');

let getIndexUrl = function () {
    return url.format({
        protocol: 'file',
        slashes: true,
        pathname: path.join(__dirname, '../../', pkgfile.entry)
    });
};

let getPageFullUrl = function (location) {
    if (!location) {
        return getIndexUrl();
    }

    return getIndexUrl() + '#!' + location;
};

module.exports = {
    getPageFullUrl: getPageFullUrl
}
