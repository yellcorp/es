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
	"ps/spritestrip/makeConfig",
	"es/CSS",
	"es/FileFilterUtil",
	"es/Path",
	"json",
	"underscore"
],
function (
	NestedStyle,
	makeConfig,
	CSS,
	FileFilterUtil,
	Path,
	JSON,
	_
) {
"use strict";


function relativePath(path, relativeTo) {
	return new File(path).getRelativeURI(relativeTo);
}


function enumerateFiles(masterPath, statePaths) {
	var masterFolder = new Folder(masterPath),
		masterFiles = masterFolder.getFiles(FileFilterUtil.getBitmapFilter()),
		fileJobs = _.map(masterFiles, function (masterFile) {
			var baseName = masterFile.name,
				states = {
					"": masterFile
				};

			if (statePaths) {
				_.each(statePaths, function (statePath, stateName) {
					var derivedFile = new File(Path.join(statePath, baseName));
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


function run(config) {
	var jobs = enumerateFiles(config.master, config.states),
		dimensions = config.dimensions,
		align = config.align,
		ppl = config.ppl,

		outTextPath = config.output.text,
		outTextBase = config.output.textBase,
		outImagePath = config.output.image,
		topRule = config.output.rule,

		sheetSize = calcSheetSize(jobs, dimensions),
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

	saveImage(sheetDoc, outImagePath);

	cssText = generateStyle(
		topRule,
		relativePath(outImagePath, outTextBase),
		sheetSize, results, ppl);

	cssFile = new File(outTextPath);
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


function runFile(configFile) {
	var configText,
		config;

	$.writeln(configFile.fsName);
	if (configFile.open("r")) {
		configText = configFile.read();
		configFile.close();
		config = makeConfig(
			JSON.parse(configText), Path.dirName(configFile.fsName));
		run(config);
	} else {
		$.writeln("Couldn't open " + configFile.fsName + " for reading: " + configFile.error);
	}
}


function main() {
	var configFiles = File.openDialog("Select config JSON", null, true);

	if (configFiles) {
		_.each(configFiles, runFile);
	} else {
		$.writeln("Cancelled");
	}
}

return main();
});
