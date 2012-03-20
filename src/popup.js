// todo we need refreshing
var pivotal = {
	projects: [],
	filter: '',
	refresh: function() {
		pivotalApi.clearEverything();
		pivotal.projects([]);
		pivotalApi.loadUser(userLoaded);
	},
	search: function(){
		Enumerable.From(pivotal.projects()).ForEach(loadStories);
	},
	refreshSearch: function(){
		pivotalApi.clearStories();
		pivotal.search();
	}
}
$(function() {
	pivotal = ko.mapping.fromJS(pivotal);
	ko.applyBindings(pivotal);
	pivotalApi.loadUser(userLoaded);
	pivotal.filter.subscribe(pivotal.search);
})

function userLoaded() {
	pivotalApi.loadProjects(projectsLoaded);
	var filter = 'mywork:' + pivotalApi.user.abbreviation;
	pivotal.filter(filter);
}

function projectsLoaded(projects) {
	Enumerable.From(projects).ForEach(loadProject);
}

function loadProject(project) {
	project.stories = [];
	var observable = ko.mapping.fromJS(project)
	pivotal.projects.push(observable);
	loadStories(observable);
}

function loadStories(project){
	project.stories([]);
	pivotalApi.loadStories(project.id(), pivotal.filter(), storiesLoaded(project));
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
