const fs = require('fs-extra');
const path = require('path');
const git = require('git-rev-sync');
const buildfile = require('./build');
const yargs = require('yargs')(process.argv.slice(2));
const argv = yargs
    .usage('Usage: $0 -f <file>')
    .help('help')
    .alias('version', 'v')
    .option('help', {
        alias: 'h'
    })
    .option('file', {
        alias: 'f',
        type: 'string',
        requiresArg: true,
        describe: 'The target file path which would be generated.',
    })
    .option('dryrun', {
        type: 'boolean',
        describe: 'Display the generated content instead of saving to target file.',
    })
    .option('verbose', {
        alias: 'V',
        type: 'boolean',
        describe: 'Enable verbose log.',
    })
    .argv;

function getBuildJson() {
    let commit = buildfile.gitCommit;

    try {
        commit = git.short();
    } catch (ex) {
        console.log('cannot get commit, because ' + ex);
    }

    return {
        gitCommit: commit
    };
}

if (!argv.file || argv.help) {
    yargs.showHelp();
} else {
    const buildJsonObj = getBuildJson();
    const buildJsonContent = JSON.stringify(buildJsonObj);

    if (argv.dryrun) {
        console.log(buildJsonContent);
    } else {
        if (!fs.existsSync(path.dirname(argv.file))) {
            fs.mkdirpSync(path.dirname(argv.file));
        }

        fs.writeFileSync(argv.file, buildJsonContent, {
            encoding: 'UTF-8'
        });
    }
}
