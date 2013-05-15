/*jslint plusplus: true, white: true */
/*global define */
define([ "underscore" ],
function (_) {
"use strict";


function generateCSS(nestedStyle, rootName) {
	var nameStack = [ ],
		text = [ ];

	function render(style, name) {
		nameStack.push(name);
		text.push(nameStack.join("") + " {\n");
		_.each(_.keys(style.properties).sort(), function (k) {
			text.push("\t" + k + ": " + style.properties[k] + ";\n");
		});
		text.push("}\n");
		_.each(_.keys(style.children).sort(), function (k) {
			render(style.children[k], k);
		});
		nameStack.pop();
	}
	render(nestedStyle, rootName);
	return text.join("");
}


function NestedStyle(properties) {
	this.properties = { };
	this.children = { };

	if (properties) {
		_.extend(this.properties, properties);
	}
}
NestedStyle.prototype = {
	constructor: NestedStyle,

	childRule: function (childRuleName) {
		var ch = this.children;
		if (!_.has(ch, childRuleName)) {
			ch[childRuleName] = new NestedStyle();
		}
		return ch[childRuleName];
	},

	generate: function (rootName) {
		return generateCSS(this, rootName);
	}
};


return NestedStyle;
});
