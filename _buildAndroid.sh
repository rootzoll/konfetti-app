echo '-----------------------------------'
echo "NODE VERSION is"
node -v
read -p "Node version above is >=6.3 - yes=ENTER / no=CTRL+c"
echo '-----------------------------------'
echo "CORDOVA VERSION is"
cordova -version
read -p "Cordova Version is >=6.3 ? yes=ENTER / no=CTRL+c"
echo '-----------------------------------'
echo "IONIC VERSION is"
ionic -version
read -p "Ionic Version is >=2.0 ? yes=ENTER / no=CTRL+c"
echo '-----------------------------------'
echo "ANDROID SDK --> open another terminal and call 'android'"
echo "do you have the following packages installed:"
echo "- Tools / Android SDK Tools"
echo "- Tools / Android SDK Platform-tools"
echo "- Android 6.0 (API23) / SDK platform"
echo "- Android 4.1.2 (API16) / SDK platform"
echo "- Extras / Android Support Repository"
ionic -version
read -p "Android SDK and required packages are installed yes=ENTER / no=CTRL+c"
echo '-----------------------------------'
ionic state reset
npm install -g bower
bower install
ionic resources
ionic build android
echo '-----------------------------------'
echo 'For Release Build with check private KeePassX for --> Konfetti Android Build Notes'
echo 'For further Development Builds just call --> ionic build android'