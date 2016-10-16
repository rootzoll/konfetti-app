'use strict';

angular.module('starter')
    .directive('notification', function () {
        return {
            templateUrl: 'templates/directive-notification.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
            }
        };
    })
    .directive('requestcard', function (ApiService) {
        return {
            templateUrl: 'templates/directive-request-card.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                $scope.requesttype = $attributes.requesttype;
                $scope.getImageUrl = function() {
                    if ((typeof $scope.request.imageMediaID != "undefined") && ($scope.request.imageMediaID!=null)) {
                        return ApiService.getImageUrlFromMediaItem($scope.request.imageMediaID);
                    } else {
                        return "./img/person.png";
                    }
                };
            }
        };
    })
    .directive('multilang', function ($translate, $ionicPopup, $rootScope) {
        return {
            templateUrl: 'templates/directive-multilang.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {

                // set basic data
                $scope.data = $scope.$eval($attributes.data);
                $scope.lang = $attributes.lang;

                // if actual lang not available try to default to en or de
                for (var i=0; i<$rootScope.langSet.length; i++) {
                    // check if actual set language is available ob multi lang item
                    if ((typeof $scope.data.data[$scope.lang] == "undefined") || ($scope.data.data[$scope.lang].length==0)) {
                        // actual lang is available - try next
                        $scope.lang = $rootScope.langSet[i].code;
                    } else {
                        // ok- got data - no need to check other langs
                        break;
                    }
                }

                // info dialog about auto translation
                $scope.showAutoTranslateInfo = function($event) {
                  $event.stopPropagation();
                  $translate("AUTOTRANSLATE_HEAD").then(function (HEADLINE) {
                        $translate("AUTOTRANSLATE_INFO").then(function (TEXT) {
                            $ionicPopup.alert({
                                title: HEADLINE,
                                template: TEXT
                            });
                        });
                  });

                };
            }
        };
    })
    // fallback src for images
    .directive('fallbackSrc', function () {
        var fallbackSrc = {
            link: function postLink(scope, iElement, iAttrs) {
                iElement.bind('error', function() {
                    angular.element(this).attr("src", iAttrs.fallbackSrc);
                });
            }
        };
        return fallbackSrc;
    })
    .directive('mediaitem', function (ApiService, $sce, leafletData) {
        return {
            templateUrl: 'templates/directive-media-item.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                
                try {

                var useCache = ((typeof $attributes.cache !="undefined") && ($attributes.cache==="true"));
                $scope.loading = true;
                $scope.itemid = $attributes.itemid;
                $scope.mediaItemData = null;

                $scope.reviewInfo = function() {
                    console.log("TODO: reviewInfo id("+$scope.itemid+")");
                };

                // pepare map data
                angular.extend($scope, {
                        center: {
                            lat: 0,
                            lng: 0,
                            zoom: 2
                        },
                        markers: {
                        }
                });

                $scope.afterProcessMediaData = function() {
                if ($scope.mediaItemData.type=='TYPE_LOCATION') {
                    if (typeof $scope.mediaItemData.data == "string") {
                        $scope.mediaItemData.data = JSON.parse($scope.mediaItemData.data);
                    }
                    $scope.center.lat = $scope.mediaItemData.data.lat;
                    $scope.center.lng = $scope.mediaItemData.data.lon;
                    $scope.center.zoom = 12;
                    $scope.markers.mainMarker = {
                                lat: $scope.mediaItemData.data.lat,
                                lng: $scope.mediaItemData.data.lon,
                                focus: true,
                                draggable: false
                    }; 
                    console.dir($scope.center);
                    console.dir($scope.markers);
                }

                  leafletData.getMap("map"+$scope.mediaItemData.id).then(function(map) {
                    setTimeout(function(){
                        map.invalidateSize();
                        }, 200);
                  });

                };

                if ((typeof $attributes.item != "undefined") && ($attributes.item!=null)) {

                    /*
                     * Use given Media Item
                     */

                    $scope.loading = false;
                    $scope.mediaItemData = JSON.parse($attributes.item);
                    $scope.afterProcessMediaData();

                } else {

                    /*
                     * Load Media Item
                     */

                    // check first if media item is within cache
                    // display chached version - than check update - e.g. on review status if needed

                    ApiService.loadMediaItem($scope.itemid, function(data){
                        // WIN
                        $scope.mediaItemData = data;
                        $scope.loading = false;

                        // parse data for complex data
                        if ($scope.mediaItemData.type=='Location') $scope.mediaItemData.data = JSON.parse($scope.mediaItemData.data);
                        $scope.afterProcessMediaData();

                    }, function(code) {
                        // FAIL
                        $scope.loading = false;
                    }, useCache);
                }

                } catch (e) {
                    alert("ERROR on MediaItem: "+JSON.stringify(e));
                }

            }
        };
    })
    .filter('distance', function() {
        return function(input) {
            if (input<1000) return input+" m";
            return Math.round(input/1000)+" km";
        };
    }).directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    });;