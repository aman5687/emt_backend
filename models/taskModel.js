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
    TLtoken:{
        type:String,
        required:true,
    },
    taskToken:{
        type:String,
        required:true,
    },
    empToken:{
        type:String,
        default:null
    },
    done:{
        type:String,
        default:"no",
    },
    empDeadline:{
        type:Date,
        default:null,
    },
    empMessage:{
        type:String,
        default:null,
    },
    completedFile:{
        type:String,
        default:null,
    },
    messageByEmployee:{
        type:String,
        default:null,
    },
})

module.exports = new mongoose.model("task", taskSchema);