'use strict';

const os = require('os');
const yargs = require('yargs');

const argv = yargs
    .usage('Usage: $0 <file> [options]')
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
