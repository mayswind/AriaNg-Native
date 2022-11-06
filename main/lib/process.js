const child_process = require('child_process');

let execCommandAsync = function (options) {
    if (!options || !options.command || !options.command.trim()) {
        return;
    }

    let finalArguments = [];

    if (options.args) {
        const argsArr = options.args.split('\n');
        for (let i = 0; i < argsArr.length; i++) {
            let arg = argsArr[i];

            if (!arg) {
                continue;
            }

            arg = arg.replace('\r', '').trim();

            if (arg) {
                finalArguments.push(arg);
            }
        }
    }

    try {
        const child = child_process.spawn(options.command, finalArguments, {
            encoding: 'utf8',
            detached: !!options.detached
        });

        if (options.onoutput) {
            child.stdout.on('data', (data) => {
                options.onoutput({
                    source: 'stdout',
                    content: data.toString(),
                    count: 1
                });
            });
        }

        if (options.onoutput) {
            child.stderr.on('data', (data) => {
                options.onoutput({
                    source: 'stderr',
                    content: data.toString(),
                    count: 1
                });
            });
        }

        if (options.onoutput) {
            child.on('close', (code) => {
                options.onoutput({
                    source: 'close',
                    content: code,
                    count: 1
                });
            });
        }

        child.on('error', (error) => {
            if (options.onerror) {
                options.onerror({
                    type: 'event',
                    error: error
                });
            }
        });
    } catch (ex) {
        if (options.onerror) {
            options.onerror({
                type: 'exception',
                error: ex
            });
        }
    }
};

module.exports = {
    execCommandAsync: execCommandAsync
}
