
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
		httpsGetJSON({host: "api.github.com", path: apipath+"/commits/"+commit}, function (data)
				{
					httpsGetJSON(url.parse(commitObject.tree.url), function (treeObject)
							{
								var currentElement;
								//get bottommost non-empty element
								while (!(currentElement = path.shift()));
								for (leaf in treeObject.tree)
								{
									if(leaf.path === currentElement)
									{
										if(path.length() > 0){
											httpsGetJSON(url.parse(leaf.url), traversePath(treeObject, path));
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
		httpsGetJSON({host: "api.github.com", path: apipath+"/refs/heads/master"}, function (data)
				{
					importCommit(apipath, data.object.sha, file);
				});
	}
	else
	{
		importCommit(apipath, commit, file);
	}
}

function httpsGetJSON(params, callback)
{
	https.get(params, function (res)
			{
				var data = "";
				res.on("data", function (chunk)
					{
						data += chunk;
					});
				res.on("end", function ()
					{
						console.log("Github interface http get status code: ", res.statusCode);
						//FIXME parse data as json
						callback(data);
					});
			});
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
	var pad;
	padManager.getPad(padId, function(err, _pad)
			{
				pad = _pad;
				callback(err);
			});
	var path = file.split("/");
	httpsGetJSON({host: "api.github.com", path: apipath+"/refs/heads/master"}, function (data)
			{
				httpsGetJSON({host: "api.github.com", path: apipath+"/commits/"+data.object.sha}, function (commitObject)
						{
							httpsGetJSON(url.parse(commitObject.tree.url), function (treeObject)
									{
										var currentElement;
										//get bottommost non-empty element
										while (!(currentElement = path.shift()));
										for (leaf in treeObject.tree)
										{
											if(leaf.path === currentElement)
											{
												if(path.length() > 0){
													httpsGetJSON(url.parse(leaf.url), traversePath(treeObject, path));
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
}

