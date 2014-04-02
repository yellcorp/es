#!/bin/sh

# npm install jshint
JSHINT=node_modules/jshint/bin/jshint

for basedir in src lib/es
do
	find $basedir -iname "*.js" \
		-print0 | xargs -0 $JSHINT --config=jshintconfig.json
done
