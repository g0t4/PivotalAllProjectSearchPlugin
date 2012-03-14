// todo we need refreshing

var pivotal = {
	projects: [],
	user: {}
}

$(function(){
	pivotal = ko.mapping.fromJS(pivotal);
	ko.applyBindings(pivotal);
	loadUser();
})

function userExtractor(data){
	var apiTokenMatches = data.match(/<td\ class=\"text_column\">([0-9,a-f]*)<\/td>/)
	if(apiTokenMatches.length < 2)
	{
		throw 'Cannot get api token'
	}
	var abbreviationMatches = data.match(/id=\"person_initials\".*value\=\"(.*)\"/)
	if(abbreviationMatches.length < 2)
	{
		throw 'Cannot find user abbreviation'
	}
	return {
		apiToken: apiTokenMatches[1],
		abbreviation: abbreviationMatches[1]
	}
}

function clearAllCaches(){
	clearRequestCache("user")
	clearRequestCache("projects")
}

function clearRequestCache( resourceId ) {
    var prefix = "request-" + resourceId,
        length = prefix.length,
        type = amplify.request.resources[ resourceId ]

    $.each( amplify.store(), function( key ) {
        if ( key.substring( 0, length ) === prefix ) {
            amplify.store( key, null );
        }
    });
}

var mappingDecoder = function(mapper)
{
    return function(data, status, xhr, success, error){
        if (status === "success"){
            success(mapper(data));
        } 
        else if (status === "fail" || status === "error"){
            error(data, status);
        }
        else{
            error(data, "fatal");
        }
    };
}

function loadProjects(){
	amplify.request.decoders.xmlToJsonDecoder = mappingDecoder($.xml2json);

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

	amplify.request("projects", function(data){
		projects = Enumerable.From(data.project)
		amplify.store("projects", projects);
		projects.ForEach(function(p){ loadProject(p)})
	})
}

function loadUser(){
	amplify.request.decoders.userDecoder = mappingDecoder(userExtractor);

	amplify.request.define("user", "ajax", {
		url: 'https://www.pivotaltracker.com/profile',
	    cache: 'persist',
	    decoder: 'userDecoder'
	});

	amplify.request("user", function(data){
		pivotal.user = data
		loadProjects();		
	})
}

function loadProject(project){
	project.stories = [];
	var observable = ko.mapping.fromJS(project)
	pivotal.projects.push(observable);
	loadStories(observable);	
}

function loadStories(project)
{
	amplify.request("stories",
		{ 
			filter: 'mywork:' + pivotal.user.abbreviation, 
			projectId: project.id()
		},function(data){
			var stories = Enumerable.From(data.story)
				.Select(function(p){ return { id: p.id, name: p.name, url: p.url} });
			stories.ForEach(function(s) { project.stories.push(s)});
		});
}
