'use strict';

angular.module('starter.filters', [])
    .filter('datetranslate', function() {
  return function (input,lang) {

    if (typeof lang == "undefined") return input;

    if (lang=='de') {
        input = input.replace("Monday", "Montag");
        input = input.replace("Tuesday", "Dienstag");
        input = input.replace("Wednesday", "Mittwoch");
        input = input.replace("Thursday", "Donnerstag");
        input = input.replace("Friday", "Freitag");
        input = input.replace("Saturday", "Samstag");
        input = input.replace("Sunday", "Sonntag");
    }

    if (lang=='ar') {
        input = input.replace("Monday", "الإثنين");
        input = input.replace("Tuesday", "الثلاثاء");
        input = input.replace("Wednesday", "الأربعاء");
        input = input.replace("Thursday", "الخميس");
        input = input.replace("Friday", "الجمعة");
        input = input.replace("Saturday", "السبت");
        input = input.replace("Sunday", "الأحد");
    }

    return input;



  };
});