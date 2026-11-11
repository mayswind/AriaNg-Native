# AriaNg Native
[![License](https://img.shields.io/github/license/mayswind/AriaNg-Native.svg?style=flat)](https://github.com/mayswind/AriaNg-Native/blob/master/LICENSE)
[![Lastest Build](https://img.shields.io/github/actions/workflow/status/mayswind/AriaNg-Native/build-snapshot.yml?branch=master)](https://github.com/mayswind/AriaNg-Native/actions)
[![Lastest Release](https://img.shields.io/github/release/mayswind/AriaNg-Native.svg?style=flat)](https://github.com/mayswind/AriaNg-Native/releases)

## Introduction
AriaNg Native is a desktop application built by [Electron](https://github.com/electron/electron), with all features of [AriaNg](https://github.com/mayswind/AriaNg). You can run AriaNg Native on Windows, macOS or Linux without any browser. In addition, AriaNg Native also has many features that [AriaNg](https://github.com/mayswind/AriaNg) cannot implement.

#### Extra features
1. More user-friendly interface
    * Create new task by draging-and-droping file or url
    * Show torrent file information and choose download file before creating task
    * Play sound after download finished
2. Command line arguments, supporting creating new task by opening file
3. File associations for .torrent/.metalink file
4. Magnet link protocol handling, supporting opening tasks from browser
5. Taskbar tray, supporting minimizing to tray
6. Local file system operating support
7. Executing custom command on startup
8. Checking for updates on startup

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
  --development, -d  Enable Debug Mode                                 [boolean]
  --classic, -c      Use classic window title bar (for Windows only)   [boolean]
  --minimal, -m      Hide the main window at startup                   [boolean]
```

## Installation
#### Prebuilt release
Latest Release: [https://github.com/mayswind/AriaNg-Native/releases](https://github.com/mayswind/AriaNg-Native/releases)

> **For mac with Apple silicon**  
> Before starting to install, you need to execute the following command, otherwise the system will show you the file is damaged.
> 
>     $ xattr -r -d com.apple.quarantine AriaNg_Native-macOS-arm64.dmg

> **For Linux**  
> The AppImage needs to be made executable before running it. Some distributions also require `libfuse2` to be installed to run AppImages.
> 
>     $ chmod +x AriaNg_Native-Linux-x64.AppImage

#### Desktop integration on Linux (optional)
The AppImage can be run directly without installation, but it will not appear in your application launcher, and file associations (.torrent/.metalink) and magnet link handling will not work. To integrate it into your desktop environment, you can use a tool like [Gear Lever](https://github.com/mijorus/gearlever) or [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher), or execute the following commands in the directory where you downloaded the AppImage.

    $ mkdir -p ~/Applications ~/.local/share/applications
    $ mv AriaNg_Native-*-Linux-x64.AppImage ~/Applications/AriaNg_Native.AppImage
    $ chmod +x ~/Applications/AriaNg_Native.AppImage
    $ cd ~/Applications
    $ ./AriaNg_Native.AppImage --appimage-extract 'usr/share/icons/*'
    $ ./AriaNg_Native.AppImage --appimage-extract ariang-native.desktop
    $ cp -r squashfs-root/usr/share/icons ~/.local/share/
    $ sed "s|^Exec=AppRun|Exec=$HOME/Applications/AriaNg_Native.AppImage|" squashfs-root/ariang-native.desktop > ~/.local/share/applications/ariang-native.desktop
    $ rm -r squashfs-root
    $ update-desktop-database ~/.local/share/applications

To update, replace `~/Applications/AriaNg_Native.AppImage` with the new version. To uninstall, delete `~/Applications/AriaNg_Native.AppImage`, `~/.local/share/applications/ariang-native.desktop` and `~/.local/share/icons/hicolor/*/apps/ariang-native.png`.

#### Building from source
Make sure you have [Node.js](https://nodejs.org/) and [NPM](https://www.npmjs.com/) installed. Then download the source code, and follow these steps.

    $ npm install
    
    # For Windows
    $ npm run publish:win
    
    # For macOS
    $ npm run publish:osx
    
    # For Linux
    $ npm run publish:linux

The builds will be placed in the dist directory.

## Translating

Everyone is welcome to contribute translations. All translations files are put in `/app/langs/`. You can just modify and commit a new pull request.

If you want to translate AriaNg to a new language, you can add language configuration to `/app/scripts/config/languages.js`, then copy `/i18n/en.sample.txt` to `/app/langs/` and rename it to the language code to be translated, then you can start the translation work.

## License
[MIT](https://github.com/mayswind/AriaNg-Native/blob/master/LICENSE)
