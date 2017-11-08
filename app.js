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
  var q = 'SELECT * from review \
    JOIN restaurant ON restaurant.id = restaurant_id \
    LEFT OUTER JOIN reviewer ON reviewer.id = reviewer_id \
    WHERE restaurant_id = $1';
  db.any(q, restaurant_id)
    .then(function (result) {
      var context = {title: 'Restaurant Details', result: result};
      resp.render('restaurant.hbs', context);
    })
    .catch(next);
});

// get method for adding a review
app.get('/addreview', function (req, resp) {
  var id = req.query.id;
  var context = {title: 'Add Restaurant Review', id: id};
  resp.render('addreview.hbs', context);
});

// post method for adding a review
app.post('/addreview', function (req, resp, next) {
    // Get input from form
  var form_restaurant_id = req.body.id;
  var form_title = req.body.review_title;
  var form_review = req.body.review_text;
  var form_stars = parseInt(req.body.review_stars);
  var review_info = {
    stars: form_stars,
    title: form_title,
    review: form_review,
    restaurant_id: form_restaurant_id
  };
  var q = 'INSERT INTO review \
    VALUES (default, ${stars}, ${title}, ${review}, default, ${restaurant_id}) RETURNING id';
    db.one(q, review_info)
      .then(function (result) {
        console.log('Created review with ID ' + result.id);
        // redirect to display all to-do's
        resp.redirect('/');
      })
      .catch(next);
});

// Listen for requests
app.listen(8000, function() {
  console.log('* Listening on port 8000 *')
});
