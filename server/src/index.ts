import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";

import userRoutes from "./routes/userRoutes";
import messagesRoutes from "./routes/messagesRoute";
const socket = require("socket.io");

declare global {
  var onlineUsers: any;
  var chatSocket: any;
}

const app = express();
require("dotenv").config();

app.use(cors());

app.use(bodyParser.json({ limit: "30mb" }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/messages", messagesRoutes);

mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => {
    console.log("DB Connection Succesfull");
  })
  .catch((err: Error) => {
    console.log(err.message);
  });

const server = app.listen(process.env.PORT, () => {
  console.log(`ChatApp server is running on port ${process.env.PORT}`);
});

// Production
// const io = socket(server, {
//   cors: {
//     origin: ["*", "https://ChatApp.vercel.app"],
//     credentials: true,
//   },
// });

// for testing with localhost
const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

global.onlineUsers = new Map();

io.on("connection", (socket: any) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId: string) => {
    onlineUsers.set(userId, socket.id);
  });
  socket.on("send-msg", (data: any) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data.message);
    }
  });
});
