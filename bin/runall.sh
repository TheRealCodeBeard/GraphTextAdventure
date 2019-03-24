#!/bin/bash

#
# Run everything!
#

MY_PATH=`dirname $0`
pushd $MY_PATH > /dev/null

echo "Killing old servers..."
pkill -f server.js
sleep 1

# Main servers
node ../npc/server.js &
node ../god/server.js &
node ../player/server.js &

# Old server
cd ..
node server.js &

popd > /dev/null