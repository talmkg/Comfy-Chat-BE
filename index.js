const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:3001",
  },
});

//on connect() we save username to socket.username
io.use((socket, next) => {
  console.log(socket.handshake.auth.username);
  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }
  socket.username = username;

  next();
});

io.on("connection", (socket) => {
  // fetch existing users
  const users = [];
  //We are looping below over the io.of("/").sockets object, which is a Map of all currently connected Socket instances, indexed by ID.
  for (let [id, socket] of io.of("/").sockets) {
    console.log(socket.pfp);
    users.push({
      userID: id,
      username: socket.username,
      pfp: "https://res.cloudinary.com/dp3i1dce4/image/upload/v1674603395/blank-profile-picture-973460-2_mz4hn1.png",
    });
  }
  //here we send back users array on connect
  socket.emit("users", users);
  socket.emit("connectStatus", true);
  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.id,
    username: socket.username,
    pfp: "https://res.cloudinary.com/dp3i1dce4/image/upload/v1674603395/blank-profile-picture-973460-2_mz4hn1.png",
  });

  // forward the private message to the right recipient
  socket.on("private message", ({ content, to, createdAt }) => {
    console.log("message");
    socket.to(to).emit("private message", {
      content,
      from: socket.id,
      createdAt: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    });
  });
  // socket.on("giveUsers", () => {
  //   socket.emit("users", users);
  // });
  // notify users upon disconnection
  socket.on("disconnect", () => {
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
