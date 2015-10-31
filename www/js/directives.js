'use strict';

angular.module('starter')
    .directive('notification', function () {
        return {
            scope: {
                type: '@',
                moreCallback: '@',
                deleteCallback: '@'
            },
            templateUrl: 'templates/directive-notification.html',
            replace: true,
            restrict: 'A',
            link: function postLink(scope, element, attrs) {
                //element.text('this is the menurocket directive');
            }
        };
    });