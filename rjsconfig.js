({
	baseUrl: "src",
	paths: {
		requireLib: "../node_modules/requirejs/require",
		underscore: "../lib/underscore/underscore",
		json:       "../lib/json/json2",
		es:         "../lib/es"
	},
	shim: {
		underscore: {
			exports: "_"
		},
		json: {
			exports: "JSON"
		}
	},
	include: [ "requireLib" ],
	optimize: "none"
})
