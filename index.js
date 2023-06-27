if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// node modules
const express = require('express');
const path = require('path');
const ejsMate = require('ejs-mate');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const { cloudinary } = require('./cloudinary/index');
const { storage } = require('./cloudinary/index');
const multer = require('multer');
const upload = multer({ storage });
const helmet = require('helmet');

// models
const Contact = require('./models/contact');
const Collection = require('./models/collection');
const Photo = require('./models/photo');
const User = require('./models/user');
const Project = require('./models/project');

// custom utilities
const { validateContact, timestamp, storeReturnTo, isLoggedIn } = require('./middleware');
const wrapAsync = require('./utils/wrapAsync');
const ExpressError = require('./utils/expressError');
const dateFormat = require('./utils/dateFormat');

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/jamal'
mongoose.connect(dbUrl);

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

const secret = process.env.SECRET || 'LOLsecret'

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
});

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e);
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    'https://stackpath.bootstrapcdn.com/',
    'https://kit.fontawesome.com/',
    'https://code.jquery.com/',
    'https://cdnjs.cloudflare.com/',
    "https://cdn.jsdelivr.net/"
];

const styleSrcUrls = [
    'https://kit-free.fontawesome.com/',
    'https://stackpath.bootstrapcdn.com/',
    'https://fonts.googleapis.com/',
    'https://use.fontawesome.com',
    'https://cdn.jsdelivr.net/'
]

const fontSrcUrls = [
    'https://fonts.gstatic.com/'
];

app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'"],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/djxbuhpf2/"
            ],
            fontSrc: ["'self'", ...fontSrcUrls]
        }
    })
)

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

app.get('/', (req, res) => {
    res.render('home.ejs');
})

app.get('/collections', wrapAsync(async (req, res) => {
    const collections = await Collection.find({});
    res.render('collections.ejs', { collections });
}))

app.post('/collections', isLoggedIn, upload.array('image'), wrapAsync(async (req, res) => {
    const name = req.body.name;
    const description = req.body.description;
    const collection = new Collection({
        name,
        description,
        photos: []
    })
    for (let image of req.files) {
        const photo = new Photo({
            src: image.path,
            filename: image.filename
        })
        await photo.save();
        collection.photos.push(photo);
    }
    collection.leadPhoto = collection.photos[0].src;
    await collection.save();
    req.flash('success', 'Uploaded new collection!');
    res.redirect('/collections');
}))

app.get('/collections/:id/:photoId', wrapAsync(async (req, res) => {
    const photoId = req.params.photoId;
    const id = req.params.id;
    const photo = await Photo.findById(photoId);
    console.log(photo)
    res.render('photo.ejs', { photo, id });
}))

app.delete('/collections/:id/:photoId', isLoggedIn, wrapAsync(async (req, res) => {
    const photoId = req.params.photoId;
    const id = req.params.id;
    const filename = await Photo.findById(photoId);
    await Photo.findByIdAndDelete(photoId);
    await cloudinary.uploader.destroy(filename)
    const collection = await Collection.findById(id).populate('photos');
    await collection.updateOne({ $pull: { photos: { id: photoId } } });
    collection.leadPhoto = collection.photos[0].src;
    collection.save();
    req.flash('success', 'Deleted!');
    res.redirect(`/collections/${id}`);
}))

app.get('/collections/:id', wrapAsync(async (req, res) => {
    const id = req.params.id;
    const collection = await Collection.findById(id).populate('photos');
    res.render('collection', { collection });
}))

app.delete('/collections/:id', wrapAsync(async (req, res) => {
    const id = req.params.id;
    await Collection.findByIdAndDelete(id);
    req.flash('success', 'Deleted collection!');
    res.redirect('/collections');
}))

app.get('/collections/:id/edit', isLoggedIn, wrapAsync(async (req, res) => {
    const id = req.params.id;
    const collection = await Collection.findById(id);
    res.render('edit.ejs', { collection });
}))

app.put('/collections/:id', isLoggedIn, upload.array('image'), wrapAsync(async (req, res) => {
    const id = req.params.id;
    const collection = await Collection.findById(id);
    await Collection.findByIdAndUpdate(id, { name: req.body.name, description: req.body.description });
    console.log(collection.photos);
    for (let image of req.files) {
        const photo = new Photo({
            src: image.path,
            filename: image.filename
        })
        await photo.save();
        collection.photos.push(photo);
    }
    collection.save();
    req.flash('success', 'Updated!');
    res.redirect('/collections');
}))

app.get('/projects', wrapAsync(async (req, res) => {
    const projects = await Project.find({}).populate('photo');
    res.render('projects.ejs', { projects });
}))

app.post('/projects', isLoggedIn, upload.single('image'), wrapAsync(async (req, res) => {
    const title = req.body.title;
    const description = req.body.description;
    const link = req.body.link;
    const photo = new Photo({
        src: req.file.path,
        filename: req.file.filename
    });
    photo.save();
    const project = new Project({
        title,
        description,
        link,
        photo
    });
    project.save();
    req.flash('success', 'Uploaded new project!');
    res.redirect('/projects');
}))

app.delete('/projects/:id', isLoggedIn, wrapAsync(async (req, res) => {
    const id = req.params.id;
    await Project.findByIdAndDelete(id);
    req.flash('success', 'Deleted project!');
    res.redirect('/projects');
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

const port = process.env.PORT || 3000
app.listen(port, () => {
    console.log('Listening on port 3000!')
})