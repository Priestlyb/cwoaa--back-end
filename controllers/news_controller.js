const mongoose = require("mongoose");
const cloudinary = require("../config/cloudinary");
const { validationResult } = require("express-validator");
const News = require("../model/news");

// Upload images to Cloudinary
const uploadToCloudinary = async (file) => {
  const uploadResponse = await cloudinary.uploader.upload(file.path);
  return {
    url: uploadResponse.secure_url,
    public_id: uploadResponse.public_id,
  };
};

// Add News
const addNews = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  try {
    const { news_img, news_title, news_writer, news_details } = req.body;
    const newNews = new News({
      news_img,
      news_title,
      news_writer,
      news_details,
    });

    await newNews.save();
    res.status(201).json({ message: "News added successfully", news: newNews });
  } catch (err) {
    console.error("Error adding news:", err);
    res.status(500).json({ error: "Failed to add news" });
  }
};

// Update News
const updateNews = async (req, res) => {
  try {
    const id = req.params.id;
    const { news_title } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid news ID" });
    }

    // Parse existing news images
    const existingImages = JSON.parse(req.body.news_img_existing || "[]");
    const uploadedImages = [];

    // Handle uploaded files
    const files = req.files || [];

    // Upload new news_img files
    for (const file of files) {
      if (file.fieldname === "news_img") {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "cwoaauploads",
        });
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    const allImages = [...existingImages, ...uploadedImages];

    // Parse existing writer data
    const parsedWriters = JSON.parse(req.body.news_writer_existing || "[]");

    // Handle replacement_writer_img_{index}
    for (const file of files) {
      if (file.fieldname.startsWith("replacement_writer_img_")) {
        const index = parseInt(file.fieldname.split("_").pop()); // e.g., 'replacement_writer_img_0' → 0

        if (!isNaN(index)) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "cwoaauploads",
          });

          // Ensure there's a writer at that index
          if (!parsedWriters[index]) {
            parsedWriters[index] = {
              name: "",
              position: "",
              img: { url: "", public_id: "" },
            };
          }

          parsedWriters[index].img = {
            url: result.secure_url,
            public_id: result.public_id,
          };
        }
      }
    }

    // Parse news details
    const parsedNewsDetails = JSON.parse(req.body.news_details || "[]");

    // Final update
    const updatedNews = await News.findByIdAndUpdate(
      id,
      {
        news_img: allImages,
        news_title,
        news_writer: parsedWriters,
        news_details: parsedNewsDetails,
      },
      { new: true }
    );

    res.status(200).json({ news: updatedNews });
  } catch (err) {
    console.error("❌ Update error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while updating the news" });
  }
};

// Delete News & its images from Cloudinary
const deleteNews = async (req, res) => {
  const id = req.params.id;
  try {
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "News not found" });

    // Delete news images from Cloudinary
    for (const image of news.news_img) {
      if (image.public_id) {
        try {
          await cloudinary.uploader.destroy(image.public_id);
        } catch (err) {
          console.warn(
            `Cloudinary deletion failed for news_img: ${image.public_id}`,
            err
          );
        }
      }
    }

    // Delete writer images from Cloudinary
    for (const writer of news.news_writer) {
      if (writer.img && writer.img.public_id) {
        try {
          await cloudinary.uploader.destroy(writer.img.public_id);
        } catch (err) {
          console.warn(
            `Cloudinary deletion failed for writer_img: ${writer.img.public_id}`,
            err
          );
        }
      }
    }

    // Delete news from MongoDB
    await News.findByIdAndDelete(id);
    res
      .status(200)
      .json({ message: "News and all images successfully deleted" });
  } catch (err) {
    console.error("Delete error:", err);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the news" });
  }
};

// Delete a single image from a news
const deleteNewsImage = async (req, res) => {
  const { id, publicId } = req.params;

  if (!id || !publicId) {
    return res.status(400).json({ message: "Invalid News ID or image public ID" });
  }

  try {
    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: "News not found" });

    const imgExists = news.news_img.some((img) => {
      return img.public_id === publicId || (img.img && img.img.public_id === publicId);
    });
    if (!imgExists) {
      return res.status(404).json({ message: "Image not found in news" });
    }

    const cloudinaryResult = await cloudinary.uploader.destroy(publicId);

    if (cloudinaryResult.result !== "ok" && cloudinaryResult.result !== "not found") {
      return res.status(500).json({ message: "Failed to delete image from Cloudinary" });
    }

    news.news_img = news.news_img.filter((img) => {
      const currentPublicId = img.public_id || (img.img && img.img.public_id);
      return currentPublicId !== publicId;
    });

    await news.save();

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error deleting image:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete writer image from Cloudinary and update all news items
const deleteWriterImage = async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    return res.status(400).json({ message: "publicId parameter is required" });
  }

  try {
    await cloudinary.uploader.destroy(publicId);

    const newsItems = await News.find({
      "news_writer.img.public_id": publicId,
    });

    for (const news of newsItems) {
      news.news_writer =
        news.news_writer?.map((writer) => {
          if (writer.img?.public_id === publicId) {
            return { ...writer.toObject(), img: null };
          }
          return writer;
        }) || [];
      await news.save();
    }

    res
      .status(200)
      .json({ message: "Writer image deleted from Cloudinary and DB" });
  } catch (err) {
    console.error("Error deleting writer image:", err);
    res.status(500).json({ message: "Server error while deleting image" });
  }
};

// Get all news
const getAllNews = async (req, res) => {
  try {
    const news = await News.find();
    res.status(200).json({ news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred" });
  }
};

// Get news by ID
const getById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ message: "News not found" });
    res.status(200).json({ news });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = {
  addNews,
  updateNews,
  deleteNews,
  deleteNewsImage,
  deleteWriterImage,
  getAllNews,
  getById,
};
