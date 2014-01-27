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
var Buffer = require('buffer').Buffer

exports.read = function(filename, callback){
  fs.open(filename,'r',function(err,f){

    var taglen = 128;
	  var pos=fs.fstatSync(f).size-taglen;
		var buffer = new Buffer(taglen);

		fs.read(f, buffer,0,taglen,pos,function(rerr, num){
		  if (buffer.slice(0,3).toString() != "TAG"){
		    callback({"code" : 2,"dscr" : "no ID3v1 tag found"},{});
		    return;
		  }  
		  
		  fs.close(f,function(){
		    callback({"code" : 0},{
		      "title" : buffer.slice(3,33).tString("binary"),
		      "artist": buffer.slice(33,63).tString("binary"),
		      "album" : buffer.slice(63,93).tString("binary"),
		      "year"  : buffer.slice(93,97).toString("binary"),
		      "comment":buffer.slice(97,(buffer[125] == 1 ) ? 125 : 127).tString(),
		      "track" : (buffer[125] == 0 ) ? buffer[126] : -1,
		      "genre" : buffer[127]
		    });
		  });
		});
	});
};

