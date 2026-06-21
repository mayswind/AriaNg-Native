'use strict';

const Store = require('electron-store');

const userSettingsSchema = {
    lang: {
        type: 'string'
    },
    width: {
        type: 'number',
        minimum: 800
    },
    height: {
        type: 'number',
        minimum: 400
    },
    maximized: {
        type: 'boolean'
    },
    minimizedToTray: {
        type: 'boolean'
    },
    pos_x: {
        type: 'number'
    },
    pos_y: {
        type: 'number'
    },
    defaultMagnetProtocolClient: {
        type: 'boolean'
    },
    execCommandOnStartup: {
        type: 'string'
    },
    execCommandArgumentsOnStartup: {
        type: 'string'
    },
    execDetachedCommandOnStartup: {
        type: 'boolean'
    },
    lastCheckUpdatesTime: {
        type: 'number'
    },
    infoboxEnabled: {
        type: 'boolean'
    },
    infoboxOpacity: {
        type: 'number',
        minimum: 0.1,
        maximum: 1.0
    },
    infoboxX: {
        type: 'number'
    },
    infoboxY: {
        type: 'number'
    }
};

const userSettingsStore = new Store({userSettingsSchema});

// Clamp opacity to a safe range — protects against corrupted store values (schema
// validation isn't actually wired up; see B2 in code review).
let rawOpacity = userSettingsStore.get('infoboxOpacity', 0.7);
let safeOpacity = parseFloat(rawOpacity);
if (isNaN(safeOpacity) || safeOpacity < 0.1) {
    safeOpacity = 0.1;
} else if (safeOpacity > 1.0) {
    safeOpacity = 1.0;
}

let config = {
    lang: userSettingsStore.get('lang'),
    width: userSettingsStore.get('width') || 950,
    height: userSettingsStore.get('height') || 600,
    x: userSettingsStore.get('x'),
    y: userSettingsStore.get('y'),
    maximized: !!userSettingsStore.get('maximized'),
    defaultPosition: userSettingsStore.get('defaultPosition') || 'last-position',
    minimizedToTray: userSettingsStore.get('minimizedToTray', true),
    defaultMagnetProtocolClient: userSettingsStore.get('defaultMagnetProtocolClient', false),
    execCommandOnStartup: userSettingsStore.get('execCommandOnStartup'),
    execCommandArgumentsOnStartup: userSettingsStore.get('execCommandArgumentsOnStartup'),
    execDetachedCommandOnStartup: userSettingsStore.get('execDetachedCommandOnStartup', false),
    lastCheckUpdatesTime: userSettingsStore.get('lastCheckUpdatesTime') || 0,
    infoboxEnabled: userSettingsStore.get('infoboxEnabled', false),
    infoboxOpacity: safeOpacity,
    infoboxX: userSettingsStore.get('infoboxX'),
    infoboxY: userSettingsStore.get('infoboxY'),
    save: function (item) {
        if (item && this[item] !== undefined) {
            userSettingsStore.set(item, this[item]);
        }
    }
};

module.exports = config;
