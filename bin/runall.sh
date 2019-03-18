#!/bin/bash

#
# Run everything!
#

MY_PATH=`dirname $0`
pushd $MY_PATH > /dev/null

# Main servers
node ../npc/server.js &
node ../god/server.js &
node ../player/server.js &

# Old server
node ../server.js &

# Now the console app
sleep 1
node ../app.js

echo "Killing old servers..."
pkill -f server.js
sleep 1

popd > /dev/null