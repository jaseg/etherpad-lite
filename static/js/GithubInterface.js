
var githubInterface = {};
var https = require('https');

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
		$.getJSON("api.github.com"+apipath+"/commits/"+commit}, function (data)
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
		$.getJSON("api.github.com"+apipath+"/refs/heads/master", function (data)
				{
					importCommit(apipath, data.object.sha, file);
				});
	}
	else
	{
		importCommit(apipath, commit, file);
	}
}

githubInterface.commitAndPush = function (padId, message, branch, callback, user, repo)
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
	httpsGetJSON("api.github.com"+apipath+"/refs/heads/master"}, function (data)
			{
				httpsGetJSON({"api.github.com"+apipath+"/commits/"+data.object.sha}, function (commitObject)
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

