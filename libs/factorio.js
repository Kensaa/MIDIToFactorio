const Base64 = require("./base64.js");
const pako = require('./pako');

//factorio encoded strings ----> json
function decode(base64=""){
    //decode from Base64
    var binary = Base64.decode(base64.substring(1));
    //decompress with zlib
    var uzip = pako.inflate(binary);
    //encode to UTF-8
    var string = new TextDecoder("utf-8").decode(uzip);
    //convert it to an object then to a string to add indent to the output json
    return JSON.parse(string)
    }

//json ----> factorio encoded strings
function encode(json){
    //remove space
    var string = json.replace(/\s/g, "");
    //encode to UTF-8
    var enc = new TextEncoder("utf-8").encode(string);
    //compress with zlib
    var zip = pako.deflate(enc, {level: 9});
    //encode in Base64
    var base64 = Base64.encodeU(zip);
    //add the version byte at the start of the string
    var bstring = "0" + base64;
    return bstring
}

module.exports = {decode,encode}