const User = require('../models/UserModel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const cloudinary = require('cloudinary').v2
const COOKIE_NAME = process.env.COOKIE_NAME;
const nodemailer = require('nodemailer');
const crypto = require('crypto')

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.USER,
        pass: process.env.PASS
    }
});


const createToken = (id, email, expiresIn) => {
    const payload = { id, email }
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn,
    });
    return token;
}

const basic = (req, res) => {
    res.send('hello from server')
}
const Signup = async (req, res) => {
    try {
        const { name, username, email, password, checkt_c } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await User.findOne({ $or: [{ username }, { email }] })
        if (existingUser) {
            let errorMessage = '';
            if (existingUser.username === username && existingUser.email === email) {
                errorMessage = 'User already exists';
            } else if (existingUser.username === username) {
                errorMessage = 'Username has already been taken';
            } else if (existingUser.email === email) {
                errorMessage = 'Email already exists';
            }
            return res.send({ error: errorMessage });
        } else {
            const newUser = new User({
                name,
                username,
                email,
                password: hashedPassword,
                checkt_c,
                emailToken: crypto.randomBytes(64).toString("hex")
            });
            await newUser.save();
            sendThankYou(newUser._id)

            const expires = new Date();
            expires.setDate(expires.getDate() + 7)
            const token = createToken(newUser._id.toString(), newUser.email, "7d")
            res.cookie(COOKIE_NAME, token, {
                path: "/", expires,
                signed: true,
            })

            return res.status(200).json({ message: "OK" })
        }
    } catch (err) {
        console.log(err)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }

}
const sendThankYou = async (id) => {
    const user = await User.findOne({ _id: id })

    const mailOptions = {
        from: 'mk366114@gmail.com',
        to: user.email,
        subject: 'Thank you! from dribbble',
        html: `<p>Hello ${user.name}, Thank you, You have succeccfully registered to dribbble.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

const logout = (req, res) => {
    try {
        res.clearCookie(COOKIE_NAME, {
            path: "/",
            signed: true,
        })
        return res.status(200).json({ message: "OK" })
    } catch (err) {
        console.log(err)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}
const Login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!user) {
            errorMessage = 'User not found';
            return res.send({ error: errorMessage });
        } else if (!isPasswordMatch) {
            errorMessage = 'Password do not match';
            return res.send({ error: errorMessage });
        } else {
            const expires = new Date();
            expires.setDate(expires.getDate() + 7)
            const token = createToken(user._id.toString(), user.email, "7d")
            res.cookie(COOKIE_NAME, token, {
                path: "/", expires,
                signed: true,
            })
            return res.status(200).json({ message: "OK" })
        }

    } catch (err) {
        console.log(err)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}
const Profile = async (req, res) => {
    try {
        const { location } = req.body;
        if(req.file === undefined){
            const updatedUser = await User.findByIdAndUpdate(res.locals.jwtData.id, { location: location}, { new: true });
            return res.status(200).json({ message: "OK" })
        }else{
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'profilepic',
                resource_type: 'auto'
            });
            const updatedUser = await User.findByIdAndUpdate(res.locals.jwtData.id, { location: location, cloudinaryPicUrl: result.secure_url }, { new: true });
            return res.status(200).json({ message: "OK" })
        }
      

    } catch (err) {
        console.log(err.message)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}

const roleType = async (req, res) => {
    try {
        const { roles } = req.body;

        const updatedUser = await User.findByIdAndUpdate(res.locals.jwtData.id, { roles: roles }, { new: true });
        if(!updatedUser.isVerified){
            emailVerify(res.locals.jwtData.id)
        }
        return res.status(200).json({ message: "OK" })

    } catch (err) {
        console.log(err.message)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}
const resendEmail = async (req, res) => {
    try {
        emailVerify(res.locals.jwtData.id)
        return res.status(200).json({ message: "OK" })

    } catch (error) {
        console.log(error.message)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}

const emailVerify = async (id) => {
    const user = await User.findOne({ _id: id })

    const mailOptions = {
        from: 'mk366114@gmail.com',
        to: user.email,
        subject: 'Dribbble email verification',
        html: `<p>Hello ${user.name}, verify your email by clicking this link...</p>
        <a href='http://localhost:3000/emailverify?emailToken=${user.emailToken}'>http://localhost:3000/emailverify?emailToken=${user.emailToken}</a>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

const verifyEmail = async (req, res) => {
    try {
        const emailToken = req.body.emailToken;
        const { id } = req.body
        if (!emailToken) {
            return res.status(404).json("EmailToken not found...")
        }
        const user = await User.findByIdAndUpdate(id, { emailToken: null, isVerified: true }, { new: true });

        if (user) {

            res.status(200).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user?.isVerified
            })
        } else {
            res.status(404).json("Email verifiaction failed, invalid token!")
        }

    } catch (err) {
        console.log(err)
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}

const verifyUser = async (req, res) => {
    try {

        const user = await User.findById(res.locals.jwtData.id)
        if (!user) {
            return res.status(401).send("User not registred OR Token Malfunctioned");
        }
        if (user._id.toString() !== res.locals.jwtData.id) {
            return res.status(401).send("Premissions didn't match");
        }

        return res.status(200).json({
            message: "OK", id: user._id.toString(), name: user.name, email: user.email, username: user.username, profilepic: user.cloudinaryPicUrl,id:user._id, isVerified:user.isVerified
        })
    } catch (err) {
        return res.status(404).json({ message: "ERROR", cause: err.message })
    }
}




module.exports = {
    basic, Signup, verifyUser, Profile, roleType, resendEmail, Login, logout, verifyEmail
}