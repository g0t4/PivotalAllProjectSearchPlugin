// todo we need refreshing
var pivotal = {
	projects: [],
	filter: '',
	refresh: function() {
		pivotalApi.clearEverything();
		pivotal.projects.removeAll();
		pivotalApi.loadUser(userLoaded);
	},
	search: function() {
		Enumerable.From(pivotal.projects()).ForEach(loadStories);
	},
	refreshSearch: function() {
		pivotalApi.clearStories();
		pivotal.search();
	},
	refreshStory: function(story) {
		pivotal.refreshProject(story.projectId);
	},
	refreshProject: function(projectId) {
		pivotalApi.clearStories();
		var project = Enumerable.From(pivotal.projects()).Single(function(p) {
			return p.id() == projectId
		});
		loadStories(project);
	},
	options: {
		showOptions: false,
		toggleOptions: function(){
			pivotal.options.showOptions(!pivotal.options.showOptions());			
			pivotalApi.user = pivotalApi.user || {};
			pivotal.options.apiToken(pivotalApi.user.apiToken);
			pivotal.options.abbreviation(pivotalApi.user.abbreviation);
			pivotal.options.defaultSearch(amplify.store('defaultSearch'));
		},
		apiToken: '',
		setApiToken: function() {
			var user = pivotalApi.user || {};
			user.apiToken = pivotal.options.apiToken();
			pivotalApi.setUser(user);
			window.location.reload();
		},
		abbreviation: '',
		setAbbreviation: function() {
			var user = pivotalApi.user || {};
			user.abbreviation = pivotal.options.abbreviation();
			pivotalApi.setUser(user);
			window.location.reload();			
		},
		defaultSearch: '',
		setDefaultSearch: function(){
			var defaultSearch = pivotal.options.defaultSearch();
			if (defaultSearch === '') {
				defaultSearch = null;
			}
			amplify.store('defaultSearch', defaultSearch);			
			window.location.reload();
		}
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
	var search = amplify.store('defaultSearch') || 'mywork:' + pivotalApi.user.abbreviation;
	pivotal.filter(search);
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
	project.stories.removeAll();
	pivotalApi.loadStories(project.id(), pivotal.filter(), storiesLoaded(project));
}

function storiesLoaded(project) {
	return function(stories) {
		Enumerable.From(stories).Select(function(s) {
			return new Story(s);
		}).ForEach(function(s) {
			project.stories.push(s)
		});
	}
}

function Story(story) {
	var self = this;
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
	this.projectId = story.project_id;
	this.tooltip = JSON.stringify(story, null, '\t');
	var setStoryState = function(state) {
			var success = function() {
					pivotal.refreshStory(self);
				};
			var failure = function(error) {
					console.log(error);
				};
			pivotalApi.setStoryState(self.id, self.projectId, state, success, failure);
		}
	this.accept = function() {
		setStoryState('accepted');
	};
	this.reject = function() {
		setStoryState('rejected');
	};
	this.finish = function() {
		setStoryState('finished');
	};
	this.deliver = function() {
		setStoryState('delivered');
	};
	this.start = function() {
		setStoryState('started');
	};
	this.restart = function() {
		setStoryState('started');
	};
	this.unFinish = function() {
		setStoryState('started');
	};
	this.unStart = function() {
		setStoryState('unstarted');
	};
}
