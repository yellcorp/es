/*global
    $,
    app,
    prompt,
    KeyframeInterpolationType
*/
require([
    "es/StringUtil",
    "underscore"
], function (
    StringUtil,
    _
) {
    "use strict";

    var HANDLE_SECONDS = 1.5,
        TIME_REMAP = "ADBE Time Remapping";

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

    function parseTimecode(str, frameRate) {
        var units = [ 3600, 60, 1, 1 / frameRate ],
            values, isNegative,
            cUnit, cValue, result = 0;

        str = StringUtil.trim(str);
        isNegative = StringUtil.startsWith(str, "-");
        if (isNegative) {
            str = StringUtil.stripStart(str, "-");
        }
        values = _.map(str.split(":"), StringUtil.trim);
        if (values.length > units.length) {
            throw new Error("Too many units in timecode string");
        }
        while (values.length > 0) {
            cUnit = units.pop();
            cValue = values.pop();
            if (cValue) {
                result += cUnit * parseFloat(cValue);
            }
        }
        return isNegative ? -result : result;
    }

    function parseTimecodeRange(str, frameRate) {
        var hyphen, start, end;

        str = StringUtil.trim(str);

        // search from 1 to allow a negative start time
        hyphen = str.indexOf("-", 1);

        if (hyphen >= 1) {
            start = parseTimecode(str.slice(0, hyphen), frameRate);
            end = parseTimecode(str.slice(hyphen + 1), frameRate);
        } else {
            start = end = parseTimecode(str, frameRate);
        }

        if (isFinite(start) && isFinite(end)) {
            if (start > end) {
                return {
                    start: end,
                    end: start
                };
            }
            return {
                start: start,
                end: end
            };
        }
        return null;
    }

    function parseTimecodeRanges(str, frameRate) {
        return _.chain(str.split(","))
            .map(function (range) {
                return parseTimecodeRange(range, frameRate);
            })
            .filter(function (range) {
                return Boolean(range);
            })
            .value();
    }

    function getTimecodeRanges(item) {
        var response = prompt("Enter timecodes to keep for " + item.name);
        return response ? parseTimecodeRanges(response, item.frameRate) : null;
    }

    function setHoldValue(property, time, value) {
        var keyIndex = property.addKey(time);
        property.setValueAtKey(keyIndex, value);
        property.setInterpolationTypeAtKey(
            keyIndex, KeyframeInterpolationType.HOLD);
    }

    function processSingleItem(item) {
        var ranges = getTimecodeRanges(item),
            usageComp,
            fillInLayer;

        if (!ranges) {
            return;
        }

        usageComp = createCompMatching(item, item.name + " ucrunched", item.parentFolder);
        fillInLayer = usageComp.layers.add(item);
        fillInLayer.timeRemapEnabled = true;
        setHoldValue(fillInLayer(TIME_REMAP), 0, 0);

        _.each(ranges, function (range) {
            var segment = usageComp.layers.add(item);
            segment.inPoint = range.start - HANDLE_SECONDS;
            segment.outPoint = range.end + item.frameDuration + HANDLE_SECONDS;
            setHoldValue(fillInLayer(TIME_REMAP), segment.outPoint, segment.outPoint);
        });

        return usageComp;
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
        app.beginUndoGroup("Create Usage Crunch");
        processItems(app.project.selection);
        app.endUndoGroup();
    }

    return main();
});
