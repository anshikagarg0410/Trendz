const mongoose = require('mongoose');
const data = require('./data.js');
const product = require('../models/product.js'); 

const dbURI = 'mongodb://127.0.0.1:27017/ecommerce';// Replace with your MongoDB URI
main().then(() => {
  console.log('Connected to MongoDB');  
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);   
});

async function main() {
    await mongoose.connect(dbURI);
}

const initDB= async () => {
    await product.deleteMany({});
    await product.insertMany(data.data);
    console.log('Database initialized with sample products');
};
initDB();