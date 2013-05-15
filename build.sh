#!/bin/sh
mkdir -p build/ps
./node_modules/.bin/r.js \
	-o rjsconfig.js \
	name=ps/spritestrip \
	out=build/ps/spritestrip.jsx
