angular.module("MyModule").config([ "$httpProvider", function($httpProvider: ng.IHttpProvider) {
    // Use x-www-form-urlencoded Content-Type
    $httpProvider.defaults.headers.post["Content-Type"] = "application/x-www-form-urlencoded;charset=utf-8";

    function phpize(obj: Object | any[], depth: number = 1): string[] {
        var arr: string[] = [ ];
        angular.forEach(obj, (value: any, key: string) => {
            if (angular.isObject(value) || angular.isArray(value)) {
                var arrInner: string[] = phpize(value, depth + 1);
                var tmpKey: string;
                var encodedKey = encodeURIComponent(key);
                if (depth == 1) tmpKey = encodedKey;
                else tmpKey = `[${encodedKey}]`;
                if (arrInner.length == 0) {
                    arr.push(`${tmpKey}=`);
                }
                else {
                    arr = arr.concat(arrInner.map(inner => `${tmpKey}${inner}`));
                }
            }
            else {
                var encodedKey = encodeURIComponent(key);
                var encodedValue;
                if (angular.isUndefined(value) || value === null) encodedValue = "";
                else encodedValue = encodeURIComponent(value);

                if (depth == 1) {
                    arr.push(`${encodedKey}=${encodedValue}`);
                }
                else {
                    arr.push(`[${encodedKey}]=${encodedValue}`);
                }
            }
        });
        return arr;
    }

    // Override $http service's default transformRequest
    (<any>$httpProvider.defaults).transformRequest = [ function(data: any) {
        if (!angular.isObject(data) || data.toString() == "[object File]") return data;
        return phpize(data).join("&");
    } ];
} ]);