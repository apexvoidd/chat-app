const socket = io();
const chat = document.getElementById('chat'); // now a div, not textarea
const msg = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const newBtn = document.getElementById('new');
const typingIndicator = document.getElementById('typing-indicator');

// Helper to add message bubbles
function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('message');
  msgDiv.classList.add(sender); // 'you' or 'stranger'
  msgDiv.textContent = text;
  chat.appendChild(msgDiv);
  chat.scrollTop = chat.scrollHeight;
}

// Send your message
sendBtn.onclick = () => {
  const message = msg.value.trim();
  if (message !== '') {
    socket.emit('message', message);
    addMessage(message, 'you');
    msg.value = '';
  }
};

// Receive chat message from partner
socket.on('message', (data) => {
  addMessage(data, 'stranger');
});

// Receive system messages (show differently)
socket.on('system-message', (data) => {
  const sysMsg = document.createElement('div');
  sysMsg.style.textAlign = 'center';
  sysMsg.style.fontStyle = 'italic';
  sysMsg.style.color = '#888';
  sysMsg.textContent = data;
  chat.appendChild(sysMsg);
  chat.scrollTop = chat.scrollHeight;
});

// Disconnect and refresh for new chat
newBtn.onclick = () => {
  socket.disconnect();
  location.reload();
};

// Local disconnect notice
socket.on('disconnect', () => {
  const discMsg = document.createElement('div');
  discMsg.style.textAlign = 'center';
  discMsg.style.fontStyle = 'italic';
  discMsg.style.color = '#888';
  discMsg.textContent = 'You have disconnected.';
  chat.appendChild(discMsg);
  chat.scrollTop = chat.scrollHeight;
});

// Send on Enter key
msg.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    sendBtn.click();
  }
});

// Typing indicator logic
let typingTimeout;

msg.addEventListener('input', () => {
  socket.emit('typing');

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stopTyping');
  }, 1000);
});

socket.on('typing', () => {
  typingIndicator.textContent = 'Stranger is typing...';
});

socket.on('stopTyping', () => {
  typingIndicator.textContent = '';
});
