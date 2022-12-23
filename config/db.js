const mongoose = require("mongoose");
const Mongo_URI = process.env.MONGODB_URI

const connectToMongo = () => {
  mongoose
    .connect(Mongo_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then((res) => console.log("> Connected..."))
    .catch((err) =>
      console.log(`> Error while connecting to mongoDB : ${err.message}`)
    );
};

module.exports = connectToMongo;
