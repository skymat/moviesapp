$("document").ready(function() {

var settings = {
  "async": true,
  "crossDomain": true,
  "url": "https://api.themoviedb.org/3/discover/movie?page=1&include_video=false&include_adult=false&sort_by=popularity.asc&language=fr-FR&api_key=477dda0db0796b050196af446fe30383",
  "method": "GET",
  "headers": {},
  "data": "{}"
}

$.ajax(settings).done(function (response) {
  $
});

})