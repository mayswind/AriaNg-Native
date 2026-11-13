// electron-builder afterPack hook (macOS).
// Without a Developer ID identity (e.g. on CI) electron-builder 24 skips signing and leaves Electron's
// prebuilt ad-hoc signature (Identifier=Electron, Info.plist not bound, no sealed resources), so macOS
// Local Network Privacy cannot attribute connections to the app (mayswind/AriaNg-Native#151, #152).
// Must be afterPack: afterSign is not invoked when electron-builder skipped signing.
// Only runs when the release pipeline opts in (MAC_ADHOC_SIGN=true), local builds are unchanged.
const childProcess = require('child_process');
const path = require('path');

exports.default = async function (context) {
    if (context.electronPlatformName !== 'darwin' || process.env.MAC_ADHOC_SIGN !== 'true') {
        return;
    }

    const appPath = path.join(context.appOutDir, context.packager.appInfo.productFilename + '.app');
    const codesign = function (args) {
        childProcess.execFileSync('codesign', args.concat([appPath]), { stdio: 'inherit' });
    };

    // identifier is taken from CFBundleIdentifier (appId), helpers keep their own identifiers
    codesign(['--force', '--deep', '--sign', '-']);
    codesign(['--verify', '--deep', '--strict', '--verbose=2']);
};
