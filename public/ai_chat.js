(function() {
  // Inject CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/public/ai_chat.css'; // Path for Cloudflare/serve.py
  document.head.appendChild(link);

  const markedScript = document.createElement('script');
  markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
  document.head.appendChild(markedScript);

  // Inject HTML
  const widgetHtml = `
    <div id="ai-chat-widget">
      <button id="ai-chat-btn">
        <span>✨</span> Asistente AI
      </button>
      <div id="ai-chat-window">
        <div id="ai-chat-header">
          <div class="title"><span>Dragón de Oro</span> AI</div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <button id="ai-chat-maximize" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:16px; padding:0;" title="Pantalla Completa">⛶</button>
            <button id="ai-chat-close">&times;</button>
          </div>
        </div>
        <div id="ai-chat-messages">
          <div class="ai-message">¡Hola! Soy tu asistente de trading experto en Binomo. Pregúntame sobre patrones de velas, indicadores chartistas (RSI, MACD, Fractals, etc.) o estrategias.</div>
        </div>
        <div id="ai-chat-input-area">
          <input type="text" id="ai-chat-input" placeholder="Pregunta algo..." />
          <button id="ai-chat-send">Enviar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', widgetHtml);

  const btn = document.getElementById('ai-chat-btn');
  const chatWindow = document.getElementById('ai-chat-window');
  const closeBtn = document.getElementById('ai-chat-close');
  const maximizeBtn = document.getElementById('ai-chat-maximize');
  const sendBtn = document.getElementById('ai-chat-send');
  const input = document.getElementById('ai-chat-input');
  const messagesArea = document.getElementById('ai-chat-messages');

  let chatHistory = [];

  btn.addEventListener('click', () => {
    chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
    if(chatWindow.style.display === 'flex') {
      input.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  maximizeBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('fullscreen');
  });

  function addMessage(text, isUser) {
    const div = document.createElement('div');
    div.className = isUser ? 'user-message' : 'ai-message';
    if (!isUser && window.marked) {
      div.innerHTML = marked.parse(text);
    } else {
      div.textContent = text;
    }
    messagesArea.appendChild(div);
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    
    addMessage(text, true);
    input.value = '';
    chatHistory.push({ role: 'user', content: text });

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-loading';
    loadingDiv.textContent = 'Escribiendo...';
    messagesArea.appendChild(loadingDiv);
    messagesArea.scrollTop = messagesArea.scrollHeight;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      loadingDiv.remove();

      if (!res.ok) {
        addMessage('Hubo un error de conexión con la IA. Intenta de nuevo.', false);
        chatHistory.pop();
        return;
      }

      const data = await res.json();
      const aiReply = data.reply || 'Sin respuesta';
      addMessage(aiReply, false);
      chatHistory.push({ role: 'assistant', content: aiReply });

    } catch (err) {
      loadingDiv.remove();
      addMessage('Error: ' + err.message, false);
      chatHistory.pop();
    }
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

})();
