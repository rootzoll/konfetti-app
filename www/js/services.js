angular.module('starter.services', [])
/*
 * collection point for experimental services
 */
.factory('DataCache', function($log) {

        var dataMap = [
            {key: 'test', val:'test'}
        ];

        return {
            putData: function(keyStr, valObj) {
                var keyIndex = this.getKeyIndex(keyStr);
                if (keyIndex>=0) dataMap.splice(keyIndex, 1);
                dataMap.push({key: keyStr, val:valObj});
                return;
            },
            getData: function(keyStr) {
                var keyIndex = this.getKeyIndex(keyStr);
                if (keyIndex>=0) return dataMap[keyIndex].val;
                return;
            },
            getKeyIndex: function(key) {
                var ki = -1;
                for (i = 0; i < dataMap.length; i++) {
                    if (dataMap[i].key===key) {
                        ki = i;
                        break;
                    }
                }
                return ki;
            }
        };
 });
