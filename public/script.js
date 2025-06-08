const socket = io();

// Listen for online user count and update the counter
socket.on('onlineUsers', (count) => {
  const counter = document.getElementById('online-counter');
  if (counter) {
    counter.textContent = `Online users: ${count}`;
  }
});

const chat = document.getElementById('chat'); // now a div, not textarea
const msg = document.getElementById('msg');
const sendBtn = document.getElementById('send');
const newBtn = document.getElementById('new');
const typingIndicator = document.getElementById('typing-indicator');

// Disable send button by default until connected
sendBtn.disabled = true;

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

// Receive system messages (show differently) and enable/disable send button
socket.on('system-message', (data) => {
  const sysMsg = document.createElement('div');
  sysMsg.style.textAlign = 'center';
  sysMsg.style.fontStyle = 'italic';
  sysMsg.style.color = '#888';
  sysMsg.textContent = data;
  chat.appendChild(sysMsg);
  chat.scrollTop = chat.scrollHeight;

  // Enable/disable send button based on connection state
  if (data === 'Connected to stranger!') {
    sendBtn.disabled = false;
    msg.value = '';
    msg.focus();
  } else if (
    data === 'Waiting for a partner...' ||
    data === 'Stranger disconnected.'
  ) {
    sendBtn.disabled = true;
  }
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
  sendBtn.disabled = true;
});

// Send on Enter key, only if sendBtn is enabled
msg.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !sendBtn.disabled) {
    e.preventDefault();
    sendBtn.click();
  }
});

// Typing indicator logic
let typingTimeout;

msg.addEventListener('input', () => {
  if (!sendBtn.disabled) {
    socket.emit('typing');
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      socket.emit('stopTyping');
    }, 1000);
  }
});

socket.on('typing', () => {
  typingIndicator.textContent = 'Stranger is typing...';
});

socket.on('stopTyping', () => {
  typingIndicator.textContent = '';
});

// 11. Dark/Light Theme Toggle Feature

// Add a theme toggle button to the page
window.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.container');
  const themeBtn = document.createElement('button');
  themeBtn.id = 'theme-toggle';
  themeBtn.textContent = 'Change Theme';
  themeBtn.style.position = 'absolute';
  themeBtn.style.top = '10px';
  themeBtn.style.right = '10px';
  document.body.appendChild(themeBtn);

  // Load theme from localStorage
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
  }

  themeBtn.onclick = () => {
    document.body.classList.toggle('dark-theme');
    if (document.body.classList.contains('dark-theme')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  };
});

// Add dark theme styles
const style = document.createElement('style');
style.textContent = `
  body.dark-theme {
    background: #181818 !important;
    color: #eee !important;
  }
  body.dark-theme .container {
    background: #232323 !important;
    color: #eee !important;
  }
  body.dark-theme input, body.dark-theme button {
    background: #333 !important;
    color: #eee !important;
    border-color: #444 !important;
  }
  body.dark-theme .chat-container {
    background: #222 !important;
    color: #eee !important;
  }
  body.dark-theme .message.you {
    background: #2a4d2a !important;
  }
  body.dark-theme .message.stranger {
    background: #2a2a4d !important;
  }
`;
document.head.appendChild(style);
