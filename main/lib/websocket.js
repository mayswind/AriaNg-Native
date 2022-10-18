'use strict';

const WebSocket = require('ws');

const ipcRender = require('../ipc/render-proecss');

let wsClient = null;
let sendQueue = [];
let pendingReconnect = null;

let fireSendQueue = function () {
    while (sendQueue.length && wsClient && wsClient.readyState === WebSocket.OPEN) {
        const request = sendQueue.shift();

        wsClient.send(request.data);
        request.deferred.resolve();
    }
};

let clearSendQueue = function () {
    for (let i = sendQueue.length - 1; i >= 0; i--) {
        sendQueue[i].deferred.reject();
        sendQueue.splice(i, 1);
    }
};

let planToReconnect = function (rpcUrl, options) {
    if (pendingReconnect) {
        ipcRender.notifyRenderProcessLogWarn('[lib/websocket.planToReconnect] another reconnection is pending');
        return;
    }

    pendingReconnect = setTimeout(function () {
        if (wsClient == null) {
            ipcRender.notifyRenderProcessLogWarn('[lib/websocket.planToReconnect] websocket is null');
            pendingReconnect = null;
            return;
        }

        if (wsClient.readyState === WebSocket.CONNECTING || wsClient.readyState === WebSocket.OPEN) {
            ipcRender.notifyRenderProcessLogWarn('[lib/websocket.planToReconnect] websocket current state is already ' + wsClient.readyState);
            pendingReconnect = null;
            return;
        }

        reconnect(rpcUrl, options);
        pendingReconnect = null;
    }, options.reconnectInterval);

    ipcRender.notifyRenderProcessLogDebug('[lib/websocket.planToReconnect] next reconnection is pending in ' + options.reconnectInterval + "ms");
};

let init = function () {
    if (sendQueue.length) {
        clearSendQueue();
    }

    if (wsClient) {
        wsClient.onopen = null;
        wsClient.onclose = null;
        wsClient.onmessage = null;
        wsClient.onerror = null;
        wsClient.terminate();
        wsClient = null;
    }
};

let connect = function (rpcUrl, options, onOpenCallback, onCloseCallback, onMessageCallback) {
    init();

    wsClient = new WebSocket(rpcUrl);

    wsClient.onopen = function () {
        onOpenCallback({
            client: wsClient,
            url: rpcUrl
        });
        fireSendQueue();
    };

    wsClient.onclose = function () {
        let autoReconnect = false;

        if (options.reconnectInterval > 0) {
            autoReconnect = true;
            planToReconnect(rpcUrl, options);
        }

        onCloseCallback({
            client: wsClient,
            url: rpcUrl,
            autoReconnect: autoReconnect
        });
    };

    wsClient.onmessage = function (event) {
        let message = null;

        if (event) {
            message = event.data;
        }

        onMessageCallback({
            client: wsClient,
            url: rpcUrl,
            success: true,
            message: message
        });
    };

    wsClient.onerror = function (event) {
        // Do Nothing
    };
};

let reconnect = function (rpcUrl, options) {
    if (!wsClient) {
        return;
    }

    const onOpenFn = wsClient.onopen;
    const onCloseFn = wsClient.onclose;
    const onMessageFn = wsClient.onmessage;
    const onErrorFn = wsClient.onerror;

    init();

    wsClient = new WebSocket(rpcUrl);
    wsClient.onopen = onOpenFn;
    wsClient.onclose = onCloseFn;
    wsClient.onmessage = onMessageFn;
    wsClient.onerror = onErrorFn;
};

let send = function (requestContext) {
    const deferred = {};
    deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve
        deferred.reject = reject
    });

    sendQueue.push({
        url: requestContext.url,
        data: requestContext.data,
        deferred: deferred
    });

    if (wsClient && wsClient.readyState === WebSocket.OPEN) {
        fireSendQueue();
    }

    return deferred.promise;
};

let getReadyState = function () {
    if (!wsClient) {
        return null;
    }

    return wsClient.readyState;
};

module.exports = {
    init: init,
    connect: connect,
    reconnect: reconnect,
    send: send,
    getReadyState: getReadyState
};
