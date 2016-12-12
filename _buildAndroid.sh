echo "NODE VERSION"
node -v
read -p "Node version above is >=6.3 - yes=ENTER / no=CTRL+c"
echo "CORDOVA VERSION:"
cordova -version
read -p "Cordova Version is >=6.3 ? yes=ENTER / no=CTRL+c"
echo "IONIC VERSION:"
ionic -version
read -p "Ionic Version is >=2.0 ? yes=ENTER / no=CTRL+c"
ionic state reset
npm install -g bower
bower install
ionic resources
ionic build android
echo 'For Release Build with check private KeePassX for --> Konfetti Android Build Notes'