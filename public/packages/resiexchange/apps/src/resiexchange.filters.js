angular.module('resiexchange')

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
        var label = item.title.toString();
        var html_path = '<span style="color: grey; font-style: italic; font-size: 80%;">('+ item.path.toString() +')</span>';
        if (query.length > 0 || angular.isNumber(query)) {
            query = oiSelectEscape(query);
            html = label.replace(new RegExp(query, 'gi'), '<strong>$&</strong>')+ ' ' + html_path;
        }
        else {
            html = label + ' ' + html_path;
        }

        return $sce.trustAsHtml(html);
    };
}])

.filter('customListFilter', ['oiSelectEscape', function(oiSelectEscape) {
    
    function ascSort(input, query, getLabel, options) {
        var i, j, isFound, output, output1 = [], output2 = [], output3 = [], output4 = [];

        if (query) {
            query = oiSelectEscape(query).toASCII().toLowerCase();
            for (i = 0, isFound = false; i < input.length; i++) {
                isFound = getLabel(input[i]).toASCII().toLowerCase().match(new RegExp(query));

                if (!isFound && options && (options.length || options.fields)) {
                    for (j = 0; j < options.length; j++) {
                        if (isFound) break;
                        isFound = String(input[i][options[j]]).toASCII().toLowerCase().match(new RegExp(query));
                    }
                }
                if (isFound) {
                    output1.push(input[i]);
                }
            }
            for (i = 0; i < output1.length; i++) {
                if (getLabel(output1[i]).toASCII().toLowerCase().match(new RegExp('^' + query))) {
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