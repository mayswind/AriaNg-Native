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
        describe: 'Enable Debug Mode',
    })
    .option('classic', {
        alias: 'c',
        type: 'boolean',
        describe: 'Use classic window title bar (for Windows only)',
    })
    .option('minimal', {
        alias: 'm',
        type: 'boolean',
        describe: 'Hide the main window at startup',
    })
    .command({
        command: '$0 [file]',
        aliases: ['new'],
        desc: 'Create new download task from exist torrent/metalink file'
    })
    .argv;

function parseArguments(argv) {
    if (!argv || argv.length < 2) {
        return undefined;
    }

    const actualArgv = [];

    for (let i = 1; i < argv.length; i++) {
        if (argv[i][0] !== '-' || argv[i] === '-d' || argv[i] === '--development') {
            actualArgv.push(argv[i]);
        }
    }

    try {
        return yargs(actualArgv)
            .command({
                command: '$0 [file] [options]'
            })
            .option('development', {
                alias: 'd',
                type: 'boolean'
            })
            .argv;
    } catch (ex) {
        return undefined;
    }
}

module.exports = {
    argv: argv,
    parseArguments: parseArguments
};
