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
    password: String,
    timezone: String,
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
    },
});

const Task = mongoose.model("Task", taskschema)

const categoryschema = new mongoose.Schema({
    title: {
        type: String,
        required:true,
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

const dailytaskcompletionschema = new mongoose.Schema({
    taskid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    date: {
        type: String,
        required: true
    }

})

const dailyTask = mongoose.model("Completion", dailytaskcompletionschema)

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

app.post("/api/signup", async (req, res) => {
    try {
        const {username, password, timeZone} = req.body
        const newUser = new User({
            username: username,
            password: password,
            timezone: timeZone,
        })
        await newUser.save()
        res.status(200).json({message: "User succesfully created"})
    } catch (error){
        console(error)
    }
})

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
        const {title, description, parent, type} = req.body;
        const newTask = new Task({
            title: title,
            description: description,
            parent: parent,
            userid: req.session.userId,
            ...(type && {type: type})
        })
        if (type == "Daily") {
            dailytaskcreation(req.session.userId, newTask._id)
        }
        await newTask.save()
        res.status(200).json({message: "Task succesfully created"})
    } catch (error){
        console.log(error)
        res.status(400).json({message: "Server error, Please Contact Admin"})
    }
})

async function dailytaskcreation(userid,taskid) {
    try{
        const user = await User.findById(userid)
        const origdate = new Date().toLocaleDateString("en-CA", {timeZone: user.timezone})
        const now = new Date(origdate)
        const newDailyTask = new dailyTask({
            taskid: taskid,
            date: now
        })
        await newDailyTask.save()
        return({status: 200, message: "Daily Task Successfully Completed"})
    } catch (error) {
        return({status: 500, error: error.message})
    } 
}

app.post("/api/completeDaily/:id", async(req,res) =>{
    const response = await dailytaskcreation(req.session.userId, req.params.id)
    res.status(response.status).json(response)
})

app.post("/api/complete", async (req,res) => {
    console.log("hello")
    try{
        const {task_id} = req.body
        const userid = req.session.userId
        const user = await User.findById(userid)
        const origdate = new Date().toLocaleDateString("en-CA", {timeZone: user.timezone})
        const now = new Date(origdate)
        const completed = await dailyTask.findOne({date: now, taskid: task_id})
        console.log(completed)
        console.log("hello")
        if (!completed) {
            res.status(200).json({taskstatus: false})
        } else {
            res.status(200).json({taskstatus: true})
        }
    } catch (error) { 
        console.log(error)
        res.status(500).json({error: error, message: "Complete Check Failed"})
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

