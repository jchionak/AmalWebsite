const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhotoSchema = new Schema({
    src: String,
    title: String,
    description: String,
    year: Number
});

module.exports = mongoose.model('Photo', PhotoSchema);