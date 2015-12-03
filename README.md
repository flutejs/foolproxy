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

// remote url to remote url
$ sudo foolproxy <remoteUrl> <remoteUrl>

// multiple proxy & only support http
$ foolproxy ./my-proxy.json
```

> my-proxy.json
> {
>   "http://xxxxxx/index.html": "./index.html",
>   "http://xxxxxx/index.js": "http://xxxxxx/result.js",
>   "http://xxxxxx/index.css": "http://xxxxxx/style.css",
>   ...
> }
>
    
## Exp
    
```bash
sudo foolproxy https://baidu.com/component/console-security-message/0.0.2/index.js ./index.js
```
    
## Feature
- auto create certificate
- support http & https
- only support single file
- only for mac


## License

foolproxy is available under the terms of the MIT License.
    
![demo](https://cloud.githubusercontent.com/assets/1179603/11390116/b32a781c-9381-11e5-964e-1890d25fc3d6.gif)
