const child_process = require('child_process');

let execCommandAsync = function (command, args, detached) {
    if (!command || !command.trim()) {
        return;
    }

    let finalArguments = [];

    if (args) {
        const argsArr = args.split('\n');
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
        const child = child_process.spawn(command, finalArguments, {
            encoding: 'utf8',
            detached: !!detached
        });

        child.on('error', (error) => {
            // Do Nothing
        });
    } catch (ex) {
        // Do Nothing
    }
};

module.exports = {
    execCommandAsync: execCommandAsync
}
