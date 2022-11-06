# AriaNg Native
[![License](https://img.shields.io/github/license/mayswind/AriaNg-Native.svg?style=flat)](https://github.com/mayswind/AriaNg-Native/blob/master/LICENSE)
[![Lastest Release](https://img.shields.io/github/release/mayswind/AriaNg-Native.svg?style=flat)](https://github.com/mayswind/AriaNg-Native/releases)

## Introduction
AriaNg Native is a desktop application built by [Electron](https://github.com/electron/electron), with all features of [AriaNg](https://github.com/mayswind/AriaNg). You can run AriaNg Native on Windows or macOS without any browser. In addition, AriaNg Native also has many features that [AriaNg](https://github.com/mayswind/AriaNg) cannot implement.

#### Extra features
1. More user-friendly interface
2. Taskbar tray, supporting minimizing to tray
3. Command line arguments, supporting creating new task by opening file
4. Local file system operating support
5. File & Url drag support
6. Show torrent file information and choose download file before creating task

## Introduction of AriaNg
Please visit [https://github.com/mayswind/AriaNg](https://github.com/mayswind/AriaNg) for more information.

## Screenshots
#### Windows
![AriaNg Native](https://raw.githubusercontent.com/mayswind/AriaNg-WebSite/master/screenshots/ariang_native_windows.png)

#### macOS
![AriaNg Native](https://raw.githubusercontent.com/mayswind/AriaNg-WebSite/master/screenshots/ariang_native_macos.png)

## Command Line

```
Usage: AriaNg Native.exe [file] [options]

Commands:
  AriaNg Native.exe new [file]  Create new download task from exist
                                torrent/metalink file                  [default]

Options:
  --version, -v      Show version number                               [boolean]
  --help, -h                                                           [boolean]
  --development, -d  Enable Development Mode (press F12 to open DevTools)
                                                                       [boolean]
  --classic, -c      Use classic window title bar (for Windows only)   [boolean]
```

## Installation
#### Prebuilt release
Latest Release: [https://github.com/mayswind/AriaNg-Native/releases](https://github.com/mayswind/AriaNg-Native/releases)

#### Building from source
Make sure you have [Node.js](https://nodejs.org/) and [NPM](https://www.npmjs.com/) installed. Then download the source code, and follow these steps.

    $ npm install
    
    # For Windows
    $ npm run publish:win
    
    # For macOS
    $ npm run publish:osx

The builds will be placed in the dist directory.

## License
[MIT](https://github.com/mayswind/AriaNg-Native/blob/master/LICENSE)
