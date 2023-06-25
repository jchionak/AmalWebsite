const mongoose = require('mongoose');

const User = require('../models/user');

mongoose.connect('mongodb://127.0.0.1:27017/jamal');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected');
});

const addAdmin = async (username, email, password) => {
    const admin = new User({ email, username });
    const registeredAdmin = await User.register(admin, password);
}

addAdmin('admin', 'jchionak@icloud.com', 'JamalAnthony44').then(() => mongoose.connection.close());