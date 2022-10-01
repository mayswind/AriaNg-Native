const fs = require('fs-extra');
const path = require('path');
const yargs = require('yargs')(process.argv.slice(2));
const argv = yargs
    .usage('Usage: $0 -d <dist>')
    .help('help')
    .alias('version', 'v')
    .option('help', {
        alias: 'h'
    })
    .option('dist', {
        alias: 'd',
        type: 'string',
        requiresArg: true,
        describe: 'The directory where dependencies would be copies to.',
    })
    .option('dryrun', {
        type: 'boolean',
        describe: 'Find the dependencies and log to the screen only.',
    })
    .option('verbose', {
        alias: 'V',
        type: 'boolean',
        describe: 'Enable verbose log.',
    })
    .argv;

const pkgfile = require('./package');

function getDependencies(filePath) {
    let allDependencies = [];
    let cssDependencies = [];
    let jsDependencies = [];
    let fontDependencies = [];

    let fileDir = path.dirname(filePath);
    let fileContent = fs.readFileSync(filePath, 'utf8');
    let cssPattern = /<link rel="stylesheet" href="(\.\.\/node_modules\/.*\.css)"\/?>/g;
    let jsPattern = /<script src="(\.\.\/node_modules\/.*\.js)"><\/script>/g;
    let fontPattern = /url\('(\.\.\/fonts\/[a-zA-Z0-9\-]+\.[a-zA-z0-9]+)(\?[a-zA-Z0-9\-_=.#]+)?'\)/g;

    for (let match; (match = cssPattern.exec(fileContent)) !== null;) {
        let dependencyPath = path.join(fileDir, match[1]);

        if (argv.verbose) {
            console.log('find css dependency ' + dependencyPath);
        }

        cssDependencies.push(dependencyPath);
    }

    for (let i = 0; i < cssDependencies.length; i++) {
        let cssFilePath = cssDependencies[i];
        let cssFileDir = path.dirname(cssFilePath);
        let cssFileContent = fs.readFileSync(cssFilePath, 'utf8');

        for (let match; (match = fontPattern.exec(cssFileContent)) !== null;) {
            let dependencyPath = path.join(cssFileDir, match[1]);

            if (argv.verbose) {
                console.log('find font dependency (' + cssFilePath + ') ' + dependencyPath);
            }

            fontDependencies.push(dependencyPath);
        }
    }

    for (let match; (match = jsPattern.exec(fileContent)) !== null;) {
        let dependencyPath = path.join(fileDir, match[1]);

        if (argv.verbose) {
            console.log('find js dependency ' + dependencyPath);
        }

        jsDependencies.push(dependencyPath);
    }

    allDependencies.push(...cssDependencies);
    allDependencies.push(...fontDependencies);
    allDependencies.push(...jsDependencies);

    return allDependencies;
}

function copyDependencies(dependencies, dist) {
    for (let i = 0; i < dependencies.length; i++) {
        let filePath = dependencies[i];
        let srcFilePath = path.join(__dirname, filePath);
        let distFilePath = path.join(__dirname, dist, filePath);
        let distDir = path.dirname(distFilePath);

        if (!fs.existsSync(distDir)) {
            fs.mkdirpSync(distDir);
        }

        fs.copyFileSync(srcFilePath, distFilePath);
    }
}

if (!argv.dist || argv.help) {
    yargs.showHelp();
} else {
    let dependencies = getDependencies(pkgfile.entry);

    if (!argv.dryrun) {
        copyDependencies(dependencies, argv.dist);
    }
}
