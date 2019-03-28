#!/bin/bash

#
# Install all Node packages
#

MY_PATH=`dirname $0`
pushd $MY_PATH > /dev/null

npm install ..
npm install ../npc
npm install ../god
npm install ../player
npm install ../shared

popd > /dev/null
