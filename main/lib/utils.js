'use strict';

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

module.exports = {
    isObject: isObject,
    isArray: isArray,
    copyObjectTo: copyObjectTo
}
