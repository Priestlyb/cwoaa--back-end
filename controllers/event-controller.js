const cloudinary = require("../config/cloudinary");
const { validationResult } = require("express-validator");
const Event = require("../model/event");

// Helper function to upload images to Cloudinary
const uploadToCloudinary = async (file) => {
  const uploadResponse = await cloudinary.uploader.upload(file.path); // Upload directly using the file path
  return {
    url: uploadResponse.secure_url,
    public_id: uploadResponse.public_id,
  };
};

// Add a new event
const addEvent = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const {
      event_img,
      event_title,
      event_sub_title,
      event_desc,
      event_host,
      event_speakers,
      event_phone_number,
      event_email,
      event_location,
      event_date,
      event_time,
    } = req.body;

    const newEvent = new Event({
      event_img, // this is now already [{ url, public_id }]
      event_title,
      event_sub_title,
      event_desc,
      event_host,
      event_speakers,
      event_phone_number,
      event_email,
      event_location,
      event_date,
      event_time,
    });

    await newEvent.save();

    res
      .status(201)
      .json({ message: "Event added successfully", event: newEvent });
  } catch (err) {
    console.error("Error adding event:", err);
    res.status(500).json({ error: "Failed to add event" });
  }
};

// Update an event
const updateEvent = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      event_title,
      event_sub_title,
      event_desc,
      event_phone_number,
      event_email,
      event_location,
      event_date,
      event_time,
      event_host_existing,
      event_speakers_existing,
    } = req.body;

    // Process existing event images
    let existingImages = [];
    if (req.body.event_img_existing) {
      existingImages = JSON.parse(req.body.event_img_existing);
    }

    // Upload new event images
    let uploadedImages = [];
    if (req.files && req.files["event_img"]) {
      for (const file of req.files["event_img"]) {
        const result = await cloudinary.uploader.upload(file.path);
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }
    const allImages = [...existingImages, ...uploadedImages];

    // Process event hosts
    let parsedHosts = [];
    if (event_host_existing) {
      parsedHosts = JSON.parse(event_host_existing);
    }

    // Upload new host images (if any)
    if (req.files && req.files["event_host_img"]) {
      const hostImages = req.files["event_host_img"];
      const hostNames = JSON.parse(req.body.event_host_names || "[]");

      for (let i = 0; i < hostImages.length; i++) {
        const result = await cloudinary.uploader.upload(hostImages[i].path);
        parsedHosts.push({
          name: hostNames[i] || "",
          img: {
            url: result.secure_url,
            public_id: result.public_id,
          },
        });
      }
    }

    // Process event speakers
    let parsedSpeakers = [];
    if (event_speakers_existing) {
      parsedSpeakers = JSON.parse(event_speakers_existing);
    }

    // Upload new speaker images (if any)
    if (req.files && req.files["event_speaker_img"]) {
      const speakerImages = req.files["event_speaker_img"];
      const speakerNames = JSON.parse(req.body.event_speaker_names || "[]");
      const speakerEmails = JSON.parse(req.body.event_speaker_emails || "[]");

      for (let i = 0; i < speakerImages.length; i++) {
        const result = await cloudinary.uploader.upload(speakerImages[i].path);
        parsedSpeakers.push({
          name: speakerNames[i] || "",
          email: speakerEmails[i] || "",
          img: {
            url: result.secure_url,
            public_id: result.public_id,
          },
        });
      }
    }

    // Final event update
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      {
        event_img: allImages,
        event_title,
        event_sub_title,
        event_desc,
        event_phone_number,
        event_email,
        event_location,
        event_date,
        event_time,
        event_host: parsedHosts,
        event_speakers: parsedSpeakers,
      },
      { new: true }
    );

    res.status(200).json({ event: updatedEvent });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "An error occurred while updating the event" });
  }
};

// Delete an event and its images from Cloudinary
const deleteEvent = async (req, res) => {
  const id = req.params.id;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete each image from event_img
for (const image of event.event_img) {
  try {
    if (image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  } catch (cloudErr) {
    console.warn(
      `Failed to delete event_img (public_id: ${image.public_id}):`,
      cloudErr.message
    );
  }
}

// Delete each host image from event_host
for (const host of event.event_host) {
  try {
    if (host.img?.public_id) {
      await cloudinary.uploader.destroy(host.img.public_id);
    }
  } catch (cloudErr) {
    console.warn(
      `Failed to delete event_host image (public_id: ${host.img.public_id}):`,
      cloudErr.message
    );
  }
}

// Delete each speaker image from event_speakers
for (const speaker of event.event_speakers) {
  try {
    if (speaker.img?.public_id) {
      await cloudinary.uploader.destroy(speaker.img.public_id);
    }
  } catch (cloudErr) {
    console.warn(
      `Failed to delete event_speaker image (public_id: ${speaker.img.public_id}):`,
      cloudErr.message
    );
  }
}

// Delete the event document from MongoDB
await Event.findByIdAndDelete(id);

return res
  .status(200)
  .json({ message: "Event and all associated images successfully deleted" });

  } catch (err) {
    console.error("Server error while deleting event:", err);
    return res
      .status(500)
      .json({ message: "An error occurred while deleting the event" });
  }
};

// Delete a single image from an event

const deleteEventImage = async (req, res) => {
  const { eventId, publicId } = req.body;

  if (!eventId || !publicId) {
    return res.status(400).json({ message: "Missing eventId or publicId" });
  }

  try {
    // 1. Delete from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // 2. Remove from MongoDB
    await Event.findByIdAndUpdate(eventId, {
      $pull: { event_img: { public_id: publicId } },
    });

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Failed to delete image:", err);
    res.status(500).json({ message: "Server error while deleting image" });
  }
};

// Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();
    if (events.length === 0) {
      return res.status(200).json({ events: [] }); // Return empty array with 200 OK
    }
    return res.status(200).json({ events });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "An error occurred" });
  }
};

// Get event by ID
const getById = async (req, res) => {
  const id = req.params.id;

  try {
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    return res.status(200).json({ event });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = {
  addEvent,
  updateEvent,
  deleteEvent,
  deleteEventImage,
  getAllEvents,
  getById,
};
