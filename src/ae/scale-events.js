/*global
    $,
    app,
    PropertyType
*/
require([
    "underscore"
], function (
    _
) {
    "use strict";


    var KEY_QUERY_METHODS = [
            'keyTime',
            'keyValue',
            'keyInInterpolationType',
            'keyInTemporalEase',
            'keyOutInterpolationType',
            'keyOutTemporalEase',
            'keyTemporalContinuous',
            'keyTemporalAutoBezier'
        ],

        SPATIAL_KEY_QUERY_METHODS = KEY_QUERY_METHODS.concat([
            'keyInSpatialTangent',
            'keyOutSpatialTangent',
            'keySpatialContinuous', // affects AutoBezier
            'keySpatialAutoBezier',
            'keyRoving'
        ]);

    function getKeyDescriptor(prop, index) {
        var methodNames = prop.isSpatial ? SPATIAL_KEY_QUERY_METHODS : KEY_QUERY_METHODS,
            desc = { };
        _.each(methodNames, function (methodName) {
            desc[methodName] = prop[methodName](index);
        });
        return desc;
    }

    function applyKeyDescriptor(prop, desc) {
        var index;

        prop.setValueAtTime(desc.keyTime, desc.keyValue);
        index = prop.nearestKeyIndex(desc.keyTime);

        prop.setTemporalEaseAtKey(index,
            desc.keyInTemporalEase, desc.keyOutTemporalEase);

        prop.setTemporalContinuousAtKey(index, desc.keyTemporalContinuous);
        prop.setTemporalAutoBezierAtKey(index, desc.keyTemporalAutoBezier);

        prop.setInterpolationTypeAtKey(index,
            desc.keyInInterpolationType, desc.keyOutInterpolationType);

        if (prop.isSpatial) {
            prop.setSpatialTangentsAtKey(index,
                desc.keyInSpatialTangent, desc.keyOutSpatialTangent);

            prop.setSpatialContinuousAtKey(index, desc.keySpatialContinuous);
            prop.setSpatialAutoBezierAtKey(index, desc.keySpatialAutoBezier);

            prop.setRovingAtKey(index, desc.keyRoving);
        }

        return index;
    }


    function Mapping(m, a) {
        this.factor = m;
        this.addend = a;
    }
    Mapping.prototype.setFromRanges = function (a, b, c, d) {
        this.factor = (d - c) / (b - a);
        this.addend = (b * c - a * d) / (b - a);
        return this;
    };
    Mapping.prototype.multiply = function (n) {
        return n * this.factor + this.addend;
    };


    function processLayer(layer, mapping) {
        var startTime = layer.startTime,
            inPoint = layer.inPoint,
            outPoint = layer.outPoint;

        layer.startTime = mapping.multiply(startTime);
        layer.inPoint = mapping.multiply(inPoint);
        layer.outPoint = mapping.multiply(outPoint);
    }


    function getPropertyLayer(prop) {
        while (prop.parentProperty) {
            prop = prop.parentProperty;
        }
        return prop;
    }


    function processComp(comp, mapping) {
        var props = _.filter(comp.selectedProperties, function (prop) {
                    return prop.propertyType === PropertyType.PROPERTY;
                }),

            propKeys = _.map(props, function (prop) {
                    var numKeys = prop.numKeys, keys = [ ], i;
                    for (i = 1; i <= numKeys; i++) {
                        keys.push(getKeyDescriptor(prop, i));
                    }
                    return keys;
                }),

            selectedLayerIndices = [ ];

        _.each(comp.selectedLayers, function (layer) {
            selectedLayerIndices[layer.index] = true;
        });

        _.each(props, function (prop) {
            selectedLayerIndices[getPropertyLayer(prop).index] = true;
        });

        _.each(selectedLayerIndices, function (selected, layerIndex) {
            if (selected) {
                processLayer(comp.layer(layerIndex), mapping);
            }
        });

        _.each(props, function (prop, index) {
            var keys = propKeys[index];
            while (prop.numKeys > 0) {
                prop.removeKey(1);
            }
            _.each(keys, function (k) {
                k.keyTime = mapping.multiply(k.keyTime);
                applyKeyDescriptor(prop, k);
            });
        });
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
        app.beginUndoGroup("Remap key time");
        processComp(app.project.activeItem, new Mapping().setFromRanges(0, 30, 0, 12));
        app.endUndoGroup();
    }


    return main();
});
