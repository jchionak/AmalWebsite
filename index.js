// node modules
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');

// models
const Contact = require('./models/contact');
const Collection = require('./models/collection');
const Photo = require('./models/photo');

// custom utilities
const { validateContact } = require('./middleware');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/expressError');

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

app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('home.ejs');
})

app.get('/collections', (req, res) => {
    res.render('collections.ejs');
})

app.get('/collections/:id', wrapAsync(async (req, res) => {
    const id = req.params.id;
    const collection = await Collection.findById(id).populate('photos');
    res.render('collection', { collection });
}))

app.get('/contact', (req, res) => {
    res.render('contact.ejs');
})

app.post('/contact', validateContact, wrapAsync(async (req, res) => {
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