taskkill /F /IM node.exe /T
cd ..\npcs
node server.js &

cd ..
node server.js &
sleep 1
node app.js
