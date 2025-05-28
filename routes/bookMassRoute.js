const express = require("express");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const nodemailer = require("nodemailer");
require("dotenv").config();

const BookMass = require("../model/bookMass");

const router = express.Router();

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup (temporary local storage)
const upload = multer({ dest: "temp_uploads/" });

// POST: Submit a Mass booking
router.post("/book-mass", upload.single("receipt"), async (req, res) => {
  try {
    const { bookMass_name, bookMass_email, date_for_mass, mass_intention } = req.body;

    // Upload receipt to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "cwoaauploads",
      resource_type: "auto",
    });

    // Remove temp file
    fs.unlinkSync(req.file.path);

    const image = {
      url: result.secure_url,
      public_id: result.public_id,
    };

    const booking = new BookMass({
      bookMass_name,
      bookMass_email,
      date_for_mass,
      mass_intention,
      bookMass_img: [image],
    });

    await booking.save();

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: bookMass_email,
      subject: "Mass Booking Confirmation",
      html: `
        <h2>Thank you, ${bookMass_name}!</h2>
        <p>Your Mass has been booked for <strong>${new Date(date_for_mass).toLocaleString()}</strong>.</p>
        <p><strong>Intention:</strong> ${mass_intention}</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Booking submitted and email sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error." });
  }
});

// GET: Fetch all bookings
router.get("/bookings", async (req, res) => {
  try {
    const bookings = await BookMass.find().sort({ createdAt: -1 }); // latest first
    res.status(200).json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching bookings." });
  }
});

module.exports = router;
