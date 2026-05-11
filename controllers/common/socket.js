let io;

const initSocket = (server) => {
  io = require("socket.io")(server, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    // Join notice room
    socket.on("join_notice_room", (noticeId) => {
      socket.join(`notice_${noticeId}`);

      console.log(
        `Socket joined room: notice_${noticeId}`
      );
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};