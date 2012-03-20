// todo we need refreshing
var pivotal = {
	projects: [],
	user: {},
	refresh: function() {
		pivotalApi.clearEverything()
		pivotal.projects([]);
		pivotalApi.loadUser();
	}
}

$(function() {
	pivotal = ko.mapping.fromJS(pivotal);
	ko.applyBindings(pivotal);
	pivotalApi.loadUser();
})


function loadProjects() {
	amplify.request.decoders.xmlToJsonDecoder = pivotalApi.mappingDecoder($.xml2json);

	amplify.request.define("projects", "ajax", {
		headers: {
			"X-TrackerToken": pivotal.user.apiToken
		},
		url: "https://www.pivotaltracker.com/services/v3/projects",
		cache: 'persist',
		decoder: 'xmlToJsonDecoder'
	});

	amplify.request.define("stories", "ajax", {
		headers: {
			"X-TrackerToken": pivotal.user.apiToken
		},
		url: 'https://www.pivotaltracker.com/services/v3/projects/{projectId}/stories?filter={filter}',
		// cache: 'persist',
		decoder: 'xmlToJsonDecoder'
	});

	amplify.request("projects", function(data) {
		projects = Enumerable.From(data.project)
		amplify.store("projects", projects);
		projects.ForEach(function(p) {
			loadProject(p)
		})
	})
}

function loadProject(project) {
	project.stories = [];
	var observable = ko.mapping.fromJS(project)
	pivotal.projects.push(observable);
	loadStories(observable);
}

function loadStories(project) {
	amplify.request("stories", {
		filter: 'mywork:' + pivotal.user.abbreviation,
		projectId: project.id()
	}, function(data) {
		var stories = Enumerable.From(data.story).Select(function(p) {
			return {
				id: p.id,
				name: p.name,
				url: p.url
			}
		});
		stories.ForEach(function(s) {
			project.stories.push(s)
		});
	});
}
