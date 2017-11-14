// Restaurant Review App

// Imports
var express = require('express'); // used to make an Express app
var app = express(); // make the app
var session = require('express-session'); // used for user login
var pgp = require('pg-promise')({
  // initialization options
}); // for accessing the database
var db = pgp({database: 'restaurant'}); // also for accessing the database
var body_parser = require('body-parser'); // used to retrieve input from HTML forms

// Application setup
app.set('view engine', 'hbs'); // use handlebars for template rendering
app.use(express.static('public')); // Setup express to serve the files in the public folder
app.use(body_parser.urlencoded({extended: false}));

// saves a session
app.use(session({
  secret: process.env.SECRET_KEY || 'dev',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 60000}
}));

// route the User to the login page if they are not logged in
app.use(function (req, resp, next) {
  if (req.session.user) {
    next(); // already logged in
  } else if (req.path == '/login') {
    next(); // already navigating to the login page
  } else {
    resp.redirect('/login'); // route to thelogin page
  }
});

// get method for root URL:/
app.get('/', function (req, resp, next) {
  login_name = req.session.login_name;
  var context = {title: 'Restaurant Review', login_name};
  resp.render('index.hbs', context);
});


// get method for login
app.get('/login', function (req, resp, next) {
  var context = {title: 'Login'};
  resp.render('login.hbs', context);
});

// post method for login
app.post('/login', function (req, resp, next) {
  var username = req.body.username; // get user name from the form
  var password = req.body.password; // get password from the form
  var q = 'SELECT * from reviewer WHERE email = $1';
  db.one(q, username)
      .then(function (result) {
      if (result.pword == password) {
        req.session.user = username; // set up a user session
        req.session.login_name = result.reviewer_name;
        resp.redirect('/')
      } else {
        resp.send("Invalid Credentials");
      }
    })
    .catch(function (error) {
      resp.send("Invalid Credentials");
    });
});


// Display list of restaurants that match search criteria
app.get('/search', function (req, resp, next) {
  // Get query parameters from URL
  var search_criteria = req.query.searchcriteria;
  var q = "SELECT * from restaurant WHERE name ILIKE '%$1#%'";
  db.any(q, search_criteria)
    .then(function (result) {
      login_name = req.session.login_name;
      var context = {title: 'Restaurant List', result: result, login_name};
      resp.render('list.hbs', context);
    })
    .catch(next);
});


// get method for adding a restaurant
app.get('/restaurant/new', function (req, resp, next) {
  var context = {title: 'Add Restaurant'};
  resp.render('addrestaurant.hbs', context);
});

// post method for adding a restaurant
app.post('/restaurant/submit_new', function (req, resp, next) {
  // Get input from form
  var form_restaurant_name = req.body.restaurant_name;
  var form_address = req.body.restaurant_addr;
  var form_category = req.body.restaurant_cat;
  var restaurant_info = {
    name: form_restaurant_name,
    address: form_address,
    category: form_category
  };
  var q = 'INSERT INTO restaurant \
    VALUES (default, ${name}, ${address}, ${category}) RETURNING id';
    db.one(q, restaurant_info)
      .then(function (result) {
        // redirect to display restaurant details
        resp.redirect('/restaurant/' + result.id);
      })
      .catch(next);
});


// Display details for a restaurant
app.get('/restaurant/:id', function (req, resp, next) {
  var id = req.params.id;
  var q = 'SELECT restaurant.id as id, restaurant.name, restaurant.address, restaurant.category, review.stars, review.title, review.review, reviewer.reviewer_name, reviewer.email, reviewer.karma FROM restaurant \
  LEFT JOIN review ON restaurant.id = review.restaurant_id \
  LEFT JOIN reviewer on reviewer.id = review.reviewer_id \
  WHERE restaurant.id = $1';
  db.any(q, id)
    .then(function (results) {
      login_name = req.session.login_name;
      resp.render('restaurant.hbs', {title: 'Restaurant', results: results, login_name});
    })
    .catch(next);
});


// get method for adding a review
app.get('/addreview', function (req, resp, next) {
  var id = req.query.id;
  login_name = req.session.login_name;
  var context = {title: 'Add Restaurant Review', id: id, login_name};
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
    VALUES (default, ${stars}, ${title}, ${review}, Null, ${restaurant_id}) RETURNING id';
    db.one(q, review_info)
      .then(function (result) {
        // redirect to display all to-do's
        resp.redirect('/restaurant/' + form_restaurant_id);
      })
      .catch(next);
});


// Listen for requests
app.listen(8000, function() {
  console.log('* Listening on port 8000 *')
});
