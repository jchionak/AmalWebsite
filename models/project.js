const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Photo = require('./photo');
const { cloudinary } = require('../cloudinary/index');

const ProjectSchema = new Schema({
    title: String,
    description: String,
    link: String,
    photo: {
        type: Schema.Types.ObjectId,
        ref: 'Photo'
    }
});

module.exports = mongoose.model('Project', ProjectSchema);