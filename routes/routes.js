const express = require("express");
const router = express.Router();
const User = require("../models/users");
const FullStack = require("../models/fullstack");
const SEO = require("../models/seo");
const ML = require("../models/ML");
const BackendDeveloper = require("../models/backendDeveloper");
const FrontDeveloper = require("../models/frontendDeveloper");
const Marketing = require("../models/marketing");
const Python = require("../models/python");
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
    const image = req.file.path

    const errors = [];



    const cloudinaryUploadResult = await cloudinary.uploader.upload(image, { folder: "emt_profile_image" }, function (err, result) {
        if (err) {
            res.status(401).json({ err })
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

        const entryInDepartment = await User.findOne({ token })
        const department = entryInDepartment.department;

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
            if (department === "Frontend Developer" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new FrontDeveloper({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })
                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the Frontend Developer department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            } else if (department === "Backend Developer" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new BackendDeveloper({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })

                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the Backend Developer department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            } else if (department === "Marketing" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new Marketing({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })
                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the Marketing department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            } else if (department === "SEO" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new SEO({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })
                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the SEO department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            } else if (department === "Python Django" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new Python({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })
                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the Python Django department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            } else if (department === "Full Stack Developer" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new FullStack({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })
                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the Full Stack Developer department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            } else if (department === "Machine Learning" && verifyEmployee.verification_status === "verified") {
                const departmentEntry = new ML({
                    firstName: entryInDepartment.firstName,
                    lastName: entryInDepartment.lastName,
                    email: entryInDepartment.email,
                    role: entryInDepartment.role,
                    token: entryInDepartment.token
                })
                try {
                    const saveDepartmentEntry = await departmentEntry.save();
                    if (saveDepartmentEntry) {
                        res.status(200).json({ message: "User added to the Machine Learning department" });
                    } else {
                        res.status(401).json({ message: "User not saved in the department" });
                    }
                } catch (error) {
                    console.error(error);
                    res.status(500).json({ message: "Internal Server Error" });
                }
            }else{
                res.status(401).json({message:"User role has been updated but he is still unverified"});
            }
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ error });
    }
})
// ends here



// delete api to delete unverified users

router.get("/unverifiedUserDelete/:token", async (req, res) => {
    try {
        const token = req.params.token;

        const deleteUser = await User.findOneAndDelete({ token });

        if (deleteUser) {
            res.status(200).json({ message: "User has been deleted" });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ error });
    }
})

// ends here

// api to get unverified users data for role and dept

router.get("/getUnverifiedEmployee/:token", async (req, res) => {
    const token = req.params.token;

    const unverifiedEmployeesget = await User.findOne({ token });

    if (!unverifiedEmployeesget) {
        res.status(401).json({ message: "No user found" });
    } else {
        res.status(200).json({ unverifiedEmployeesget });
    }
})


// ends here

// api to edit uverified employees before verifying
router.post("/editUnverifiedEmployee/:token", async (req, res) => {
    try {
        const token = req.params.token;
        const updateDepartment = req.body.updateDepartment;
        const updateRole = req.body.updateRole;

        const editUnverifiedEmployee = await User.findOneAndUpdate(
            { token },
            {
                department: updateDepartment,
                role: updateRole
            },
            { new: true }
        );

        if (!editUnverifiedEmployee) {
            res.status(401).json({ message: "User has not been updated" })
        } else {
            res.status(200).json({ editUnverifiedEmployee });
        }
    } catch (error) {
        console.log(error);
        res.status(401).json({ error });
    }
})
// ends here


module.exports = router;