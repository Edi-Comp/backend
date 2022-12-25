const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  text: {
    type: Object,
  },
  roomid: {
    type: String,
  },
  history: [
    {
      text: { type: String },
      timestamp: { type: mongoose.SchemaTypes.Date },
    },
  ],
});
const file = mongoose.model("files", fileSchema);
module.exports = file;
