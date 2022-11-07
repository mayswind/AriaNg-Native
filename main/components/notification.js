'use strict';

const electron = require('electron');

const localfs = require('../lib/localfs');

const notificationMessageTemplates = {
    onDownloadComplete: {
        title: 'Download Completed',
        text: '${taskname}'
    },
    onBtDownloadComplete: {
        title: 'BT Download Completed',
        text: '${taskname}'
    },
    onDownloadError: {
        title: 'Download Error',
        text: '${taskname}'
    }
};

let setNotificationMessageTemplates = function (templates) {
    for (const eventName in notificationMessageTemplates) {
        if (!notificationMessageTemplates.hasOwnProperty(eventName)) {
            continue;
        }

        if (!templates[eventName]) {
            continue;
        }

        if (templates[eventName].title) {
            notificationMessageTemplates[eventName].title = templates[eventName].title;
        }

        if (templates[eventName].text) {
            notificationMessageTemplates[eventName].text = templates[eventName].text;
        }
    }
};

let getNotificationMessageTemplate = function (eventName) {
    return notificationMessageTemplates[eventName];
};

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
    setNotificationMessageTemplates: setNotificationMessageTemplates,
    getNotificationMessageTemplate: getNotificationMessageTemplate,
    showNotification: showNotification
};
