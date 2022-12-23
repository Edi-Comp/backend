const mongoose = require("mongoose");
// const Mongo_URI = process.env.MONGODB_URI
const Mongo_URI = "mongodb+srv://edicomp2022:edicomp2022@cluster0.mxc46l0.mongodb.net/?retryWrites=true&w=majority"

const connectToMongo = () => {
  mongoose
    .connect(Mongo_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((res) => console.log("> Connected..."))
    .catch((err) =>
      console.log(`> Error while connecting to mongoDB : ${err.message}`)
    );
};

module.exports = connectToMongo;
