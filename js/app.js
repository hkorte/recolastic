var app = angular.module('Recolastic',[]);

// To allow for the use of bookmarklets we have to add the javascript protocol to the white list
app.config(['$compileProvider', function($compileProvider) {
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|javascript):/);
}]);