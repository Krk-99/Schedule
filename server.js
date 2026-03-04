const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

// Enable CORS for all origins
app.use(cors());

app.use(express.json());

app.post("/api/flight", (req, res) => {
    const recdata = req.body.info
    res.status(200).json({
        message: 'Data recieved successfully',
        displaytext: recdata + " from the backend",
        data: recdata       
    })  
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});