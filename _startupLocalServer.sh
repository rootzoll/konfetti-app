echo "Use CTRL-C to stop local server ..."
read -p "Press any key now to start local server ... " -n1 -s
cd api
mvn spring-boot:run
