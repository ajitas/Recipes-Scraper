//relevant packages
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");

//port
var PORT = process.env.PORT || 8080;

//Initialize express
var app = express();

// Requiring our models for syncing
var db = require("./models");

// Serve static content for the app from the "public" directory in the application directory.
app.use(express.static("public"));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse application/json
app.use(bodyParser.json());

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to the Mongo DB
// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/recipe-scraper";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);



// A GET route for scraping the epicurious.com website
app.get("/scrape", function(req, res) {

    // Make a request call to grab the HTML body from the site of your choice
    request("https://www.epicurious.com/search/?content=recipe&sort=newest", function(error, response, html) {

        //load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);

        //get the number of recipes that we would be extracting from the website
        var len = $("article.recipe-content-card").length;

        //for each recipe card in the html
        $("article.recipe-content-card").each(function(i, element) {

            //scrape the title of the recipe
            var title = $(element).children("header.summary").children("h4.hed").children().text();
            //scrape summary of the recipe
            var summary = $(element).children("header.summary").children("p.dek").text();
            //scrape rating of the recipe
            var rating = $(element).children("header.summary").find("dd.rating").children("span").eq(0).text();
            //scrape makeagain percentage for the recipe
            var makeagain = $(element).children("header.summary").find("dd.make-again-percentage").text();
            //remove the last % from makeagain as we want to store it as number and not a string
            makeagain=makeagain.slice(0,makeagain.length-1);
            //scrape the recipe link
            var link = "https://www.epicurious.com"+$(element).children("a.photo-link").attr("href");

            //since picture was dynamically generated on this page and could not be scraped,
            //To get the picture another request is made to the recipe link page
            request(link, function(error,response,html){

                //load that into cheerio and save it to $ for a shorthand selector
                var $ = cheerio.load(html);
                //scrape the image
                var image = $("img.photo.loaded").attr("srcset");

                //empty object that will be used to make recipe object
                var result ={};
                
                //add all scraped values to the object result
                result.title= title,
                result.summary=summary,
                result.rating=parseInt(rating),
                result.makeagain= parseInt(makeagain),
                result.link=link,
                result.image=image
                
                // Create a new Recipe using the `result` object built from scraping
                db.Recipe.create(result).then(function(dbRecipe) {
                    // View the added result in the console
                    console.log(dbRecipe);
            
                    //If all recipes are created in database, redirect to root route and display all the recipes from the database
                    if(i === len-1)
                        res.redirect("/");
                }).catch(function(err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
            });
        })
    });
});


// Route for getting all Recipes from the db
app.get("/", function(req, res) {
    db.Recipe.find({}).then(function(dbData){
        //if the data is sucessfully retrieved, render index.handlebars with this data
        res.render("index",{recipes:dbData})
      }).catch(function(err){
          // If an error occurs, send it back to the client
        res.json(err);
      })
});

// Route for getting all Recipes that are favorite from the db
app.get("/favorites", function(req, res) {
db.Recipe.find({favorite:true}).then(function(dbData){
    //if the data is sucessfully retrieved, render favorites.handlebars with this data
        res.render("favorites",{recipes:dbData})
    }).catch(function(err){
        // If an error occurs, send it back to the client
        res.json(err);
    })
});

// Route for grabbing a specific Recipe by id, populate it with it's note
app.get("/recipes/:recipeID/notes", function(req, res) {
    //find the recipe document for the given recipeID populated with it's note
    db.Recipe.findOne({"_id": req.params.recipeID}).populate("note").then(function(dbData){
        //If data was successfully retrieved, send it as response to the client
      res.json(dbData)
    }).catch(function(err){
        // If an error occurs, send it back to the client
      res.json(err);
    })
  });

  // Route for saving/updating an Recipe's associated Note
app.post("/recipes/:recipeID/notes", function(req, res) {
    //create a new note for the selected recipeID with the value sent in body
    db.Note.create(req.body).then(function(dbNote){
    //once the note has been created, find the recipeID in recipe collection and add the newly created note's id to it
      return db.Recipe.findOneAndUpdate({"_id":req.params.recipeID}, { $set: { note: dbNote._id } }, { new: true });
    }).then(function(dbRecipe) {
      // If the User was updated successfully, send it back to the client
      res.json(dbRecipe);
    })
    .catch(function(err) {
      // If an error occurs, send it back to the client
      res.json(err);
    });
});

//updates the Recipe collection's document where id=:recipeID; sets favorite
app.post("/recipes/:recipeID", function(req,res){
    //find one document where id matches request paramater and set favorite key value
    db.Recipe.findOneAndUpdate({"_id":req.params.recipeID}, {$set:{ favorite: req.body.favorite }}, { new: true })
    .then(function(dbRecipe){
        // If the Recipe was updated successfully, send it back to the client
        res.json(dbRecipe);
    })
    .catch(function(err){
        // If an error occurs, send it back to the client
        res.json(err);
    });
});

  // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});
  