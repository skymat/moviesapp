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


$('#loginform').on('submit', function(e) {
  
  console.log("submit");
  var val = $("#username").val();
  return;
  $.get( "/login",{email:$("#emaillogin").val(),password:$("#passwordlogin").val()}, function( data ) {
      console.log("post",val);
      console.log(data);
      $("#loginuser").html(data);
        });
        
});


//Chargement des favoris
  $.post( "/getFavoris",{page}, function( data ) {
    console.log("getfavoris post",data);
    for (var i = 0; i < data.length; i++) {
      console.log("favori",data[i]);
      $("#"+data[i]+" .fa-star-o").removeClass("fa-star-o").addClass("fa-star");
    }
  });

 $(".fa-star-o,.fa-star").click(function(event){ 
    var id = $(this).parents('div .movief').attr('id');
    var url = window.location.href;
    console.log(url);
    var current = $(this);
    if ($(this).hasClass("fa-star"))
      $.post( "/removeFavori",{page,id}, function( data ) {
        current.removeClass("fa-star");
        current.addClass("fa-star-o");
      });
    else if ($(this).hasClass("fa-star-o"))
      $.post( "/addFavori",{page,id}, function( data ) {
        console.log(data);
        current.removeClass("fa-star-o");
        current.addClass("fa-star");
      });
 });


})