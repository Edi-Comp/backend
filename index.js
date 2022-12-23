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

var rooms = {};
io.on("connection", (socket) => {
  socket.on("join-room", async (roomId, username) => {
    // console.log("joined room", roomId, "-", username);
    socket.join(roomId);
    rooms[username] = roomId;
    const myroom = [];
    Object.entries(rooms).forEach(([user, room]) => {
      if (room === roomId) {
        myroom.push(user);
      }
    });

    const file = await findFile(roomId);

    socket.emit("load-document", file?.text || "");

    io.to(roomId).emit("user-connected", username, myroom);

    socket.on("save-document", async (doc) => {
      const file = await findFile(roomId);
      if (file?.text) {
        console.log("updating ");
        await File.updateOne({ roomid: roomId }, { text: doc }).then(() => {
          socket.broadcast.to(roomId).emit("re-load-document", doc);
        });
      } else {
        console.log("saving ");
        await File.create({
          roomid: roomId,
          text: doc,
        }).then(() => {
          socket.broadcast.to(roomId).emit("re-load-document", doc);
        });
      }
    });

    socket.on("send-message", (message) => {
      socket.broadcast.to(roomId).emit("recieve-message", message);
    });

    socket.on("disconnect", () => {
      delete rooms[username];
      const myroom=[]
      Object.entries(rooms).forEach(([user, room]) => {
        if (room === roomId) {
          myroom.push(user);
        }
      });
      io.to(roomId).emit("user-disconnected", username, myroom);
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
