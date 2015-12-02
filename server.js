var http = require('http'),
    url = require('url'),
    path = require('path'),
    fs = require('fs'),
    request = require('request'),
    querystring = require('querystring'),
    port = process.argv[2] || 8888;

var r = request.defaults({'proxy': 'http://localhost:8118'}); // privoxy

function isNull (anode) {
  if (anode == 'undefined') {
    return true;
  } else {
    if (anode === null) {
      return true;
    } else {
      return false;
    }
  }
}

function Urify (str) {
  var a = str;
  if (str.substring(0, 8) !== 'https://' && str.substring(0, 7) !== 'http://') {
    a = 'http://' + str;
  }
  return a;
}

http.createServer(function (request, response) {
  if((url.parse(request.url).pathname === '/') && !(isNull(url.parse(request.url).query))) {
    var link = querystring.parse(url.parse(request.url).query)['a'];
    var json = querystring.parse(url.parse(request.url).query)['format'];
    if(link !== undefined) {
      var rePattern = new RegExp('^[a-zA-Z0-9:/\\\\.\'"]*$');
      var arrMatches = link.match(rePattern);
      if(arrMatches !== null && arrMatches['index'] > -1) {
        link = Urify(link);
        r.get(link)
         .on('response', function (resp) {
          status = resp.statusCode;
          if (json == 'json') {
            response.writeHead(200, {"Content-Type": "application/json"});
            jobject = {"url":link,"status":status};
            response.write(JSON.stringify(jobject));
            response.end();
          }
          else {
            response.writeHead(200, {"Content-Type": "text/html"});
            res = ""
            fs.readFile("./head.html", "binary", function (err, file) {
              res=res+file;
              if(status == "200"){
                res=res+'<input disabled style="background-color: green;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                res=res+link+' is Online!">';
              } else if(status == "302" || status == "301") {
                res=res+'<input disabled style="background-color: orange;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                res=res+link+' is probably Online! (301 - 302 - HTTP redirect)">';
              } else if(status == "403") {
                res=res+'<input disabled style="background-color: orange;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                res=res+link+' don\'t want to be tracked. (probably Online) (403 - Forbidden)">';
              } else if(status == "404" || status == "502" || status == "503") {
                res=res+'<input disabled style="background-color: red;color:#FFF" class="btn btn-block btn-lg btn-primary" type="submit" value="'
                res=res+link+' is Offline! (Error: '+status+')">';
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
        }).on('error', function(err) {
          console.log(err)
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

  var uri = url.parse(request.url).pathname,
    filename = path.join(process.cwd(), uri);

  var contentTypesByExtension = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript'
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

console.log("Server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
