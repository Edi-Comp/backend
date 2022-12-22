const express = require("express");
require("dotenv").config();
const app = express();
const server = require("http").createServer(app);
const cors = require("cors");

const path = require("path");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.PORT;

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, username) => {
    console.log("joined room", roomId, "-", username);
    socket.join(roomId);

    socket.emit("load-document","");

    socket.broadcast.to(roomId).emit("user-connected", username);

    socket.on("send-message",(message)=>{
        socket.broadcast.to(roomId).emit("recieve-message",message);
    })
    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", username);
    });
  });
});

app.get("/", async (req, res) => {
  res.send("Hey Backend");
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
