const express = require("express");
const multer = require("multer");
const cloudinary = require("../config/cloudinary");
const {
  addEvent,
  updateEvent,
  deleteEvent,
  deleteEventImage,
  getAllEvents,
  getById,
} = require("../controllers/event-controller");
const { body } = require("express-validator");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const Event = require('../model/event');

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|avif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimeType && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// Route for adding an event (with file uploads)
router.post(
  "/events",
  upload.fields([
    { name: "event_img", maxCount: 15 },
    { name: "event_host_img", maxCount: 10 },
    { name: "event_speaker_img", maxCount: 10 },
  ]),
  [
    body("event_title").not().isEmpty().withMessage("Event title is required"),
    body("event_desc")
      .not()
      .isEmpty()
      .withMessage("Event description is required"),
  ],
  addEvent
);

// Route for updating an event (with file uploads)
router.put(
  "/events/:id",
  upload.fields([
    { name: "event_img", maxCount: 15 },
    { name: "event_host_img", maxCount: 10 },
    { name: "event_speaker_img", maxCount: 10 },
  ]),
  updateEvent
);

// Route for deleting an event image
router.post("/delete-event-image", deleteEventImage);

// Route for deleting an event
router.delete("/events/:id", deleteEvent);

// Route for fetching all events
router.get("/events", getAllEvents);

// Route for fetching a single event by ID
router.get("/events/:id", getById);

// 🚀 NEW ROUTE: Delete event host image by publicId

// Minimal delete route - recommended for replacements
router.post("/delete-host-image", async (req, res) => {
  const { publicId } = req.body;
  if (!publicId)
    return res.status(400).json({ message: "Public ID is required." });

  try {
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Host image deleted from Cloudinary." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete host image.", error: error.message });
  }
});

// 🚀 NEW ROUTE: Replace event host image by publicId
router.post("/upload-host-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "cwoaauploads",
    });

    // Delete temp file from local disk
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Failed to upload image.", error: error.message });
  }
});



// 🚀 NEW ROUTE: Delete event speaker image by publicId

// Minimal delete route - recommended for replacements
router.post("/delete-speaker-image", async (req, res) => {
  const { publicId } = req.body;
  if (!publicId)
    return res.status(400).json({ message: "Public ID is required." });

  try {
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Speaker image deleted from Cloudinary." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to delete speaker image.", error: error.message });
  }
});

// 🚀 NEW ROUTE: Replace event host image by publicId
router.post("/upload-speaker-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided." });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "cwoaauploads",
    });

    // Delete temp file from local disk
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete temp file:", err);
    });

    res.json({
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Failed to upload image.", error: error.message });
  }
});

// 🚀 NEW ROUTE: DELETE host by id from an event
router.delete("/events/:id/host/:hostId", async (req, res) => {
  const { id: eventId, hostId } = req.params;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const hostIndex = event.event_host.findIndex(
      (host) => host._id.toString() === hostId
    );
    if (hostIndex === -1) {
      return res.status(404).json({ message: "Host not found" });
    }

    // Delete image from Cloudinary
    const publicId = event.event_host[hostIndex].img?.public_id;
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }

    // Remove host from array
    event.event_host.splice(hostIndex, 1);

    // Save updated event
    await event.save();

    res.status(200).json({ message: "Host removed successfully" });
  } catch (err) {
    console.error("Error deleting host:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// 🚀 NEW ROUTE: DELETE /api/speakers/:id
router.delete("/speakers/:id", async (req, res) => {
  const speakerId = req.params.id;
  const { public_id } = req.body;

  try {
    // Delete image from Cloudinary
    if (public_id) {
      await cloudinary.uploader.destroy(public_id);
    }

    // Delete speaker from MongoDB
    await Event.updateOne(
      { "event_speakers._id": speakerId },
      { $pull: { event_speakers: { _id: speakerId } } }
    );

    res.status(200).json({ message: "Speaker deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error deleting speaker" });
  }
});


module.exports = router;
