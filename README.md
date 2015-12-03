# foolproxy
    
<!--
[![Build Status][ci-img]][ci-url]
[![Coverage Status][cover-img]][cover-url]
-->

[![NPM version][npm-version]][npm-url]
[![NPM downloads][npm-download]][npm-url]
[![Node version][node-version]][npm-url]

[ci-img]: https://travis-ci.org/nikogu/zhuang.svg
[ci-url]: https://travis-ci.org/nikogu/zhuang

[cover-img]: https://coveralls.io/repos/nikogu/zhuang/badge.svg?branch=master&service=github
[cover-url]: https://coveralls.io/github/nikogu/zhuang?branch=master

[npm-version]: https://img.shields.io/npm/v/foolproxy.svg?style=flat
[npm-download]: http://img.shields.io/npm/dm/foolproxy.svg?style=flat
[npm-url]: https://npmjs.org/package/foolproxy

[node-version]: https://img.shields.io/badge/node.js-%3E=_2.3.3-green.svg?style=flat   
    
The most simple http & https proxy for mac.
    
---
    
## Install

```bash
$ npm install foolproxy -g
```
    
## Usage
    
```bash
// remote url to local url
$ sudo foolproxy <remoteUrl> <localUrl>
sudo foolproxy https://baidu.com/component/console-security-message/0.0.2/index.js ./index.js

// remote url to remote url
$ sudo foolproxy <remoteUrl> <remoteUrl>
sudo foolproxy https://baidu.com/component/xxx/0.0.2/index.js http://taobao/xxx/index.js

// multiple proxy
$ sudo foolproxy ./my-proxy.json
```

```
my-proxy.json
{
  "https://baidu.com/component/console-security-message/0.0.2/index.js": "./index.js",
  "https://baidu.com/component/xxx/0.0.2/index.js": "http://taobao/xxx/index.js"
}
```
    
## Feature
- auto create certificate
- support http & https
- support multi file(only http)
- only for mac


## License

foolproxy is available under the terms of the MIT License.
    
![demo](https://cloud.githubusercontent.com/assets/1179603/11390116/b32a781c-9381-11e5-964e-1890d25fc3d6.gif)



