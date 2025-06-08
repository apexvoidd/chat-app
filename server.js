const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let waitingUser = null;
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);

  socket.isConnected = false; // Track connection state

  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    socket.partner = partner;
    partner.partner = socket;

    socket.isConnected = true;
    partner.isConnected = true;

    socket.emit('system-message', 'Connected to stranger!');
    partner.emit('system-message', 'Connected to stranger!');
  } else {
    waitingUser = socket;
    socket.emit('system-message', 'Waiting for a partner...');
  }

  socket.on('message', (msg) => {
    // Only allow sending if connected
    if (socket.partner && socket.isConnected) {
      socket.partner.emit('message', msg);
    } else {
      socket.emit('system-message', 'You are not connected to a stranger.');
    }
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);

    if (socket.partner) {
      socket.partner.emit('system-message', 'Stranger disconnected.');
      socket.partner.partner = null;
      socket.partner.isConnected = false; // Mark partner as disconnected
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });

  socket.on('typing', () => {
    if (socket.partner && socket.isConnected) {
      socket.partner.emit('typing');
    }
  });

  socket.on('stopTyping', () => {
    if (socket.partner && socket.isConnected) {
      socket.partner.emit('stopTyping');
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});