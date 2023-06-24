const { contactSchema } = require('./schemas');

const validateContact = (req, res, next) => {
    const { error } = contactSchema.validate(req.body)
    if (error) {
        req.flash('error', 'Invalid response, please ensure both fields are filled out properly.');
        res.redirect('/contact')
    } else {
        next();
    }
}

module.exports.validateContact = validateContact;