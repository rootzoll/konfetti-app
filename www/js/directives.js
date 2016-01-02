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
    .directive('mediaitem', function (ApiService) {
        return {
            templateUrl: 'templates/directive-media-item.html',
            replace: true,
            restrict: 'A',
            link: function ($scope, $element, $attributes) {
                
                $scope.loading = true;
                $scope.itemid = $attributes.itemid;
                $scope.mediaItemData = null;

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
        };
    });