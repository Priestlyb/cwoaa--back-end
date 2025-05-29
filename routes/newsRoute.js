const express = require("express");
const multer = require("multer");
const News = require("../model/news");
const cloudinary = require("../config/cloudinary");
const {
  addNews,
  updateNews,
  deleteNews,
  deleteNewsImage,
  deleteWriterImage,
  getAllNews,
  getById,
} = require("../controllers/news_controller");
const { body } = require("express-validator");
const fs = require("fs");
const path = require("path");

// Ensure upload folder exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|avif|gif/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimeType && extname) cb(null, true);
    else cb(new Error("Only image files are allowed."));
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Route for adding an news (with file uploads)
router.post(
  "/news",
  upload.fields([
    { name: "news_img", maxCount: 15 },
    { name: "replacement_writer_img", maxCount: 1 },
  ]),
  [body("news_title").not().isEmpty().withMessage("News title is required")],
  addNews
);

// Route for updating an news (with file uploads)
router.put("/news/:id", upload.any(), updateNews);

// Route for deleting an news image
router.delete("/news/:id/:publicId", deleteNewsImage);

// Route for deleting an new
router.delete("/news/:id", deleteNews);

// Route for deleting a writer image
router.delete("/delete-writer-image/:publicId(*)", deleteWriterImage);

// Route for fetching all news
router.get("/news", getAllNews);

// Route for fetching a single news by ID
router.get("/news/:id", getById);

// DELETE writer from news
router.delete("/news/:newsId/writer/:index", async (req, res) => {
  const { newsId, index } = req.params;

  try {
    const news = await News.findById(newsId);
    if (!news) return res.status(404).json({ message: "News not found" });

    const writer = news.news_writer[parseInt(index)];
    if (!writer) return res.status(404).json({ message: "Writer not found" });

    // Delete writer image from Cloudinary
    if (writer.img?.public_id) {
      await cloudinary.uploader.destroy(writer.img.public_id);
    }

    // Remove writer from array
    news.news_writer.splice(index, 1);
    await news.save();

    res.status(200).json({ message: "Writer deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting writer:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
