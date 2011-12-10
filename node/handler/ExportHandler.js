/**
 * Handles the export requests
 */

/*
 * 2011 Peter 'Pita' Martischka (Primary Technology Ltd)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var exporthtml = require("../utils/ExportHtml");
var padManager = require("../db/PadManager");
var async = require("async");
var fs = require("fs");
var settings = require('../utils/Settings');
var os = require('os');
var https = require('https');
var querystring = require('querystring');

//load abiword only if its enabled
if(settings.abiword != null)
  var abiword = require("../utils/Abiword");

var tempDirectory = "/tmp";

//tempDirectory changes if the operating system is windows 
if(os.type().indexOf("Windows") > -1)
{
  tempDirectory = process.env.TEMP;
}
  
/**
 * do a requested export
 */ 
exports.doExport = function(req, res)
{
  var padId = req.params.pad;
  var type = req.params.type;
  if(type != "github")
  {
    //tell the browser that this is a downloadable file
    res.attachment(padId + "." + type);
  }

  //if this is a plain text export, we can do this directly
  if(type == "txt")
  {
    padManager.getPad(padId, function(err, pad)
    {
      if(err)
        throw err;
         
      res.send(pad.text());
    });
  }
  else if(type == "github")
  {
    padManager.getPad(padId, function(err, pad)
    {
      if(err)
        throw err;
      console.log("getting github access token with code "+req.params.code);
      //FIXME the client secret and id need to be configurable
      var token_post_data = querystring.stringify({
          client_id: "a7845068707943ffa5f2",
          client_secret: "6996ec127db3f81bc32b1e56eeacf920ff9d3ba4",
          code: req.query.code
        });
      var treq = https.request({
          host: "github.com",
          path: "/login/oauth/access_token",
          method: "POST",
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': token_post_data.length
          }
        }, function(tres){
          tres.setEncoding('utf8');
          //FIXME is it safe to assume all data will arrive in one chunk?
          tres.on('data', function(chunk){
              console.log("received access token chunk from github: "+chunk);
              var github_info = querystring.parse(chunk);
              res.redirect("/p/"+padId+"?github_export_token="+github_info.access_token);
            });
        }).on('error', function(e){
          console.log("github error: "+e);
        });
      treq.write(token_post_data);
      treq.end();
    });
  }
  else
  {
    var html;
    var randNum;
    var srcFile, destFile;

    async.series([
      //render the html document
      function(callback)
      {
        exporthtml.getPadHTMLDocument(padId, null, false, function(err, _html)
        {
          html = _html;
          callback(err);
        });   
      },
      //decide what to do with the html export
      function(callback)
      {
        //if this is a html export, we can send this from here directly
        if(type == "html")
        {
          res.send(html);
          callback("stop");  
        }
        else //write the html export to a file
        {
          randNum = Math.floor(Math.random()*0xFFFFFFFF);
          srcFile = tempDirectory + "/eplite_export_" + randNum + ".html";
          fs.writeFile(srcFile, html, callback); 
        }
      },
      //send the convert job to abiword
      function(callback)
      {
        //ensure html can be collected by the garbage collector
        html = null;
      
        destFile = tempDirectory + "/eplite_export_" + randNum + "." + type;
        abiword.convertFile(srcFile, destFile, type, callback);
      },
      //send the file
      function(callback)
      {
        res.sendfile(destFile, null, callback);
      },
      //clean up temporary files
      function(callback)
      {
        async.parallel([
          function(callback)
          {
            fs.unlink(srcFile, callback);
          },
          function(callback)
          {
            //100ms delay to accomidate for slow windows fs
			if(os.type().indexOf("Windows") > -1)
			{
			  setTimeout(function() 
			  {
			    fs.unlink(destFile, callback);
			  }, 100);
			}
          }
        ], callback);
      }
    ], function(err)
    {
      if(err && err != "stop") throw err;
    })
  }
};
