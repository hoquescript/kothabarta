import express, { Request, Response } from "express";
import { Server } from "socket.io";
import http from "http";

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 8000;

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const emailToMeetId = new Map<string, string>();
const meetIdToEmail = new Map<string, string>();

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("room:join-request", (data) => {
    try {
      const { email, meetId } = data;

      // Store the email and meetId in the maps for future reference
      emailToMeetId.set(email, meetId);
      meetIdToEmail.set(meetId, email);

      // Sending a message to all the members in the meeting if someone is already in the meeting
      io.to(meetId).emit("user:joining", {
        email,
        socketId: socket.id,
      });

      // Adding this socket to the room so that the client can join the room
      socket.join(meetId);

      // Emit the join request to the room so that the client can join the room
      io.to(socket.id).emit("room:join-accepted", data);
    } catch (error) {
      console.error("Error in room:join-request:", error);
      socket.emit("error", { message: "Failed to join room" });
    }
  });

  socket.on("webrtc:call:send", (data) => {
    try {
      const { to, offer } = data;
      io.to(to).emit("webrtc:call:received", { from: socket.id, offer });
    } catch (error) {
      console.error("Error in webrtc:call:send:", error);
      socket.emit("error", { message: "Failed to send call" });
    }
  });

  socket.on("webrtc:answer:send", (data) => {
    try {
      const { to, answer } = data;
      io.to(to).emit("webrtc:answer:received", { from: socket.id, answer });
    } catch (error) {
      console.error("Error in webrtc:answer:send:", error);
      socket.emit("error", { message: "Failed to send answer" });
    }
  });

  socket.on("negotiation:send", (data) => {
    try {
      const { to, offer } = data;
      io.to(to).emit("negotiation:received", { from: socket.id, offer });
    } catch (error) {
      console.error("Error in negotiation:send:", error);
      socket.emit("error", { message: "Failed to send negotiation" });
    }
  });

  socket.on("negotiation:settled", (data) => {
    try {
      const { to, answer } = data;
      io.to(to).emit("negotiation:completed", { from: socket.id, answer });
    } catch (error) {
      console.error("Error in negotiation:settled:", error);
      socket.emit("error", { message: "Failed to complete negotiation" });
    }
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
