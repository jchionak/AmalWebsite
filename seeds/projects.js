const mongoose = require('mongoose');

const Project = require('../models/project');
const Photo = require('../models/photo');

mongoose.connect('mongodb://127.0.0.1:27017/jamal');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const seedDB = async () => {
    await Project.deleteMany({});

    const photo = new Photo({
        src: 'https://cdn.discordapp.com/attachments/1100975739530121307/1121893753439911996/pookal.JPG',
        filename: 'FAKE'
    });
    await photo.save();

    const exampleProject = new Project({
        title: 'TESTING',
        description: 'Kind of a shit project but its ok',
        photo: photo._id,
        link: 'https://www.youtube.com/'
    })

    await exampleProject.save();

    const exampleProject2 = new Project({
        title: 'TESTING2',
        description: 'Kind of a shit project but its ok',
        photo: photo._id,
        link: 'https://www.youtube.com/'
    })

    await exampleProject2.save();
}

seedDB().then(() => mongoose.connection.close());