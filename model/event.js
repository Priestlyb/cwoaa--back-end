const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventsSchema = new Schema({
    event_img: {
        type: String,
        required: true,
    },
    event_desc: {
        type: String,
        required: true,
    }

},
    { timestamps: true }
);

module.exports = mongoose.model("events", eventsSchema);

// books