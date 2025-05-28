// config/cloudinary.js
require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config(); // auto-loads CLOUDINARY_URL from process.env

module.exports = cloudinary;
