/*jslint
	nomen: true,
	plusplus: true,
	white: true
*/
/*global
	require,
	app,
	ExportOptionsSaveForWeb,
	ExportType,
	File,
	SaveDocumentType,
	SaveOptions,
	UnitValue
*/
require([
	"underscore"
], function (
	_
) {
"use strict";


function pixRect(l, t, r, b) {
	return [
			new UnitValue(l, "px"),
			new UnitValue(t, "px"),
			new UnitValue(r, "px"),
			new UnitValue(b, "px")
		];
}


function tile(userDocument, xCount, yCount, saveTemplateString) {
	var doc = userDocument.duplicate(
			userDocument.name + " tile working copy", true),
		originalState,

		pixWidth = doc.width.as("px"),
		pixHeight = doc.height.as("px"),

		saveTemplate = _.template(saveTemplateString),
		saveOptions = new ExportOptionsSaveForWeb(),

		x, y;

	saveOptions.format = SaveDocumentType.PNG;
	saveOptions.PNG8 = false;

	app.activeDocument = doc;
	originalState = doc.activeHistoryState;

	for (y = 0; y < yCount; y++) {
		for (x = 0; x < xCount; x++) {
			doc.activeHistoryState = originalState;
			doc.crop(pixRect(
				Math.round(pixWidth * x / xCount),
				Math.round(pixHeight * y / yCount),
				Math.round(pixWidth * (x + 1) / xCount),
				Math.round(pixHeight * (y + 1) / yCount)
			));
			doc.exportDocument(
				new File(saveTemplate({ x: x, y: y })),
				ExportType.SAVEFORWEB,
				saveOptions);
		}
	}

	doc.close(SaveOptions.DONOTSAVECHANGES);
}


function main() {
// config here for now, hang a ui off it though
	tile(app.activeDocument, 1, 12,
		"~/tile-<%=x%>-<%=y%>.png");
}

return main();
});
