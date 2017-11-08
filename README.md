# Konfetti App

![alt tag](https://api.travis-ci.org/rootzoll/konfetti-app.svg?branch=master)

IMPORTANT: We did a reboot of the KonfettiApp (Ionic3+Angular4+newDesign) - new code/repo here: https://github.com/konfetti-app/konfetti-app

Its an app for neighborhood building thru a community todo list and a playful in-app currency called konfetti.

Get updates and more infos on our facebook-page: https://www.facebook.com/konfetti4change


## Concept Notes

Get konfetti for:
- doing a task on the community todo list
- get a konfetti voucher for helping or donating

Spend konfetti on:
- creating a task on the community todo list
- upvote tasks you like on the community todo list

The app is part of the refugeehackathon, Berlin 2015 - so konfetti exchange can go:
- neighbor2refugee
- refugee2refugee
- refugee2neighbor

... you get the idea :D


## Prototype

Live demo of the app (prototype test-server): http://test.konfettiapp.de

Android Alpha-Release APK: [DOWNLOAD] (https://github.com/rootzoll/konfetti-app/blob/master/releases/konfetti-alpha-08052016.apk?raw=true)


## Contact

For non-programmers: maxie@konfettiapp.de

For programmers: christian@geektank.de


## German Slides

![alt tag](https://raw.githubusercontent.com/rootzoll/konfetti-app/master/concept/slides/1_de.png)

![alt tag](https://raw.githubusercontent.com/rootzoll/konfetti-app/master/concept/slides/2_de.png)

![alt tag](https://raw.githubusercontent.com/rootzoll/konfetti-app/master/concept/slides/3_de.png)

![alt tag](https://raw.githubusercontent.com/rootzoll/konfetti-app/master/concept/slides/4_de.png)

![alt tag](https://raw.githubusercontent.com/rootzoll/konfetti-app/master/concept/slides/5_de.png)

![alt tag](https://raw.githubusercontent.com/rootzoll/konfetti-app/master/concept/slides/6_de.png)


## Join & Meet

If you are a coder, designer or a helping hand on location - feel free to join in - newcomers welcome.

Here is our public [calendar](https://calendar.google.com/calendar/embed?src=1qtlrqsgha4jv6ug26e775gqac@group.calendar.google.com&ctz=Europe/Rome&pli=1) - to join in. 


## Checkout App and Prepare for Running Local

Make sure to have the IONIC framework installed (v1.x): http://ionicframework.com

Then run './_startupAppInBrowser.sh' - than the App should open up in your browser and connect to the public Konfetti server.


## Build Android APK

Use the '_buildAndroid.sh' script on first build.


## Translations

To work together easily on translations we created this tool: https://github.com/rootzoll/angular-translate-sheet-export

Its a script for a Google Sheet that contains all i18n strings and exports it so that updates and translation extensions can be easily transferred into the konfetti app. See project ReadMe for instructions. 

Link to the Google Translation Sheet (Read Only) : https://docs.google.com/spreadsheets/d/1AO5c7H3h25GyNeIslCLgbcpuxtnJA3stFfu4b4lThRM/edit?usp=sharing

To help on the translations get an invite to the Google Sheet by sending an email to chrtistian@konfettiapp.de

## Other Konfetti Software (to run your own server)

The API is the center of the konfetti backend. Check it out and build your Docker Container and do run it with Docker-Compose. To make the local Konfetti App running in your browser connect with this local API change the API URL in the file `www/js/service-appcontext.js` to localhost ... remember to change it back before doing a commit or a pullrequest.

MORE STUFF TO SETUP A KONFETTI SERVER: https://github.com/rootzoll/konfetti-serversetup

API: https://github.com/rootzoll/konfetti-api

... other optional parts of the konfetti backend:

ADMIN-GUI: https://github.com/rootzoll/konfetti-admin

HOMEPAGE: https://github.com/rootzoll/konfetti-homepage

COUPON-GENERATOR: https://github.com/rootzoll/konfetti-coupongenerator
