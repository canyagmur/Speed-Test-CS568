// app.js
var express = require("express");
var app = express();
var crypto = require("crypto");
require("dotenv").config();
var http = require("http");
var socketIo = require("socket.io");

// Set the view engine to EJS
app.set("view engine", "ejs");

// Serve static files from the "public" directory
app.use(express.static("public"));

// Render the main page
app.get("/", function (req, res) {
  res.render("view"); // Renders views/hello.ejs
});

// Create HTTP server and Socket.io instance
var server = http.createServer(app);
var io = socketIo(server);

// Listen on the specified port (default to 3000 if not set in .env)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("listening on port " + PORT));

// Handle socket connections and events
io.on("connection", function (socket) {
  console.log("connected");

  // Respond to "clientPing" event
  socket.on("clientPing", (msg) => {
    socket.emit("serverPong", msg);
  });

  // Respond to "download" event with random data of specified chunk size
  socket.on("download", (chunkSize) => {
    const data = crypto.randomBytes(chunkSize);
    socket.emit("download", data);
  });

  // Respond to "upload" event with a timestamp
  socket.on("upload", (data) => {
    socket.emit("upload", Date.now());
  });

  // Log disconnection events
  socket.on("disconnect", function () {
    console.log("disconnected");
  });
});

// Handle 404 errors for unrecognized routes
app.use(function (req, res, next) {
  res.sendStatus(404);
});
