const express = require("express");
require("dotenv").config();
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");

const path = require("path");
const connectToMongo = require("./config/db");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT || 5000;

const File = require("./models/File");
async function findFile(id) {
  if (id == null) return;
  const file = await File.findOne({ roomid: id });
  return file;
}

io.on("connection", (socket) => {
  socket.on("join-room", async (roomId, username) => {
    // console.log("joined room", roomId, "-", username);
    socket.join(roomId);

    const file = await findFile(roomId);

    socket.emit("load-document", file?.text || "");

    socket.broadcast.to(roomId).emit("user-connected", username);

    socket.on("save-document", async (doc) => {
      const file=await findFile(roomId);
      if(file?.text){
        console.log("updating "+doc)
        await File.updateOne({ roomid: roomId }, { text: doc }).then(()=>{
          socket.broadcast.to(roomId).emit("re-load-document", doc);
        });
      }else{
        console.log("saving "+doc)
        await File.create({
          roomid:roomId,
          text:doc
        }).then(()=>{
          socket.broadcast.to(roomId).emit("re-load-document", doc);
        })
      }
    });

    socket.on("send-message", (message) => {
      socket.broadcast.to(roomId).emit("recieve-message", message);
    });
    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", username);
    });
  });
});

app.get("/", async (req, res) => {
  res.send("Hey Backend");
});

server.listen(PORT, async () => {
  await connectToMongo();
  console.log(`Server is running on port ${PORT}`);
});
