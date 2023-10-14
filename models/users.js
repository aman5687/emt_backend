const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
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
    verification_status:{
        type:String,
        required:true,
        default:"unverified",
    },
});

module.exports = mongoose.model('User', userSchema);