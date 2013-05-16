/*global define*/
define([ "es/Path","underscore" ],
function (Path, _) {
"use strict";


var failure = { };


function get(object, keyPath) {
	var names = keyPath.split("."),
		i;
	for (i = 0; i < names.length; i++) {
		if (!_.has(object, names[i])) {
			return failure;
		}
		object = object[names[i]];
	}
	return object;
}


function str(object, keyPath) {
	var v = get(object, keyPath);
	return _.isString(v) ? v : failure;
}


function positiveNonZero(object, keyPath) {
	var v = get(object, keyPath);
	if (_.isString(v)) {
		v = parseFloat(v);
	}
	if (isFinite(v) && v > 0) {
		return v;
	}
	return failure;
}


function any(object, keyPath) {
	return get(object, keyPath);
}


function def(func, defaultValue) {
	return function (object, keyPath) {
		var v = func(object, keyPath);
		return v === failure ? defaultValue : v;
	};
}


function point(object, keyPath) {
	var v = get(object, keyPath);
	if (v && isFinite(v.x) && isFinite(v.y)) {
		return v;
	}
	return failure;
}


function evaluate(object, schema, prefix, out) {
	_.each(schema, function (matcher, key) {
		var value,
			keyPath = prefix + key;

		if (_.isFunction(matcher)) {
			value = matcher(object, keyPath);
			if (value === failure) {
				throw new Error("Bad value for " + keyPath);
			}
			out[key] = value;
		} else {
			out[key] = { };
			evaluate(object, matcher, keyPath + ".", out[key]);
		}
	});
}


function makeConfig(object, defaultBase) {
	var base = object.base || defaultBase,
		result = { };

	function dir(func) {
		if (!func) {
			func = str;
		}
		return function(object, keyPath) {
			var p = func(object, keyPath);
			if (p !== failure) {
				p = Path.join(base, p);
			}
			return p;
		};
	}

	evaluate(object, {
		master: dir(),
		states: def(any, { }),
		output: {
			text:     dir(),
			textBase: dir(def(str, Path.dirName(object.output.text))),
			image:    dir(),
			rule:     def(str, "div")
		},
		dimensions: point,
		align: def(point, { x: 0.5, y: 0.5 }),
		ppl: def(positiveNonZero, 1)
	}, "", result);

	_.each(result.states, function (path, name) {
		result.states[name] = Path.join(base, path);
	});

	return result;
}


return makeConfig;
});
