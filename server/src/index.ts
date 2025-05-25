import { Server } from "socket.io";

const io = new Server(8000, {
  cors: {
    origin: "*",
  },
});

const emailToMeetId = new Map<string, string>();
const meetIdToEmail = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("room:join-request", (data) => {
    const { email, meetId } = data;

    // Store the email and meetId in the maps for future reference
    emailToMeetId.set(email, meetId);
    meetIdToEmail.set(meetId, email);

    // Sending a message to all the members in the meeting if someone is already in the meeting
    io.to(meetId).emit("user:joining", data);

    // Adding this socket to the room so that the client can join the room
    socket.join(meetId);

    // Emit the join request to the room so that the client can join the room
    io.to(socket.id).emit("room:join-accepted", data);
  });
});

// io.on("disconnect", (socket) => {
//   console.log("a user disconnected", socket.id);
// });
