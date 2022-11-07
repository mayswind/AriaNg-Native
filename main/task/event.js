'use strict';

const constants = require('../config/constants');
const config = require('../config/config');
const notification = require('../components/notification');
const ipcRender = require('../ipc/render-proecss');

const getFinalText = function (textTemplate, taskContext) {
    let finalText = textTemplate;

    finalText = finalText.replace('${taskname}', taskContext.taskName || '');

    return finalText;
};

let nativeProcessTaskEvent = function (gid, template) {
    const taskContext = {
        taskName: gid
    };

    const title = getFinalText(template.title, taskContext);
    const body = getFinalText(template.text, taskContext);

    notification.showNotification(title, body, !config.notificationSound);
};

let nativeProcessTaskMessage = function (context) {
    const message = context.message;
    let content = null;

    try {
        content = JSON.parse(message);
    } catch (ex) {
        ipcRender.notifyRenderProcessLogError('[task/event.nativeProcessTaskMessage] cannot parse message json, message=' + message, ex);
        return;
    }

    if (!content || content.id || !content.method) { // Not Event
        return;
    }

    if (!content.params || !content.params[0] || !content.params[0].gid) {
        ipcRender.notifyRenderProcessLogError('[task/event.nativeProcessTaskMessage] content params is invalid', content);
        return;
    }

    try {
        let methodName = content.method;

        if (methodName.indexOf(constants.aria2Constants.rpcServiceName) !== 0) {
            ipcRender.notifyRenderProcessLogError('[task/event.nativeProcessTaskMessage] event method name is invalid', content);
            return;
        }

        methodName = methodName.substring(constants.aria2Constants.rpcServiceName.length + 1);

        const template = notification.getNotificationMessageTemplate(methodName);

        if (template) {
            nativeProcessTaskEvent(content.params[0].gid, template);
        }
    } catch (ex) {
        ipcRender.notifyRenderProcessLogError('[task/event.nativeProcessTaskMessage] cannot process task event, message=' + message, ex);
    }
};

module.exports = {
    nativeProcessTaskMessage: nativeProcessTaskMessage
};
