'use strict';

const os = require('os');
const yargs = require('yargs');

const argv = (function () {
    if (os.platform() === 'win32') {
        return yargs
            .usage('Usage: $0 <file> [options]')
            .option('d', {
                alias: 'development',
                type: 'boolean',
                describe: 'Enable Development Mode (press F12 to open DevTools)',
            })
            .command('$0 <file> [options]', 'Create new task from specified file')
            .help('h')
            .alias('h', 'help')
            .parse(process.argv.slice(1));
    } else if (os.platform() === 'darwin') {
        return yargs
            .usage('Usage: $0 [options]')
            .option('d', {
                alias: 'development',
                type: 'boolean',
                describe: 'Enable Development Mode (press F12 to open DevTools)',
            })
            .help('h')
            .alias('h', 'help')
            .parse(process.argv.slice(1));
    }
})();

module.exports = {
    argv: argv
};
