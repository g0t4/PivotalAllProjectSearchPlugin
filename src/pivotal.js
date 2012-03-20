var pivotalApi = {
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
		var apiTokenMatches = data.match(/<td\ class=\"text_column\">([0-9,a-f]*)<\/td>/)
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
	loadUser: function() {
		amplify.request.define("user", "ajax", {
			url: 'https://www.pivotaltracker.com/profile',
			cache: 'persist',
			decoder: pivotalApi.mappingDecoder(pivotalApi.userExtractor)
		});
		amplify.request("user", function(data) {
			pivotal.user = data
			loadProjects();
		})
	},
	clearRequestCache: function(resourceId) {
		var prefix = "request-" + resourceId,
			length = prefix.length,
			type = amplify.request.resources[resourceId]
			$.each(amplify.store(), function(key) {
				if (key.substring(0, length) === prefix) {
					amplify.store(key, null);
				}
			})
	},
	clearUser: function() {
		pivotalApi.clearRequestCache('user');
	},
	clearProjects: function() {
		pivotalApi.clearRequestCache('projects');
	},
	clearEverything: function() {
		pivotalApi.clearUser();
		pivotalApi.clearProjects();
	}
}
