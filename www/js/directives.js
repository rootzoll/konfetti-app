'use strict';

angular.module('starter')
    .directive('notification', function () {
        return {
            templateUrl: 'templates/directive-notification.html',
            replace: true,
            restrict: 'A'
        };
    });