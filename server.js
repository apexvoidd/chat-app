const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let waitingUser = null;

io.on('connection', (socket) => {
  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    socket.partner = partner;
    partner.partner = socket;

    socket.emit('system-message', 'Connected to stranger!');
    partner.emit('system-message', 'Connected to stranger!');
  } else {
    waitingUser = socket;
    socket.emit('system-message', 'Waiting for a partner...');
  }

  socket.on('message', (msg) => {
    if (socket.partner) {
      socket.partner.emit('message', msg);
    }
  });

  socket.on('disconnect', () => {
    if (socket.partner) {
      socket.partner.emit('system-message', 'Stranger disconnected.');
      socket.partner.partner = null;
    }
    if (waitingUser === socket) {
      waitingUser = null;
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
