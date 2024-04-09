const express = require("express")
const dotenv = require("dotenv")
const cookieParser = require("cookie-parser")
const cors = require('cors')

const PORT = process.env.PORT || 5000;

const app = express();

dotenv.config();
app.use(cors({ origin: "http://localhost:3000", credentials: true }))
require("./db/connection.js");
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET))
const Router = require('./routes/routes.js');

app.use('/', Router)


app.listen(PORT, () => {
    console.log(`server running in port no ${PORT}`)
})
