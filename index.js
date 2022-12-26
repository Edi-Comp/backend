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
var logs; 
var cursors={};

io.on("connection", (socket) => {
  socket.on("join-room", async (roomId, username) => {
    socket.join(roomId);
    rooms[username] = roomId;
    const myroom = [];
    // Send data of people online
    Object.entries(rooms).forEach(([user, room]) => {
      if (room === roomId) {
        myroom.push(user);
      }
    });

    const file = await findFile(roomId);

    // Load the data from the database when new user joins
    socket.emit("load-document", file?.text || "");

    // Get and Send the cursor index of users
    socket.on("send-cursor",(user,index)=>{
      cursors[user]=index;
      socket.broadcast.to(roomId).emit("get-cursor",cursors);
    })

    // Trigger connected user
    io.to(roomId).emit("user-connected", username, myroom);

    // Save the document to database and reload for other online users who have just joined.
    socket.on("save-document", async (doc) => {
      const file = await findFile(roomId);
      if (file?.text) {
        console.log("updating ");
        const history = {
          text: doc,
          timestamp: new Date(),
        };
        const lastHistory = file.history[file.history.length - 1];
        const minDiff = (new Date() - lastHistory.timestamp) / (1000 * 60);
        console.log(minDiff);
        if (minDiff < 60) {
          await File.updateOne(
            { roomid: roomId },
            { $set: { text: doc },}
          ).then(() => {
            socket.broadcast.to(roomId).emit("re-load-document", doc);
          });
        } else {
          await File.updateOne(
            { roomid: roomId },
            {
              $set: { text: doc },
              $push: {
                history,
              },
            }
          ).then(() => {
            socket.broadcast.to(roomId).emit("re-load-document", doc);
          });
        }
      } else {
        console.log("saving ");
        const history = {
          text: doc,
          timestamp: new Date(),
        };
        await File.create({
          roomid: roomId,
          text: doc,
          history,
        }).then(() => {
          socket.broadcast.to(roomId).emit("re-load-document", doc);
        });
      }
    });

    // Send Message who are online in socket
    socket.on("send-message", (message,index) => {
      socket.broadcast.to(roomId).emit("recieve-message", message,index);
    });

    socket.on("disconnect", () => {
      delete rooms[username];
      delete cursors[username];
      const myroom = [];
      // Remove users who disconnected and send to client side
      Object.entries(rooms).forEach(([user, room]) => {
        if (room === roomId) {
          myroom.push(user);
        }
      });
      // Trigger disconnected user
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
