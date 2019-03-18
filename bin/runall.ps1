#
# Run everything!
#

pushd $PSScriptRoot

# Main servers
node ..\npc\server.js &
node ..\god\server.js &
node ..\player\server.js &

# Old server
node ..\server.js &

# Now the console app
sleep 1
node ..\app.js

# echo "Killing old servers..."
Stop-Process -name node

popd