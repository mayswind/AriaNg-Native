'use strict';

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

function parseFilePath(argv) {
    if (!argv || argv.length < 2) {
        return undefined;
    }

    const actualArgv = [];

    for (let i = 1; i < argv.length; i++) {
        if (argv[i][0] !== '-') {
            actualArgv.push(argv[i]);
        }
    }

    const ret = yargs(actualArgv)
        .command({
            command: '$0 <file>'
        })
        .argv;

    return ret ? ret.file : undefined;
}

module.exports = {
    argv: argv,
    parseFilePath: parseFilePath
};
