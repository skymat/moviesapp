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
var page = $.urlParam('page')? $.urlParam('page'):1;

//Chargement des favoris
  $.post( "/getFavoris",{page}, function( data ) {
    for (var i = 0; i < data.length; i++) {
      $("#"+data[i]+" .addFavori").removeClass("addFavori").addClass("myFavori");
    }
  });

 $(".addFavori,.myFavori").click(function(event){ 
    var id = $(this).parents('div .movief').attr('id');
    console.log(id);
    var current = $(this);
    if ($(this).hasClass("myFavori"))
      $.post( "/removeFavori",{page,id}, function( data ) {
        current.removeClass("myFavori");
        current.addClass("addFavori");
      });
    else if ($(this).hasClass("addFavori"))
      $.post( "/addFavori",{page,id}, function( data ) {
        console.log(data);
        current.removeClass("addFavori");
        current.addClass("myFavori");
      });
 });


})