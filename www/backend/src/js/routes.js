'use strict';

/**
 * Route configuration for the RDash module.
 */
angular.module('RDash').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {

        // For unmatched routes
        $urlRouterProvider.otherwise('/');

        // Application routes
        $stateProvider
            .state('index', {
                url: '/',
                templateUrl: 'templates/dashboard.html'
            })
            .state('tables', {
                url: '/tables',
                templateUrl: 'templates/tables.html'
            })
            .state('party', {
                url: '/party/:id',
                templateUrl: 'templates/party.html',
                controller: 'PartyCtrl'
            })
        ;

    }
]).run(['$rootScope','KonfettiApi',function($rootScope, KonfettiApi) {
    $rootScope.logout = function(){
        KonfettiApi.logout();
        KonfettiApi.modalAlert("OK logged out. Please close browser window now.", function(){
            window.close();
        });
    };
}]);