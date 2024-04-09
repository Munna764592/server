const mongoose = require("mongoose")

const URL = process.env.DATABASE_URL;

mongoose.connect(URL).then(() => {
    console.log("database connected")
}).catch((err) => {
    console.log(err);
})





