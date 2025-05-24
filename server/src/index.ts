import { Server } from "socket.io";

const io = new Server(8000);

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
});

io.on("disconnect", (socket) => {
  console.log("a user disconnected", socket.id);
});
