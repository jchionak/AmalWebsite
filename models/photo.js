const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PhotoSchema = new Schema({
    src: String,
    filename: String
});

module.exports = mongoose.model('Photo', PhotoSchema);