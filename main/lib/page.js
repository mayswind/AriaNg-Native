'use strict';

const url = require('url');
const path = require('path');

const pkgfile = require('../../package');

const routerSeparator = '#!';

let parseLocationFromFullUrl = function (fullUrl) {
    if (!fullUrl || fullUrl.indexOf(routerSeparator) < 0) {
        return '';
    }

    const separatorIndex = fullUrl.indexOf(routerSeparator);

    if (fullUrl.length <= separatorIndex + routerSeparator.length) {
        return '';
    }

    return fullUrl.substring(fullUrl.indexOf(routerSeparator) + routerSeparator.length);
};

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

    return getIndexUrl() + routerSeparator + location;
};

module.exports = {
    parseLocationFromFullUrl: parseLocationFromFullUrl,
    getPageFullUrl: getPageFullUrl
}
