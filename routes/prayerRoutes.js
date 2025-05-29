const express = require("express");
const multer = require("multer");
const {
  addPrayer,
  updatePrayer,
  deletePrayer,
  getAllPrayers,
  getById,
} = require("../controllers/prayer_controllers");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

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
    const allowedTypes = /jpeg|jpg|png|avif|gif/;
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

// Route for adding an prayer (with file uploads)
router.post(
  "/prayers",
  upload.array("img", 2), // allow multiple images under field name `img`
  addPrayer
);

// Route for updating an prayer (with file uploads)
router.put("/prayers/:id", upload.array("img", 2), updatePrayer);

// Route for deleting an prayer
router.delete("/prayers/:id", deletePrayer);

// Route for fetching all prayers
router.get("/prayers", getAllPrayers);

// Route for fetching a single prayer by ID
router.get("/prayers/:id", getById);

// 🚀 NEW ROUTE: Delete prayer prayer image by publicId

// Minimal delete route - recommended for replacements
router.post("/delete-prayer-image", async (req, res) => {
  const { publicId } = req.body;
  if (!publicId)
    return res.status(400).json({ message: "Public ID is required." });

  try {
    await cloudinary.uploader.destroy(publicId);
    res.json({ message: "Prayer image deleted from Cloudinary." });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        message: "Failed to delete prayer image.",
        error: error.message,
      });
  }
});

// 🚀 NEW ROUTE: Replace prayer prayer image by publicId
router.post(
  "/upload-prayer-image",
  upload.single("image"),
  async (req, res) => {
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
  }
);

module.exports = router;
