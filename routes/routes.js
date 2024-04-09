const express = require("express")
const dotenv = require("dotenv")
const appcontroller = require('../controller/appcontroller')
const middleware = require('../middlewares/token-manager')
const cloudinary = require('cloudinary').v2


const routes = express();
dotenv.config();

routes.use(express.urlencoded({ extended: false }));
routes.use(express.json());

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_APIKEY,
    api_secret: process.env.CLOUDINARY_APISECRET
});
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/images'))

    },
    filename: function (req, file, cb) {
        const name = Date.now() + '_' + file.originalname
        cb(null, name)
    }
})

const upload = multer({ storage: storage })

routes.post('/signup', appcontroller.Signup)
routes.post('/login', appcontroller.Login)
routes.post('/profile', upload.single('profilepic'), middleware.verifyToken, appcontroller.Profile)
routes.post('/roletype', middleware.verifyToken, appcontroller.roleType)
routes.post('/resendemail', middleware.verifyToken, appcontroller.resendEmail)
routes.post('/logout', appcontroller.logout)
routes.post('/verify-email', appcontroller.verifyEmail)

routes.get('/', appcontroller.basic)
routes.get('/auth-status', middleware.verifyToken, appcontroller.verifyUser)

module.exports = routes;