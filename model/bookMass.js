const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bookMassSchema = new Schema(
  {
    bookMass_img: [{
      url: { type: String, required: true },
      public_id: { type: String, required: true }
    }], // Array of objects with url and public_id for each image
    bookMass_name: {
      type: String,
      required: true,
    },
    bookMass_email: {
      type: String,
      required: true,
    },
    date_for_mass: {
        type: Date,
        required: true
    },
    mass_intention: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookMass', bookMassSchema);
