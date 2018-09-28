//on click of #scrape-recipes button
$(document).on("click","#scrape-recipes", function(){
  //a get request that scrapes the website and add the scraped data to database
    $.get("/scrape", function() {
      //once the data has been scraped and added to database, reload the page to reflect the data
        location.reload(true);
      });
})

//on click of #favorite-recipes button
$(document).on("click","#favorite-recipes", function(){
  //get all the recipes that have favorite value true
    $.get("/favorites", function() {
      //reload the page
        window.location.href="/favorites";
      });
})

//on click of #view-all-recipes button
$(document).on("click","#view-all-recipes", function(){
  //get all the recipes present in the database
    $.get("/", function() {
      //reload the page
        window.location.href="/";
      });
})

//on click of .add-a-note button, shows modal
$(document).on("click",".add-a-note", function(){
    //clear the textarea of the modal
    $("#bodyinput").val("");
    //get recipeID from the button data-id attribute
    var recipeID = $(this).attr("data-id");;
    //get request to get the note for the recipeID
    $.ajax({
        method: "GET",
        url: "/recipes/" + recipeID +"/notes"
      })
        // With that done, add the note information to the page
        .then(function(data) {
          // The title of the article
          $("#exampleModalLongTitle").html("<h4>" + data.title + "</h4>")
          //attach data-id attribute to the #savenote button
          $("#savenote").attr("data-id",data._id)
          // If there's a note in the recipe
          if (data.note) {
            // Place the body of the note in the body textarea
            $("#bodyinput").val(data.note.body);
          }
        });
})

// When you click the savenote button
$(document).on("click", "#savenote", function() {
  //get the note body in a variable
    var noteData =  $("#bodyinput").val();
    //hide the modal
    $("#exampleModalCenter").modal('hide');
    // Grab the id associated with the recipe from the submit button
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
  
//on click of favorite button which is not yet added to favorites
$(document).on("click",".add-to-favorites", function(){
    //change the button's class to change it's color
    $(this).removeClass("add-to-favorites");
    $(this).addClass("added-to-favorites");
    //get recipeID from button's data-id attribute
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

//on click of favorite button which is already added to favorites
$(document).on("click",".added-to-favorites", function(){
  //change the button's class to change it's color
    $(this).removeClass("added-to-favorites");
    $(this).addClass("add-to-favorites");
    //get recipeID from button's data-id attribute
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

//on click of favorite button which is already added to favorites on favorites page
$(document).on("click",".added-to-favorites-favorite-recipes", function(){
  //change the button's class to change it's color
    $(this).removeClass("added-to-favorites-favorite-recipes");
    $(this).addClass("add-to-favorites");
    //get recipeID from button's data-id attribute
    var recipeId = $(this).data("id");
    //ajax call to update favorite to false
    $.ajax({
        method: "POST",
        url: "/recipes/" + recipeId,
        data: {
          favorite: false
        }
      }).then(function(data){
        //reloads the page to remove the recipe from the favorite page
        location.reload();
      })
})

