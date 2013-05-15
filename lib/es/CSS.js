/*global define */
define([ "es/RegExpUtil" ],
function (RegExpUtil) {
"use strict";


var NMSTART_ASCII = /[_a-z]/i,
	NMCHAR_ASCII = /[_a-z0-9\-]/i,
	HEX_DIGIT = /[0-9a-f]/i,
	quoteEscapeRegexes = { };


function unit(num, units) {
	if (num === 0 || !units) {
		return String(num);
	}
	return String(num) + String(units);
}


function isNmstart(ch) {
	return ch > "~" || NMSTART_ASCII.test(ch);
}


function isNmchar(ch) {
	return ch > "~" || NMCHAR_ASCII.test(ch);
}


function escapeChar(ch) {
	if ( ch < " " || HEX_DIGIT.test(ch) ) {
		return "\\" + ch.toString(16);
	}
	return "\\" + ch;
}


function matchOrEscape(matchFunc, ch) {
	if (matchFunc(ch)) {
		return ch;
	}
	return escapeChar(ch);
}


function toIdentifier(str) {
	var state = 0, i, ch, result = [ ];

	for (i = 0; i < str.length; i++) {
		ch = str.charAt(i);
		switch (state) {
		case 0:
			if (ch === "-") {
				result.push(ch);
				state = 1;
			} else {
				result.push(matchOrEscape(isNmstart, ch));
				state = 2;
			}
			break;
		case 1:
			result.push(matchOrEscape(isNmstart, ch));
			state = 2;
			break;
		default:
			result.push(matchOrEscape(isNmchar, ch));
			break;
		}
	}
	return result.join("");
}


function quote(str, quoteChar) {
	var re;
	if (!quoteChar) {
		quoteChar = '"';
	}
	re = quoteEscapeRegexes[quoteChar];
	if (!re) {
		re = quoteEscapeRegexes[quoteChar] =
			new RegExp("[\\x00-\\x1f" + RegExpUtil.escape(quoteChar) + "]", "g");
	}
	return quoteChar + str.replace(re, escapeChar) + quoteChar;
}


return {
	unit: unit,
	toIdentifier: toIdentifier,
	quote: quote
};
});
