/*global
    $,
    app
*/
require([], function () {
    "use strict";


    function processComp(comp) {
        var layer, i;
        for (i = 1; i <= comp.numLayers; i++) {
            layer = comp.layers[i];
            if (layer.isTrackMatte) {
                layer.name = comp.layers[++i].name + " matte";
            }
        }
    }


    function main() {
        var message;

        if (!app) {
            message = "This script works with After Effects";
        } else if (!app.project) {
            message = "This script requires an open project";
        } else if (!app.project.activeItem || app.project.activeItem.typeName !== "Composition") {
            message = "The active item must be a comp";
        }
        if (message) {
            $.writeln(message);
            return;
        }
        app.beginUndoGroup("Autoname mask layers");
        processComp(app.project.activeItem);
        app.endUndoGroup();
    }


    return main();
});
