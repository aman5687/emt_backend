const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required: true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    number:{
        type:String,
        required:true,
    },
    hashedPassword:{
        type:String,
        required:true,
    },
    token:{
        type:String,
        required:true,
    },
    role:{
        type:String,
        required:true,
    },
    department:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    zipcode:{
        type:String,
        required:true,
    },
    city:{
        type:String,
        required:true,
    },
    country:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    verification_status:{
        type:String,
        required:true,
        default:"unverified",
    },
});

module.exports = mongoose.model('User', userSchema);