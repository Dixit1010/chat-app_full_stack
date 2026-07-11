import { Server } from "socket.io";
import http from "http";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL || "http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ receiverId, conversationId, participants }) => {
    if (receiverId) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing", { senderId: userId, conversationId });
      }
    } else if (participants) {
      participants.forEach(p => {
        if (p !== userId) {
          const socketId = getReceiverSocketId(p);
          if (socketId) io.to(socketId).emit("typing", { senderId: userId, conversationId });
        }
      });
    }
  });

  socket.on("stopTyping", ({ receiverId, conversationId, participants }) => {
    if (receiverId) {
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("stopTyping", { senderId: userId, conversationId });
      }
    } else if (participants) {
      participants.forEach(p => {
        if (p !== userId) {
          const socketId = getReceiverSocketId(p);
          if (socketId) io.to(socketId).emit("stopTyping", { senderId: userId, conversationId });
        }
      });
    }
  });

  // WebRTC Signaling
  socket.on("call-offer", ({ receiverId, offer, isVideo }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-offer", { senderId: userId, offer, isVideo });
    }
  });

  socket.on("call-answer", ({ receiverId, answer }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call-answer", { senderId: userId, answer });
    }
  });

  socket.on("ice-candidate", ({ receiverId, candidate }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("ice-candidate", { senderId: userId, candidate });
    }
  });

  socket.on("end-call", ({ receiverId }) => {
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("end-call", { senderId: userId });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
