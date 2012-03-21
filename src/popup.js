// todo we need refreshing
var pivotal = {
	projects: [],
	filter: '',
	refresh: function() {
		pivotalApi.clearEverything();
		pivotal.projects([]);
		pivotalApi.loadUser(userLoaded);
	},
	search: function() {
		Enumerable.From(pivotal.projects()).ForEach(loadStories);
	},
	refreshSearch: function() {
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

function loadStories(project) {
	project.stories([]);
	pivotalApi.loadStories(project.id(), pivotal.filter(), storiesLoaded(project));
}

function storiesLoaded(project) {
	return function(stories) {
		Enumerable.From(stories).Select(function(s) {
			console.log(s);
			return new Story(s);
		}).ForEach(function(s) {
			project.stories.push(s)
		});
	}
}

function Story(story) {
	this.id = story.id;
	this.url = story.url;
	this.name = story.name;
	// todo would be nice to have click to search labels
	this.labels = story.labels ? story.labels : '';
	// todo would be nice to have owned by abbreviation and click to search
	this.owned_by = story.owned_by;
	this.isFeature = story.story_type === "feature";
	this.isBug = story.story_type === "bug";
	this.isRelease = story.story_type === "release";
	this.isChore = story.story_type === "chore";
	this.current_state = story.current_state;
	this.isUnstarted = story.current_state === "unstarted";
	this.isStarted = story.current_state === "started";
	this.isDelivered = story.current_state === "delivered";
	this.isFinished = story.current_state === "finished";
	this.isAccepted = story.current_state === "accepted";
	this.isRejected = story.current_state === "rejected";
	this.isUnscheduled = story.current_state === "unscheduled";
}
