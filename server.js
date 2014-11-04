var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs"),
    //spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    querystring = require("querystring")
    port = process.argv[2] || 8888;


function isNull(anode){
  if (anode=='undefined'){ return true;} //bscontact
  else{
    if (anode===null){ return true;} //cosmo
    else{
      return false;
    }
  }
}

http.createServer(function(request, response) {
  
  console.log(request.url);
  
  if((url.parse(request.url).pathname == "/") && !(isNull(url.parse(request.url).query))){
    link=querystring.parse(url.parse(request.url).query)["a"];
    json=querystring.parse(url.parse(request.url).query)["format"]
    if(link != undefined){
      var rePattern = new RegExp('^[a-zA-Z0-9:/\\\\.\'"]*$');
      var arrMatches = link.match(rePattern);
      if(arrMatches!=null && arrMatches["index"]>-1){
        if (link.substring(0,5) == "https") link=link.substring(0,4)+link.substring(5,link.lenght)
        child = exec('./hs_chk.sh '+link,
          function (error, stdout, stderr) {
            if (json == "json"){
              response.writeHead(200, {"Content-Type": "application/json"});
              jobject = {"url":link,"status":stdout.replace(/[\n\r]/g, '')};
              response.write(JSON.stringify(jobject));
              response.end();
            }
            else {
              response.writeHead(200, {"Content-Type": "text/html"});
              res=""
              fs.readFile("./head.html", "binary", function(err, file) {
                res=res+file;
                if(stdout.indexOf("200") > -1){
                  res=res+'<input disabled style="background-color: green;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                  res=res+link+' is Online!">';
                } else if(stdout.indexOf("302") > -1 || stdout.indexOf("301") > -1) {
                  res=res+'<input disabled style="background-color: orange;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                  res=res+link+' is probably Offline! (301 - 302 - HTTP redirect)">';
                } else if(stdout.indexOf("403") > -1) {
                  res=res+'<input disabled style="background-color: orange;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                  res=res+link+' don\'t want to be tracked. (probably Online) (403 - Forbidden)">';
                } else if(stdout.indexOf("404") > -1 || stdout.indexOf("502") > -1 || stdout.indexOf("503") > -1) {
                  res=res+'<input disabled style="background-color: red;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                  res=res+link+' is Offline! (Error: '+stdout+')">';
                } else {
                  res=res+'<input disabled style="background-color: red;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                  res=res+link+' can\'t retrive status - Generic Error">';
                }
                fs.readFile("./foot.html", "binary", function(err, file) {
                  res=res+file;
                  response.write(res);
                  response.end();
                });
              });
            }

            if (error !== null) {
              console.log('exec error: ' + error);
            }
            return;
        });
      } else {
        response.writeHead(200, {"Content-Type": "text/html"});
        res=""
        fs.readFile("./head.html", "binary", function(err, file) {
          res=res+file;
          res=res+'<input disabled style="background-color: black;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="Error!">';
          fs.readFile("./foot.html", "binary", function(err, file) {
            res=res+file;
            response.write(res);
            response.end();
          });
        });
      }
    }else{
      if (json == "json"){
        response.writeHead(200, {"Content-Type": "text/html"});
        fs.readFile("./api.html", "binary", function(err, file) {
          response.write(file);
          response.end();
        });
      }
    }
    return;
  }
	
  var uri = url.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += 'index.html';

    if (uri == '/' || uri == '/index.html') {
      res="";
      fs.readFile("./head.html", "binary", function(err, file) {
        res=res+file;
        //res=res+'<input disabled style="background-color: black;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="Error!">';
        fs.readFile("./foot.html", "binary", function(err, file) {
          res=res+file;
          response.writeHead(200, {"Content-Type": "text/html"});
          response.write(res);
          response.end();
        });
      });
    } else {
      fs.readFile(filename, "binary", function(err, file) {
        if(err) {        
          response.writeHead(500, {"Content-Type": "text/plain"});
          response.write(err + "\n");
          response.end();
          return;
        }

        var headers = {};
        var contentType = contentTypesByExtension[path.extname(filename)] || 'text/plain';
        if (contentType) headers["Content-Type"] = contentType;
        response.writeHead(200, headers);
        response.write(file, "binary");
        response.end();
      });
    }
  });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
