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
    type: {
        type: String, 
        default: "task",
        required: true,
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    parent: {
        type: String, 
        required: true, 
        default: "none"
    }
});

const Task = mongoose.model("Task", taskschema)

const categoryschema = new mongoose.Schema({
    title: {
        type: String,
        required:true,
    },
    type: {
        type: String,
        required: true,
        default: "category"
    },
    parent: {
        type: String,  
        default: "none",
        set: v => v === '' ? undefined : v
    },
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required:true,
    }
})

const Category = mongoose.model("Category", categoryschema)


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

app.get("/api/getcategories", async (req, res) => {
    try{
        const usercategories = await Category.find({userid: req.session.userId})
        res.status(200).json(usercategories)
    } catch {
        console.log(error)
    }
})

app.post("/api/newcategory" , async(req, res) => {
    try{
        const {title, parent} = req.body
        console.log(title)
        console.log(parent)
        const newcategory = new Category({
            title: title,
            parent: parent,
            userid: req.session.userId
        })
        await newcategory.save()
        res.status(200).json({message: "Category successfully created"})
    } catch (error) {
        console.log(error)
    }
})
app.post("/api/newtask", async (req, res) => {
    try {
        const {title, description, parent} = req.body;
        const newTask = new Task({
            title: title,
            description: description,
            parent: parent,
            userid: req.session.userId
        })
        await newTask.save()
        res.status(200).json({message: "Task succesfully created"})
    } catch (error){
        console.log(error)
        res.status(400).json({message: "Server error, Please Contact Admin"})
    }
})



app.get("/api/gettasks", async (req, res) => {
    try {
        const usertasks = await Task.find({userid: req.session.userId})

        res.status(200).json(usertasks)
    } catch (error) {
        console.log(error)
    }
})


app.delete("/api/task/:id", async (req, res) =>{
    try {
        const taskid = new mongoose.Types.ObjectId(req.params.id);
        const usid = new mongoose.Types.ObjectId(req.session.userId);
        const deletedtask = await Task.findOneAndDelete({_id: taskid, userid: usid});
        console.log(deletedtask)
        if(!deletedtask) {
            return res.status(404).json({message: "Task not found"})
        }
        res.status(200).json({message: "Task successfully deleted"})
    } catch (error) {
        console.log(error)
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
