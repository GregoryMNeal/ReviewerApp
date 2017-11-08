// Restaurant Review App

var express = require('express'); // used to make an Express app
var app = express(); // make the app
app.set('view engine', 'hbs'); // use handlebars for template rendering
app.use(express.static('public')); // Setup express to serve the files in the public folder
var pgp = require('pg-promise')({
  // initialization options
}); // for accessing database
var db = pgp({database: 'restaurant'});
const body_parser = require('body-parser');
app.use(body_parser.urlencoded({extended: false}));

// get method for root URL:/
app.get('/', function (req, resp) {
  var context = {title: 'Restaurant Review'};
  resp.render('index.hbs', context);
});

// Display list of restaurants that match search criteria
app.get('/search', function (req, resp, next) {
  // Get query parameters from URL
  var search_criteria = req.query.searchcriteria;
  var q = "SELECT * from restaurant WHERE name ILIKE '%$1#%'";
  db.any(q, search_criteria)
    .then(function (result) {
      var context = {title: 'Restaurant List', result: result};
      resp.render('list.hbs', context);
    })
    .catch(next);
});

// Display details for a restaurant
app.get('/restaurant/:id', function (req, resp, next) {
  var restaurant_id = req.params.id;
  var q = 'SELECT * from restaurant WHERE id = $1';
  db.one(q, restaurant_id)
    .then(function (result) {
      var context = {title: 'Restaurant Details', result: result};
      resp.render('restaurant.hbs', context);
    })
    .catch(next);
});

// Listen for requests
app.listen(8000, function() {
  console.log('* Listening on port 8000 *')
});
