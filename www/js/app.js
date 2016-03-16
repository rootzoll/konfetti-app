// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'starter.controller.dash', 'starter.controller.request', 'starter.controller.account', 'starter.services', 'starter.api', 'ngCordova', 'pascalprecht.translate'])

.run(function(AppContext, ApiService, $rootScope, $ionicPlatform, $cordovaGlobalization, $cordovaGeolocation, $log, $cordovaToast, $translate, KonfettiToolbox) {
  $ionicPlatform.ready(function() {

    $rootScope.initDone = false;
    $rootScope.tabRequestTitle = 'TAB_REQUEST';

    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
      cordova.plugins.Keyboard.disableScroll(true);
    }

    try {
        // hide native status bar
        ionic.Platform.fullScreen();
        if (typeof window.StatusBar != "undefined")  {
            window.StatusBar.hide();
            console.log("OK window.StatusBar.hide()");
        } else {
            console.log("FAIL no window.StatusBar");
        }
    } catch (e) {
        alert("FAIL on hide native status bar: "+e);
    }

    // set running os info
    try {
        $rootScope.os = "browser";
        if (typeof window.device != "undefined") $rootScope.os = window.device.platform;
    } catch (e) {
        alert("FAIL set running os info: "+e);
    }

    /*
     * GLOBAL LANGUAGE SELECTOR (displayed in every tab)
     */

    // available app languages (order in international priority)
    $rootScope.langSet = [
          {code:'en', display:'English', dir:'ltr'},
          {code:'de', display:'Deutsch', dir:'ltr'},
          {code:'ar', display:'عربي', dir:'rtl'}
    ];
    $rootScope.actualLang = AppContext.getAppLang();

    // setting selected lang in view to setting
    // should be called on every view enter
    $rootScope.setActualLangOnSelector = function() {
          $rootScope.actualLangSelect = $rootScope.langSet[0];
          for (i = 0; i < $rootScope.langSet.length; i++) {
              if ($rootScope.langSet[i].code===AppContext.getAppLang()) {
                  $rootScope.actualLangSelect = $rootScope.langSet[i];
                  break;
              }
          }
    };

    // receiving changes lang settings from selector --> with i18n
    $rootScope.selectedLang = function(selected) {
          $rootScope.actualLang = selected.code;
          $translate.use(selected.code);
          AppContext.setAppLang(selected.code);
          $rootScope.spClass = AppContext.getAppLangDirection();
    };

    /*
     * GET LANGUAGE OF DEVICE
     * http://ngcordova.com/docs/plugins/globalization/
     */
    var gotLang = false;
    var setLocale = function(lang) {

        // check if changed
        if (AppContext.getAppLang() != lang) {
            $log.info("switching to lang(" + lang + ")");
            AppContext.setAppLang(lang);
            $translate.use(AppContext.getAppLang());
            $rootScope.spClass = AppContext.getAppLangDirection();
        } else {
            $log.info("already running lang(" + lang + ") ... no need to switch");
        }

    };
    if (AppContext.getRunningOS()!="browser") {
        $cordovaGlobalization.getLocaleName().then(
            function (result) {
                // WIN
                if (!gotLang) {
                    gotLang = true;

                    // check available lang
                    var lang = result.value.substr(0, 2);
                    var langOK = false;
                    for (var i=0; i < $rootScope.langSet.length; i++) {
                        var availableLang = $rootScope.langSet[i];
                        if (availableLang.code == lang) {
                            langOk = true;
                            break;
                        }
                    }
                    if (!langOK) {
                        $log.warn("lang '" + lang + "' not available ... using 'en'");
                        lang = "en";
                    }

                    setLocale(lang);

                } else {
                    $log.warn("double call prevent of $cordovaGlobalization.getLocaleName()");
                }

            },
            function (err) {
                // FAIL
                $log.info("cordovaGlobalization: FAIL " + err);
            }
        );

        } else {
            $log.warn("TODO: On browser check lang setting differently");
            setLocale("en");
        }

    /*
     * Start GPS
     */

    $rootScope.lat  = 0;
    $rootScope.lon = 0;
    KonfettiToolbox.updateGPS();

    /*
     * App Context
     */
    try {
        AppContext.loadContext(function(){
            /*
             * i18n SETTINGS
             */
            $translate.use(AppContext.getAppLang());
            $rootScope.spClass = AppContext.getAppLangDirection();
        });
    } catch (e) {
        alert("FAIL i18n SETTINGS: "+e);
    }

    // global scope data
    $rootScope.party = {id:0};

  });
})

.config(function($stateProvider, $urlRouterProvider, $translateProvider, $ionicConfigProvider) {

   $ionicConfigProvider.tabs.position('bottom');

  /*
   * i18n --> https://angular-translate.github.io/docs
   */

   $translateProvider.translations('en', {
            'INIT' : '... loading ...',
            'TAB_PARTIES' : 'Parties',
            'TAB_REQUEST' : 'Task',
            'TAB_REQUEST_NEW' : 'New Task',
            'TAB_MORE' : 'More',
            'KONFETTI' : 'confetti',
            'KONFETTI-APP' : 'Konfetti',
            'PARTYINFO_TITLE': 'Party Info',
            'PARTYINFO_SUB': 'editorial responsibility',
            'POSTSORT_MOST': 'top confetti',
            'POSTSORT_NEW': 'newest entry',
            'DASHHEADER_REVIEW': 'Please Review',
            'DASHHEADER_POSTED': 'You Posted',
            'DASHHEADER_ACTIVE': 'You Answered',
            'DASHHEADER_OPEN': 'Open Tasks',
            'DASHHEADER_RECENTLYDONE': 'Recently Done',
            'NOTIFICATION_REVIEWOK' : 'Your task is now public.',
            'NOTIFICATION_REVIEWFAIL' : 'Your task was rejected.',
            'NOTIFICATION_CHATREQUEST' : 'You got a chat message.',
            'NOCONTENT' : 'no open tasks',
            'NEWREQUEST' : 'Publish a new Task',
            'YOURNAME' : 'Your Name',
            'YOURREQUEST' : 'Your Tasks',
            'PUBLICINFO' : 'Public Information',
            'PRIVATECHATS' : 'Private Chats',
            'ADDINFO' : 'add image, text, location',
            'ISPEAK' : 'I speak',
            'SUBMIT' : 'Submit Task',
            'REWARD' : 'reward',
            'YOUGIVE' : 'you give',
            'IMPORTANT' : 'Important',
            'ENTERNAME' : 'Please enter your name before submit.',
            'THANKYOU' : 'Thank You',
            'SUBMITINFO' : 'Your task gets now reviewed. You will get a notification once it is public.',
            'SUBMITINFO_NOREVIEW' : 'Your task is now public.',
            'ENTERREQUEST' : 'Please enter a short task description.',
            'PARTYWAIT' : 'loading party',
            'INTERNETFAIL' : 'no internet',
            'ACCOUNTWAIT' : 'registering',
            'GPSWAIT' : 'getting position',
            'GPSFAIL' : 'please activate GPS',
            'PARTYLISTWAIT' : 'loading parties',
            'YOUCOLLECT' : 'You collected total',
            'YOUTOP' : 'You are within the best',
            'REDEEMCOUPON' : 'Redeem Konfetti Coupon',
            'MAGICCODE' : 'Enter Magic Password',
            'GLOBALSETTINGS' : 'Global Settings',
            'ENABLEPUSH' : 'Enable Pushnotifications',
            'PAUSECHAT' : 'Pause Chat',
            'NEEDSGPS'  : 'turn on location',
            'NEEDSINTERNET'  : 'needs internet connection',
            'LOWKONFETTI'  : 'You have too little confetti to open a task.',
            'MINKONFETTI'  : 'Minimal amount needed',
            'CONTACT' : 'Contact',
            'HELPOUT' : 'help out and earn up to',
            'GETREWARD' : 'as reward',
            'HELPCHAT' : 'Start Chat',
            'HELPCHAT_CONT' : 'Continue Chat',
            'INTERNETPROBLEM' : 'Problem with Connection. Please try again later.',
            'ENTERNAME' : 'Please enter your name',
            'SENDMESSAGE' : 'send a message',
            'INTRO_WELCOME' : 'Welcome to Konfetti App',
            'INTRO_STEP1A' : 'This app is about',
            'INTRO_STEP1B' : 'neighborly help parties.',
            'INTRO_STEP2A' : 'Earn Konfetti',
            'INTRO_STEP2B' : 'by taking care of tasks or by donating.',
            'INTRO_STEP3A' : 'Use Konfetti',
            'INTRO_STEP3B' : 'to post tasks to community or to up vote existing tasks.',
            'INTRO_LETSGO' : 'Show confetti parties in my area.',
            'CREATENEW'    : 'create new',
            'REDEEM_MAGIC_SUB' : 'activate features, add privileges ..',
            'REDEEM_COUPON_SUB' : 'Please enter the code number of your coupon:',
            'ANSWERE' : 'Result',
            'REQUESTEDON' : 'Requested on',
            'REQUESTDONE': 'mark as done - reward konfetti',
            'REQUESTDELETE': 'delete task',
            'REQUESTAPPROVE': 'approve task',
            'REQUESTREJECT': 'reject task',
            'REQUESTPROCESS' : 'help found - pause new chats',
            'REQUESTREOPEN' : 're-open for help offers',
            'ENTERREASON' : 'reason for rejection',
            'CONFIRM_DELETE' : 'Do you really want to delete?',
            'CONFIRM_DELETE_AUTHOR' : 'All konfetti spend by the author will get lost. Voting konfetti by others will get refunded. Do you really want to delete?',
            'REQUESTREJECT_AFTER' : 'revoke task',
            'EXPLAIN_REVIEW_USER' : 'Is not public yet - waiting for review.',
            'EXPLAIN_REVIEW_ADMIN' : 'Please choose reject or approve this task.',
            'EXPLAIN_REJECTED' : 'Not public - was rejected.',
            'EXPLAIN_PROCESSING_AUTHOR' : 'Is public - but new help offers are blocked. Re-open if you need more help or reward konfetti when done.',
            'EXPLAIN_PROCESSING_PUBLIC' : 'Still open, but author was already promised help. So chat is deactivated.',
            'EXPLAIN_OPEN_AUTHOR' : 'Is public. Please answere incoming chats and reward konfetti once is done.',
            'EXPLAIN_OPEN_PUBLIC' : 'If you are interested to help out, start a chat and ask for details. Our just upvote with your konfetti.',
            'EXPLAIN_DONE_PUBLIC' : 'Sucessfully done. Visible just for the archive.',
            'EXPLAIN_DONE_AUTHOR' : 'Done. Still public for people to see.',
            'IMAGE' : 'image',
            'TEXT'  : 'text',
            'LOCATION' : 'location',
            'ADDTEXT' : 'Add Text',
            'ENTERTEXT' : 'Enter the text you like to add:',
            'REWARDKONFETTI' : 'reward konfetti',
            'SELECTREWARD' : 'select one or more chat partners',
            'INFO' : 'info',
            'INFO_ZEROKONFETTI' : 'You have no konfetti to support this task. See party info how to get konfetti.',
            'OK' : 'OK',
            'CANCEL' : 'Cancel',
            'PLEASE_REVIEW' : 'please review',
            'INFO_REQUESTFAIL' : 'Check Internet or try again later.',
            'INFO_FAILTRYAGAIN': 'This failed. Please try again or report to developers.',
            'AUTOTRANSLATE_HEAD' : 'Auto Translate',
            'AUTOTRANSLATE_INFO' : 'This text was auto translated by a robot. Please keep in mind, that robots are not perfect and make mistakes.',
            'USELOCATION' : 'Would you like to add your current location?',
            'SELECT_LESS' : 'Please select less.',
            'CHECK_MEDIAITEMS' : 'contains additional media items (see below)',
            'KEEP_HEADLINE_SHORT' : 'try to keep headline short',
            'INVALID_EMAIL' : 'Please enter a valid email address.',
            'EMAIL_OK' : 'Thanks. Your email got stored and more info send to your address.',
            'EMAIL_NEEDED' : 'You need to set your email to create coupons.',
            'EMAIL_INFO' : 'Set email for backup and important announcements:',
            'SAVE' : 'save',
            'WELCOME_PARTY' :'Welcome to this Konfetti party.',
            'REWARD_NOTI' : 'You got a reward.',
            'PARTYADMIN_OPTIONS' : 'Party Admin Options',
            'CREATE_COUPONS' : 'Create Konfetti Coupons',
            'COUPON_COUNT' : 'Number of Coupons:',
            'COUPON_AMOUNT' : 'Konfetti per Coupon:',
            'CREATE_COUPON_TITLE' : 'Create Konfetti Coupons',
            'CREATE_COUPON_SUBLINE' : 'you will get an email with a PDF to print out',
            'CREATE_COUPON_OK' : 'Your coupons got created. Check your email.',
            'NOTIFICATION_PAYBACK' : 'A task you supported got canceled = payback.',
            'NOTIFICATION_SUPPORTWIN' : 'A task you supported got done.',
            'INFO_REWARD' : 'Your reward for this task',
            'INFO_SUPPORT' : 'Your support for this task',
            'SELECT_LANG' : 'Please select languages you speak.',
            'GPSFALLBACK_TITLE' : 'Where is your neighboorhood?',
            'GPSFALLBACK_SUB' : 'please lets us know your zipcode and country',
            'ZIPCODE' : 'Zipcode:',
            'COUNTRY' : 'Country:',
            'COUNTRY_GERMANY' : 'Germany',
            'GPSFALLBACK_GPS' : 'Try GPS again',
            'GPSFALLBACK_FAIL' : 'Sorry, was not able to process zip code. Check internet connection.',
            'GPSFALLBACK_NEEDED' : 'Please enter a zip code.',
            'DATE' : 'date',
            'ADDDATE_TITLE' : 'Add Time & Date',
            'ADDDATE_SUB' : 'set a date and a one word description',
            'ADDDATE_DESCRIPTION' : 'description',
            'LOGIN_WELCOME' : 'Welcome to Konfetti App',
            'LOGIN_STEP1' : 'Because you are running on a browser you need to login. Please register with email and password if this is your first time.',
            'LOGINBUTTON_REGISTER' : 'Register new Account',
            'LOGINBUTTON_LOGIN' : 'Login',
            'LOGINBUTTON_LOGINFORGOT' : 'I forgot my password',
            'LOGIN_INFO' : 'please login in',
            'REGISTER_INFO' : 'please register',
            'EMAIL' : 'email',
            'PASSWORD' : 'password',
            'RECOVER_TITLE' : 'Password Recovery',
            'RECOVER_EXPLAIN' : 'Enter the eMail you used for registering and we will send you a new password.',
            'RECOVER_BUTTON' : 'Reset Password',
            'RECOVER_WIN' : 'OK. Please check your email inbox for new password and keep it save.',
            'RECOVER_FAIL' : 'Was not able to reset password. Please check email and internet connection.',
            'LOGIN_FAIL' : 'Was not able to login. Please check email, password and internet connection.',
            'REGISTER_FAIL' : 'Was not able to register. Please check email, password and internet connection.',
            'REGISTER_FAILMAIL' : 'The email is already in use. If you forgot the password, try to reset.',
            'PASSWORD_LENGTH' : '8 characters minimum for password',
            'EMAIL_VALID' : 'please enter a valid email as username',
            'LOGOUT_REMINDER' : '= Logout when done.'
   });

   $translateProvider.translations('de', {
            'INIT' : '... lade ...',
            'TAB_PARTIES' : 'Parties',
            'TAB_REQUEST' : 'Aufgabe',
            'TAB_REQUEST_NEW' : 'Neue Aufgabe',
            'TAB_MORE' : 'Mehr',
            'KONFETTI' : 'Konfetti',
            'KONFETTI-APP' : 'Konfetti',
            'PARTYINFO_TITLE': 'Party Info',
            'PARTYINFO_SUB': 'inhaltlich verantwortlich',
            'POSTSORT_MOST': 'top konfetti',
            'POSTSORT_NEW': 'neuste posts',
            'DASHHEADER_REVIEW': 'Bitte Prüfen',
            'DASHHEADER_POSTED': 'Deine Aufgaben',
            'DASHHEADER_ACTIVE': 'Deine Antworten',
            'DASHHEADER_OPEN': 'Offene Aufgaben',
            'DASHHEADER_RECENTLYDONE': 'Kürzlich Erledigt',
            'NOTIFICATION_REVIEWOK' : 'Deine Aufgabe ist jetzt öffentlich.',
            'NOTIFICATION_REVIEWFAIL' : 'Deine Aufgabe wurde abgelehnt.',
            'NOTIFICATION_CHATREQUEST' : 'Du hast eine Nachricht.',
            'NOCONTENT' : 'keine offene Aufgaben',
            'NEWREQUEST' : 'Neue Aufgabe erstellen',
            'YOURNAME' : 'Dein Name',
            'YOURREQUEST' : 'Deine Aufgabe',
            'PUBLICINFO' : 'Öffentliche Informationen',
            'PRIVATECHATS' : 'Private Chats',
            'ADDINFO' : 'Bild, Text, Ortsinformationen hinzufügen',
            'ISPEAK' : 'Ich spreche',
            'SUBMIT' : 'Aufgaben Idee abschicken',
            'REWARD' : 'Belohnung',
            'YOUGIVE' : 'Du gibst',
            'IMPORTANT' : 'Wichtig',
            'ENTERNAME' : 'Bitte trage deinen Namen ein.',
            'THANKYOU' : 'Danke',
            'SUBMITINFO' : 'Ihre Aufgaben Idee wird nun überprüft. Sie erhalten eine Benachrichtigung, sobald sie veröffentlicht wird.',
            'SUBMITINFO_NOREVIEW' : 'Ihre Aufgabe ist nun öffentlich.',
            'ENTERREQUEST' : 'Bitte geben Sie eine kurze Beschreibung der Aufgabe ein.',
            'PARTYWAIT' : 'Lade Party',
            'INTERNETFAIL' : 'Kein Internet',
            'ACCOUNTWAIT' : 'Anmeldung',
            'GPSWAIT' : 'Bestimme Position',
            'GPSFAIL' : 'Bitte GPS aktvieren',
            'PARTYLISTWAIT' : 'Lade Parties',
            'YOUCOLLECT' : 'Du hast bisher insgesamt gesammelt',
            'YOUTOP' : 'Du bist unter den Besten ',
            'REDEEMCOUPON' : 'Konfetti Gutschein einlösen',
            'MAGICCODE' : 'Magisches Passwort eingeben',
            'GLOBALSETTINGS' : 'Einstellungen',
            'ENABLEPUSH' : 'Push-Meldungen einschalten',
            'PAUSECHAT' : 'Chats pausieren',
            'NEEDSGPS'  : 'bitte GPS aktivieren',
            'NEEDSINTERNET'  : 'Internetverbindung benötigt',
            'LOWKONFETTI'  : 'Du hast zuwenig Konfetti, um eine Aufgabe zu starten.',
            'MINKONFETTI'  : 'Minimal nötige Menge',
            'CONTACT' : 'Kontakt',
            'HELPOUT' : 'Helfen und bis zu',
            'GETREWARD' : 'erhalten.',
            'HELPCHAT' : 'Starte Chat',
            'HELPCHAT_CONT' : 'Chat fortsetzen',
            'INTERNETPROBLEM' : 'Problem mit der Verbindung. Bitte später nochmal probieren.',
            'ENTERNAME' : 'Bitte gib deinen Namen ein',
            'SENDMESSAGE' : 'sende eine Nachricht',
            'INTRO_WELCOME' : 'Willkommen zur Konfetti App :)',
            'INTRO_STEP1A' : 'In dieser App geht es um',
            'INTRO_STEP1B' : 'Nachbarschaftshilfe-Parties.',
            'INTRO_STEP2A' : 'Verdiene Konfetti',
            'INTRO_STEP2B' : 'indem du Aufgaben erledigst oder spendest.',
            'INTRO_STEP3A' : 'Nutze Konfetti',
            'INTRO_STEP3B' : 'um selber Aufgaben an die Gemeinschaft zu stellen oder bestehende Aufgaben zu unterstützen.',
            'INTRO_LETSGO' : 'Zeige Konfetti-Parties in meiner Nähe.',
            'CREATENEW'    : 'Neu Erstellen',
            'REDEEM_MAGIC_SUB' : 'Aktivierung von zusätzlichen Funktionen oder Rechten ..',
            'REDEEM_COUPON_SUB' : 'Bitte gib die Code-Nummer deines Gutscheines ein:',
            'ANSWERE' : 'Ergebnis',
            'REQUESTEDON' : 'Angefragt am',
            'REQUESTDONE': 'Auf erledigt setzen - Konfetti verteilen',
            'REQUESTDELETE': 'Aufgabe löschen',
            'REQUESTAPPROVE': 'Aufgabe freischalten',
            'REQUESTREJECT': 'Aufgabe ablehnen',
            'REQUESTPROCESS' : 'Hilfe gefunden - keine weiteren Chats',
            'REQUESTREOPEN' : 'Aufgabe wieder für Chats öffnen',
            'ENTERREASON' : 'Ablehungsbegründung',
            'CONFIRM_DELETE' : 'Wirklich löschen?',
            'CONFIRM_DELETE_AUTHOR' : 'Bei Löschung erhält der Autor kein Konfetti zurück. Hinzugegebenes Konfetto von anderen wird zurückerstattet. Wirklich löschen?',
            'REQUESTREJECT_AFTER' : 'Aufgabe zurückziehen',
            'EXPLAIN_REVIEW_USER' : 'Noch nicht öffentlich - Warten auf Freigabe.',
            'EXPLAIN_REVIEW_ADMIN' : 'Bitte freigeben oder ablehnen.',
            'EXPLAIN_REJECTED' : 'Nicht öffentlich - Wurde abgelehnt.',
            'EXPLAIN_PROCESSING_AUTHOR' : 'Öffentlich - doch für weitere Hilfsangebote geblockt. Wenn weitere Hilfe benötigt wird, Aufgabe wieder öffnen oder Konfetti verteilen, wenn erledigt.',
            'EXPLAIN_PROCESSING_PUBLIC' : 'Ausreichend Hilfe wurde zugesagt. Daher ist der Chat deaktiviert.',
            'EXPLAIN_OPEN_AUTHOR' : 'Öffentlich. Bitte Chatanfrage beantworten und und wenn erledigt Konfetti verteilen.',
            'EXPLAIN_OPEN_PUBLIC' : 'Du willst mithelfen? Dann frage im Chat nach Details. Du willst diese Aufgabe unterstützen? Dann spende dein Konfetti für die Belohnung mit dem Gefällt-Mir Button.',
            'EXPLAIN_DONE_PUBLIC' : 'Wurde bereits erledigt. Kommt bald ins Archiv.',
            'EXPLAIN_DONE_AUTHOR' : 'Erledigt. Noch öffentlich sichtbar.',
            'IMAGE' : 'Bild',
            'TEXT'  : 'Text',
            'LOCATION' : 'Ort',
            'ADDTEXT' : 'Add Text',
            'ENTERTEXT' : 'Enter the text you like to add:',
            'REWARDKONFETTI' : 'Konfetti verteilen',
            'SELECTREWARD' : 'wähle eine oder mehrere Personen',
            'INFO' : 'Info',
            'INFO_ZEROKONFETTI' : 'Du hast kein Konfetti um diese Aufgabe zu unterstützen. Für mehr Konfetti siehe Party Info.',
            'OK' : 'OK',
            'CANCEL' : 'Abbrechen',
            'PLEASE_REVIEW' : 'bitte freigeben',
            'INFO_REQUESTFAIL' : 'Internet überprüfen. Später noch einmal probieren.',
            'INFO_FAILTRYAGAIN': 'Das hat nicht geklappt. Bitte noch einmal probieren oder an die Entwickler melden.',
            'AUTOTRANSLATE_HEAD' : 'Automatische Übersetzung',
            'AUTOTRANSLATE_INFO' : 'Dieser Text wurde automatisiert von einem Roboter aus einer anderen Sprache übersetzt. Roboter sind nicht perfekt. Die Übersetzung kann fehlerhaft sein.',
            'USELOCATION' : 'Die aktuelle Position hinzufügen?',
            'SELECT_LESS' : 'Bitte weniger auswählen.',
            'CHECK_MEDIAITEMS' : 'enthält weitere Medienelemente (siehe unten)',
            'KEEP_HEADLINE_SHORT' : 'versuch die Überschrift kurz zu halten',
            'INVALID_EMAIL' : 'Bitte eine gültige eMail eingeben.',
            'EMAIL_OK' : 'Danke. Deine eMail wurde gespeichert. Weitere Infos wurden dir zugesandt.',
            'EMAIL_NEEDED' : 'Bitte zuerst eine eMail angeben, um Coupons zu erstellen.',
            'EMAIL_INFO' : 'eMail für Konfetti Backup und wichtige Ankündigungen:',
            'SAVE' : 'speichern',
            'WELCOME_PARTY' :'Willkommen zu dieser Konfetti-Party.',
            'REWARD_NOTI' : 'Du hast Konfetti erhalten.',
            'PARTYADMIN_OPTIONS' : 'Party Admin Optionen',
            'CREATE_COUPONS' : 'Konfetti Coupons erstellen',
            'COUPON_COUNT' : 'Anzahl der Coupons:',
            'COUPON_AMOUNT' : 'Konfetti pro Coupon:',
            'CREATE_COUPON_TITLE' : 'Konfetti Coupons erstellen',
            'CREATE_COUPON_SUBLINE' : 'die Coupons werden als PDF per eMail zugesandt',
            'CREATE_COUPON_OK' : 'Die Coupons wurden erstellt. Bitte eMail Eingang prüfen.',
            'NOTIFICATION_PAYBACK' : 'Eine Aufgabe die Du unterstützt hattest wurde abgebrochen = Zurückzahlung.',
            'NOTIFICATION_SUPPORTWIN' : 'Eine Aufgabe die Du unterstüzt hast wurde erledigt.',
            'INFO_REWARD' : 'Du hast für diese Aufgabe erhalten',
            'INFO_SUPPORT' : 'Du hast diese Aufgabe unterstützt',
            'SELECT_LANG' : 'Bitte Sprache auswählen.',
            'GPSFALLBACK_TITLE' : 'Wo befindet sich deine Nachbarschaft?',
            'GPSFALLBACK_SUB' : 'Bitte nenne uns Postleizahl und Land',
            'ZIPCODE' : 'Postleitzahl:',
            'COUNTRY' : 'Land:',
            'COUNTRY_GERMANY' : 'Deutschland',
            'GPSFALLBACK_GPS' : 'Versuch GPS',
            'GPSFALLBACK_FAIL' : 'Die Postleitzahl konnte nicht verarbeitet werden. Besteht Internetverbindung?',
            'GPSFALLBACK_NEEDED' : 'Bitte Postleitzahl eingaben.',
            'DATE' : 'Datum & Zeit',
            'ADDDATE_TITLE' : 'Datum & Zeit',
            'ADDDATE_SUB' : 'und bitte kurze Terminbeschreibung hinzufügen',
            'ADDDATE_DESCRIPTION' : 'Beschreibung',
            'LOGIN_WELCOME' : 'Willkommen zur Konfetti App',
            'LOGIN_STEP1' : 'Da die App auf einem Browser aufgerufen wird, ist ein Login nötig. Bist du zum ersten mal hier, bitte registrier dich mit eMail und Passwort.',
            'LOGINBUTTON_REGISTER' : 'Neu-Registrierung',
            'LOGINBUTTON_LOGIN' : 'Login',
            'LOGINBUTTON_LOGINFORGOT' : 'Ich habe mein Passwort vergessen.',
            'LOGIN_INFO' : 'Bitte einloggen:',
            'REGISTER_INFO' : 'Bitte registrien:',
            'EMAIL' : 'eMail',
            'PASSWORD' : 'Passwort',
            'RECOVER_TITLE' : 'Passwort Vergessen',
            'RECOVER_EXPLAIN' : 'Bitte eMail eingeben, welche bei er Registrierung verwendet wurde. Es wird dann ein neues Passwort versandt.',
            'RECOVER_BUTTON' : 'Neues Passwort anfordern',
            'RECOVER_WIN' : 'OK. Es wurde dir ein neues Passwort zugesandt.',
            'RECOVER_FAIL' : 'Zurücksetzen des Passworts war nicht möglich. Bitte eMail Adresse und Internetverbindung prüfen.',
            'LOGIN_FAIL' : 'Login fehlgeschlagen. Bitte eMail Adresse, Passwort und Internetverbindung prüfen.',
            'REGISTER_FAIL' : 'Registrierung fehlgeschlagen. Bitte eMail Adresse, Passwort und Internetverbindung prüfen.',
            'REGISTER_FAILMAIL' : 'eMail ist bereits in Verwendung. If you forgot the password, try to reset.',
            'PASSWORD_LENGTH' : 'Das Password benötigt mindestens 8 Zeichen.',
            'EMAIL_VALID' : 'Bitte eine gültige eMail als Nutzername verwenden.',
            'LOGOUT_REMINDER' : '= Logout wenn fertig'
   });

   $translateProvider.translations('ar', {
            'INIT' : '... جار التحميل ...',
            'TAB_PARTIES' : 'حفلات',
            'TAB_REQUEST' : 'طلب',
            'TAB_REQUEST_NEW' : 'طلب',
            'TAB_MORE' : 'مهر',
            'KONFETTI' : 'حلويات',
            'KONFETTI-APP' : 'حلويات',
            'PARTYINFO_TITLE': 'منظم',
            'PARTYINFO_SUB': 'المسؤولية التحريرية',
            'POSTSORT_MOST': 'شعبية',
            'POSTSORT_NEW': 'جديد',
            'DASHHEADER_REVIEW': 'مراجعة',
            'DASHHEADER_POSTED': 'استفساراتك',
            'DASHHEADER_ACTIVE': 'ردكم',
            'DASHHEADER_OPEN': 'طلبات نشطة',
            'DASHHEADER_RECENTLYDONE': 'فعلت مؤخرا',
            'NOTIFICATION_REVIEWOK' : 'طلبك الآن العام',
            'NOTIFICATION_REVIEWFAIL' : 'وقد رفض طلبك',
            'NOTIFICATION_CHATREQUEST' : 'كنت حصلت على رسالة دردشة',
            'NOCONTENT' : 'أي طلب حتى الآن',
            'NEWREQUEST' : 'جعل طلب جديد',
            'YOURNAME' : 'اسم الدين',
            'YOURREQUEST' : 'اسم الدين',
            'PUBLICINFO' : 'معلومات عامة',
            'PRIVATECHATS' : 'دردشات خاصة',
            'ADDINFO' : 'الصورة والنص و إضافة معلومات الموقع',
            'ISPEAK' : 'أتكلم',
            'SUBMIT' : 'إرسال طلب',
            'REWARD' : 'مكافأة',
            'YOUGIVE' : 'انت تعطى',
            'IMPORTANT' : 'مهم',
            'ENTERNAME' : 'الرجاء إدخال اسمك.',
            'THANKYOU' : 'شكرا',
            'SUBMITINFO' : 'يحصل استعرض طلبك الآن . سوف تحصل على إخطار مرة واحدة فمن العام.',
            'SUBMITINFO_NOREVIEW' : 'مهمتك هي الآن العامة.',
            'ENTERREQUEST' : 'الرجاء إدخال وصف طلب القصير.',
            'PARTYWAIT' : 'حزب تحميل',
            'INTERNETFAIL' : 'لا إنترنت',
            'ACCOUNTWAIT' : 'تسجيل',
            'GPSWAIT' : 'الحصول على موقف',
            'GPSFAIL' : 'يرجى تفعيلها GPS',
            'PARTYLISTWAIT' : 'الأحزاب التحميل',
            'YOUCOLLECT' : 'كنت جمعت الكلي',
            'YOUTOP' : 'كنت ضمن أفضل',
            'REDEEMCOUPON' : 'استبدال القسيمة',
            'MAGICCODE' : 'أدخل كلمة المرور ماجيك',
            'GLOBALSETTINGS' : 'إعدادات',
            'ENABLEPUSH' : 'تمكين إخطارات',
            'PAUSECHAT' : 'وقفة الدردشة',
            'NEEDSGPS'  : 'بدوره على الموقع',
            'NEEDSINTERNET'  : 'يحتاج اتصال بالإنترنت',
            'LOWKONFETTI'  : 'لديك حلويات صغيرة جدا لفتح الطلب.',
            'MINKONFETTI'  : 'الحد الأدنى اللازم',
            'CONTACT' : 'اتصال',
            'HELPOUT' : 'مساعدة و تكسب ما يصل الى',
            'GETREWARD' : 'كمكافأة',
            'HELPCHAT' : 'بدء الدردشة',
            'HELPCHAT_CONT' : 'مواصلة الدردشة',
            'INTERNETPROBLEM' : 'مشكلة مع الاتصال. الرجاء معاودة المحاولة في وقت لاحق.',
            'ENTERNAME' : 'من فضلك أدخل إسمك',
            'SENDMESSAGE' : 'ارسل رسالة',
            'INTRO_WELCOME' : 'أهلا بك',
            'INTRO_STEP1A' : 'هذا التطبيق هو عن الأحزاب مساعدة الجوار .',
            'INTRO_STEP1B' : '',
            'INTRO_STEP2A' : '',
            'INTRO_STEP2B' : 'كسب حلويات من رعاية المهام أو عن طريق التبرع .',
            'INTRO_STEP3A' : '',
            'INTRO_STEP3B' : 'استخدام الورق الملون لإضافة مهام ل مجتمع أو لغاية التصويت المهام الحالية .',
            'INTRO_LETSGO' : 'تظهر الأطراف حلويات في مجال اختصاصي .',
            'CREATENEW'    : 'خلق فرص عمل جديدة',
            'REDEEM_MAGIC_SUB' : 'تنشيط الميزات ، إضافة امتيازات',
            'REDEEM_COUPON_SUB' : 'الرجاء إدخال قانون رقم الكوبون الخاص بك:',
            'ANSWERE' : 'نتيجة',
            'REQUESTEDON' : 'طلب على',
            'REQUESTDONE': 'تأكيد الطلب كما فعلت',
            'REQUESTDELETE': 'حذف الطلب',
            'REQUESTAPPROVE': 'الموافقة على طلب',
            'REQUESTREJECT': 'رفض طلب',
            'REQUESTPROCESS' : 'مساعدة وجدت - لا مزيد من الأحاديث',
            'REQUESTREOPEN' : 'إعادة فتح للعروض المساعدة',
            'ENTERREASON' : 'سبب الرفض',
            'CONFIRM_DELETE' : 'حذف بالتأكيد ؟',
            'CONFIRM_DELETE_AUTHOR' : 'حذف بالتأكيد ؟',
            'REQUESTREJECT_AFTER' : 'إلغاء طلب',
            'EXPLAIN_REVIEW_USER' : 'ليس الجمهور حتى الآن - في انتظار المراجعة.',
            'EXPLAIN_REVIEW_ADMIN' : 'الرجاء اختيار رفض أو الموافقة على هذا الطلب.',
            'EXPLAIN_REJECTED' : 'لا الجمهور - رفض .',
            'EXPLAIN_PROCESSING_AUTHOR' : 'المقرر افتتاحه مرة أخرى اذا كنت بحاجة الى مزيد من المساعدة. مكافأة النثار عند الانتهاء.',
            'EXPLAIN_PROCESSING_PUBLIC' : 'كان لا يزال مفتوحا ، ولكن المؤلف وعدت بالفعل المساعدة. حتى الدردشة و إبطال مفعولها .',
            'EXPLAIN_OPEN_AUTHOR' : 'هو الجمهور . الرجاء الاجابه الأحاديث الواردة و مكافأة حلويات بمجرد القيام به.',
            'EXPLAIN_OPEN_PUBLIC' : 'إذا كنت مهتما للمساعدة، بدء الدردشة و السؤال عن التفاصيل. لدينا فقط حتى التصويت مع حلويات الخاص بك .',
            'EXPLAIN_DONE_PUBLIC' : 'فعلت بنجاح . فقط مرئية للأرشيف',
            'EXPLAIN_DONE_AUTHOR' : 'تم الانتهاء من. لا يزال الجمهور ليرى الناس .',
            'IMAGE' : 'صورة',
            'TEXT'  : 'نص',
            'LOCATION' : 'موقع',
            'ADDTEXT' : 'اضافة نص',
            'ENTERTEXT' : 'أدخل النص الذي ترغب في إضافة :',
            'REWARDKONFETTI' : 'حلويات مكافأة',
            'SELECTREWARD' : 'اختيار واحد أو أكثر من شخص',
            'INFO' : 'المعلومات',
            'INFO_ZEROKONFETTI' : 'لا يوجد لديك حلويات لدعم هذا الطلب . انظر المعلومات الأحزاب كيفية الحصول على قصاصات من الورق .',
            'OK' : 'حسنا',
            'CANCEL' : 'إلغاء',
            'PLEASE_REVIEW' : 'من فضلك اعد النظر',
            'INFO_REQUESTFAIL' : 'تحقق الإنترنت أو المحاولة مرة أخرى في وقت لاحق .',
            'INFO_FAILTRYAGAIN': 'وهذا فشل. الرجاء المحاولة مرة أخرى أو يقدم للمطورين.',
            'AUTOTRANSLATE_HEAD' : 'السيارات ترجمة',
            'AUTOTRANSLATE_INFO' : 'كان هذا النص السيارات وترجم من قبل الروبوت . يرجى أن نضع في اعتبارنا، أن الروبوتات ليست مثالية و ارتكاب الأخطاء .',
            'USELOCATION' : 'هل ترغب في إضافة موقعك الحالي ؟',
            'SELECT_LESS' : 'الرجاء تحديد أقل.',
            'CHECK_MEDIAITEMS' : 'يحتوي على عناصر وسائط إضافية (انظر أدناه)',
            'KEEP_HEADLINE_SHORT' : 'محاولة للحفاظ على التوجه قصيرة',
            'INVALID_EMAIL' : 'رجاء قم بإدخال بريد الكتروني صحيح.',
            'EMAIL_OK' : 'شكر. البريد الإلكتروني الخاص بك الحصول على تخزين ومزيد من المعلومات إرسالها إلى عنوان الخاص بك.',
            'EMAIL_NEEDED' : 'تحتاج إلى تعيين البريد الإلكتروني الخاص بك لإنشاء القسائم.',
            'EMAIL_INFO' : 'تعيين البريد الإلكتروني للنسخ الاحتياطي وهامة الإعلانات:',
            'SAVE' : 'حفظ',
            'WELCOME_PARTY' :'مرحبا بكم في هذا الحزب حلويات.',
            'REWARD_NOTI' : 'كنت حصلت على مكافأة.',
            'PARTYADMIN_OPTIONS' : 'خيارات مسؤول الحزب',
            'CREATE_COUPONS' : 'إنشاء كوبونات النثار',
            'COUPON_COUNT' : 'عدد القسائم:',
            'COUPON_AMOUNT' : 'حلويات في القسيمة:',
            'CREATE_COUPON_TITLE' : 'إنشاء كوبونات النثار',
            'CREATE_COUPON_SUBLINE' : 'سوف تتلقى رسالة بريد إلكتروني مع وثيقة للطباعة',
            'CREATE_COUPON_OK' : 'القسائم الخاصة بك حصلت بإنشائه. تحقق من بريدك الالكتروني.',
            'NOTIFICATION_PAYBACK' : 'والمهمة التي دعمت حصلت على إلغاء = الاسترداد.',
            'NOTIFICATION_SUPPORTWIN' : 'والمهمة التي دعمت حصلت على القيام به.',
            'INFO_REWARD' : 'كنت حصلت على مكافأة من هذا الطلب مع',
            'INFO_SUPPORT' : 'كنت دعم هذه المهمة',
            'SELECT_LANG' : 'الرجاء تحديد اللغات التي يتكلم .',
            'GPSFALLBACK_TITLE' : 'أين هو منطقتكم؟',
            'GPSFALLBACK_SUB' : 'يرجى يتيح لنا أن نعرف الرمز البريدي الخاص بك والبلاد',
            'ZIPCODE' : 'الرمز البريدي:',
            'COUNTRY' : 'بلد:',
            'COUNTRY_GERMANY' : 'ألمانيا',
            'GPSFALLBACK_GPS' : 'محاولة لتحديد المواقع',
            'GPSFALLBACK_FAIL' : 'عذرا، لم يكن قادرا على معالجة الرمز البريدي. تحقق من اتصال الإنترنت.',
            'GPSFALLBACK_NEEDED' : 'الرجاء إدخال الرمز البريدي.',
            'DATE' : 'تاريخ',
            'ADDDATE_TITLE' : 'إضافة الوقت والتاريخ',
            'ADDDATE_SUB' : 'تحديد موعد ووصف كلمة واحدة',
            'ADDDATE_DESCRIPTION' : 'وصف',
            'LOGIN_WELCOME' : 'مرحبا بكم في النثار التطبيقات',
            'LOGIN_STEP1' : 'لأنك تعمل على متصفح تحتاج إلى تسجيل الدخول. للتسجيل الرجاء البريد الإلكتروني وكلمة المرور إذا كانت هذه هي المرة الأولى.',
            'LOGINBUTTON_REGISTER' : 'تسجيل حساب جديد',
            'LOGINBUTTON_LOGIN' : 'تسجيل الدخول',
            'LOGINBUTTON_LOGINFORGOT' : 'لقد نسيت كلمة المرور',
            'LOGIN_INFO' : 'يرجى تسجيل الدخول في:',
            'REGISTER_INFO' : 'الرجاء التسجيل:',
            'EMAIL' : 'البريد الإلكتروني',
            'PASSWORD' : 'كلمه السر',
            'RECOVER_TITLE' : 'استعادة كلمة السر',
            'RECOVER_EXPLAIN' : 'أدخل البريد الإلكتروني الذي استخدمته للتسجيل، وسوف نرسل لك كلمة مرور جديدة.',
            'RECOVER_BUTTON' : 'اعادة تعيين كلمة السر',
            'RECOVER_WIN' : 'حسنا. يرجى التحقق من بريدك الالكتروني لكلمة مرور جديدة.',
            'RECOVER_FAIL' : 'لم يكن قادرا على إعادة تعيين كلمة المرور. يرجى التحقق من البريد الإلكتروني والاتصال بشبكة الانترنت.',
            'LOGIN_FAIL' : 'لم يكن قادرا على تسجيل الدخول. يرجى التحقق من البريد الإلكتروني وكلمة السر والاتصال بشبكة الانترنت.',
            'REGISTER_FAIL' : 'لم يكن قادرا على تسجيل. يرجى التحقق من البريد الإلكتروني وكلمة السر والاتصال بشبكة الانترنت.',
            'REGISTER_FAILMAIL' : 'البريد الإلكتروني قيد الاستخدام بالفعل. إذا كنت قد نسيت كلمة المرور، في محاولة لإعادة تعيين.',
            'PASSWORD_LENGTH' : '8 أحرف الحد الأدنى لكلمة المرور',
            'EMAIL_VALID' : 'يرجى إدخال عنوان بريد إلكتروني صالح كما اسم المستخدم',
            'LOGOUT_REMINDER' : 'تسجيل الخروج عند الانتهاءك.'
   });

  $translateProvider.preferredLanguage("en");
  $translateProvider.useSanitizeValueStrategy('escape');

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: '/tab',
    abstract: true,
    templateUrl: 'templates/tabs.html'
  })

  // Each tab has its own nav history stack:

  .state('tab.dash', {
    url: '/dash/:id',
    views: {
      'tab-dash': {
        templateUrl: 'templates/tab-dash.html',
        controller: 'DashCtrl'
      }
    }
  })

  .state('tab.request', {
          url: '/request',
          views: {
              'tab-chats': {
                  templateUrl:'templates/tab-request.html',
                  controller: 'RequestCtrl'
              }
          }
  })

  .state('tab.request-detail', {
      url: '/request/:id/:area',
      views: {
        'tab-chats': {
          templateUrl: 'templates/tab-request.html',
          controller: 'RequestCtrl'
        }
      }
  })

  .state('tab.chat-detail', {
      url: '/chats/:id',
      views: {
        'tab-chats': {
          templateUrl: 'templates/chat-detail.html',
          controller: 'ChatDetailCtrl'
        }
      }
  })

  .state('tab.account', {
    url: '/account',
    views: {
      'tab-account': {
        templateUrl: 'templates/tab-account.html',
        controller: 'AccountCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/dash/0');

});

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) {
            return true;
        }
    }
    return false;
};

function cloneObject(obj) {
    if (obj === null || typeof obj !== 'object') {return obj;}
    var temp = obj.constructor();
    for (var key in obj) {
        temp[key] = cloneObject(obj[key]);
    }
    return temp;
}