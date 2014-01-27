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

Buffer.prototype.tString = function(encoding){
  var tmp=this.toString(encoding);
  var ret="";
  for (i=0; i<tmp.length; i++){
    if (tmp[i] === "\u0000") {
      return ret;
    } 
    ret += tmp[i];
  }
};

Buffer.prototype.readBigInt = function(){
  var tmp = 0;
  var tbuf=new Buffer(this);
  while (tbuf.length >0){
    tmp<<=8;
    tmp+=tbuf[0];
    tbuf=tbuf.slice(1);  
  }
  return tmp;
};

// splits number into bit array
// determined that the shifting solution is faster then masking
var tags =exports.tags = function(v){
  var ret=[];
  for (var _i=0; _i<8; _i++){
    ret.push(v-(v>>1<<1));
    v<<=1;
  }
  return ret;
};

exports.arrtag = function(v,_arr,obj){
  var arr = [].concat(_arr); // shallow copy
  tmp = tags(v);
  while (arr.length && tmp.length) {
    var field=arr.pop();
    // for implementing bits that are ignored
    if (field !== "-")
      obj[field] = tmp.pop();
    else 
      tmp.pop();
  }
  return obj;
};

// converts the 4*7bit size of id3 to integer 
exports.sizecalc = function(buf) {
  var ret = 0;
  ret +=  buf[3] & 127;  
  ret += (buf[2] & 127) << 7;
  ret += (buf[1] & 127) << 14;
  ret += (buf[0] & 127) << 21;
  return ret;
};
