var express = require('express');
var request = require('request');
var app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
var mongoose= require('mongoose');
var session = require("express-session");
var promise = require('promise'); 

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json()); // this is used for parsing the JSON object from POST

//Initialisation de la sessionapp.use(
app.use(
 session({ 
  secret: 'a4f8071f-c873-4447-8ee2',
  resave: false,
  saveUninitialized: false,
 })
);

//Connexion à la base de données Mongo
mongoose.connect('mongodb://localhost/moviesapp' , function(err) {
  if (err) { throw err; }
});

//Définition du schéma dans Mongo
var myMovieAccountSchema = mongoose.Schema({
    login : String,
    password : String,
    movies : Array
});

//Lie le schéma au model Mongo
var MyMovies = mongoose.model('MyMovies', myMovieAccountSchema);

//VARIABLES GLOBALES
var listMovies = {};
var pageG = 1;
const pageF = 0;//Page des favoris stockées en mémoire 
listMovies[pageF] = {};



//Mise en cache de mes films
var cacheMyMovies = function(session){
    return new Promise(function (resolve, reject) {
        console.log("Debut cacheMyMovies");
        if (session){
            return new Promise(function (resolve, reject) {
            MyMovies.findOne({email:session.email}).exec(function (err, favoris) {
                session.myMovies = {};
                favoris.movies.forEach(function(id) {
                    session.myMovies[id] = {};
                    session.myMovies[id].content = null;
                    console.log("session.myMovies[id].content ------------------- NULL");
                    callDiscoverMovieDetailsId(pageF,null,id,session);
                    setFavoriCache(id,pageF,session);                    
                }
                , this);
                resolve();
            }
            , this);
            }).then(function (fulfilled) {
                console.log(session.myMovies);
                resolve(session.myMovies);
            })
            .catch(function (error) {
                console.log(error.message);
            });
        }
        else
            reject();
        console.log("Fin cacheMyMovies");
    });
};

//Savoir si un film (ID) est en Favori
function isFavori(id,session){
    console.log(session);
    return session.myMovies[id] ===undefined ? false : true;
}

function setFavoriCache(id,page,session){
    if (page != null && listMovies[page]!= undefined && listMovies[page][id]){
        console.log("setFavoriCache",page,id);
        session.myMovies[id].content = listMovies[page][id];
        console.log("content myMovies", session.myMovies[id].content);
    }
}


//Mise en cache de la première page
callDiscoverMovies(pageG,null,null);

function callDiscoverMovies(page,renderPage,id)
{
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
            body = JSON.parse(body);
            if(body != undefined) {
                listMovies.totalPages = body.total_pages;
                body.results.forEach(function(element) {
                    listMovies[page][element.id] = element;
                    listMovies[page][element.id].details = null;

                }, this);
            }
            if (renderPage)
                if (!id)
                    renderPage();
                else
                    callDiscoverMovieDetailsId(page,renderPage,id,null);           
        });
    }
    else
        if (renderPage)
            if (!id)
                renderPage();
            else
                callDiscoverMovieDetailsId(page,renderPage,id,null);  
}

//fonction  pour appeler le WS de détails d'un film, avec son id
function callDiscoverMovieDetailsId(page,renderPage,id,session){

    //Cas de la page  = 0 correspondant aux Favoris
    if (page == pageF){
        listMovies[page][id] = {};
         listMovies[page][id].details = null;
    }


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
            body = JSON.parse(body);
            if(body != undefined && page != null) {
                listMovies[page][id].details = body;
                if (session != null && session.myMovies != null){
                    if(isFavori(id,session)){
                            console.log("Bon endroit",body.title);
                            setFavoriCache(id,pageF,session);
                    }
                }
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
                    if(body != undefined && page != null) {
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
        res.render('home', {listMovies,page : pageG,login:req.session.email,isLoged : req.session.isLoged});
    }
    callDiscoverMovies(pageG,renderPage,null);
}

app.get('/', function (req, res) {
    home(req,res);
});

app.get('/single', function (req, res) {
    var renderPage = function (id) {
        res.render('single', {listMovies,page : pageG,id,favori : isFavori(id,req.session),login : req.session.email,isLoged : req.session.isLoged});
    }
    if (req.query.id != null){
        if(listMovies[pageG][req.query.id]!= undefined){
            callDiscoverMovieDetailsId(pageG,renderPage,req.query.id,req.session);
        }
        else
        {
            try {
                    callDiscoverMovies(pageG,renderPage,req.query.id);
            }
            catch (e) {
                console.log("Exception",e);
                res.render('home', {listMovies,page : pageG,login : req.session.email,isLoged : req.session.isLoged});
            }

        }
    }
});

app.get('/home', function (req, res) {
    req.query.page = 1;
    pageG = 1;
    home(req,res);
});

app.post('/addFavori', function (req, res) {
    var id = parseInt(req.body.id, 10);
    var page = parseInt(req.body.page, 10);
    if(req.session.isLoged){
        MyMovies.findOne({email:req.session.email}).exec(function (err, favoris) {
            favoris.movies.push(id);
            MyMovies.update({ email: req.session.email }, { movies : favoris.movies},function (error, fav) {
                    if (!error){
                        res.send("true");
                        cacheMyMovies(req.session);
                    }
                    else
                        res.send(String(error));
                });
                //callDiscoverMovieDetailsId(pageF,null,element.id);
            }
            , this);
    }
});

    


app.post('/removeFavori', function (req, res) {
    var id = parseInt(req.body.id, 10);
    var page = parseInt(req.body.page, 10);

    if(req.session.isLoged){
        MyMovies.findOne({email:req.session.email}).exec(function (err, favoris) {
            var position = null;
            for (var i = 0; i < favoris.movies.length; i++) {
                if (favoris.movies[i] == id){
                    position = i;
                    break;
                }
            }
            if (position){
                favoris.movies.splice(position,1);
                MyMovies.update({ email: req.session.email }, { movies : favoris.movies},function (error, fav) {
                        if (!error){
                            res.send("true");
                            cacheMyMovies(req.session);
                        }
                        else
                            res.send(String(error));
                    });
                }
        }
        , this);
    }

});

app.post('/getFavoris', function (req, res) {
    if (req.session.isLoged){
        console.log("getFavoris");
        cacheMyMovies(req.session).then(function (content) {
            console.log("promise content");
            var page = parseInt(req.body.page, 10);
            var fav = [];

            for (var id in req.session.myMovies) {
                fav.push(id);
            }
            console.log(fav);
            res.json(fav);
        }).catch(function (error) {
            console.log(error.message);
        });;
    }
});

app.get('/login', function (req, res) {
    console.log(req.query);
    MyMovies.findOne({email:req.query.email,password : req.query.password}).exec(function (err, element) {
        if (!err && element){
            req.session.email = req.query.email;
            console.log(req.query.email);
            req.session.email = req.query.email;
            req.session.isLoged = true;
            //res.render('review', {listMovies,myMovies,login : req.session.email,isLoged : req.session.isLoged  });
            home(req,res);
        }
        else
            res.send(String(err));
    }
    , this);


});

app.get('/contact', function (req, res) {
  res.render('contact', {
  });
});

app.get('/review', function (req, res) {
    pageG = 0;//Les données provenant du WS sont stockés à la page 0 en mémoire
    console.log("REVIEW");
    
    res.render('review', {listMovies,myMovies : req.session.myMovies,login : req.session.email,isLoged : req.session.isLoged   });
});


app.listen(80, function () {
  console.log("Server listening on port 80");
});