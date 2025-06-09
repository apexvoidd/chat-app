import express from "express";
import http from "http";
import { Server } from "socket.io";
import { generateAIResponse, clearMemory } from './ai.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let waitingUser = null;
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);

  socket.isConnected = false;

  function tryMatchWaitingWithAI() {
    if (
      waitingUser &&
      !waitingUser.isConnected &&
      onlineUsers <= 2
    ) {
      const toConnect = waitingUser;
      waitingUser = null;
      connectWithAIBot(toConnect);
    }
  }

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

    socket.waitingTimeout = setTimeout(() => {
      if (!socket.isConnected && waitingUser === socket && onlineUsers <= 2) {
        waitingUser = null;
        connectWithAIBot(socket);
      }
    }, 10000);
  }

  socket.on('message', (msg) => {
    if (socket.partner && socket.isConnected) {
      if (socket.partner.isBot) {
        handleBotReply(socket, msg);
      } else {
        socket.partner.emit('message', msg);
      }
    } else {
      socket.emit('system-message', 'You are not connected to a stranger.');
    }
  });

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);

    if (socket.partner && !socket.partner.isBot) {
      socket.partner.emit('system-message', 'Stranger disconnected.');
      socket.partner.partner = null;
      socket.partner.isConnected = false;
    }

    if (socket.partner && socket.partner.isBot) {
      onlineUsers--;
      io.emit('onlineUsers', onlineUsers);
      clearMemory(socket.id);
    }

    if (waitingUser === socket) {
      if (socket.waitingTimeout) clearTimeout(socket.waitingTimeout);
      waitingUser = null;
    }

    setTimeout(tryMatchWaitingWithAI, 100);
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

function connectWithAIBot(socket) {
  const bot = {
    isBot: true,
    emit: (event, data) => {
      if (event === 'message') {
        socket.emit('message', data);
      } else if (event === 'system-message') {
        socket.emit('system-message', data);
      }
    }
  };

  socket.partner = bot;
  socket.isConnected = true;

  bot.partner = socket;
  bot.isConnected = true;

  // Increase onlineUsers for AI session and emit update
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);

  if (socket.botTimeout) clearTimeout(socket.botTimeout);
  socket.botTimeout = setTimeout(() => {
    socket.emit('system-message', 'Stranger disconnected.');
    socket.disconnect();
  }, 90000);

  socket.emit('system-message', 'Connected to stranger!');
}

async function handleBotReply(userSocket, userMessage) {
  if (userSocket.botTimeout) clearTimeout(userSocket.botTimeout);
  userSocket.botTimeout = setTimeout(() => {
    userSocket.emit('system-message', 'Stranger disconnected.');
    userSocket.disconnect();
  }, 90000);

  setTimeout(() => {
    userSocket.emit('typing');
  }, 1000 + Math.random() * 1000);

  const reply = await generateAIResponse(userMessage, userSocket.id);

  // Calculate delay: 170ms per character, min 1s, max 50s
  const delay = Math.min(Math.max(reply.length * 170, 1000), 50000);
  setTimeout(() => {
    userSocket.emit('stopTyping');
    if (reply) userSocket.emit('message', reply);
  }, delay);
}

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

