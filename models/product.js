const { name } = require('ejs');
const mongoose = require('mongoose');
const reviews = require('./reviews');
const e = require('connect-flash');
const Schema = mongoose.Schema;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    availableSizes: {
        type: [String],
        required: true,
    }, 
    image: {
        type: String,
        required: true,
    },
    colors: {
        type: [String], 
        required: true,
    },
    material: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        enum: ['Jeans', 'Tops', 'Trousers', 'T-Shirts', 'Shirts','Shorts','Frocks','Midis','Floor Touch Dresses','Skirts','Blazers','Kurti','Ethnic Wear','Jackets','Sweatshirts', 'Hoodies', 'Gowns','Lehengas'],
        required: true,
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;