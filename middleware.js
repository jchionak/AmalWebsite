const { contactSchema } = require('./schemas');
const joi = require('joi');

const validateContact = (req, res, next) => {
    console.log(req.body);
    const { error } = contactSchema.validate(req.body, { allowUnknown: true });
    if (error) {
        console.log(error)
        req.flash('error', 'Invalid response, please ensure both fields are filled out properly.');
        res.redirect('/contact')
    } else {
        next();
    }
}

module.exports.validateContact = validateContact;

const dateFormat = require('./utils/dateFormat');

const timestamp = (req, res, next) => {
    const date = dateFormat(new Date());
    req.body.date = date;
    next();
}

module.exports.timestamp = timestamp;

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in to do that!');
        return res.redirect('/login');
    } else {
        next()
    }
}

module.exports.isLoggedIn = isLoggedIn;

const storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
}

module.exports.storeReturnTo = storeReturnTo;