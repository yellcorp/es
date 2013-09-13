#!/bin/sh

src=src
out=build

for js in $src/{ae,ps}/*.js
do
	barename=${js%.js}
	barename=${barename#$src/}
	outfile=$out/$barename.jsx
	dirname=$(dirname $outfile)
	mkdir -vp $dirname
	./node_modules/.bin/r.js \
		-o rjsconfig.js \
		name=$barename \
		out=$out/$barename.jsx
done
