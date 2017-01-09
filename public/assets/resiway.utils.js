/**
* Converts to lower case and strips accents
* this method is used in myListFilter, a custom filter for dsiplaying categories list
* using the oi-select angular plugin
*
* note : this is not valid for non-latin charsets !
*/
String.prototype.toLowerASCII = function () {
    var str = this.toLocaleLowerCase();
    var result = '';
    var convert = {
        192:'a', 193:'a', 194:'a', 195:'a', 196:'a', 197:'a',
        224:'a', 225:'a', 226:'a', 227:'a', 228:'a', 229:'a',
        200:'e', 201:'e', 202:'e', 203:'e',
        232:'e', 233:'e', 234:'e', 235:'e',
        204:'i', 205:'i', 206:'i', 207:'i',
        236:'i', 237:'i', 238:'i', 239:'i',
        210:'o', 211:'o', 212:'o', 213:'o', 214:'o', 216:'o',
        240:'o', 242:'o', 243:'o', 244:'o', 245:'o', 246:'o',
        217:'u', 218:'u', 219:'u', 220:'u',      
        249:'u', 250:'u', 251:'u', 252:'u'
    };
    for (var i = 0, code; i < str.length; i++) {
        code = str.charCodeAt(i);
        if(code < 128) {
            result = result + str.charAt(i);
        }
        else {
            if(typeof convert[code] != 'undefined') {
                result = result + convert[code];   
            }
        }
    }
    return result;
}
