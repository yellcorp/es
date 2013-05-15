/*global define */
define([ "es/RegExpUtil","underscore" ],
function (RegExpUtil,     _) {
"use strict";


var BITMAP_EXTS = [
	"jpg", "jpeg", "jpe", "png", "gif", "bmp", "tiff", "tif", "tga", "exr",
	"psd", "psb", "pcx", "pct" ];


function createPropertyRegexFilter(propName, regex) {
	return function (f) {
		return f && regex.test(f[propName]);
	};
}


function createNameFilter(nameRegex) {
	return createPropertyRegexFilter("name", nameRegex);
}


function createExtensionFilter(extensionArray) {
	var dottedArray = _.map(extensionArray, function (e) {
			e = String(e);
			return e.charAt(0) === "." ? e : ("." + e);
		});
	return createNameFilter(RegExpUtil.createAlternatesMatcher(
		dottedArray, false, false, true, "i"));
}


function getBitmapFilter() {
	return createExtensionFilter(BITMAP_EXTS);
}


return {
	createPropertyRegexFilter: createPropertyRegexFilter,
	createNameFilter: createNameFilter,
	createExtensionFilter: createExtensionFilter,
	getBitmapFilter: _.once(getBitmapFilter)
};
});
