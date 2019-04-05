const argv = require('yargs')
    .usage('Usage: $0 [options]')
    .option('d', {
        alias: 'development',
        type: 'boolean',
        describe: 'Enable Development Mode (press F12 to open DevTools)',
    })
    .help('h')
    .alias('h', 'help')
    .parse(process.argv.slice(1));

let cmd = (function () {
    let getMainUrl = function () {
        return 'file://' + __dirname + '/app/index.html'
    };

    return {
        argv: argv,
        getMainUrl: getMainUrl
    }
})();

module.exports = cmd;
