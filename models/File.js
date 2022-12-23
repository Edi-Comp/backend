const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    text : {
        type : Object
    },
    roomid:{
        type:String,
    }
})
const file = mongoose.model("files",fileSchema);
module.exports = file;