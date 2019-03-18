#
# Install all Node packages
#

pushd $PSScriptRoot

npm install .
npm install ./npc
npm install ./god
npm install ./player
npm install ./shared

popd