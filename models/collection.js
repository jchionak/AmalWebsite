const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CollectionSchema = new Schema({
    name: String,
    description: String,
    photos: [{
        type: Schema.Types.ObjectId,
        ref: 'Photo'
    }],
    leadPhoto: String
});

module.exports = mongoose.model('Collection', CollectionSchema)