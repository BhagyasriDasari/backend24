const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 4000;

// Connect to SQLite database
const db = new sqlite3.Database(":memory:");

// Create messages table
db.serialize(() => {
  db.run(
    "CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, text TEXT, user TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)"
  );
});

// Handle WebSocket connections
io.on("connection", (socket) => {
  console.log("New client connected");

  // Send initial messages to client
  db.all(
    "SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50",
    (err, rows) => {
      if (err) {
        console.error(err);
        return;
      }
      const messages = rows.map((row) => row.text);
      socket.emit("message", messages.reverse());
    }
  );

  // Send updated user list to all clients
  io.emit(
    "users",
    Object.keys(io.sockets.connected).map(
      (id) => io.sockets.connected[id].username
    )
  );

  // Receive and broadcast messages
  socket.on("sendMessage", (message) => {
    const user = socket.username || "Anonymous";
    const timestamp = new Date().toISOString();
    db.run(
      "INSERT INTO messages (text, user, timestamp) VALUES (?, ?, ?)",
      [message, user, timestamp],
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
        io.emit("message", [message]);
      }
    );
  });

  // Set username for the socket
  socket.on("setUsername", (username) => {
    socket.username = username;
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    io.emit(
      "users",
      Object.keys(io.sockets.connected).map(
        (id) => io.sockets.connected[id].username
      )
    );
  });
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
