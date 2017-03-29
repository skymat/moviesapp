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
      $("#"+data[i]+" .fa-star-o").removeClass("fa-star-o").addClass("fa-star");
    }
  });

 $(".fa-star-o,.fa-star").click(function(event){ 
    var id = $(this).parents('div .movief').attr('id');
    console.log(id);
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

//Contact
$('#contact-form-id').on('submit', function(e) {

  event.preventDefault();

  $.post( "/contact",{email:$("#email").val(),name:$("#name").val(),website:$("#website").val(),message:$("#message").val()}, function( data ) {
      console.log(data);
      $("#email").val("");
      $("#name").val("");
      $("#website").val("");
      $("#message").val("");
      $("#messagesend").html(data);
  });
        
});


})