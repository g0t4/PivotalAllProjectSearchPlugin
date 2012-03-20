// todo we need refreshing
var pivotal = {
	projects: [],
	refresh: function() {
		pivotalApi.clearEverything()
		pivotal.projects([]);
		pivotalApi.loadUser(userLoaded);
	}
}
$(function() {
	pivotal = ko.mapping.fromJS(pivotal);
	ko.applyBindings(pivotal);
	pivotalApi.loadUser(userLoaded);
})

function userLoaded() {
	pivotalApi.loadProjects(projectsLoaded);
}

function projectsLoaded(projects) {
	Enumerable.From(projects).ForEach(loadProject);
}

function loadProject(project) {
	project.stories = [];
	var observable = ko.mapping.fromJS(project)
	pivotal.projects.push(observable);
	pivotalApi.loadStories(project.id, storiesLoaded(observable));
}

function storiesLoaded(project) {
	return function(stories) {
		Enumerable.From(stories).Select(function(s) {
			return {
				id: s.id,
				url: s.url,
				name: s.name
			}
		}).ForEach(function(s) {
			project.stories.push(s)
		});
	}
}
