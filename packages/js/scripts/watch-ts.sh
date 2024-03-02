#!/bin/bash

# This script is used to watch for changes in the typescript files and rebuild the revert.js file
# It is used in the watch:ts:default script in the package.json file


if [ ! -d ../react/src/lib/build ]; then mkdir -p ../react/src/lib/build; fi
if [ ! -f ../react/src/lib/build/revert-dev.js ]; then touch ../react/src/lib/build/revert-dev.js; fi
if [ ! -d ../vue/src/lib/build ]; then mkdir -p ../vue/src/lib/build; fi
if [ ! -f ../vue/src/lib/build/revert-dev.js ]; then touch ../vue/src/lib/build/revert-dev.js; fi
yarn run build
cp dist/revert.js ../react/src/lib/build/revert-dev.js
cp dist/revert.js ../vue/src/lib/build/revert-dev.js
