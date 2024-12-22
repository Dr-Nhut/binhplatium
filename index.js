const express = require("express");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const { io: ClientIO } = require("socket.io-client"); // Dùng để kết nối tới Python server
const connectDb = require("./src/config/db");
const DeviceCheck = require("./src/models/deviceCheck");

connectDb();

const app = express();
app.use(express.static("public"));
app.set("view engine", "pug");
app.set("views", "./src/views");
app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  const lastCheck = await DeviceCheck.findOne().sort({ checkedAt: -1 }).exec();
  const devices = lastCheck ? lastCheck.devices : [];
  res.render("devices", { devices });
});

app.get("/all", async (req, res) => {
  const lastCheck = await DeviceCheck.findOne();

  res.json({ lastCheck });
});

const server = http.createServer(app);
const io = new Server(server);

// Kết nối tới Python server
// const pythonSocket = ClientIO("http://192.168.1.25:5000");
const pythonSocket = ClientIO("http://localhost:5000");
// const pythonSocket = ClientIO("http://192.168.1.71:5000");
// const pythonSocket = ClientIO("http://192.168.7.116:5000");

pythonSocket.on("connect", () => {
  console.log("Connected to Python server");
});

pythonSocket.on("response", (data) => {
  console.log("Received from Python:", data);
});

io.on("connection", (socket) => {
  console.log("Client connected");

  // Nhận yêu cầu từ client và chuyển tới Python server
  socket.on("checking", (data) => {
    console.log("Checking devices...");
    pythonSocket.emit("checking"); // Gửi dữ liệu tới Python server
  });

  // Nhận phản hồi từ Python và gửi lại client
  pythonSocket.on("result", async (result) => {
    console.log("Received result from Python:", result);

    const deviceCheck = new DeviceCheck(result);
    await deviceCheck.save();
    socket.emit("ml_response", result);
    io.emit("ml_response", result);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });

  socket.on("python_data", async (data) => {
    console.log("Received data from Python client:", data);
    const deviceCheck = new DeviceCheck(data);
    await deviceCheck.save();
    socket.emit("ml_response", data);
    io.emit("ml_response", data);
  });

  // ToDo: streaming
  // Khi client yêu cầu bật camera
  socket.on("start_camera", () => {
    console.log("Start camera requested");
    pythonSocket.emit("start_camera");
  });

  // Chuyển tiếp frame từ Python tới client
  pythonSocket.on("camera_frame", (data) => {
    console.log("camera_frame", data);
    socket.emit("camera_frame", data);
    // const frameBase64 = data.frame;
    // const frameBuffer = Buffer.from(frameBase64, "base64");
  });

  // Chuyển tiếp lỗi camera từ Python tới client
  pythonSocket.on("camera_error", (data) => {
    // socket.emit("camera_error", data);
  });
});

server.listen(3000, () => {
  console.log("Node.js server is running on port 3000");
});
