To start server:

Change into main directory and run command
"mvn spring-boot:run"

- service should be running on port 9000

To stop the server:
- just press CTRL-C in console, or kill the process

To change the Profile, change the value "spring.profiles.active" in file "api/src/main/resources/application.properties"

existing Profiles at the moment:
dev
    -> using mysql for persistenc, adjust values for your mysql server accordingly in file application-dev.properties (spring.datasource.user and spring.datasource.password)
test
    -> using H2 inMemory Database

to test if the server is running correctly, call the URL http://localhost:9000/konfetti/api/account

should return something like this "{"clientId":"1","secret":"3915478b-f51d-4306-ab3b-fa7762f4c6bc","userId":"1"}"

## Release an Android App for the Google Play Store
more informations under :
http://ionicframework.com/docs/guide/publishing.html

* cordova build --release android
* [JDK] keytool -genkey -v -keystore my-release-key.keystore -alias konfetti -keyalg RSA -keysize 2048 -validity 10000
* [JDK] jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk konfetti
* zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk Konfetti.apk