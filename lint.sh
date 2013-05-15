#!/bin/sh

for basedir in src lib/es
do
	find $basedir -iname "*.js" -print0 | \
		xargs -0 jslint --white --plusplus --nomen
done
