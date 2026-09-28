const mongoose = require('mongoose');
const initData = require('./data.js');
const Listing = require('../models/listing.js');

const MONGODB_URL = "mongodb://127.0.0.1:27017/wanderlust";

main().then(() => {
        console.log('MongoDB connection established');
    }).catch(err => {
        console.log('Error connecting to MongoDB:', err);
    });

async function main() {
  await mongoose.connect(MONGODB_URL);
  console.log('Connected to MongoDB');
}

const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj) => ({...obj, owner: "6aad3c8bd759f7959879f868"}));
    await Listing.insertMany(initData.data);
    console.log('Sample listings inserted');
};

initDB();