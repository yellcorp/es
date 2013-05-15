/*jslint plusplus: true, white: true */
/*global define */
define([],
function () {
"use strict";


var REGEX_SPECIAL_CHARS = /(\^|\$|\\|\.|\*|\+|\?|\(|\)|\[|\]|\{|\}|\|)/g;


// prefixed with re because 'escape' alone is often a built-in global function
function reEscape(literalString) {
	return literalString.replace(REGEX_SPECIAL_CHARS, "\\$1");
}


function createLiteralMatcher(literalString, anchorStart, anchorEnd, flags) {
	var restr = anchorStart ? "^" : "";
	restr += reEscape(literalString);
	if (anchorEnd) {
		restr += "$";
	}
	return new RegExp(restr, flags || "");
}


function createAlternatesMatcher(literalAlternates, capture, anchorStart, anchorEnd, flags) {
	var escapedAlternates = [ ],
		restr, i;
	for (i = 0; i < literalAlternates.length; i++) {
		escapedAlternates.push(reEscape(literalAlternates[i]));
	}

	restr = (anchorStart ? "^" : "") +
		(capture ? "(" : "(?:") +
		escapedAlternates.join("|") +
		(anchorEnd ? ")$" : ")");

	return new RegExp(restr, flags || "");
}


return {
	escape: reEscape,
	createLiteralMatcher: createLiteralMatcher,
	createAlternatesMatcher: createAlternatesMatcher
};
});
