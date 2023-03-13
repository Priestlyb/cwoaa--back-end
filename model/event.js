const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const eventsSchema = new Schema({
    event_img: {
        type: String,
        required: true,
    },
    event_title: {
        type: String,
        required: true,
    },
    event_sub_title: {
        type: String,
        required: true,
    },
    event_desc: {
        type: String,
        required: true,
    },
    extra_event_img: {
        type:[
            {
                extra_img:{type:String, required:true}
            },
        ],
    },

},
    { timestamps: true }
);

module.exports = mongoose.model("events", eventsSchema);

// books