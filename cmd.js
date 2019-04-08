'use strict';

const argv = require('yargs')
    .usage('Usage: $0 [file] [options]')
    .option('d', {
        alias: 'development',
        type: 'boolean',
        describe: 'Enable Development Mode (press F12 to open DevTools)',
    })
    .help('h')
    .alias('h', 'help')
    .parse(process.argv.slice(1));

module.exports = {
    argv: argv
};
