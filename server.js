import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUser = null;
let onlineUsers = 0;
let recentlyDisconnected = new Set();

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);

  socket.isConnected = false;

  let matched = false;

  // --- Fix: Remove stale waitingUser if it is disconnected ---
  if (waitingUser && waitingUser.disconnected) {
    waitingUser = null;
  }

  // Try to pair with waiting user first, but not if recently disconnected from each other
  if (
    waitingUser &&
    !waitingUser.isConnected &&
    !waitingUser.disconnected &&
    !recentlyDisconnected.has(waitingUser.id) &&
    !recentlyDisconnected.has(socket.id)
  ) {
    const partner = waitingUser;
    waitingUser = null;
    matched = true;

    socket.partner = partner;
    partner.partner = socket;

    socket.isConnected = true;
    partner.isConnected = true;

    socket.emit('system-message', 'Connected to stranger!');
    partner.emit('system-message', 'Connected to stranger!');
  }

  if (!matched) {
    if (!waitingUser) {
      waitingUser = socket;
      socket.emit('system-message', 'Waiting for a partner...');
    } else {
      socket.emit('system-message', 'Waiting for a partner...');
    }
  }

  socket.on('message', (msg) => {
    if (socket.partner && socket.isConnected) {
      socket.partner.emit('message', msg);
    } else {
      socket.emit('system-message', 'You are not connected to a stranger.');
    }
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);

    recentlyDisconnected.add(socket.id);
    setTimeout(() => recentlyDisconnected.delete(socket.id), 5000);

    if (socket.partner) {
      socket.partner.emit('system-message', 'Stranger disconnected.');
      socket.partner.partner = null;
      socket.partner.isConnected = false;

      // --- Fix: Do NOT set the partner as waitingUser on disconnect ---
      // (Remove the block that sets waitingUser = socket.partner)
      // This prevents instant re-waiting after disconnect.
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

