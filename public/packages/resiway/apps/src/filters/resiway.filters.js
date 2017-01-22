angular.module('resiway')

.filter("nl2br", function() {
 return function(data) {
   if (!data) return data;
   return data.replace(/\n\r?/g, '<br />');
 };
})

.filter("humanizeCount", function() {
    return function(value) {
        if(typeof value == 'undefined' 
        || typeof parseInt(value) != 'number') return 0;
        if(value == 0) return 0;
        var sign = value/Math.abs(value);
        value = Math.abs(value);
        var s = ['', 'k', 'M', 'G'];
        var e = Math.floor(Math.log(value) / Math.log(1000));
        return (sign*((e <= 0)?value:(value / Math.pow(1000, e)).toFixed(1))) + s[e];
    };
})

/**
* display select widget with selected items
*/
.filter('customSearchFilter', ['$sce', function($sce) {
    return function(label, query, item, options, element) {
        var closeIcon = '<span class="close select-search-list-item_selection-remove">×</span>';
        return $sce.trustAsHtml(item.title + closeIcon);
    };
}])

.filter('customDropdownFilter', ['$sce', 'oiSelectEscape', function($sce, oiSelectEscape) {
    return function(label, query, item) {
        var html;
        if (query.length > 0 || angular.isNumber(query)) {
            label = item.title.toString();
            query = oiSelectEscape(query);
            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>');
        } 
        else {
            html = item.title;
        }

        return $sce.trustAsHtml(html);
    };
}])

.filter('customListFilter', ['oiSelectEscape', function(oiSelectEscape) {
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
    
    function ascSort(input, query, getLabel, options) {
        var i, j, isFound, output, output1 = [], output2 = [], output3 = [], output4 = [];

        if (query) {
            query = oiSelectEscape(query).toLowerASCII();
            for (i = 0, isFound = false; i < input.length; i++) {
                isFound = getLabel(input[i]).toLowerASCII().match(new RegExp(query));

                if (!isFound && options && (options.length || options.fields)) {
                    for (j = 0; j < options.length; j++) {
                        if (isFound) break;
                        isFound = String(input[i][options[j]]).toLowerASCII().match(new RegExp(query));
                    }
                }
                if (isFound) {
                    output1.push(input[i]);
                }
            }
            for (i = 0; i < output1.length; i++) {
                if (getLabel(output1[i]).toLowerASCII().match(new RegExp('^' + query))) {
                    output2.push(output1[i]);
                } 
                else {
                    output3.push(output1[i]);
                }
            }
            output = output2.concat(output3);

            if (options && (options === true || options.all)) {
                inputLabel: for (i = 0; i < input.length; i++) {
                    for (j = 0; j < output.length; j++) {
                        if (input[i] === output[j]) {
                            continue inputLabel;
                        }
                    }
                    output4.push(input[i]);
                }
                output = output.concat(output4);
            }
        } 
        else {
            output = [].concat(input);
        }
        return output;
    }
    return ascSort;
}]);