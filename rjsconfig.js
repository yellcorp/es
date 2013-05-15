({
	baseUrl: "src",
	paths: {
		requireLib: "../node_modules/requirejs/require",
		underscore: "../lib/underscore/underscore",
		es:         "../lib/es"
	},
	shim: {
		underscore: {
			exports: "_"
		}
	},
	include: [ "requireLib" ],
	optimize: "none"
})
