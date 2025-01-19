'use strict';

const core = require('../core');

let updateWindowTitleBar = function (backgroundColor, symbolColor) {
    if (core.useCustomAppTitle) {
        core.mainWindow.setTitleBarOverlay({
            color: backgroundColor,
            symbolColor: symbolColor,
            height: 30
        });
    }
}

module.exports = {
    updateWindowTitleBar: updateWindowTitleBar
};
