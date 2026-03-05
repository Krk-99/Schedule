const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());

app.use(express.json());

const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("Could not connect to MongoDB: ", err));

app.post("/api/flight", (req, res) => {
    const recdata   = req.body.info
    res.status(200).json({
        message: 'Data recieved successfully',
        displaytext: recdata + " from the backend",
        data: recdata       
    })  
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
