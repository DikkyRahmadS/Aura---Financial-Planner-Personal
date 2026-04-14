// UI Elements
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const chatToggle = document.getElementById('chat-toggle');
const chatContainer = document.getElementById('chat-container');
const newChatBtn = document.getElementById('new-chat-btn');
const sessionList = document.getElementById('session-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// State
let sessions = JSON.parse(localStorage.getItem('aura_sessions')) || [];
let currentSessionId = localStorage.getItem('aura_current_id') || null;

// Initialization
function init() {
  if (sessions.length === 0) {
    createNewChat();
  } else {
    if (!currentSessionId) currentSessionId = sessions[0].id;
    switchSession(currentSessionId);
  }
  renderSessionList();
  setupRevealAnimations();
}

// Session Logic
function createNewChat() {
  const newId = Date.now().toString();
  const newSession = {
    id: newId,
    title: 'Percakapan Baru',
    history: []
  };
  sessions.unshift(newSession);
  currentSessionId = newId;
  saveData();
  renderSessionList();
  renderHistory();
}

function switchSession(id) {
  currentSessionId = id;
  const session = sessions.find(s => s.id === id);
  if (session) {
    renderHistory();
    renderSessionList();
    localStorage.setItem('aura_current_id', id);
  }
}

function saveData() {
  localStorage.setItem('aura_sessions', JSON.stringify(sessions));
  localStorage.setItem('aura_current_id', currentSessionId);
}

function renderSessionList() {
  sessionList.innerHTML = '';
  sessions.forEach(session => {
    const item = document.createElement('div');
    item.className = `session-item ${session.id === currentSessionId ? 'active' : ''}`;
    item.textContent = session.title;
    item.onclick = () => switchSession(session.id);
    sessionList.appendChild(item);
  });
}

function renderHistory() {
  chatBox.innerHTML = '';
  const session = sessions.find(s => s.id === currentSessionId);
  if (session) {
    session.history.forEach(msg => {
      appendMessageToUI(msg.role === 'user' ? 'user' : 'bot', msg.text);
    });
  }
}

// Chat API Logic
form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Add to UI
  appendMessageToUI('user', userMessage);
  input.value = '';

  // Update Session History
  const session = sessions.find(s => s.id === currentSessionId);
  if (session) {
    session.history.push({ role: 'user', text: userMessage });
    
    // Update title if it's the first message
    if (session.history.length === 1) {
      session.title = userMessage.substring(0, 20) + (userMessage.length > 20 ? '...' : '');
      renderSessionList();
    }
  }

  const botMsgElement = appendMessageToUI('bot', 'Aura sedang berpikir...');
  botMsgElement.classList.add('typing');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation: session.history }),
    });

    const data = await response.json();
    botMsgElement.classList.remove('typing');

    if (response.ok) {
      botMsgElement.innerHTML = marked.parse(data.result);
      session.history.push({ role: 'model', text: data.result });
      saveData();
    } else {
      botMsgElement.textContent = 'Aduh, ada kendala: ' + (data.error || 'Server sibuk');
    }
  } catch (error) {
    botMsgElement.classList.remove('typing');
    botMsgElement.textContent = 'Koneksi terputus. Pastikan server berjalan.';
  }
});

function appendMessageToUI(sender, text) {
  const msg = document.createElement('div');
  msg.className = `message ${sender}`;
  
  if (sender === 'bot' && typeof marked !== 'undefined' && text !== 'Aura sedang berpikir...') {
    msg.innerHTML = marked.parse(text);
  } else {
    msg.textContent = text;
  }
  
  chatBox.appendChild(msg);
  chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
  return msg;
}

// UI Toggles & Animations
chatToggle.onclick = () => {
  chatContainer.classList.toggle('hidden');
  const isOpen = !chatContainer.classList.contains('hidden');
  chatToggle.querySelector('.icon-open').classList.toggle('hidden', isOpen);
  chatToggle.querySelector('.icon-close').classList.toggle('hidden', !isOpen);
};

newChatBtn.onclick = createNewChat;

clearHistoryBtn.onclick = () => {
  if (confirm('Hapus semua riwayat percakapan?')) {
    sessions = [];
    localStorage.removeItem('aura_sessions');
    localStorage.removeItem('aura_current_id');
    createNewChat();
  }
};

function setupRevealAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Load on start
window.onload = init;
