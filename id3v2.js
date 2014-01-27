/*
* Author
*         Christian Neubauer
* web: http://neu3no.de/         twitter: @neu3no mail: the@neu3no.de
*         
* Licence
* (cc-by-nc) 2012
*         This work is licensed under the Creative Commons Attribution-NonCommercial
* 3.0 Unported License. To view a copy of this license, visit
* http://creativecommons.org/licenses/by-nc/3.0/.
*
* Project
*         website: http://neu3no.de/
*         github : https://github.com/neu3no/id3lib
*
*/
var fs = require('fs');

var Buffer = require('buffer').Buffer;
var conf=require("./id3conf.json");
var helper=require("./id3_helper.js");
var parser=require("./id3_frame_parser.js");

//

var grabExtHead = function(f, head, callback){
  var buffer = new Buffer(conf.versions["2"][head.ver].extheader.maxsize);
  // in the beginning read a buffer with maximum count of byte a extheader could 
  // have, we can strip it down later
  fs.read(f, buffer,0,conf.versions["2"][head.ver].extheader.maxsize,conf.versions["2"].headsize,function(rerr, num){
    var size = conf.versions["2"][head.ver].extheader.maxsize;
    if (conf.versions["2"][head.ver].extheader.calcsize) {
      size = 
        conf.versions["2"][head.ver].extheader.sizebase + 
        helper.sizecalc(buffer.slice(0,4));
    } else {
      size = 
        conf.versions["2"][head.ver].extheader.sizebase + 
        buffer.readInt32BE(0);
    }
    if (size > conf.versions["2"][head.ver].extheader.maxsize) {
      callback({"code" : 5, "dscr" : "extended header size is too big!"},undefined);
      return;
    }
    // since we have the size we can strip the buffer to header size
    buffer=buffer.slice(0,size);
    
    callback({},buffer);
  });
};

var grabHead = function(f, callback){
  var buffer = new Buffer(conf.versions["2"].headsize);
  fs.read(f, buffer,0,conf.versions["2"].headsize,0,function(rerr, num){
    // test wether "ID3" string is present or not.if not there might be no tag
    if (buffer.toString('utf8',0,3)!="ID3"){
			callback({"code" : 2, "dscr":"no ID3v2 tag found"},undefined);
			return;
		} else {
		  callback({},buffer);
		}
  });
};

// grab the head and make a js object out of it for versions described in conf
var getID3v2head = function(f, callback){
   grabHead(f,function(err,buffer){
    if (err.code) {
      callback(err, undefined);  
      return;
    } else {
      var head={};
      
      head.ver  = buffer[3];
      head.rev  = buffer[4];
      
      // check if we have a description of this version in config
      if (conf.versions["2"]["versions"].indexOf(head.ver) == -1) {
        callback(
          {"code":3,"dscr":"ID3v2." + head.ver + " not implemented"},
          undefined
        );
        return;
        
      } else {
      
        head.flags={};
        // map flags according to the definition in config file
        helper.arrtag(
          buffer[5],
          conf.versions["2"][head.ver].header.flags, // see config for that
          head.flags
        );
        
        // if the size is stored as 4*7Bit it needs to be converted
        if (conf.versions["2"][head.ver].header.calcsize){
          head.size = helper.sizecalc(buffer.slice(6,10));
        } else {
          // if not we can just read for bytes and interpret as 32bit int
          head.size = buffer.readInt32BE(6);
        }
        
        callback({},head);
      }
    }
  });
};

var grabFrameRecur = function(buffer,head){
  var len =conf.versions["2"][head.ver].framehead.wordsize; // keep readability
  var sizb=conf.versions["2"][head.ver].framehead.sizebase; // keep readability
  var size;  // int
  var frame; // buffer
  
  size= buffer.slice(len,2*len).readBigInt() + sizb;
  if (size > 0 && buffer.slice(0,1).toString("hex") != "00") { // just if we trapped into undeclared padding
    frame = new Buffer(buffer.slice(0,size));
    // there is still data in the buffer -> recall our self and append the result

    if (buffer.slice(size).length>2*len) {
      return [frame].concat(grabFrameRecur(buffer.slice(size),head));
    
    // theres no data left in buffer -> finish -> no more function call
    } else {
      return [frame];
    }
    
  // if the size is 0 we trapped into padding and could stop recursing
  } else {
    return [];
  }
};

var getFrames = function(f, head,offset,callback){
  var tmp=[];
  grabFrames(f,head,offset, function(e,frames){
    for (framekey in frames){       // sure not the fastest solution
      var frame = frames[framekey]; // but most flexible and most readable
      
      for ( p in parser.parser) {
      
        if (parser.parser[p].condition(frame)){
          tmp.push(parser.parser[p].parse(frame,head.ver));
          break; 
        }
        
      }
    }
    
    callback({},{"header": head, "frames" : tmp});
  });
};

var grabFrames = function(f,head,offset,callback){
  var buffer = new Buffer(head.size - offset);
  fs.read(f,buffer,0,buffer.length,offset,function(rerr,num){
    var frames = grabFrameRecur(buffer,head);
    var len =conf.versions["2"][head.ver].framehead.wordsize; // keep readability
    var tmp=[];
    
    for (i=0; i<frames.length; i++){
      var frame=frames[i];
      parser.preProcess({
          "id"     : frame.slice(0,len).toString(),
          "payload": frame.slice(2*len)
        }, head.ver, function(err,preframe){
          tmp.push(preframe);
      });
    }
    callback({},tmp);
  });
};

exports.read = function(filename, callback){
  var closeback = function(fd,e,d){
    fs.close(fd,function(){
      callback(e,d);
    });
  };
  if (typeof filename !== "string"){
    callback({"dscr": "typeof filename =" + (typeof filename)},{})
    return;
  }
  fs.exists(filename,function(ex){
    fs.open(filename,'r',function(err,f){
    
      if (err) {
        closeback(f,{"code" :1, "dscr" : "error opening file", "err": err},undefined);
        return;
      }
      
      getID3v2head(f,function(e,head){
        // we need the offset where the frames start
        var offset=conf.versions["2"].headsize;
        if (typeof head === "undefined" ) {
          closeback(f,{"code":99,"filename":filename},{});
          return;
        }
        if (head.flags.extendedheader){
          // TODO: parse extended header
          grabExtHead(f,head,function(ee,eh){
            offset+=eh.length;
            getFrames(f,head,offset,function(e,d){
              closeback(f,e,d);
            });
          });
        } else{
            getFrames(f,head,offset,function(e,d){
              closeback(f,e,d);
            });
        }
      });
    });
  });
  
};
