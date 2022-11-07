'use strict';

const constants = require('../config/constants');

let isObject = function (value) {
    return value !== null && typeof value === 'object';
}

let isArray = function (value) {
    return Array.isArray(value);
}

let copyObjectTo = function (from, to) {
    if (!to) {
        return from;
    }

    for (const name in from) {
        if (!from.hasOwnProperty(name)) {
            continue;
        }

        const fromValue = from[name];
        const toValue = to[name];

        if (isObject(fromValue) || isArray(fromValue)) {
            to[name] = copyObjectTo(from[name], to[name]);
        } else {
            if (fromValue !== toValue) {
                to[name] = fromValue;
            }
        }
    }

    return to;
}

let base64Encode = function (str) {
    return new Buffer(str).toString('base64');
};

let generateUniqueId = function () {
    const sourceId = constants.ariaNgNativeConstants.appPrefix + '_' + Math.round(new Date().getTime() / 1000) + '_' + Math.random();
    const hashedId = base64Encode(sourceId);

    return hashedId;
};

module.exports = {
    isObject: isObject,
    isArray: isArray,
    copyObjectTo: copyObjectTo,
    generateUniqueId: generateUniqueId
};

