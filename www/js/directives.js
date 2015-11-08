'use strict';

angular.module('starter')
    .directive('notification', function () {
        return {
            templateUrl: 'templates/directive-notification.html',
            replace: true,
            restrict: 'A'
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
    });