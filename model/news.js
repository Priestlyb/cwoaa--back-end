const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const newsSchema = new Schema(
  {
    news_img: [{
      url: { type: String, required: true },
      public_id: { type: String, required: true }
    }], // Array of objects with url and public_id for each image
    news_title: {
      type: String,
      required: true,
    },
    news_writer: [
      {
        name: { type: String},
        position: { type: String},
        img: {
          url: { type: String },
          public_id: { type: String },
        },
      },
    ],
    news_details: [
      {
        sub_title: { type: String},
        details: { type: String},
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('News', newsSchema);
