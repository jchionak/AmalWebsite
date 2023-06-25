const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ContactSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    inquiry: {
        type: String,
        required: true
    },
    date: {
        type: String,
        requried: true
    }
})

module.exports = mongoose.model('Contact', ContactSchema)