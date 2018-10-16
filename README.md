# AriaNg Native
[![License](https://img.shields.io/github/license/mayswind/AriaNg-Native.svg?style=flat)](https://github.com/mayswind/AriaNg-Native/blob/master/LICENSE)
[![Lastest Release](https://img.shields.io/github/release/mayswind/AriaNg-Native.svg?style=flat)](https://github.com/mayswind/AriaNg-Native/releases)

## Introduction
AriaNg Native is a native app of [AriaNg](https://github.com/mayswind/AriaNg), you can run it on Windows or macOS without any browser.

## Introduction of AriaNg
Please visit [https://github.com/mayswind/AriaNg](https://github.com/mayswind/AriaNg) for more information.

## Installation
#### Prebuilt release
Latest Release: [https://github.com/mayswind/AriaNg-Native/releases](https://github.com/mayswind/AriaNg-Native/releases)

#### Windows 10 UWP release
Link to the store : [https://www.microsoft.com/en-us/p/aria2c-rpc/9n0bgcs7gj87#activetab=pivot:overviewtab}(https://www.microsoft.com/en-us/p/aria2c-rpc/9n0bgcs7gj87#activetab=pivot:overviewtab)
Direct link: [ms-windows-store://pdp/?ProductId=9N0BGCS7GJ87](ms-windows-store://pdp/?ProductId=9N0BGCS7GJ87)
If you want to allow this app to access localhost aria2c-rpc, run this command:

    checknetisolation.exe loopbackexempt -a -n="44050trevalim.Aria2crpc_ds8qmrpgzd7fg"


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
