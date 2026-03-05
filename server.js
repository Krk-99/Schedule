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

const userschema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model("User", userschema);


app.post("/api/flight", async (req, res) => {
    try {
        const {username, password} = req.body;
        const foundUser = await User.findOne({username: username})
        if (!foundUser) return res.status(404).json({message: "User not found"})
        if (password === foundUser.password) {
            res.status(200).json({message: "Access Granted"})
        } else {
            res.status(200).json({message: "Access Denied"})
        }
        // res.status(200).json({
        //     message: 'Data recieved successfully',
        //     displaytext: recdata + " from the backend",
        //     data: recdata       
        // })  
    } catch (error) {
        res.status(500).json({message: "Server Error", error})
    }

});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
