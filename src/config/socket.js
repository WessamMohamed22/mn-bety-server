import { Server } from "socket.io";
import { env } from "./env.js";

let io;
// This Map will store connected users: { "userId": "socketId" }
const connectedUsers = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`New Socket Connected: ${socket.id}`);

    // Listen for a custom "register" event from the React frontend
    socket.on("register", (userId) => {
      if (userId) {
        connectedUsers.set(userId.toString(), socket.id);
        console.log(`👤 User [${userId}] linked to Socket [${socket.id}]`);
      }
    });

    // Handle disconnections
    socket.on("disconnect", () => {
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User [${userId}] disconnected`);
          break;
        }
      }
    });
  });

  return io;
};

// Helper function to emit events to specific users from anywhere in your controllers
export const emitToUser = (userId, eventName, data) => {
  if (!io) return false;
  
  const socketId = connectedUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit(eventName, data);
    return true; // Successfully sent
  }
  return false; // User is currently offline
};