const mongoose = require('mongoose');

const Collection = require('../models/collection');

mongoose.connect('mongodb://127.0.0.1:27017/jamal');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const seedDB = async () => {
    // THIS WILL DELETE EVERYTHING IN COLLECTIONS, DONT DO IT WILLY NILLY!!!
    await Collection.deleteMany({});

    // I'm just making a few collections to get an idea of what they look like on the page
    const nature = new Collection({
        name: 'NATURE',
        description: 'The great outdoors.',
        photos: [],
        leadPhoto: 'https://cdn.discordapp.com/attachments/1100975739530121307/1121893753439911996/pookal.JPG'
    });

    await nature.save();

    const street = new Collection({
        name: 'STREET',
        description: 'The city calls.',
        photos: [],
        leadPhoto: 'https://cdn.discordapp.com/attachments/1100975739530121307/1121893751758000179/Kalor.JPG'
    });

    street.save();

    const stillLife = new Collection({
        name: 'STILL LIFE',
        description: 'The simple moments.',
        photos: [],
        leadPhoto: 'https://cdn.discordapp.com/attachments/1100975739530121307/1121894386100342846/Two_bros.JPG'
    });

    await stillLife.save();

    const extras = new Collection({
        name: 'EXTRAS',
        description: 'Expect the unexpected.',
        photos: [],
        leadPhoto: 'https://cdn.discordapp.com/attachments/1100975739530121307/1121893750097059951/Amalathasan_Anthony_Humber3.JPG'
    })

    await extras.save();
}

seedDB().then(() => mongoose.connection.close());