const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    checkt_c: {
        type: String,
        required: true,
    },
    cloudinaryPicUrl: {
        type: String
    },
    location: {
        type: String
    },
    roles: {
        type: [String]
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    emailToken:{
        type:String
    },
    
    
})

module.exports = mongoose.model("User", userSchema)