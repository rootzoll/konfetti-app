# Konfetti App

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


## Building App from Source

Make sure to have the IONIC framework installed (v1.x): http://ionicframework.com

Checkout from git, run 'ionic state reset' and then 'ionic resources' with project folder.


## Running local Server

You need to have Maven installed. Check with 'mvn --version'.

To run server on localhost, go into 'api' folder and run 'mvn spring-boot:run'.


## Run App in local Browser (for development)

Run in project root folder 'ionic serve' - this will run the app in local browser for development.


# Docker

## Run with docker-compose

`cd ~/api
docker build --tag konfetti/backend .
docker-compose up -d`

## To clean up containers and volumes
`docker-compose stop
docker-compose rm -v 
docker volume rm api_konfettiDb`

