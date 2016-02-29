killall node
rm -Rf couponGenerator
git clone https://github.com/rootzoll/chisel.git couponGenerator
cd couponGenerator
npm install
node src/index.js &
cd ..
echo "COUPON GENERATOR STARTED ON PORT 2342"