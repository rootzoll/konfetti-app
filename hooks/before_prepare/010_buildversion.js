#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

process.stdout.write('******** BEFORE BUILD HOOK - GIT BUILD NUMBER **************\n');

var exec = require('child_process').exec;
exec('git describe', function(error, stdout, stderr) {

  var version = "n/a";

  /*
   *  ******** TRY TO GET LATEST GIT VERSION NUMBER **********
   *  --> make sure that command 'git' is working on command line
   */

  try {
    if ((typeof stdout != "undefined") && (stdout!=null) && (stdout.length>0)) version = stdout.trim();
  } catch (e) {
      process.stdout.write("BEFORE BUILD HOOK --> ERROR ON GETTING GIT VERSION : "+JSON.stringify(e)+" \n");
  }

  /*
   *  ******** WRITE GIT VERSION NUMBER **********
   */

  try {

      var fileContent = "window.appGitVersion='"+version+"';";
      var jsPath = path.join('www', 'buildversion.js');
      fs.unlinkSync(jsPath);
      fs.writeFileSync(jsPath, fileContent, 'utf8');
      process.stdout.write("OK file '"+jsPath+"' updated\n");

  } catch (e) {
    process.stdout.write("BEFORE BUILD HOOK --> ERROR ON WRITING buildversion.js : "+JSON.stringify(e)+" \n");
  }

});