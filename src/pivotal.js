var pivotalApi = {
	amplifyKeyPrefix: "B29BA696-71B6-45DA-AB53-E0787FF93F2D",
	mappingDecoder: function(mapper) {
		return function(data, status, xhr, success, error) {
			if (status === "success") {
				success(mapper(data));
			} else if (status === "fail" || status === "error") {
				error(data, status);
			} else {
				error(data, "fatal");
			}
		};
	},
	userExtractor: function(data) {
		var apiTokenMatches = data.match(/<td\ class=\"text_column\">([0-9,a-f]+)<\/td>/)
		if (apiTokenMatches.length < 2) {
			throw 'Cannot get api token'
		}
		var abbreviationMatches = data.match(/id=\"person_initials\".*value\=\"(.*)\"/)
		if (abbreviationMatches.length < 2) {
			throw 'Cannot find user abbreviation'
		}
		return {
			apiToken: apiTokenMatches[1],
			abbreviation: abbreviationMatches[1]
		}
	},
	setUser: function(user) {
		var resourceId = pivotalApi.amplifyKeyPrefix + "user"
		amplify.store(resourceId, user);
	},
	loadUser: function(success, failure) {
		var resourceId = pivotalApi.amplifyKeyPrefix + "user"
		var onSuccess = function(user){
			pivotalApi.user = user;
			amplify.store(resourceId, user);
			success(user);
		}
		var saved = amplify.store(resourceId);
		if(saved){
			onSuccess(saved)
			return;
		}
		amplify.request.define(resourceId, "ajax", {
			url: 'https://www.pivotaltracker.com/profile',
			decoder: pivotalApi.mappingDecoder(pivotalApi.userExtractor)
		});
		amplify.request({
			resourceId: resourceId,
			success: onSuccess,
			failure: failure
		});
	},
	loadProjects: function(success, failure) {
		var resourceId = pivotalApi.amplifyKeyPrefix + "projects"

		amplify.request.decoders.xmlToJsonDecoder = pivotalApi.mappingDecoder($.xml2json);

		amplify.request.define(resourceId, "ajax", {
			headers: {
				"X-TrackerToken": pivotalApi.user.apiToken
			},
			url: "https://www.pivotaltracker.com/services/v3/projects",
			cache: 'persist',
			decoder: 'xmlToJsonDecoder'
		});

		amplify.request({
			resourceId: resourceId,
			success: function(data) {
				success(data.project);
			},
			failure: failure
		});
	},
	loadStories: function(projectId, filter, success, failure) {
		var resourceId = pivotalApi.amplifyKeyPrefix + "stories"

		amplify.request.define(resourceId, "ajax", {
			headers: {
				"X-TrackerToken": pivotalApi.user.apiToken
			},
			url: 'https://www.pivotaltracker.com/services/v3/projects/{projectId}/stories?filter={filter}',
			cache: {
				type: 'persist',
				expires: 5 * 60 * 1000
			},
			decoder: 'xmlToJsonDecoder'
		});

		var storyParameters = {
			filter: filter,
			projectId: projectId
		};

		amplify.request({
			resourceId: resourceId,
			data: storyParameters,
			success: function(data) {
				if (data.story === undefined) {
					success([]);
					return;
				}
				var stories = data.story instanceof Array ? data.story : [data.story];
				success(stories);
			},
			failure: failure
		});
	},
	clearRequestCache: function(resourceId) {
		var prefix = "request-" + pivotalApi.amplifyKeyPrefix + resourceId,
			length = prefix.length,
			type = amplify.request.resources[resourceId]
			$.each(amplify.store(), function(key) {
				if (key.substring(0, length) === prefix) {
					amplify.store(key, null);
				}
			})
	},
	setStoryState: function(storyId, projectId, current_state, success, failure) {
		amplify.request.define("setStoryState", "ajax", {
			headers: {
				"X-TrackerToken": pivotalApi.user.apiToken
			},
			type: "PUT",
			url: 'https://www.pivotaltracker.com/services/v3/projects/{projectId}/stories/{storyId}?story[current_state]={current_state}',
		});

		amplify.request({
			resourceId: "setStoryState",
			data: {
				projectId: projectId,
				storyId: storyId,
				current_state: current_state
			},
			success: success,
			failure: failure
		});
	},
	clearUser: function() {
		pivotalApi.setUser(null);
	},
	clearProjects: function() {
		pivotalApi.clearRequestCache('projects');
	},
	clearStories: function() {
		pivotalApi.clearRequestCache('stories');	
	},
	clearEverything: function() {
		pivotalApi.clearUser();
		pivotalApi.clearProjects();
		pivotalApi.clearStories();
	}
}
