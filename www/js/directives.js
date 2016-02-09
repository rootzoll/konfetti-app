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
    .directive('requestcard', function () {
        return {
            templateUrl: 'templates/directive-request-card.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                $scope.requesttype = $attributes.requesttype;
            }
        };
    })
    .directive('multilang', function ($translate, $ionicPopup) {
        return {
            templateUrl: 'templates/directive-multilang.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                $scope.data = $scope.$eval($attributes.data);
                $scope.lang = $attributes.lang;
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
    .directive('mediaitem', function (ApiService, $sce) {
        return {
            templateUrl: 'templates/directive-media-item.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                
                $scope.loading = true;
                $scope.itemid = $attributes.itemid;
                $scope.mediaItemData = null;

                $scope.reviewInfo = function() {
                    console.log("TODO: reviewInfo id("+$scope.itemid+")");
                };

                $scope.getMapUrl = function() {
                    return $sce.trustAsResourceUrl("https://www.google.com/maps/embed/v1/place?q="+$scope.mediaItemData.data.lat+",+"+$scope.mediaItemData.data.lon+"&key=AIzaSyAsGmhV2-6ahp6i_n62GZgVddpITrLDNkw");
                };

                if ((typeof $attributes.item != "undefined") && ($attributes.item!=null)) {

                    /*
                     * Use given Media Item
                     */

                    $scope.loading = false;
                    $scope.mediaItemData = JSON.parse($attributes.item);


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
                    }, function(code) {
                        // FAIL
                        $scope.loading = false;
                    });
                }

            }
        };
    })
    .filter('distance', function() {
        return function(input) {
            if (input<1000) return input+" m";
            return Math.round(input/1000)+" km";
        };
    });