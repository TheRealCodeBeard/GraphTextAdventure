#!/bin/bash
pkill node
cd ../npcs
node server.js &

cd ..
node server.js &
sleep 1
node app.js
