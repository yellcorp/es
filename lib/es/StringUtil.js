/*global define */
define([], function () {
"use strict";


function trimLeft(text) {
	return text.replace(/^[\s\0]+/, "");
}

function trimRight(text) {
	return text.replace(/[\s\0]+$/, "");
}

function trim(text) {
	return trimLeft(trimRight(text));
}

function repeat(str, times) {
	if (!str || times <= 0) {
		return "";
	}
	if (times === 1) {
		return str;
	}
	return new Array(times + 1).join(str);
}

function padLeft(str, minWidth, padChar, truncate) {
	padChar = padChar || " ";
	truncate = truncate || false;
	if (str.length === minWidth) {
		return str;
	}
	if (str.length > minWidth) {
		if (truncate) {
			return str.substr(str.length - minWidth);
		}
		return str;
	}
	return repeat(padChar.charAt(0), minWidth - str.length) + str;
}

function padRight(str, minWidth, padChar, truncate) {
	padChar = padChar || " ";
	truncate = truncate || false;
	if (str.length === minWidth) {
		return str;
	}
	if (str.length > minWidth) {
		if (truncate) {
			return str.substr(0, minWidth);
		}
		return str;
	}
	return str + repeat(padChar.charAt(0), minWidth - str.length);
}

function startsWith(query, start, caseSensitive) {
	if (caseSensitive === false) { // has to be explicitly set
		query = query.toLowerCase();
		start = start.toLowerCase();
	}
	return query.slice(0, start.length) === start;
}

function endsWith(query, end, caseSensitive) {
	if (caseSensitive === false) {
		query = query.toLowerCase();
		end = end.toLowerCase();
	}
	return query.slice(-end.length) === end;
}

function stripStart(str, prefix, caseSensitive) {
	if (startsWith(str, prefix, caseSensitive)) {
		return str.slice(prefix.length);
	}
	return str;
}

function stripEnd(str, suffix, caseSensitive) {
	if (endsWith(str, suffix, caseSensitive)) {
		return str.slice(0, -suffix.length);
	}
	return str;
}

function delimiterJoin(a, b, delim, caseSensitive) {
	return stripEnd(a, delim, caseSensitive) +
		delim +
		stripStart(b, delim, caseSensitive);
}

function delimiterJoinArray(values, delim, caseSensitive) {
	var stripped, i, value, valuesLen, lastIndex;

	valuesLen = values.length;
	lastIndex = valuesLen - 1;
	stripped = [ ];

	for (i = 0; i < valuesLen; i++) {
		value = values[i];
		if (i > 0) {
			value = stripStart(value, delim, caseSensitive);
		}
		if (i < lastIndex) {
			value = stripEnd(value, delim, caseSensitive);
		}
		stripped[i] = value;
	}
	return stripped.join(delim);
}


return {
	trimLeft:           trimLeft,
	trimRight:          trimRight,
	trim:               trim,
	repeat:             repeat,
	padLeft:            padLeft,
	padRight:           padRight,
	startsWith:         startsWith,
	endsWith:           endsWith,
	stripStart:         stripStart,
	stripEnd:           stripEnd,
	delimiterJoin:      delimiterJoin,
	delimiterJoinArray: delimiterJoinArray
};
});
