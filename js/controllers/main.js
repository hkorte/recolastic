app.controller("MainController", function($scope, $http, $timeout){
	$scope.selectedHost = "151.252.40.250:9200";
	$scope.selectedIndex = "recolastic";
//	$scope.selectedHost = "localhost:9200";
//	$scope.selectedIndex = "imdb";
	$scope.selectedSize = 10;
	$scope.selectedMovies = [];
	$scope.suggestions = [];
	$scope.recommendedMovies = [];
	$scope.refLists = [];
	$scope.results = [];
	$scope.newMovieLastReq = "";
	$scope.newMovie = "";
	$scope.state = 'initial';
	$scope.addMovie = function(movie) {
		$scope.selectedMovies.push(movie);
		var index = $scope.suggestions.indexOf(movie);
		if (index > -1) {
			$scope.suggestions.splice(index, 1);
		}
	};
	$scope.removeMovie = function(movie) {
		var index = $scope.selectedMovies.indexOf(movie);
		if (index > -1) {
			$scope.selectedMovies.splice(index, 1);
		}
	};
	$scope.$watch('newMovie', function (newMovie) {
		if(newMovie.length > 3 && newMovie != $scope.newMovieLastReq) {
			$timeout(function () {
				if($scope.newMovie == newMovie) {
					var request = {
						movie: {
							text: newMovie,
							completion: {
								field: "suggest"
							}
						}
					};
					$http.post("http://" + $scope.selectedHost + "/" + $scope.selectedIndex + "/_suggest",
						request).success(function (data) {
						if ($scope.newMovie == data.movie[0].text) {
							var options = data.movie[0].options;
							var results = [];
							for (var i = 0; i < options.length; i++) {
								results.push({title: options[i].text, id: options[i].payload._id});
							}
							$scope.suggestions = results;
						}
					}).error(function (data) {
						console.log("Error!");
						console.log(data);
						$scope.errorMsg = JSON.stringify(data, undefined, 2);
						$scope.state = 'error';
					});
				}
			}, 300);
		}
	}, true);
	$scope.search = function() {
		var ids = [];
		for (var i = 0; i < $scope.selectedMovies.length; i++) {
			ids.push($scope.selectedMovies[i].id);
		}
		var request = {
			size: 0,
			query: {
				terms: {
					movie: $scope.selectedMovies
				}
			},
			aggregations: {
//				sigLists: {
//					significant_terms: {
//						field: "list",
//						size: 1
//					}
//				},
				lists: {
					terms: {
						field: "list",
						size: 1000
					}
				}
			}
		};
		$scope.state = 'searching lists';
		$http.post("http://"+$scope.selectedHost+"/"+$scope.selectedIndex+"/listmovie/_search", request).success(function(data) {
//			var buckets = data.aggregations.sigLists.buckets;
//			var results = [];
//			for(var i = 0; i < buckets.length; i++) {
//				results.push(buckets[i].key);
//			}
//			console.log(data.aggregations.sigLists);
//			if(results.length === 0) {
				var buckets = data.aggregations.lists.buckets;
				var results = [];
				for (var i = 0; i < buckets.length; i++) {
					results.push(buckets[i].key);
				}
//			}
			$scope.refLists = results;
			var request = {
				size: 0,
				query: {
					terms: {
						list: $scope.refLists
					}
				},
				aggregations: {
					movies: {
						significant_terms: {
							field: "movie",
							size: $scope.selectedSize
						}
					}
				}
			};
			$http.post("http://"+$scope.selectedHost+"/"+$scope.selectedIndex+"/listmovie/_search", request).success(function(data) {
				var buckets = data.aggregations.movies.buckets;
				var ids = [];
				for(var i = 0; i < buckets.length; i++) {
					var movieId = buckets[i].key;
					if($scope.selectedMovies.indexOf(movieId) === -1) {
						ids.push(buckets[i].key);
					}
				}
				if(ids.length > 0) {
					var request = {
						ids: ids
					};
					$http.post("http://" + $scope.selectedHost + "/" + $scope.selectedIndex + "/movie/_mget",
						request).success(function (data) {
						var selectedMovieIds = [];
						for (var i = 0; i < $scope.selectedMovies.length; i++) {
							selectedMovieIds.push($scope.selectedMovies[i].id);
						}
						var movies = [];
						var idMap = {};
						for (var i = 0; i < data.docs.length; i++) {
							var doc = data.docs[i];
							if (doc._source) {
								if (selectedMovieIds.indexOf(doc._id) === -1) {
									var movie = {title: doc._source.suggest.output, id: doc._id, imgUrl:""};
									movies.push(movie);
									idMap[doc._id] = movie;
									$http.get("http://www.omdbapi.com/?i=" + doc._id).success(function (data) {
										if (data.Poster) {
											console.log(idMap[data.imdbID]);
											idMap[data.imdbID].imgUrl = data.Poster;
										}
									}).error(function (data) {
										console.log("Error!");
										console.log(data);
										$scope.errorMsg = JSON.stringify(data, undefined, 2);
										$scope.state = 'error';
									});
								}
							}
						}
						$scope.recommendedMovies = movies;
					}).error(function (data) {
						console.log("Error!");
						console.log(data);
						$scope.errorMsg = JSON.stringify(data, undefined, 2);
						$scope.state = 'error';
					});
				} else {
					$scope.state = 'empty';
					$scope.recommendedMovies = [];
				}
			}).error(function(data) {
				console.log("Error!");
				console.log(data);
				$scope.errorMsg = JSON.stringify(data, undefined, 2);
				$scope.state = 'error';
			});
			$scope.state = 'searchingMovies';
			$scope.state = 'finished';
		}).error(function(data) {
			console.log("Error!");
			console.log(data);
			$scope.errorMsg = JSON.stringify(data, undefined, 2);
			$scope.state = 'error';
		});
	};

	$scope.movies = ["abc", "def", "ghi", "abcd", "abcde", "defg", "ghij"];

	$scope.getmovies = function(){
		return $scope.movies;
	}

	$scope.doSomething = function(typedthings){
		console.log("Do something like reload data with this: " + typedthings );
		$scope.newmovies = ["yay", "bla"];
	}

	$scope.doSomethingElse = function(suggestion){
		console.log("Suggestion selected: " + suggestion );
	}
});