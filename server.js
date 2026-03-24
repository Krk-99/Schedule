const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose")
const session = require("express-session")
const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors({
    origin: 'https://krk-99.github.io',
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,  
    saveUninitialized: false,
    proxy: true,
    cookie: {
        secure: true,
        httpOnly: true,
        sameSite: "none",
        }   
}));
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("Could not connect to MongoDB: ", err));

const userschema = new mongoose.Schema({
    username: String,
    password: String
});
const User = mongoose.model("User", userschema);

const taskschema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: 'No description'
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
});

const Task = mongoose.model("Task", taskschema)

app.post("/api/flight", async (req, res) => {
    try {
        const {username, password} = req.body;
        const foundUser = await User.findOne({username: username})
        if (!foundUser) return res.json({message: "User Not Found. If New Please Click I'm New and Follow Instructions Provided"})
        if (password === foundUser.password) {
            req.session.isLoggedIn = true;
            req.session.user = foundUser.username;
            req.session.userId = foundUser._id;
            req.session.save((err) => {
                if(err) {
                    return res.status(500).json({message: "Error Saving Please Try Again"})
                } else{

                    res.status(200).json({message: "Access Granted",
                        session_data: req.session
                    })
                }
            })
        } else {
            res.status(200).json({message: "Access Denied"})
        }
    } catch (error) {
        res.status(500).json({message: "Server Error", error})
    }
});

app.post("/api/newtask", async (req, res) => {
    try {
        const {title, description} = req.body;
        const newTask = new Task({
            title: title,
            description: description,
            userid: req.session.userId
        })
        await newTask.save()
        res.status(200).json({message: "Task succesfully created"})
    } catch (error){
        console.log(error)
        res.status(400).json({message: "Server error, Please Contact Admin"})
    }
})

const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next()
    } else {
        res.status(403).json({message: "Please Log In First"})
    }
}

app.get("/api/authenticate", checkAuth, (req, res) => {
    res.status(200).json({message:`Welcome to your dashboard, ${req.session.user}!`})
})

app.listen(port, () => {
    // console.log(`Server running at http://localhost:${port}`);
});
