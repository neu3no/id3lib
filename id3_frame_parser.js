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
var conf=require("./id3conf.json");
var helper=require("./id3_helper.js");
var zlib=require("zlib");

// pre processing
exports.preProcess =function(frame,ver,callback){
  var buffer = new Buffer(frame.payload);
  var vconf=conf.versions["2"][ver];
  var flags={};
  var usize = 0;
  
  if (ver > 2){
    helper.arrtag(buffer[0],vconf.framehead.flag0,flags);
    helper.arrtag(buffer[1],vconf.framehead.flag1,flags);
    buffer=buffer.slice(2);
        
    if (flags.compression || flags.datalengthindicators) {
      var usize = buffer.readInt32BE(0);
      buffer=buffer.slice(4);
    }
    
    if (flags.compression){
      zlib.gunzip(buffer, function(a,buf){
        callback({},{
          "id" : frame.id,
          "version" : ver,
          "flags" : flags, 
          "decomp" : "true",
          "payload": buffer
        });
      });
      return;
    }
  }
  callback({},{
    "id" : frame.id,
    "version" : ver,
    "flags" : flags, 
    "decomp" : "false",
    "payload": buffer
  });
}

exports.parser ={};

exports.parser["text"] ={
  "condition" : function(frame){
    var tid = frame.id;
    return tid[0] =="T" && tid != "TXX" && tid != "TXXX";
  },
  
  "parse" : function(frame,ver){
    var buffer = new Buffer(frame.payload);
    var encdic = conf.versions["2"][ver].encodings;  
    var flags=frame.flags;
        
    if (typeof(encdic[buffer[0]])!=="undefined") {
      if (encdic[buffer[0]] === "ucs2"){
        buffer=buffer.slice(2);
      }
      var ret= {
        "id" : frame.id,
        "flags" : flags,
        "payload" : buffer.slice(1).toString(encdic[buffer[0]])
      };
      return ret;    
    } else {
      return {};
    }
  }
};

exports.parser["default"]={
  "condition" : function(){return true;},
  "parse" : function(frame,ver){
    return {
      "id" : frame.id,
      "payload" : frame.payload.toString("hex")
    }
  }
}
