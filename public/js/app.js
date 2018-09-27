$(document).on("click","#scrape-recipes", function(){
    $.get("/scrape", function() {
        location.reload(true);
      });
})

$(document).on("click","#favorite-recipes", function(){
    $.get("/favorites", function() {
        window.location.href="/favorites";
      });
})

$(document).on("click","#view-all-recipes", function(){
    $.get("/", function() {
        window.location.href="/";
      });
})

$(document).on("click",".add-a-note", function(){
    $("#bodyinput").val("");
    var recipeID = $(this).attr("data-id");;
    $.ajax({
        method: "GET",
        url: "/recipes/" + recipeID +"/notes"
      })
        // With that done, add the note information to the page
        .then(function(data) {
          // The title of the article
          $("#exampleModalLongTitle").html("<h2>" + data.title + "</h2>")
          $("#savenote").attr("data-id",data._id)
          // If there's a note in the article
          if (data.note) {
            // Place the body of the note in the body textarea
            $("#bodyinput").val(data.note.body);
          }
        });
})

// When you click the savenote button
$(document).on("click", "#savenote", function() {
    var noteData =  $("#bodyinput").val();
    $("#exampleModalCenter").modal('hide');
    // Grab the id associated with the article from the submit button
    var recipeId = $(this).attr("data-id");
  
    // Run a POST request to change the note, using what's entered in the inputs
    $.ajax({
      method: "POST",
      url: "/recipes/" + recipeId+ "/notes",
      data: {
        // Value taken from note textarea
        body: noteData
      }
    })
      // With that done
      .then(function(data) {
        // Log the response
        console.log(data);
        // Empty the notes section
        $("#notes").empty();
      });
  
    // Also, remove the values entered in the input and textarea for note entry
    $("#bodyinput").val("");
  });
  

$(document).on("click",".add-to-favorites", function(){
    $(this).removeClass("add-to-favorites");
    $(this).addClass("added-to-favorites");
    var recipeId = $(this).data("id");
    //ajax call to update favorite to true
    $.ajax({
        method: "POST",
        url: "/recipes/" + recipeId,
        data: {
          favorite: true
        }
      })
})

$(document).on("click",".added-to-favorites", function(){
    $(this).removeClass("added-to-favorites");
    $(this).addClass("add-to-favorites");
    var recipeId = $(this).data("id");
    //ajax call to update favorite to false
    $.ajax({
        method: "POST",
        url: "/recipes/" + recipeId,
        data: {
          favorite: false
        }
      })
})
$(document).on("click",".added-to-favorites-favorite-recipes", function(){
    $(this).removeClass("added-to-favorites-favorite-recipes");
    $(this).addClass("add-to-favorites");
    var recipeId = $(this).data("id");
    console.log("before clicking")
    //ajax call to update favorite to false
    $.ajax({
        method: "POST",
        url: "/recipes/" + recipeId,
        data: {
          favorite: false
        }
      }).then(function(data){
        location.reload();
      })
})

