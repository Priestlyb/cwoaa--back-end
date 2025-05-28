const cloudinary = require("../config/cloudinary");
const Prayer = require("../model/prayer");

// Helper to upload image to Cloudinary
const uploadToCloudinary = async (file) => {
  const uploadResponse = await cloudinary.uploader.upload(file.path, {
      folder: "cwoaauploads",
    });
  return {
    url: uploadResponse.secure_url,
    public_id: uploadResponse.public_id,
  };
};

// Add a new prayer
const addPrayer = async (req, res) => {
  try {
    const { name, details } = req.body;
    const files = req.files; // Assuming you're uploading multiple images

    // Upload each image to Cloudinary
    const uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file))
    );

    const newPrayer = new Prayer({
      name,
      details,
      img: uploadedImages, // Now an array of {url, public_id}
    });

    await newPrayer.save();

    res.status(201).json({
      message: "Prayer added successfully",
      prayer: newPrayer,
    });
  } catch (err) {
    console.error("Error adding prayer:", err);
    res.status(500).json({ error: "Failed to add prayer" });
  }
};


// Update a prayer
const updatePrayer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, details, img, deletedImages } = req.body;

    // Delete removed images from Cloudinary
    if (Array.isArray(deletedImages) && deletedImages.length > 0) {
      await Promise.all(
        deletedImages.map(publicId =>
          cloudinary.uploader.destroy(publicId)
        )
      );
    }

    // Validate img structure (optional but good for safety)
    const validImages = Array.isArray(img)
      ? img.filter((imgObj) => imgObj.url && imgObj.public_id)
      : [];

    // Update the prayer
    const updatedPrayer = await Prayer.findByIdAndUpdate(
      id,
      {
        name,
        details,
        img: validImages
      },
      { new: true }
    );

    if (!updatedPrayer) {
      return res.status(404).json({ success: false, message: "Prayer not found" });
    }

    res.json({ success: true, prayer: updatedPrayer });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update prayer",
      error: error.message
    });
  }
};


// Delete a prayer and its images from Cloudinary
const deletePrayer = async (req, res) => {
  const id = req.params.id;

  try {
    const prayer = await Prayer.findById(id);
    if (!prayer) {
      return res.status(404).json({ message: "Prayer not found" });
    }

    // Delete all images linked to this prayer (prayer.img is array)
    if (Array.isArray(prayer.img)) {
      for (const image of prayer.img) {
        try {
          if (image.public_id) {
            await cloudinary.uploader.destroy(image.public_id);
          }
        } catch (cloudErr) {
          console.warn(
            `Failed to delete image from Cloudinary (public_id: ${image.public_id}):`,
            cloudErr.message
          );
        }
      }
    }

    // Delete the prayer document
    await Prayer.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Prayer and all associated images successfully deleted",
    });
  } catch (err) {
    console.error("Server error while deleting prayer:", err);
    return res.status(500).json({ message: "An error occurred while deleting the prayer" });
  }
};

// Get all prayers
const getAllPrayers = async (req, res) => {
  try {
    const prayers = await Prayer.find().sort({ createdAt: -1 });
    return res.status(200).json({ prayers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred" });
  }
};

// Get prayer by ID
const getById = async (req, res) => {
  const id = req.params.id;

  try {
    const prayer = await Prayer.findById(id);
    if (!prayer) {
      return res.status(404).json({ message: "Prayer not found" });
    }
    return res.status(200).json({ prayer });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = {
  addPrayer,
  updatePrayer,
  deletePrayer,
  getAllPrayers,
  getById,
};
