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

app.listen(80, function () {
  console.log("Server listening on port 80");
});

app.get('/', function (req, res) {
  res.render('home', {
  });
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