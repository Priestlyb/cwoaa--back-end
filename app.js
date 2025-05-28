const express = require("express");
const mongoose = require("mongoose");
const eventRoutes = require("./routes/eventRoutes");
const authRoute = require("./routes/auth");
const prayerRoutes = require("./routes/prayerRoutes");
const NewsRoutes = require("./routes/newsRoute");
const commentRoutes = require("./routes/commentRoute");
const bookMassRoutes = require('./routes/bookMassRoute');
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

mongoose.set("strictQuery", false);
require("dotenv").config();

app.use(cookieParser());
app.use(
  cors({
    origin: "https://cwoaa.vercel.app/", // http://localhost:3000 
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use("/", prayerRoutes);
app.use("/auth", authRoute);
app.use("/", eventRoutes);
app.use("/", commentRoutes);
app.use("/", NewsRoutes);
app.use('/', bookMassRoutes);

/* Click connect at Database Deployments page */
const MONGO_URL = process.env.MONGO_URL;

mongoose
  .connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to Database 9000");
    app.listen(process.env.PORT || 9000, () => {
      console.log("Server is running on port 9000");
    });
  })
  .catch((err) => console.log(err));
