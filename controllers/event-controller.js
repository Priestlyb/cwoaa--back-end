const Event = require("../model/event");

const getAllEvents = async(req, res, next) => {
    let events;
    try {
        events = await Event.find();
    } catch (err) {
        console.log(err);
    }

    if (!events) {
        return res.status(404).json({message:"No products found"})
    }
    return res.status(200).json({ events });
};

const getById = async (req, res, next) => {
    const id = req.params.id;
        let event;
        try {
            event = await Event.findById(id);
        } catch (err) {
            console.log(err);
        }

        if (!event) {
            return res.status(404).json({message:"No event found"});
        }
        return res.status(200).json({ event });
};

const addEvent = async (req, res, next) => {
    const {event_img, event_desc, extra_event_img, event_title, event_sub_title} = req.body;
    let event;
    try {
        event = new Event({
            event_img, event_desc, extra_event_img, event_title, event_sub_title
        })
        await event.save();
    } catch (err) {
        console.log(err);
    }

    if (!event) {
        return res.status(500).json({message:"unable to add product"})
    }
    return res.status(201).json({ event }); 
};

const updateEvent =async (req, res, next) => {
    const id = req.params.id;
    const { event_img, event_desc, extra_event_img, event_title, event_sub_title } = req.body;
    let event;
    try {
        event = await Event.findByIdAndUpdate(id, {
            event_img, event_desc, extra_event_img, event_title, event_sub_title
        });
        event = await event.save()
    } catch (err) {
        console.log(err);
    }

    if (!event) {
        return res.status(404).json({message:"Unable to update by this ID"});
    }
    return res.status(200).json({ event });
}

const deleteEvent = async ( req, res, next) => {
    const id = req.params.id;
    let event;
    try {
        event = await Event.findByIdAndRemove(id);
    } catch (err) {
        console.log(err);
    }

    if (!event) {
        return res.status(404).json({message:"Unable to delete by this ID"});
    }
    return res.status(200).json({ message: 'event Successfully deleted'});
}


exports.getAllEvents = getAllEvents;
exports.addEvent = addEvent;
exports.getById = getById;
exports.updateEvent = updateEvent;
exports.deleteEvent = deleteEvent;