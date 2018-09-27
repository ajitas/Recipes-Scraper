var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");

var PORT = process.env.PORT || 8080;

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
mongoose.connect("mongodb://localhost/recipe-scraper", { useNewUrlParser: true });


// A GET route for scraping the echoJS website
app.get("/scrape", function(req, res) {

    // Make a request call to grab the HTML body from the site of your choice
    request("https://www.epicurious.com/search/?content=recipe&sort=newest", function(error, response, html) {
        var $ = cheerio.load(html);
        var len = $("article.recipe-content-card").length;
        $("article.recipe-content-card").each(function(i, element) {
            var title = $(element).children("header.summary").children("h4.hed").children().text();
            var summary = $(element).children("header.summary").children("p.dek").text();
            var rating = $(element).children("header.summary").find("dd.rating").children("span").eq(0).text();
            var makeagain = $(element).children("header.summary").find("dd.make-again-percentage").text();
            makeagain=makeagain.slice(0,makeagain.length-1);
            var link = "https://www.epicurious.com"+$(element).children("a.photo-link").attr("href");

            request(link, function(error,response,html){
                var $ = cheerio.load(html);
                var image = $("img.photo.loaded").attr("srcset");

                var result ={};
                
                result.title= title,
                result.summary=summary,
                result.rating=parseInt(rating),
                result.makeagain= parseInt(makeagain),
                result.link=link,
                result.image=image
                
                // Create a new Article using the `result` object built from scraping
                db.Recipe.create(result).then(function(dbRecipe) {
                    // View the added result in the console
                    console.log(dbRecipe);
            
                    if(i === len-1)
                        res.redirect("/");
                }).catch(function(err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
            });
        })
        //res.send("Scrape Complete");
    });
});


// Route for getting all Articles from the db
app.get("/", function(req, res) {
    db.Recipe.find({}).then(function(dbData){
        res.render("index",{recipes:dbData})
      }).catch(function(err){
        res.json(err);
      })
  });

  app.get("/favorites", function(req, res) {
    db.Recipe.find({favorite:true}).then(function(dbData){
        res.render("favorites",{recipes:dbData})
      }).catch(function(err){
        res.json(err);
      })
  });

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/recipes/:recipeID/notes", function(req, res) {

    db.Recipe.findOne({"_id": req.params.recipeID}).populate("note").then(function(dbData){
      res.json(dbData)
    }).catch(function(err){
      res.json(err);
    })
  });

  // Route for saving/updating an Article's associated Note
app.post("/recipes/:recipeID/notes", function(req, res) {
    db.Note.create(req.body).then(function(dbNote){
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

app.post("/recipes/:recipeID", function(req,res){
    db.Recipe.findOneAndUpdate({"_id":req.params.recipeID}, {$set:{ favorite: req.body.favorite }}, { new: true })
    .then(function(dbRecipe){
        res.json(dbRecipe);
    }).catch(function(err){
        res.json(err);
    })
})

  // Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
});
  