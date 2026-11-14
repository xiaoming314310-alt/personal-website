/**
 * AI Customer Service Chatbot Widget & Settings Handler
 * Supports:
 * 1. Google Apps Script (GAS) Web App proxy to OpenRouter
 * 2. Direct OpenRouter API calls
 */

(function () {
  // LocalStorage keys
  const STORAGE_KEYS = {
    MODE: 'portfolio_chat_mode',
    GAS_URL: 'portfolio_gas_url',
    OR_KEY: 'portfolio_openrouter_key',
    OR_MODEL: 'portfolio_openrouter_model',
    SYSTEM_PROMPT: 'portfolio_system_prompt',
    THEME: 'portfolio_theme'
  };

  // Default values
  const DEFAULT_SYSTEM_PROMPT = `你是 Alex Chen (陳冠宇) 的個人網站專屬 AI 客服助理。
Alex 是一位擁有 6+ 年經驗的資深全端工程師與 AI 解決方案架構師。
專長包含：
- 前端：React, Next.js, TypeScript, Tailwind CSS
- 後端：Node.js, Python FastAPI, PostgreSQL, Redis
- AI 與自動化：OpenRouter API, OpenAI, Claude, Google Apps Script, LangChain
- 雲端維運：Docker, GCP, CI/CD

請以親切、專業、繁體中文回答訪客的所有提問。
若訪客想諮詢專案或索取履歷，請引導其寄信至 alex@example.com 或透過頁面的聯絡按鈕聯繫。
回答請條理清晰，適當使用重點列點。`;

  const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free';

  // State
  let config = {
    mode: localStorage.getItem(STORAGE_KEYS.MODE) || 'gas',
    gasUrl: localStorage.getItem(STORAGE_KEYS.GAS_URL) || '',
    openRouterKey: localStorage.getItem(STORAGE_KEYS.OR_KEY) || '',
    model: localStorage.getItem(STORAGE_KEYS.OR_MODEL) || DEFAULT_MODEL,
    systemPrompt: localStorage.getItem(STORAGE_KEYS.SYSTEM_PROMPT) || DEFAULT_SYSTEM_PROMPT
  };

  let conversationHistory = [];
  let isSending = false;

  // DOM Elements
  const chatWindow = document.getElementById('chatWindow');
  const chatToggleBtn = document.getElementById('chatToggleBtn');
  const closeChatBtn = document.getElementById('closeChatBtn');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const settingsPanel = document.getElementById('settingsPanel');

  const modeGasBtn = document.getElementById('modeGasBtn');
  const modeDirectBtn = document.getElementById('modeDirectBtn');
  const gasConfigSection = document.getElementById('gasConfigSection');
  const directConfigSection = document.getElementById('directConfigSection');

  const gasUrlInput = document.getElementById('gasUrlInput');
  const openRouterKeyInput = document.getElementById('openRouterKeyInput');
  const modelSelectInput = document.getElementById('modelSelectInput');
  const systemPromptInput = document.getElementById('systemPromptInput');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  const testConnectionBtn = document.getElementById('testConnectionBtn');

  const messagesContainer = document.getElementById('messagesContainer');
  const typingIndicator = document.getElementById('typingIndicator');
  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const noticeNoConfig = document.getElementById('noticeNoConfig');
  const quickChips = document.getElementById('quickChips');

  // Theme elements
  const themeToggle = document.getElementById('themeToggle');

  // Initialize
  function init() {
    initTheme();
    loadConfigToUI();
    bindEvents();
    updateConfigNotice();
  }

  // Theme Management
  function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
      });
    }
  }

  function loadConfigToUI() {
    gasUrlInput.value = config.gasUrl;
    openRouterKeyInput.value = config.openRouterKey;
    modelSelectInput.value = config.model;
    systemPromptInput.value = config.systemPrompt;
    setModeUI(config.mode);
  }

  function setModeUI(mode) {
    config.mode = mode;
    if (mode === 'gas') {
      modeGasBtn.className = 'py-2 px-3 rounded-xl border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-center';
      modeDirectBtn.className = 'py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium text-center hover:bg-slate-50 dark:hover:bg-slate-800';
      gasConfigSection.classList.remove('hidden');
      directConfigSection.classList.add('hidden');
    } else {
      modeDirectBtn.className = 'py-2 px-3 rounded-xl border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-center';
      modeGasBtn.className = 'py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-medium text-center hover:bg-slate-50 dark:hover:bg-slate-800';
      gasConfigSection.classList.add('hidden');
      directConfigSection.classList.remove('hidden');
    }
  }

  function updateConfigNotice() {
    if (!noticeNoConfig) return;
    const isReady = (config.mode === 'gas' && config.gasUrl.trim().length > 0) ||
                    (config.mode === 'direct' && config.openRouterKey.trim().length > 0);
    if (isReady) {
      noticeNoConfig.classList.add('hidden');
    } else {
      noticeNoConfig.classList.remove('hidden');
    }
  }

  function openChat() {
    chatWindow.classList.remove('hidden');
    // Force reflow for transition
    void chatWindow.offsetWidth;
    chatWindow.classList.remove('scale-95', 'opacity-0');
    chatWindow.classList.add('scale-100', 'opacity-100');
    chatInput.focus();
    scrollToBottom();
  }

  function closeChat() {
    chatWindow.classList.remove('scale-100', 'opacity-100');
    chatWindow.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      chatWindow.classList.add('hidden');
    }, 250);
  }

  function toggleSettings(show) {
    if (show) {
      settingsPanel.classList.remove('hidden');
    } else {
      settingsPanel.classList.add('hidden');
    }
  }

  function bindEvents() {
    chatToggleBtn.addEventListener('click', () => {
      if (chatWindow.classList.contains('hidden') || chatWindow.classList.contains('opacity-0')) {
        openChat();
      } else {
        closeChat();
      }
    });

    closeChatBtn.addEventListener('click', closeChat);
    openSettingsBtn.addEventListener('click', () => toggleSettings(true));
    closeSettingsBtn.addEventListener('click', () => toggleSettings(false));

    modeGasBtn.addEventListener('click', () => setModeUI('gas'));
    modeDirectBtn.addEventListener('click', () => setModeUI('direct'));

    // Save Settings
    saveSettingsBtn.addEventListener('click', () => {
      config.gasUrl = gasUrlInput.value.trim();
      config.openRouterKey = openRouterKeyInput.value.trim();
      config.model = modelSelectInput.value;
      config.systemPrompt = systemPromptInput.value.trim() || DEFAULT_SYSTEM_PROMPT;

      localStorage.setItem(STORAGE_KEYS.MODE, config.mode);
      localStorage.setItem(STORAGE_KEYS.GAS_URL, config.gasUrl);
      localStorage.setItem(STORAGE_KEYS.OR_KEY, config.openRouterKey);
      localStorage.setItem(STORAGE_KEYS.OR_MODEL, config.model);
      localStorage.setItem(STORAGE_KEYS.SYSTEM_PROMPT, config.systemPrompt);

      updateConfigNotice();
      toggleSettings(false);

      appendSystemNotice(`已成功儲存設定！連線模式：${config.mode === 'gas' ? 'Google Apps Script (GAS)' : 'OpenRouter 直連'}`);
    });

    // Test Connection
    testConnectionBtn.addEventListener('click', testConnection);

    // Form Submit
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleUserSendMessage();
    });

    // Quick Chips
    if (quickChips) {
      quickChips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-btn');
        if (btn) {
          const text = btn.textContent.trim().replace(/^[\uD800-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]\s*/, '');
          chatInput.value = text;
          handleUserSendMessage();
        }
      });
    }
  }

  // Handle Send Message
  async function handleUserSendMessage() {
    const text = chatInput.value.trim();
    if (!text || isSending) return;

    // Check config
    if (config.mode === 'gas' && !config.gasUrl) {
      appendUserMessage(text);
      chatInput.value = '';
      appendBotMessage('尚未設定 Google Apps Script (GAS) 網址。請點擊右上角「齒輪 ⚙️」填入您部署的 GAS Web App 網址後再試一次！');
      return;
    }

    if (config.mode === 'direct' && !config.openRouterKey) {
      appendUserMessage(text);
      chatInput.value = '';
      appendBotMessage('尚未設定 OpenRouter API Key。請點擊右上角「齒輪 ⚙️」填入 API Key 後再試一次！');
      return;
    }

    appendUserMessage(text);
    chatInput.value = '';
    conversationHistory.push({ role: 'user', content: text });

    setLoading(true);

    try {
      let botReply = '';
      if (config.mode === 'gas') {
        botReply = await callGasApi(text);
      } else {
        botReply = await callOpenRouterApi();
      }

      appendBotMessage(botReply);
      conversationHistory.push({ role: 'assistant', content: botReply });
    } catch (err) {
      console.error('Chatbot error:', err);
      appendBotMessage(`⚠️ 連線錯誤：${err.message || '無法取得 AI 回覆，請確認 GAS 網址或網路狀態。'}`);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Call Google Apps Script Web App
   * Uses text/plain to avoid CORS preflight OPTIONS request
   */
  async function callGasApi(userMessage) {
    const payload = {
      message: userMessage,
      history: conversationHistory.slice(-6), // Send last 6 turns
      systemPrompt: config.systemPrompt
    };

    const response = await fetch(config.gasUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`GAS 回應狀態碼 ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.reply || data.text || data.message || '（無回傳內容）';
  }

  /**
   * Call OpenRouter API directly
   */
  async function callOpenRouterApi() {
    const messages = [
      { role: 'system', content: config.systemPrompt },
      ...conversationHistory.slice(-8)
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openRouterKey}`,
        'HTTP-Referer': window.location.origin || 'http://localhost',
        'X-Title': 'Alex Chen Portfolio Chatbot'
      },
      body: JSON.stringify({
        model: config.model,
        messages: messages
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '（無回傳內容）';
  }

  /**
   * Test Connection
   */
  async function testConnection() {
    const originalText = testConnectionBtn.textContent;
    testConnectionBtn.disabled = true;
    testConnectionBtn.textContent = '測試中...';

    try {
      if (config.mode === 'gas') {
        const url = gasUrlInput.value.trim();
        if (!url) throw new Error('請先輸入 GAS 網址');

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'ping', message: 'ping' })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        alert('🎉 GAS 連線成功！\n後端回應：' + (data.reply || JSON.stringify(data)));
      } else {
        const key = openRouterKeyInput.value.trim();
        if (!key) throw new Error('請先輸入 OpenRouter API Key');

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model: modelSelectInput.value,
            messages: [{ role: 'user', content: 'Say hello in 5 words' }]
          })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        alert('🎉 OpenRouter 直連測試成功！\n回應：' + (data.choices?.[0]?.message?.content || 'OK'));
      }
    } catch (err) {
      alert('❌ 連線測試失敗：' + err.message);
    } finally {
      testConnectionBtn.disabled = false;
      testConnectionBtn.textContent = originalText;
    }
  }

  function setLoading(loading) {
    isSending = loading;
    sendBtn.disabled = loading;
    if (loading) {
      typingIndicator.classList.remove('hidden');
    } else {
      typingIndicator.classList.add('hidden');
    }
    scrollToBottom();
  }

  function appendUserMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex justify-end';
    msgDiv.innerHTML = `
      <div class="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] leading-relaxed chat-bubble">
        ${escapeHtml(text)}
      </div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function appendBotMessage(text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex items-start gap-2.5';
    msgDiv.innerHTML = `
      <div class="w-7 h-7 rounded-lg bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-xs mt-0.5">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-sm border border-slate-200/80 dark:border-slate-700/80 shadow-sm max-w-[85%] text-slate-700 dark:text-slate-200 leading-relaxed chat-bubble">
        ${formatMarkdown(text)}
      </div>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function appendSystemNotice(text) {
    const noticeDiv = document.createElement('div');
    noticeDiv.className = 'text-center my-2';
    noticeDiv.innerHTML = `
      <span class="inline-block px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
        ℹ️ ${escapeHtml(text)}
      </span>
    `;
    messagesContainer.appendChild(noticeDiv);
    scrollToBottom();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Simple, clean Markdown formatter for chat bubbles
  function formatMarkdown(text) {
    let html = escapeHtml(text);
    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code: `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Line breaks
    html = html.replace(/\n/g, '<br>');
    return html;
  }

  // Expose global helper
  window.chatWidget = {
    openChat,
    closeChat,
    toggleSettings
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
