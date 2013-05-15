/*jslint plusplus: true, white: true */
/*global define */
define([],
function () {
"use strict";


function join(a, b) {
	return a.replace(/\/+$/, "") + "/" + b.replace(/^\/+/, "");
}


function split(p) {
	var slash = p.lastIndexOf("/");
	if (slash >= 0) {
		return [ p.substr(0, slash + 1), p.substr(slash + 1) ];
	}
	return [ "", p ];
}


function dirName(p) {
	return split(p)[0];
}


function baseName(p) {
	return split(p)[1];
}


function splitExt(p) {
	var ps = split(p),
		dirName = ps[0],
		baseName = ps[1],
		dot = baseName.lastIndexOf("."),
		bareName, ext;

	if (dot > 0) {
		// deliberately > 0 - a dot at position 0 is not considered an
		// extension, rather a convention to mark a file as hidden
		bareName = baseName.substr(0, dot);
		ext = baseName.substr(dot);
	} else {
		bareName = baseName;
		ext = "";
	}

	return [ dirName ? join(dirName, bareName) : bareName, ext ];
}


return {
	join: join,
	split: split,
	dirName: dirName,
	baseName: baseName,
	splitExt: splitExt
};
});
