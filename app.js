const express = require('express');
const mongoose = require ('mongoose');
const router = require("./routes/events-routes");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/users");
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(cors());
app.use("/api/users", userRoute);
app.use("/api/auth", authRoute);
app.use("/events", router) // localhost:5000/books


/* Click connect at Database Deployments page */
mongoose.connect(
"mongodb+srv://mernApp:p%40ssw0rd%279%27%21@mernbookstore.iwzp06a.mongodb.net/?retryWrites=true&w=majority"
        )
        .then(()=>console.log("Connected to Datebase"))
        .then(() => {
            app.listen(process.env.PORT || 9000);
        }).catch((err) =>console.log(err));