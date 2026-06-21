'use strict';

const path = require('path');
const electron = require('electron');

const core = require('../core');
const config = require('../config/config');

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

const WINDOW_WIDTH = 100;
const WINDOW_HEIGHT = 50;
const DEFAULT_EDGE_MARGIN = 10;
const SNAP_THRESHOLD = 15; // pixels to snap to edge

let instance = null;
let dragInitialPos = null;

// Check whether a saved point lies inside any currently connected display.
// Multi-monitor layouts can legitimately produce negative coordinates, so we
// can't rely on `>= 0` as a validity check.
let isPositionVisible = function (x, y) {
    if (typeof x !== 'number' || typeof y !== 'number') {
        return false;
    }

    let displays = electron.screen.getAllDisplays();

    for (let i = 0; i < displays.length; i++) {
        let b = displays[i].bounds;

        if (x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height) {
            return true;
        }
    }

    return false;
};

let getDefaultPosition = function () {
    let display = electron.screen.getPrimaryDisplay();
    let workArea = display.workArea;

    return {
        x: workArea.x + workArea.width - WINDOW_WIDTH - DEFAULT_EDGE_MARGIN,
        y: workArea.y + workArea.height - WINDOW_HEIGHT - DEFAULT_EDGE_MARGIN
    };
};

let createWindow = function () {
    if (instance) {
        return;
    }

    instance = new BrowserWindow({
        width: WINDOW_WIDTH,
        height: WINDOW_HEIGHT,
        minWidth: 80,
        minHeight: 40,
        maxWidth: 200,
        maxHeight: 100,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: true,
        hasShadow: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            spellcheck: false
        }
    });

    instance.setOpacity(config.infoboxOpacity);
    instance.setVisibleOnAllWorkspaces(true);
    instance.setAlwaysOnTop(true, 'screen-saver');

    // Restore last position only if it's still visible on a connected display;
    // otherwise fall back to the bottom-right corner of the primary display.
    if (isPositionVisible(config.infoboxX, config.infoboxY)) {
        instance.setPosition(config.infoboxX, config.infoboxY);
    } else {
        let pos = getDefaultPosition();
        instance.setPosition(pos.x, pos.y);
    }

    instance.loadFile(path.join(__dirname, '..', '..', 'app', 'views', 'infobox.html'));

    instance.on('closed', () => {
        instance = null;
        dragInitialPos = null;
    });

    // Prevent closing, only hide. destroy() bypasses this by removing the listener.
    instance.on('close', (event) => {
        if (!core.isConfirmExit) {
            event.preventDefault();
            instance.hide();
        }
    });
};

let show = function () {
    if (!instance) {
        createWindow();
    }

    if (instance) {
        instance.show();
        instance.setOpacity(config.infoboxOpacity);
    }
};

let hide = function () {
    if (instance) {
        instance.hide();
    }
};

let destroy = function () {
    if (instance) {
        // Capture and null first — guards against the 'closed' handler firing
        // after a re-create races in and overwriting the new instance.
        let oldInstance = instance;
        instance = null;
        dragInitialPos = null;

        oldInstance.removeAllListeners('close');
        oldInstance.removeAllListeners('closed');
        // destroy() is synchronous; avoid close() which goes through preventDefault path.
        oldInstance.destroy();
    }
};

let isVisible = function () {
    return instance && instance.isVisible();
};

let setOpacity = function (value) {
    if (instance) {
        instance.setOpacity(value);
    }
};

let sendStat = function (data) {
    if (instance && !instance.isDestroyed()) {
        instance.webContents.send('on-infobox-stat-update', data);
    }
};

// IPC: main window controls infobox visibility and data
ipcMain.on('render-set-infobox-enabled', (event, value) => {
    config.infoboxEnabled = !!value;
    config.save('infoboxEnabled');

    if (config.infoboxEnabled) {
        show();
    } else {
        hide();
    }
});

ipcMain.on('render-set-infobox-opacity', (event, value) => {
    let opacity = parseFloat(value);

    if (isNaN(opacity) || opacity < 0.1) {
        opacity = 0.1;
    } else if (opacity > 1.0) {
        opacity = 1.0;
    }

    config.infoboxOpacity = opacity;
    config.save('infoboxOpacity');
    setOpacity(opacity);
});

ipcMain.on('render-sync-get-infobox-config', (event) => {
    event.returnValue = {
        enabled: config.infoboxEnabled,
        opacity: config.infoboxOpacity
    };
});

// Forward stat data from main window to infobox window
ipcMain.on('render-send-infobox-stat', (event, data) => {
    sendStat(data);
});

// Infobox window requests to show main window
ipcMain.on('infobox-show-main-window', () => {
    if (core.mainWindow && !core.mainWindow.isDestroyed()) {
        if (core.mainWindow.isMinimized()) {
            core.mainWindow.restore();
        } else if (!core.mainWindow.isVisible()) {
            core.mainWindow.show();
        }
        core.mainWindow.focus();
    }
});

let clampAndSnap = function (win) {
    let display = electron.screen.getDisplayNearestPoint({
        x: dragInitialPos[0],
        y: dragInitialPos[1]
    });
    let workArea = display.workArea;
    let bounds = win.getBounds();
    let newX = dragInitialPos[0];
    let newY = dragInitialPos[1];

    // Clamp within work area
    if (newX < workArea.x) {
        newX = workArea.x;
    }
    if (newY < workArea.y) {
        newY = workArea.y;
    }
    if (newX + bounds.width > workArea.x + workArea.width) {
        newX = workArea.x + workArea.width - bounds.width;
    }
    if (newY + bounds.height > workArea.y + workArea.height) {
        newY = workArea.y + workArea.height - bounds.height;
    }

    // Snap to left edge
    if (newX - workArea.x <= SNAP_THRESHOLD) {
        newX = workArea.x;
    }
    // Snap to right edge
    if ((workArea.x + workArea.width) - (newX + bounds.width) <= SNAP_THRESHOLD) {
        newX = workArea.x + workArea.width - bounds.width;
    }
    // Snap to top edge
    if (newY - workArea.y <= SNAP_THRESHOLD) {
        newY = workArea.y;
    }
    // Snap to bottom edge
    if ((workArea.y + workArea.height) - (newY + bounds.height) <= SNAP_THRESHOLD) {
        newY = workArea.y + workArea.height - bounds.height;
    }

    dragInitialPos[0] = newX;
    dragInitialPos[1] = newY;
    win.setPosition(newX, newY);
};

ipcMain.on('infobox-drag-start', () => {
    if (instance) {
        dragInitialPos = instance.getPosition();
    }
});

ipcMain.on('infobox-drag-move', (event, arg) => {
    if (instance && dragInitialPos) {
        dragInitialPos[0] += arg.dx;
        dragInitialPos[1] += arg.dy;
        clampAndSnap(instance);
    }
});

ipcMain.on('infobox-drag-end', () => {
    if (instance && dragInitialPos) {
        let pos = instance.getPosition();
        config.infoboxX = pos[0];
        config.infoboxY = pos[1];
        config.save('infoboxX');
        config.save('infoboxY');
    }
    dragInitialPos = null;
});

module.exports = {
    init: function () {
        if (config.infoboxEnabled) {
            show();
        }
    },
    show: show,
    hide: hide,
    destroy: destroy,
    isVisible: isVisible,
    setOpacity: setOpacity,
    sendStat: sendStat
};
