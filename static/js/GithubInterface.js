
var githubInterface = {
  parents: Array()
};

githubInterface.levelUp = function(token, level){
  for(var i=0; i<(level?(githubInterface.parents.length-level):1); i++)
  {
    githubInterface.parents.pop();
  }
  var target = githubInterface.parents[githubInterface.parents.length-1];
  console.log("going to "+(target ? "target" : null));
  githubInterface.populateGithubFolderView(null, target ? target.location : null, token, true);
}

githubInterface.rebuildPathView = function(token){
  $("#githubpathview").html(null);
  for(i in githubInterface.parents)
  {
    var name = githubInterface.parents[i].name;
    $("#githubpathview").append("<a href=\"#\" onClick=\"githubInterface.levelUp('"+token+"', "+i+")\" class=\"githubpathatom\">"+(name?name:"")+"/</a>");
    console.log("name: "+githubInterface.parents[i].name+" location: "+githubInterface.parents[i].location);
  }
}

githubInterface.populateGithubFolderView = function(name, location, token, returning){
  var output = $("#githubfolderview");
  if(!returning)
  {
    console.log("entering");
    githubInterface.parents.push({name: name, location: location});
  }
  githubInterface.rebuildPathView(token);
  if(location == null)
  { //list the user's repositories
    $.getJSON("https://api.github.com/user/repos?access_token="+token, function(data){
        output.html(null);
        for(var i in data){
          var element = '';
          element += "<a href=\"#\" onClick=\"githubInterface.populateGithubFolderView('"+data[i].name+"', '"+data[i].url+"', '"+token+"')\" class=\"githubfolderentry githubrepo\">";
          element += data[i].name;
          element += '</a>';
          output.append(element);
        }
      });
  }
  else
  { 
    if(location.indexOf("git/trees") == -1)
    { //list master branch top-level
      $.getJSON(location+"/git/refs/heads/master?access_token="+token, function(ref){
          $.getJSON(ref.object.url, function(commit){
            githubInterface.populateGithubFolderViewWithTree(output, commit.tree.url, token);
          });
        });
    }
    else
    { //list subfolder
      githubInterface.populateGithubFolderViewWithTree(output, location, token);
    }
  }
}

githubInterface.populateGithubFolderViewWithTree = function(output, location, token){
  $.getJSON(location, function(tree){
      output.html(null);

      var back = '';
      back += "<a href=\"#\" onClick=\"githubInterface.levelUp('"+token+"')\" class=\"githubfolderentry githublevelup\">";
      back += ".. (one level up)";
      back += '</a>';
      output.append(back);

      for(var i in tree.tree){
        var element = '';
        if(tree.tree[i].type == "tree"){
          element += "<a href=\"#\" onClick=\"githubInterface.populateGithubFolderView('"+tree.tree[i].path+"', '"+tree.tree[i].url+"', '"+token+"')\" class=\"githubfolderentry githubtree\">";
        }
        else
        {
          element += "<a href=\"#\" onClick=\"githubInterface.commit('"+tree.tree[i].url+"', '"+token+"')\" class=\"githubfolderentry githubblob\">";
        }
        element += tree.tree[i].path;
        element += '</a>';
        output.append(element);
      }
    });
}

/*
githubInterface.importPad = function (padId, user, repo, commit, file)
{
	var pad;
	padManager.getPad(padId, function(err, _pad)
			{
				pad = _pad;
				callback(err);
			});
	var apipath = "/repos/"+user+"/"+repo+"/git";
	function importCommit(apipath, commit, file)
	{
		var path = file.split("/");
		$.getJSON("https://api.github.com"+apipath+"/commits/"+commit}, function (data)
				{
					$.getJSON(commitObject.tree.url, function (treeObject)
							{
								var currentElement;
								//get bottommost non-empty element
								while (!(currentElement = path.shift()));
								for (leaf in treeObject.tree)
								{
									if(leaf.path === currentElement)
									{
										if(path.length() > 0){
                        $.getJSON(leaf.url, traversePath(treeObject, path));
										}
										else
										{
											//reached the file.
											httpsGetJSON(url.parse(leaf.url), function (blob)
													{
														pad.setText(blob.content);
														padMessageHandler.updatePadClients(pad, callback);
													});
										}
									}
								}						
							});
				});
	}

	pad.githubData = {user: user, repo: repo};
	if(commit == null)
	{
		$.getJSON("https://api.github.com"+apipath+"/refs/heads/master", function (data)
				{
					importCommit(apipath, data.object.sha, file);
				});
	}
	else
	{
		importCommit(apipath, commit, file);
	}
}

githubInterface.commit = function (message, branch, repo)
{
	if(user == null)
		user = pad.githubData.user;
	if(user == null)
		callback({error: "no user given"});
	if(repo == null)
		repo = pad.githubData.repo;
	if(repo == null)
		callback({error: "no user given"});
	var apipath = "/repos/"+user+"/"+repo+"/git";
	var path = file.split("/");
	httpsGetJSON("https://api.github.com"+apipath+"/refs/heads/master"}, function (data)
			{
				httpsGetJSON({"https://api.github.com"+apipath+"/commits/"+data.object.sha}, function (commitObject)
						{
							httpsGetJSON(commitObject.tree.url, function (treeObject)
									{
										var currentElement;
										//get bottommost non-empty element
										while (!(currentElement = path.shift()));
										for (leaf in treeObject.tree)
										{
											if(leaf.path === currentElement)
											{
												if(path.length() > 0){
													httpsGetJSON(leaf.url, traversePath(treeObject, path));
												}
												else
												{
													//reached the file.
													httpsGetJSON(leaf.url, function (blob)
															{
																pad.setText(blob.content);
																padMessageHandler.updatePadClients(pad, callback);
															});
												}
											}
										}						
									});
						});
			}
}
*/
