require([], function () {
"use strict";


function collectionToArray(collection) {
	var a = [ ], i;
	for (i = 1; i <= collection.length; i++) {
		a.push(collection[i]);
	}
	return a;
}

return {
	collectionToArray: collectionToArray
};
});
