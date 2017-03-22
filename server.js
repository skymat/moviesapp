var express = require('express');
var request = require('request');
var app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
var mongoose= require('mongoose');

//Connexion à la base de données
mongoose.connect('mongodb://localhost/moviesapp' , function(err) {
  if (err) { throw err; }
});


var listMovies = {};
var pageG = 1;
callDiscoverMovies(pageG,null);
function callDiscoverMovies(page,renderPagination)
{
    console.log(page);
    if(listMovies[page] === undefined)
    {
        listMovies[page] = {};
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.themoviedb.org/3/discover/movie?page="+page+"&include_image=true&include_adult=false&sort_by=popularity.desc&language=fr-FR&api_key=477dda0db0796b050196af446fe30383",
            "method": "GET",
            "headers": {},
            "data": "{}"
        }
        

        request(settings.url, function(error, response, body) {
            console.log("PAGE WS: " + page);
            body = JSON.parse(body);
            if(body != undefined) {
                listMovies.totalPages = body.total_pages;
                body.results.forEach(function(element) {
                    listMovies[page][element.id] = element;
                    console.log("ELEMENT ID - " + element.id);
/*
                   var settingsDetails = {
                        "async": true,
                        "crossDomain": true,
                        "url": "https://api.themoviedb.org/3/movie/"+element.id+"?api_key=477dda0db0796b050196af446fe30383&language=fr-FR",
                        "method": "GET",
                        "headers": {},
                        "data": "{}"
                    }
                    request(settingsDetails.url, function(error, response, body) {
                        console.log("details - " + element.id);
                        body = JSON.parse(body);
                        if(body != undefined) {
                            console.log("detail affectation - " + element.id);
                            listMovies[page][element.id].details = body;
                        }
                    });
*/
                }, this);
            }
            console.log(renderPagination);
            if (renderPagination)
                renderPagination();
        });
    }
    else
        if (renderPagination)
            renderPagination();
}

app.get('/', function (req, res) {
    console.log("Query page : " + req.query.page);
    if (req.query.page != null && parseInt(req.query.page, 10)){
        
        pageG = parseInt(req.query.page, 10);
        var renderPagination = function () {
            res.render('home', {listMovies,page : pageG});
        }
        console.log("Query page  CALLED: " + req.query.page);
        callDiscoverMovies(pageG,renderPagination);
    }
});


app.get('/home', function (req, res) {
  res.render('home', {
  });
});

app.get('/contact', function (req, res) {
  res.render('contact', {
  });
});

app.get('/review', function (req, res) {
  res.render('review', {
  });
});

app.get('/single', function (req, res) {
  res.render('single', {
  });
});

app.listen(80, function () {
  console.log("Server listening on port 80");
});