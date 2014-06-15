$.ajax({
	url: "http://localhost:9200/recolastic",
	type: "HEAD"
}).done(function() {
	deleteIndex();
}).fail(function() {
	createIndex();
});

function deleteIndex() {
	$.ajax({
		url: "http://localhost:9200/recolastic",
		type: "DELETE"
	}).done(function () {
		createIndex();
	});
}

function createIndex() {
	$.post("http://localhost:9200/recolastic", JSON.stringify({
		"settings": {
			"number_of_shards": 1,
			"number_of_replicas": 0
		},
		"mappings": {
			"movie": {
				"properties": {
					"title": { "type": "string" },
					"suggest": {
						"type": "completion",
						"analyzer": "simple",
						"payloads": true,
						"preserve_position_increments": false
					}
				}
			},
			"listmovie": {
				"properties": {
					"list": { "type": "string", "index": "not_analyzed" },
					"movie": { "type": "string", "index": "not_analyzed" }
				}
			},
			"list": {
				"properties": {
					"title": { "type": "string", "index": "no" }
				}
			}
		}
	}), function (data) {
		if (data.acknowledged) {
			startScraper();
		} else {
			alert(JSON.stringify(data))
		}
	}, "json");
}

function startScraper() {
	loadTagUrls();
}

function loadTagUrls() {
	var iframe = $("<iframe/>").attr("src", "http://www.imdb.com/lists/tag/");
	$("body").append(iframe);
	var urls = [];
	iframe.load(function () {
		$("a[href^=\"/lists/tag/\"]", iframe.contents()).each(function () {
			urls.push($(this).attr("href"));
		});
		iframe.remove();
		loadList(urls[0]);
		loadList(urls[1]);
		loadList(urls[2]);
		loadList(urls[3]);
		loadList(urls[4]);
		loadList(urls[5]);
	});
}

function loadList(url) {
	var iframe = $("<iframe/>").css("display", "none").attr("src", url);
	$("body").append(iframe);
	iframe.load(function () {
		var bulkContent = "";
		$("#main div.list-preview", iframe.contents()).each(function () {
			var link = $("div.list_name a", this);
			var id = link.attr("href").replace(/\/list\/(.+)\//g, "$1");
			var name = link.text();
			bulkContent += JSON.stringify({ "index": { "_index": "recolastic", "_type": "list", "_id": id } }) + "\n";
			bulkContent += JSON.stringify({ "title": name }) + "\n";
		});
		$.post("http://localhost:9200/_bulk", bulkContent, function (data) {
			console.log(data);
		}, "json");
		iframe.remove();
	});
}