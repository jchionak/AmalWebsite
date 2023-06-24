const joi = require('joi');

const contactSchema = joi.object({
    contact: joi.object({
        email: joi.string().required(),
        inquiry: joi.string().required()
    })
});

module.exports.contactSchema = contactSchema;