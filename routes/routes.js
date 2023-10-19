const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const cloudinary = require("cloudinary").v2;


// Configure multer for image upload
const storage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
});

const upload = multer({ storage: storage });


// cloudinary config
cloudinary.config({
    cloud_name: 'djrh8oflc',
    api_key: '544113442678141',
    api_secret: 'G6AKEYGFz2eiEcVHXg-4myu5cXg'
});





// registration api starts
router.post("/register", upload.single("image"), async (req, res) => {

    const firstName = req.body.firstName
    const lastName = req.body.lastName
    const email = req.body.email
    const number = req.body.number
    const password = req.body.password
    const token = uuidv4();
    const role = req.body.role
    const department = req.body.department
    const address = req.body.address
    const zipcode = req.body.zipcode
    const city = req.body.city
    const country = req.body.country

    const errors = [];



    const cloudinaryUploadResult = await cloudinary.uploader.upload(req.file.path, {folder: "emt_profile_image"}, function (err, result){
        if(err){
            res.status(401).json({err})
        }
    })

    const imageUrl = cloudinaryUploadResult.secure_url

    if (!firstName) {
        errors.push("Please enter  your first name");
    }
    if (!lastName) {
        errors.push("Please enter your last name");
    }
    if (!email) {
        errors.push("Please enter an email");
    }
    if (!number) {
        errors.push("Please enter a number");
    }
    if (!address) {
        errors.push("Please enter a address");
    }
    if (!zipcode) {
        errors.push("Please enter a zipcode");
    }
    if (!city) {
        errors.push("Please enter a city");
    }
    if (!country) {
        errors.push("Please enter a country");
    }
    if (number.length !== 10) {
        errors.push("Number should be 10 digits long");
    }
    if (!password) {
        errors.push("Please enter a password");
    }
    if (!role) {
        errors.push("Please enter an role");
    }
    if (!department) {
        errors.push("Please enter an department");
    }
    if (!validator.isEmail(email)) {
        errors.push("Please enter a valid email");
    }
    if (password.length < 8) {
        errors.push("Password should be atleast 8 characters long");
    }

    if (errors.length > 0) {
        res.status(400).json({ errors })
    } else {
        try {
            const hashedPassword = await bcrypt.hash(password, 8);
            const user = new User({
                firstName,
                lastName,
                email,
                number,
                hashedPassword,
                token,
                role,
                department,
                address,
                zipcode,
                city,
                country,
                image: imageUrl
            });
            const savedUser = await user.save();

            if (!savedUser) {
                res.status(500).send({ message: "Error occured" });
            } else {
                res.status(200).send({ message: "Successful" });
            }
        } catch (error) {
            if (error.code === 11000 && error.keyPattern && error.keyPattern.email === 1) {
                res.status(409).json({ message: "Email is already in use, please enter a unique email" }); // Use 409 Conflict
            } else {
                res.status(500).json({ message: "Error in catch" }); // Use 500 Internal Server Error
            }
        }
    }
});
// ends



// login api
router.post("/login", async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const sessionStorage = req.session.userInfo;

    const errors = [];

    if (!email) {
        errors.push("Please provide the email");
    }
    if (!password) {
        errors.push("Please provide the password");
    }
    if (!validator.isEmail(email)) {
        errors.push("Please enter a valid email");
    }
    if (sessionStorage) {
        errors.push("You are already logged in");
    }

    if (errors.length > 0) {
        res.status(400).json({ errors });
        return;
    }
    const user = await User.findOne({ email });

    if (!user) {
        errors.push("This email is not registered");
        res.status(400).json({ errors });
        return;
    } else {
        const checkPassword = await bcrypt.compare(password, user.hashedPassword);

        if (!checkPassword) {
            errors.push("Wrong password");
            res.status(400).json({ errors });
            return;
        } else if (user.verification_status === 'unverified') {
            errors.push("You still need to be verified");
            res.status(400).json({ errors });
            return;
        }
        else {
            const userData = user;
            req.session.userInfo = { userToken: user.token, userEmail: user.email };
            res.status(201).send({ userData, message: "Logged in" });
        }
    }
});
// ends



// logout api
router.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(401).json({ err })
        } else {
            res.status(200).send({ message: "Successfully logged out" });
        }
    })
})
// ends


// api to print sessions
router.get("/getsession", (req, res) => {
    const user = req.session.userInfo;
    if (user) {
        console.log(user);
    } else {
        res.status(200).json({ message: "No session" });
    }
})
// ends here


// =================================================Admin Module=========================================

// api to show verified employees
router.get("/unverifiedEmployees", (req, res) => {
    User.find({ verification_status: "unverified" })
        .exec()
        .then((data) => {
            res.status(200).json({ data });
        })
        .catch((error) => {
            res.status(401).json({ error });
        })
})
// ends here

// api to show verified employees
router.get("/verifiedEmployees", (req, res) => {
    User.find({
        verification_status: "verified",
        role: { $ne: "admin" }
    })
        .exec()
        .then((data) => {
            res.status(200).json({ data });
        })
        .catch((error) => {
            res.status(401).json({ error });
        })
})
// ends here

// api to verify employee
router.post("/verifyEmployee/:token", async (req, res) => {
    try {
        const token = req.params.token;
        const updated_verification_status = req.body.updated_verification_status
        const updatedRole = req.body.updatedRole

        const verifyEmployee = await User.findOneAndUpdate(
            { token },
            {
                verification_status: updated_verification_status,
                role: updatedRole
            },
            { new: true }
        );

        if (!verifyEmployee) {
            res.status(401).json({ message: "Not updated" });
        } else {
            res.status(200).json({ verifyEmployee });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ error });
    }
})
// ends here



// 







module.exports = router;