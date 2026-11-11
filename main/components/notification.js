'use strict';

const os = require('os');
const electron = require('electron');

const localfs = require('../lib/localfs');

let showNotification = function (title, body, silent) {
    const notification = new electron.Notification({
        title: title,
        body: body,
        icon: localfs.getPackageIconPath(os.platform() === 'linux' ? 'linux/512x512.png' : 'AriaNg.ico'),
        silent: !!silent
    });

    notification.show();
};

module.exports = {
    showNotification: showNotification
};
