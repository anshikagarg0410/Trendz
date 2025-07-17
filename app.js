const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Product = require('./models/product'); // Adjust the path as necessary
const path = require('path');
const ejsMate = require('ejs-mate'); // EJS layout engine
const Review = require('./models/reviews'); // Adjust the path as necessary
const {reviewSchema} = require('./schema'); // Adjust the path as necessary
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const User = require('./models/user'); // Adjust the path as necessary
const LocalStrategy = require('passport-local');

const dbURI = 'mongodb://127.0.0.1:27017/ecommerce';// Replace with your MongoDB URI
main().then(() => {
  console.log('Connected to MongoDB');  
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);   
});

async function main() {
    await mongoose.connect(dbURI);
}
app.set('views', path.join(__dirname, 'views')); // Set the views directory
app.set('view engine', 'ejs'); // Set EJS as the view engine
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.engine('ejs', ejsMate); // Use ejsMate for EJS layout support
app.use(express.static('public'));
app.use(methodOverride('_method'));



const sessionOptions = {
  secret: 'your-secret-key', // Replace with your secret key
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7, // Cookie expires in 7 days
    maxAge:1000 * 60 * 60 * 24 * 7,
    httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
  }
};
app.use(session(sessionOptions)); // Use session middleware
app.use(flash()); // Use flash middleware for flash messages
app.use(passport.initialize()); // Initialize Passport.js
app.use(passport.session()); // Use Passport.js session support
passport.use(new LocalStrategy(User.authenticate())); // Use local strategy for authentication
passport.serializeUser(User.serializeUser()); // Serialize user for session
passport.deserializeUser(User.deserializeUser()); // Deserialize user from session
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
});

const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'You must be logged in');
  res.redirect('/login');
};

const isAuthor=async (req, res, next) => {
  let {id, reviewId} = req.params;
  let review = await Review.findById(reviewId);
  if(!review.author.equals(req.user._id)){
    req.flash('error', 'You do not have permission to do that');
    return res.redirect(`/products/${req.params.id}`);
  }
  next();
};

app.get('/signUp', (req, res) => {
  res.render('users/signUp.ejs'); // Render the signup page
});

app.post('/signUp', async (req, res) => {
    try{
      const { email, password, Username } = req.body;
    const newUser = new User({ email, username: Username });
    const registeredUser=await User.register(newUser, password);
    req.login(registeredUser, (err) => {
        if (err) {
            console.error('Error during login:', err);
            req.flash('error', 'Could not log you in after signup');
            return res.redirect('/signUp'); // Redirect back to signup page on error
        }
        req.flash('success', 'Welcome to the E-commerce site!');
         // Redirect to products page after successful signup
         res.redirect('/products'); 
    });
    } catch (err) {
        console.error('Error during signup:', err);
        req.flash('error', err.message);
        res.redirect('/signUp'); // Redirect back to signup page on error
    }
});

app.get('/login', (req, res) => {
  res.render('users/signUp.ejs'); // Render the login page
});

app.post('/login', passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true, // Enable flash messages for authentication errors
}), (req, res) => {
  req.flash('success', 'Welcome back!');
  res.redirect('/products'); // Redirect to products page after successful login
});

app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/login');
  });
});
//index route to render the products page
app.get('/products', isLoggedIn, async (req, res) => {
  const { category } = req.query;
  let allProducts;
  if (category) {
    allProducts = await Product.find({ category });
  } else {
    allProducts = await Product.find({});
  }
  // Pass category to the EJS file
  res.render('products/index.ejs', { allProducts, category });
});


//show route to render a single product
app.get('/products/:id', isLoggedIn , async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(404).render('not-found/not-found', { url: req.originalUrl });
        }
        const product = await Product.findById(id).populate({path:'reviews', populate:{path:'author'}}); // Populate reviews and their authors
        if (!product) {
            return res.status(404).render('not-found/not-found', { url: req.originalUrl });
        }
        res.render("products/show.ejs", { product });
    } catch (err) {
        console.error('Error fetching product:', err);
        req.flash('error', 'Could not fetch the product');
        res.redirect('/products');
    }
});

app.get('/cart', isLoggedIn , (req, res) => {
  res.render('cart/cart.ejs'); // Render the cart page
});

app.get('/favourites', isLoggedIn , (req, res) => {
  res.render('favourites/fav.ejs'); // Render the favourites page
});

app.get('/buynow', isLoggedIn , (req, res) => {
  res.render('buy-now/buy-now.ejs'); // Render the checkout page
});

const validateReview = async (req, res, next) => {
    let { error } = reviewSchema.validate(req.body);
    const { id } = req.params;
    if (error) {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).render('not-found/not-found', { url: req.originalUrl });
        }
        req.flash('error', error.details[0].message);
        return res.status(400).render('products/show.ejs', { product, error: error.details[0].message });
    } else {
        next();
    }
};

//reviews
//post route to add a review
app.post('/products/:id/reviews', isLoggedIn, validateReview, async (req, res) => {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(404).render('not-found/not-found', { url: req.originalUrl });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).render('not-found/not-found', { url: req.originalUrl });
        }

        // Create review object
        const review = new Review({
            comment: req.body.review.comment,
            rating: req.body.review.rating,
            createdAt: new Date(),
            author: req.user._id // Set author
        });

        await review.save();

        // Add review to product
        product.reviews.push(review._id);
        await product.save();

        console.log("Review saved successfully by:", req.user._id);
        res.redirect(`/products/${id}`);
    } catch (err) {
        console.error("Error adding review:", err);
        req.flash('error', 'Could not add review');
        res.redirect(`/products/${id}`);
    }
});

app.delete('/products/:id/reviews/:reviewId', isLoggedIn, isAuthor ,async (req, res) => {
  try {
        const { id, reviewId } = req.params;
        await Product.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash('success', 'Review deleted!');
        res.redirect(`/products/${id}`);
    } catch (err) {
        console.error('Error deleting review:', err);
        req.flash('error', 'Could not delete review');
        res.redirect(`/products/${req.params.id}`);
    }
  });

  app.get('/profile', isLoggedIn, (req, res) => {
  res.render('profile/profile.ejs', { user: req.user });
});



// app.get('/testingproducts', async (req, res) => {
//   // You can add your logic here, for example
//   let sampleProduct = new Product({
//     name: 'Sample Product',
//     price: 19.99,
//     description: 'This is a sample product.',
//     availableSizes: ['S', 'M', 'L'],
//     image: 'https://example.com/sample.jpg',
//     colors: ['red', 'blue', 'green'],
//     material: 'cotton',
//     category: 'clothing'
//   });

//   await sampleProduct.save();
//   console.log('Sample product saved:');
//   res.send('Sample product created and saved to the database.');
// });

// 404 handler for page not found
app.use((req, res, next) => {
  res.status(404).render('not-found/not-found', { url: req.originalUrl });
});

// Or, if you don't have a not-found.ejs, use plain text:
// app.use((req, res) => {
//   res.status(404).send('404 Page Not Found');
// });

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
