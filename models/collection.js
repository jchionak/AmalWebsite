const mongoose = require('mongoose');
const Photo = require('./photo');
const Schema = mongoose.Schema;
const { cloudinary } = require('../cloudinary/index');

const CollectionSchema = new Schema({
    name: String,
    description: String,
    photos: [{
        type: Schema.Types.ObjectId,
        ref: 'Photo'
    }],
    leadPhoto: String
});

CollectionSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Photo.deleteMany({
            _id: {
                $in: doc.photos
            }
        })
    }
})

module.exports = mongoose.model('Collection', CollectionSchema)