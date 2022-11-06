'use strict';

const electron = require('electron');

const localfs = require('../lib/localfs');

let showNotification = function (title, body, silent) {
    const notification = new electron.Notification({
        title: title,
        body: body,
        icon: localfs.getPackageIconPath('AriaNg.ico'),
        silent: !!silent
    });

    notification.show();
};

module.exports = {
    showNotification: showNotification
};
