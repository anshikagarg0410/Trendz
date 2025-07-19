require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');
const { data: products } = require('./init/data');


const dbUrl = process.env.ATLASDB_URL;

async function seedDB() {
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing products if needed
    await Product.deleteMany();
    console.log('🧹 Old products deleted');

    // Insert new ones
    await Product.insertMany(products);
    console.log('🌱 New products inserted');

    mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  } catch (err) {
    console.error('❌ Error seeding database:', err);
    process.exit(1);
  }
}

seedDB();
