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
            restrict: 'A'
        };
    });