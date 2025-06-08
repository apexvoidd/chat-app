const socket = io();
const chat = document.getElementById('chat');
const msg = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const newBtn = document.getElementById('new');

// Send your message
sendBtn.onclick = () => {
  const message = msg.value.trim();
  if (message !== '') {
    socket.emit('message', message);
    chat.value += 'You: ' + message + '\n';
    chat.scrollTop = chat.scrollHeight;
    msg.value = '';
  }
};

// Receive chat message from partner
socket.on('message', (data) => {
  chat.value += 'Stranger: ' + data + '\n';
  chat.scrollTop = chat.scrollHeight;
});

// Receive system messages (no prefix!)
socket.on('system-message', (data) => {
  chat.value += data + '\n';
  chat.scrollTop = chat.scrollHeight;
});

// Disconnect and refresh for new chat
newBtn.onclick = () => {
  socket.disconnect();
  location.reload();
};

// Local disconnect notice
socket.on('disconnect', () => {
  chat.value += 'You have disconnected.\n';
});

// Send on Enter key
msg.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendBtn.click();
  }
});
