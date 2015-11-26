var fs = require('fs')
var thunkify = require('thunkify')
var jschardet = require('jschardet')

module.exports = {
    removeFile: thunkify(fs.unlink),
    readFile: readFile,
    writeFile: thunkify(fs.writeFile),
    renameFile: thunkify(fs.rename),
    openFile: thunkify(fs.open)
}

function readFile(filename,options) {
  
  if (options&&options.encoding){
    return function(cb){
      fs.readFile(filename,options,cb)
    }
  }


  return function(cb){

    options = options||{}
    fs.readFile(filename,options,function(err,data){
      if (err){
        cb(err)
        return
      }
      try{
        var encoding = jschardet.detect(data).encoding
        if (encoding != 'utf-8'){
          encoding = 'gbk'
        }
        var str = data.toString(encoding)
        cb(null,str)
      }
      catch(err){
        cb(err)
      }
    })
  }
}

function writeFile(filename,content,options) {

  if (options&&options.encoding){
    return function(cb){
      fs.writeFile(filename,content,options,cb)
    }
  }

  return function(cb){

    fs.readFile(filename,function(err,data){
      
      if (err){
        fs.writeFile(filename,content,options||{},cb)
        return
      }

      try{
        var encoding = jschardet.detect(data).encoding
        if (encoding != 'utf-8'){
          encoding = 'gbk'
        }
        options = options||{}
        options.encoding = encoding
        fs.writeFile(filename,content,options,cb)
      }
      catch(err){
        cb(err)
      }
    })
  }
}
