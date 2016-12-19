echo ''
echo '--- BUILD FRAMEWORKS ----------'
echo ''
echo "NODE VERSION should be >=6.3 and is"
node --version
echo "CORDOVA VERSION should be >=6.3 and is"
cordova -version
echo "IONIC VERSION should >2.0 and is"
ionic -version
read -p "--> all versions corerct? yes=ENTER / no=CTRL+c"
echo ''
echo '--- ANDROID SDK ---------------'
echo ''
echo "ANDROID SDK --> open another terminal and call 'android'"
echo "do you have the following packages installed:"
echo "- Tools / Android SDK Tools"
echo "- Tools / Android SDK Platform-tools"
echo "- Android 6.0 (API23) / SDK platform"
echo "- Android 4.1.2 (API16) / SDK platform"
echo "- Extras / Android Support Repository"
echo "- Extras / Google Repository"
echo ''
read -p "Android SDK and required packages are installed yes=ENTER / no=CTRL+c"
echo ''
echo '--- BUILDING ------------------'
echo ''
npm install
ionic state reset
ionic resources
ionic state reset
npm install -g bower
bower install
cp -r ./res/* ./platforms/android/res
ionic build android
rm -r ./res
echo ''
echo '--- FURTHER OPTIONS -----------'
echo ''
echo 'For Release Build with check private KeePassX for --> Konfetti Android Build Notes'
echo 'For further Development Builds just call --> ionic build android'
echo ''