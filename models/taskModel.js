const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    taskMessage:{
        type:String,
    },
    taskFile:{
        type:String,
    },
    taskDeadline:{
        type:Date,
        default:Date.now(),
    },
    taskToken:{
        type:String,
        required:true,
    },
    TLtoken:{
        type:String,
        required:true,
    },
})

module.exports = new mongoose.model("task", taskSchema);