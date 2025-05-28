const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const eventsSchema = new Schema(
  {
    event_img: [
      {
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ], // Array of objects with url and public_id for each image
    event_title: {
      type: String,
      required: true,
      trim: true,
    },
    event_sub_title: {
      type: String,
      required: true,
      trim: true,
    },
    event_desc: {
      type: String,
      required: true,
      trim: true,
    },
    event_host: [
      {
        name: { type: String},
        img: {
          url: { type: String },
          public_id: { type: String },
        },
      },
    ],
    event_speakers: [
      {
        name: { type: String},
        email: { type: String},
        img: {
          url: { type: String },
          public_id: { type: String },
        },
      },
    ],
    event_phone_number: {
      type: String,
      required: true,
    },
    event_email: {
      type: String,
      required: true,
    },
    event_location: {
      type: String,
      required: true,
    },
    event_date: {
      type: Date,
      required: true,
    },
    event_time: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventsSchema);
