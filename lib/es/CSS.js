/*global define */
define([ "es/RegExpUtil","underscore" ],
function (RegExpUtil,     _) {
"use strict";


var NMSTART_ASCII = /[_a-z]/i,
	NMCHAR_ASCII = /[_a-z0-9\-]/i,
	HEX_DIGIT = /[0-9a-f]/i,
	
	makeQuoteEscapeRegex = _.memoize(
		function (quoteChar) {
			return new RegExp(
				"[\\x00-\\x1f" + RegExpUtil.escape(quoteChar) + "]", "g");
		});


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
		return "\\" + ch.charCodeAt(0).toString(16);
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
	if (!quoteChar) {
		quoteChar = '"';
	}
	return quoteChar +
		str.replace(makeQuoteEscapeRegex(quoteChar, escapeChar)) +
		quoteChar;
}


return {
	unit: unit,
	toIdentifier: toIdentifier,
	quote: quote
};
});
