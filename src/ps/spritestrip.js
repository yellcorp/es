/*global require,
	$,
	app,
	BitsPerChannelType,
	DocumentFill,
	ExportOptionsSaveForWeb,
	ExportType,
	File,
	Folder,
	NewDocumentMode,
	SaveDocumentType,
	SaveOptions,
	UnitValue
*/
require([
	"ps/spritestrip/NestedStyle",
	"es/CSS",
	"es/FileFilterUtil",
	"es/Path",
	"json",
	"underscore"
],
function (
	NestedStyle,
	CSS,
	FileFilterUtil,
	Path,
	JSON,
	_
) {
"use strict";


var config;


function getPath(relPath) {
	return Path.join(config.base, relPath);
}


function relativePath(path, relativeTo) {
	return new File(path).getRelativeURI(relativeTo);
}


function enumerateFiles() {
	var masterFolder = new Folder(getPath(config.master)),
		masterFiles = masterFolder.getFiles(FileFilterUtil.getBitmapFilter()),
		fileJobs = _.map(masterFiles, function (masterFile) {
			var baseName = masterFile.name,
				states = {
					"": masterFile
				};

			if (config.states) {
				_.each(config.states, function (statePath, stateName) {
					var derivedFile = new File(Path.join(getPath(statePath), baseName));
					if (derivedFile.exists) {
						states[stateName] = derivedFile;
					}
				});
			}
			return states;
		});
	return fileJobs;
}


function calcSheetSize(jobs, dimensions) {
	var spriteCount = 0;
	_.each(jobs, function (job) {
		spriteCount += _.size(job);
	});
	return {
		x: dimensions.x,
		y: spriteCount * dimensions.y
	};
}


function createDoc(dimensions) {
	return app.documents.add(
		new UnitValue(dimensions.x, "px"),
		new UnitValue(dimensions.y, "px"),
		72,
		"New Document",
		NewDocumentMode.RGB,
		DocumentFill.TRANSPARENT,
		1,
		BitsPerChannelType.EIGHT,
		"sRGB");
}


function duplicateFlat(doc) {
	var tempLayer = doc.artLayers.add(),
		flat = doc.duplicate("Flat duplicate", true);

	flat.artLayers[flat.artLayers.length - 1].isBackgroundLayer = false;
	app.activeDocument = doc;
	tempLayer.remove();
	return flat;
}


function alignRect(rect, reference, param) {
	return {
		x: reference.x + param.x * (reference.width - rect.width),
		y: reference.y + param.y * (reference.height - rect.height),
		width: rect.width,
		height: rect.height
	};
}


function pixelRect(uva) {
	var xmin = uva[0].as("px"),
		ymin = uva[1].as("px"),
		xmax = uva[2].as("px"),
		ymax = uva[3].as("px");

	return {
		x: xmin,
		y: ymin,
		width: xmax - xmin,
		height: ymax - ymin
	};
}


function layerTranslateAbsolute(layer, x, y) {
	var sx = layer.bounds[0].as("px"),
		sy = layer.bounds[1].as("px"),
		tx = x.as("px"),
		ty = y.as("px");

	layer.translate(
		new UnitValue(Math.round(tx - sx), "px"), 
		new UnitValue(Math.round(ty - sy), "px")
	);
}


function copyMergedDocument(doc) {
	var sel;
	app.activeDocument = doc;
	sel = doc.selection;
	sel.selectAll();
	sel.copy(true);
	sel.deselect();
}


function closeWithoutSaving(doc) {
	doc.close(SaveOptions.DONOTSAVECHANGES);
}


function insertIntoSheet(source, target, dimensions, align, index) {
	var flatSource = duplicateFlat(source),
		cropper = createDoc(dimensions),
		croppedLayer,
		alignedCropPosition,
		situatedLayer,
		targetPosition,
		situatedPosition;

	copyMergedDocument(flatSource);

	app.activeDocument = cropper;
	croppedLayer = cropper.paste();

	alignedCropPosition = alignRect(
		pixelRect(croppedLayer.bounds), {
			x: 0,
			y: 0,
			width: dimensions.x,
			height: dimensions.y
		}, align);

	layerTranslateAbsolute(
		croppedLayer, 
		new UnitValue(alignedCropPosition.x, "px"), 
		new UnitValue(alignedCropPosition.y, "px"));

	copyMergedDocument(cropper);

	app.activeDocument = target;
	situatedLayer = target.paste();

	targetPosition = {
		x: 0,
		y: dimensions.y * index,
		width: dimensions.x,
		height: dimensions.y
	};

	situatedPosition = alignRect(
		pixelRect(situatedLayer.bounds), targetPosition, align);

	layerTranslateAbsolute(
		situatedLayer, 
		new UnitValue(situatedPosition.x, "px"), 
		new UnitValue(situatedPosition.y, "px"));

	_.each([ flatSource, cropper ], closeWithoutSaving);

	return targetPosition;
}


function generateStyle(rootName, imagePath, sheetSize, images, ppl) {
	var root = new NestedStyle({
			"background-image": "url(" + CSS.quote(imagePath) + ")"
		});

	if (ppl !== 1) {
		root.properties["background-size"] =
			CSS.unit(sheetSize.x / ppl, "px") + " " +
			CSS.unit(sheetSize.y / ppl, "px");
	}

	_.each(images, function (image) {
		var targetRule = root;
		targetRule = targetRule.childRule("." + CSS.toIdentifier(Path.splitExt(image.name)[0]));
		if (image.role) {
			targetRule = targetRule.childRule("." + image.role);
		}
		_.each(["x", "y"], function (axis) {
			if (image.position[axis] !== 0) {
				targetRule.properties["background-position-" + axis] =
					CSS.unit(-image.position[axis] / ppl, "px");
			}
		});
	});

	return root.generate(rootName);
}


function saveImage(document, path) {
	var file = new File(path),
		options = new ExportOptionsSaveForWeb();

	options.format = SaveDocumentType.PNG;
	options.PNG8 = false;
	options.transparency = true;
	options.webSnap = 0;

	document.exportDocument(file, ExportType.SAVEFORWEB, options);

	$.writeln("Image: " + file.fsName);
}


function create(jobs, dimensions, align, ppl) {
	var sheetSize = calcSheetSize(jobs, dimensions),
		sheetDoc = createDoc(sheetSize),
		imageNum = 0,
		results = [ ],
		cssText,
		cssFile;

	_.each(jobs, function (job) {
		var roles = _.keys(job).sort();
		_.each(roles, function (role) {
			var inFile = job[role],
				inDoc = app.open(inFile),
				position = insertIntoSheet(
					inDoc, sheetDoc, dimensions, align, imageNum++);
			closeWithoutSaving(inDoc);
			results.push({
				name: inFile.name,
				role: role,
				position: position
			});
		});
	});

	saveImage(sheetDoc, getPath(config.output.image));

	cssText = generateStyle(
		config.output.rule,
		relativePath(
			getPath(config.output.image),
			getPath(config.output.textBase || config.output.text)),
		sheetSize, results, ppl);

	cssFile = new File(getPath(config.output.text));
	cssFile.encoding = "UTF-8";
	cssFile.lineFeed = "Unix";
	if (cssFile.open("w")) {
		cssFile.write(cssText);
		cssFile.close();
		$.writeln("Text: " + cssFile.fsName);
	} else {
		throw new Error("Couldn't open " + cssFile.fsName + " for writing: " + cssFile.error);
	}

	closeWithoutSaving(sheetDoc);
}


function main() {
	var configFile = File.openDialog("Select config JSON"),
		configText;

	if (configFile) {
		if (configFile.open("r")) {
			configText = configFile.read();
			configFile.close();
			config = JSON.parse(configText);
		} else {
			throw new Error("Couldn't open " + configFile.fsName + " for reading: " + configFile.error);
		}
		create(enumerateFiles(), config.dimensions, config.align, config.ppl);
	} else {
		$.writeln("Cancelled");
	}
}

return main();
});
