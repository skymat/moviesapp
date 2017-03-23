$("document").ready(function() {

//Get URL Parameters using jQuery
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
}
var page = $.urlParam('page');

var addToFavori = {
  "async": true,
  "crossDomain": true,
  "url": "\addToFavori",
  "method": "POST",
  "headers": {},
  "data": "{id : }"
}

$.ajax(addToFavori).done(function (response) {
  
});


 $(".addFavori").click(function(event){ 
        //var id = $("#").
        $.post( "/addFavori",{page,id}, function( data ) {
        });
 });

})