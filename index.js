const express = require('express');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const { io: ClientIO } = require('socket.io-client'); // Dùng để kết nối tới Python server
const connectDb = require('./src/config/db');
const DeviceCheck = require('./src/models/deviceCheck')

connectDb();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Kết nối tới Python server
const pythonSocket = ClientIO('http://localhost:5000'); // Python server chạy tại đây

pythonSocket.on('connect', () => {
  console.log('Connected to Python server');
});

pythonSocket.on('response', (data) => {
  console.log('Received from Python:', data);
});

io.on('connection', (socket) => {
  console.log('Client connected');

  // Nhận yêu cầu từ client và chuyển tới Python server
  socket.on('checking', (data) => {
    pythonSocket.emit('checking'); // Gửi dữ liệu tới Python server
  });

  // Nhận phản hồi từ Python và gửi lại client
  pythonSocket.on('result', async (result) => {
    // {
    //   devices: {
    // name: string;
    // quantity: number;
    // },
    // checkedAt: NativeDate;
    // }
    const deviveCheck = new DeviceCheck(result);
    await deviveCheck.save();
    socket.emit('ml_response', result);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(3000, () => {
  console.log('Node.js server is running on port 3000');
});
