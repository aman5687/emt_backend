const mongoose = require("mongoose");

const seoSchema = new mongoose.Schema({
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true
    },
    role:{
        type:String,
        required:true,
    },
    token:{
        type:String,
        required:true,
    }
})

module.exports = mongoose.model("seo", seoSchema);