/*global
	$,
	app,
	BlendingMode,
	TrackMatteType
*/
require([
	"underscore"
], function (
	_
) {
	"use strict";

	var RESET_INTERVAL_SEC = 2,

		WORK_FOLDER_NAME = "DeltaCrunch items",
		EFFECT_LEVELS_IC = "ADBE Pro Levels2",
		LEVELS_IC_INPUT_BLACK = "ADBE Pro Levels2-0004",
		LEVELS_IC_INPUT_WHITE = "ADBE Pro Levels2-0005",

		EFFECT_SHIFT_CHANNELS = "ADBE Shift Channels",
		SHIFT_CHANNELS_BASE_INDEX = 2,
		SHIFT_CHANNELS_COUNT = 3,
		SHIFT_CHANNELS_LUMA = 5,

		EFFECT_TIME_ECHO = "ADBE Echo",
		TIME_ECHO_INTERVAL = "ADBE Echo-0001",
		TIME_ECHO_COUNT = "ADBE Echo-0002",
		TIME_ECHO_START_INTENSITY = "ADBE Echo-0003",
		TIME_ECHO_DECAY = "ADBE Echo-0004",
		TIME_ECHO_OPERATOR = "ADBE Echo-0005",

		ECHO_OPERATOR_FRONT = 6,

		RESET_TEMPLATE = "timeToFrames() % ({}) === 0 ? 100 : 0";

	function aeCollToArray(collection) {
		var a = [ ], i;
		for (i = 0; i < collection.length; i++) {
			a.push(collection[i + 1]);
		}
		return a;
	}

	function createCompMatching(avItem, name, inFolder) {
		return inFolder.items.addComp(
			name,
			avItem.width, avItem.height,
			avItem.pixelAspect,
			avItem.duration,
			avItem.frameRate);
	}

	function createSolidMatching(avItem, name, color, inComp, inFolder) {
		var solid = inComp.layers.addSolid(
				color,
				name,
				avItem.width,
				avItem.height,
				avItem.pixelAspect,
				avItem.duration);

		if (inFolder) {
			solid.parentFolder = inFolder;
		}
		return solid;
	}

	function applyLumaEffect(layer) {
		var shiftEffect, i;

		layer.adjustmentLayer = true;
		shiftEffect = layer.effect.addProperty(EFFECT_SHIFT_CHANNELS);
		for (i = 0; i < SHIFT_CHANNELS_COUNT; i++) {
			shiftEffect.property(i + SHIFT_CHANNELS_BASE_INDEX).setValue(SHIFT_CHANNELS_LUMA);
		}
		return shiftEffect;
	}

	function applyThresholdEffect(layer, maxBlack) {
		var levelEffect;
		layer.adjustmentLayer = true;
		levelEffect = layer.effect.addProperty(EFFECT_LEVELS_IC);
		levelEffect.property(LEVELS_IC_INPUT_BLACK).setValue(maxBlack / 255);
		levelEffect.property(LEVELS_IC_INPUT_WHITE).setValue((maxBlack + 1) / 255);
		return levelEffect;
	}

	function applyTimeEchoEffect(layer, frameDuration, seconds) {
		var echoEffect = layer.effect.addProperty(EFFECT_TIME_ECHO);
		echoEffect.property(TIME_ECHO_INTERVAL).setValue(-frameDuration);
		echoEffect.property(TIME_ECHO_COUNT).setValue(seconds / frameDuration);
		echoEffect.property(TIME_ECHO_START_INTENSITY).setValue(1);
		echoEffect.property(TIME_ECHO_DECAY).setValue(1);
		echoEffect.property(TIME_ECHO_OPERATOR).setValue(ECHO_OPERATOR_FRONT);
		return echoEffect;
	}

	function createDiffComp(item, folder) {
		var comp = createCompMatching(item, item.name + " diff", folder),
			zeroLayer = comp.layers.add(item),
			oneLayer = comp.layers.add(item),

			lumaLayer = createSolidMatching(
				item, item.name + " diff adjustment", [1, 1, 1], comp, folder),
			lumaEffect,

			levelLayer = comp.layers.add(lumaLayer.source),

			resetLayer = comp.layers.add(lumaLayer.source);

		oneLayer.startTime = comp.frameDuration;
		oneLayer.blendingMode = BlendingMode.DIFFERENCE;

		applyLumaEffect(lumaLayer);
		applyThresholdEffect(levelLayer, 0);

		resetLayer.opacity.expression = 
			RESET_TEMPLATE.replace("{}", item.frameRate * RESET_INTERVAL_SEC);

		return comp;
	}

	function createDeltaComp(item, mask, folder) {
		var comp = createCompMatching(item, item.name + " delta", folder),
			sourceLayer = comp.layers.add(item),
			maskLayer = comp.layers.add(mask);

		sourceLayer.trackMatteType = TrackMatteType.LUMA;
		return comp;
	}

	function createFillComp(delta, name, folder) {
		var comp = createCompMatching(delta, name, folder),
			deltaLayer = comp.layers.add(delta);

		applyTimeEchoEffect(deltaLayer, delta.frameDuration, RESET_INTERVAL_SEC);
		return comp;
	}

	function processSingleItem(item) {
		var parent = item.parentFolder,
			workFolder = parent.items.addFolder(WORK_FOLDER_NAME),
			diffComp = createDiffComp(item, workFolder),
			deltaComp = createDeltaComp(item, diffComp, workFolder),
			fillComp = createFillComp(deltaComp, item.name + " dcrunched", parent);

		return fillComp;
	}

	function processItems(items) {
		_.each(items, function (item) {
			switch (item.typeName) {
			case "Footage":
			case "Composition":
				processSingleItem(item);
				break;
			case "Folder":
				processItems(aeCollToArray(item.items));
				break;
			default:
				// ???
				break;
			}
		});
	}

	function main() {
		var message;

		if (!app) {
			message = "This script works with After Effects";
		} else if (!app.project) {
			message = "This script requires an open project";
		} else if (app.project.selection.length === 0) {
			message = "Use the project panel to select the items to process";
		}
		if (message) {
			$.writeln(message);
			return;
		}
		app.beginUndoGroup("Create Delta Crunch");
		processItems(app.project.selection);
		app.endUndoGroup();
	}

	return main();
});
