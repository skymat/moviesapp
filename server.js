var express = require('express');
var request = require('request');
var app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
var mongoose= require('mongoose');

//Connexion à la base de données Mongo
mongoose.connect('mongodb://localhost/moviesapp' , function(err) {
  if (err) { throw err; }
});

//Définition du schéma dans Mongo
var myMovieAccountSchema = mongoose.Schema({
    id: Number,
    favori: Boolean,
});

//Lie le schéma au model Mongo
var MyMovies = mongoose.model('MyMovies', myMovieAccountSchema);
/*
var fav =  new MyMovies({id : 118340,favori : true});
  fav.save(function (error, fav) {
    
  });
*/
var listMovies = {};
var pageG = 1;
//callDiscoverMovies(pageG,null,null);
function callDiscoverMovies(page,renderPage,id)
{
    console.log("page: " + page, " -- renderPage: ", renderPage , " -- id: "+ id );
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
                    listMovies[page][element.id].details = null;
                    
                    var fav = isFavori(element.id);
                
                    console.log("id",fav);
                    listMovies[page][element.id].favori = fav;
                    
                    console.log("ELEMENT ID - " + element.id);
                }, this);
            }
            console.log(renderPage);
            if (renderPage)
                if (!id)
                    renderPage();
                else
                    callDiscoverMovieDetailsId(page,renderPage,id);           
        });
    }
    else
        if (renderPage)
            if (!id)
                renderPage();
            else
                callDiscoverMovieDetailsId(page,renderPage,id);  
}

//fonction  pour appeler le WS de détails d'un film, avec son id
function callDiscoverMovieDetailsId(page,renderPage,id){
    console.log("DETAILS " ,listMovies[page][id].details != null);
    //Si le détails a déjà été mis en mémoire, on rend la page sans rappeler le WS
    if (listMovies[page][id].details != null){
        if (renderPage)
            renderPage(id);
    }
    else{
        //Requête pour WS de détails sur un film spécifique (id)
        var settingsDetails = {
            "async": true,
            "crossDomain": true,
            "url": "https://api.themoviedb.org/3/movie/"+id+"?api_key=477dda0db0796b050196af446fe30383&language=fr-FR",
            "method": "GET",
            "headers": {},
            "data": "{}"
        }
        //WS détails
        request(settingsDetails.url, function(error, response, body) {
            console.log("details - " + id);
            body = JSON.parse(body);
            if(body != undefined && page) {
                console.log("detail affectation - " + id);
                listMovies[page][id].details = body;
                formatAndSaveCategories(page,id);
                listMovies[page][id].scenaristes = "";
                listMovies[page][id].realisateurs = "";
                listMovies[page][id].acteurs = "";

                //Requête pour obtenir les acteurs et le staff du film
                var people = {
                    "async": true,
                    "crossDomain": true,
                    "url": "https://api.themoviedb.org/3/movie/"+id+"/credits?api_key=477dda0db0796b050196af446fe30383",
                    "method": "GET",
                    "headers": {},
                    "data": "{}"
                }
                //WS acteurs/Staff
                request(people.url, function(error, response, body) {
                    body = JSON.parse(body);
                    if(body != undefined && page) {
                        formatAndSaveRealisateurs(page,id,body);
                        formatAndSaveScenaristes(page,id,body);
                        formatAndSaveActeurs(page,id,body);
                        if (renderPage)
                            renderPage(id);
                    }
                    else if (renderPage)
                        renderPage(id);
                });
            }
        });
    }
}

var isFavori = function(id){
    var fav = false;
    //Récupération de l'info Boolean si le film est en favori
    MyMovies.find({id : id}).exec(function (err, movie) {
        fav = movie.length > 0;
        console.log(id,fav);
        return fav;
    });
    console.log("return",fav);
}

function formatAndSaveCategories(page,id){
    categories = "";
    for (var i = 0; i < listMovies[page][id].details.genres.length; i++) {
        categories+=listMovies[page][id].details.genres[i].name;
        if(i < listMovies[page][id].details.genres.length - 1)
        categories+=" / ";
    }
    listMovies[page][id].categories = categories;
}

function formatAndSaveRealisateurs(page,id,body){
    var realisateurs = "";
    body.crew.forEach(function(element) {
        if (element.job == "Director"){
            if (realisateurs != "")
                realisateurs += " / ";
            realisateurs += element.name;
        }
    }, this);
    listMovies[page][id].realisateurs = realisateurs;
}

function formatAndSaveScenaristes(page,id,body){
    var scenaristes = "";
    body.crew.forEach(function(element) {
        if (element.job == "Story"){
            if (scenaristes != "")
                scenaristes += " / ";
            scenaristes += element.name;
        }
    }, this);
    listMovies[page][id].scenaristes = scenaristes;
}

function formatAndSaveActeurs(page,id,body){
    var acteurs = "";
    for (var i = 0; i < 6; i++) {
        var element = body.cast[i];
        acteurs += element.character + " ("+ element.name + ")";
        if (i < 5)
            acteurs += " / ";
    }
    listMovies[page][id].acteurs = acteurs;
}

function home(req,res){
    if (req.query.page != null && parseInt(req.query.page, 10)){
        pageG = parseInt(req.query.page, 10);
    }
    var renderPage = function () {
        res.render('home', {listMovies,page : pageG});
    }
    callDiscoverMovies(pageG,renderPage,null);
}

app.get('/', function (req, res) {
    home(req,res);
});

app.get('/single', function (req, res) {
    var renderPage = function (id) {
        res.render('single', {listMovies,page : pageG,id});
    }
    if (req.query.id != null){
        if(listMovies[pageG][req.query.id]!= undefined){
            console.log("AVANT callDiscoverMovieDetailsId");
            callDiscoverMovieDetailsId(pageG,renderPage,req.query.id);
            console.log("APRES callDiscoverMovieDetailsId");
        }
        else
        {
            try {
                    console.log("AVANT callDiscoverMovies");
                    callDiscoverMovies(pageG,renderPage,req.query.id);
                    console.log("APRES callDiscoverMovies");
            }
            catch (e) {
                console.log("Exception",e);
                res.render('home', {listMovies,page : pageG});
            }

        }
    }
});

app.get('/home', function (req, res) {
    home(req,res);
});

app.get('/contact', function (req, res) {
  res.render('contact', {
  });
});

app.get('/review', function (req, res) {
  res.render('review', {
  });
});


app.listen(80, function () {
  console.log("Server listening on port 80");
});