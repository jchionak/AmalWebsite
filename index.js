// node modules
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');

// models
const Contact = require('./models/contact');
const Collection = require('./models/collection');
const Photo = require('./models/photo');
const User = require('./models/user');

// custom utilities
const { validateContact, timestamp, storeReturnTo, isLoggedIn } = require('./middleware');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/expressError');
const dateFormat = require('./utils/dateFormat');

mongoose.connect('mongodb://127.0.0.1:27017/jamal');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

const sessionConfig = {
    name: 'session',
    secret: 'LOLsecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('home.ejs');
})

app.get('/collections', async (req, res) => {
    const collections = await Collection.find({});
    res.render('collections.ejs', { collections });
})

app.get('/collections/:id', wrapAsync(async (req, res) => {
    const id = req.params.id;
    const collection = await Collection.findById(id).populate('photos');
    res.render('collection', { collection });
}))

app.get('collection/:photoId', wrapAsync(async (req, res) => {
    const photoId = req.params.photoId;
    const photo = Photo.findById(photoId);
    res.render('photo.ejs', { photo });
}))

app.get('/contact', (req, res) => {
    res.render('contact.ejs');
})

app.post('/contact', timestamp, validateContact, wrapAsync(async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();
        req.flash('success', 'Successfully sent an inquiry!')
        res.redirect('/');
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('/')
    }
}))

app.get('/admin', isLoggedIn, wrapAsync(async (req, res) => {
    const contacts = await Contact.find({});
    res.render('admin.ejs', { contacts });
}))

app.delete('/admin/:id', wrapAsync(async (req, res) => {
    const id = req.params.id;
    await Contact.findByIdAndDelete(id);
    req.flash('success', 'Contact inquiry deleted!');
    res.redirect('/admin');
}))

app.get('/login', (req, res) => {
    res.render('login.ejs');
})

app.post('/login', storeReturnTo,
    passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }),
    (req, res) => {
        req.flash('success', 'Welcome back!');
        const redirectUrl = res.locals.returnTo || '/'
        delete res.locals.returnTo;
        res.redirect(redirectUrl)
    })

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong'
    res.status(statusCode).render('error', { err, statusCode });
})

app.listen(3000, () => {
    console.log('Listening on port 3000!')
})