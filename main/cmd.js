'use strict';

const os = require('os');
const yargs = require('yargs');

const argv = yargs(process.argv.slice(1))
    .usage('Usage: $0 [file] [options]')
    .help('help')
    .alias('version', 'v')
    .option('help', {
        alias: 'h'
    })
    .option('development', {
        alias: 'd',
        type: 'boolean',
        describe: 'Enable Development Mode (press F12 to open DevTools)',
    })
    .option('classic', {
        alias: 'c',
        type: 'boolean',
        describe: 'Use classic window title bar (for Windows only)',
    })
    .command({
        command: '$0 [file]',
        aliases: ['new'],
        desc: 'Create new download task from exist torrent/metalink file'
    })
    .argv;

module.exports = {
    argv: argv
};
