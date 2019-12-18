var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

var phantom = require('phantom');
var _ph, _page;
var result = {};
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM(`<!DOCTYPE html>`);
const $ = require('jQuery')(window);


// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoGoals";

// Initialize Express
var app = express();
// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Connect to the Mongo DB
mongoose.connect(MONGODB_URI, { useUnifiedTopology: true, useNewUrlParser: true });

// Routes

function pullData(content) {

  $(content).find('div .gamecentre-playbyplay-event--goal').each(function (i, element) {
    // Save an empty result object
    result = {};
    result.G = $(this).find('a[data-reactid$=".3.0.2"]').text().trim();
    result.A1 = $(this).find('a[data-reactid$=".3.0.6.3"]').text().trim();
    result.A2 = $(this).find('a[data-reactid$=".3.0.7.2"]').text().trim();
    result.Strength = $(this).find('span[data-reactid$=".3.0.8"]').text().trim();
    if (!result.Strength) {
      result.Strength = $(this).find('span[data-reactid$=".3.0.b"]').text().trim() === "" ? "Even Strength" : $(this).find('span[data-reactid$=".3.0.b"]').text().trim();
      result.Type = $(this).find('span[data-reactid$=".3.0.c"]').text().trim() === "" ? "" : $(this).find('span[data-reactid$=".3.0.c"]').text().trim();
    }
    if (!result.Type) {
      result.Type = $(this).find('span[data-reactid$=".3.0.d"]').text().trim() === "" ? "" : $(this).find('span[data-reactid$=".3.0.d"]').text().trim();
    }
    result.Time = $(this).find(".gamecentre-playbyplay-event__timestamp").text().trim();
    result.Plus = [];
    result.Minus = [];
    $(this).find('a[data-reactid*=".3.0.f.1.0.1"]').each(function (i, plusPlayer) {
      result.Plus.push($(plusPlayer).text());
    })
    $(this).find('a[data-reactid*=".3.0.f.1.1.1"]').each(function (i, minusPlayer) {
      result.Minus.push($(minusPlayer).text());
    })
    //addPlayer([result.G,result.A1,result.A2].concat(result.Plus).concat(result.Minus));
    db.GoalSummary.create(result)
      .then(function (dbGoalSummary) {
        // View the added result in the console
      })
      .catch(function (err) {
        // If an error occurred, log it
        console.log(err);
      });
  });
}

function addPlayer(newPlayers) {
  newPlayers.map(player => {
    newPlayer = {
      playerName: player
    }
    db.Player.create(newPlayer)
      .then(function (dbPlayer) {
        // View the added result in the console
        console.log(dbPlayer);
      })
      .catch(function (err) {
        // If an error occurred, log it
        console.log(err);
      });
  })
}

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  phantom.create().then(ph => {
    _ph = ph;
    return _ph.createPage();
  }).then(page => {
    _page = page;
    return _page.open('https://ontariohockeyleague.com/gamecentre/24326/boxscore');
  }).then(status => {
    console.log(status);
    return _page.property('content');
  }).then(content => {
    _ph.exit();
    pullData(content);
    res.json(result);
  })
    .catch(e => console.log(e));

});

app.delete("/clear", function (req, res) {
  // Grab every document in the Articles collection
  db.GoalSummary.remove({}, () => {
    //callback for remove
  });
});

// Route for getting all Articles from the db
app.get("/api/goalSummaries", function (req, res) {
  // Grab every document in the Articles collection
  db.GoalSummary.find({})
    .then(function (dbGoalSummary) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbGoalSummary);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});
// Route for grabbing a specific Article by id, populate it with it's note
app.get("/api/goalSummaries/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.GoalSummary.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function (dbGoalSummary) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbGoalSummary);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Route for saving/updating an Article's associated Note
app.post("/api/goalSummaries/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function (dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.GoalSummary.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
