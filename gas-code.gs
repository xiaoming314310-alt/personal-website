/**
 * ====================================================================
 * Google Apps Script (GAS) 後端代理程式 - 專為 OpenRouter API 設計
 * 支援模型：anthropic/claude-haiku-5.5 (含 reasoning 思維鏈保留)
 * ====================================================================
 * 
 * 【教學與部署步驟】
 * 1. 前往 Google Apps Script ( https://script.google.com/ ) 點擊「新增專案」。
 * 2. 清空現有程式碼，將本檔案內容完整貼上。
 * 3. 設定指令碼屬性 (Script Properties)：
 *    - 點擊左側齒輪「專案設定 (Project Settings)」。
 *    - 滾動到最下方「指令碼屬性 (Script Properties)」，點擊「新增指令碼屬性」。
 *    - 屬性名稱 (Property) 請填： OPENROUTER_API_KEY
 *    - 值 (Value) 請填： 您的 OpenRouter API Key (sk-or-v1-...)
 *    - 點擊「儲存指令碼屬性」。
 * 4. 點擊右上角「部署 (Deploy)」 ->「新增部署作業 (New deployment)」。
 * 5. 點擊左側齒輪選「網頁應用程式 (Web app)」：
 *    - 說明：AI 客服 OpenRouter 代理
 *    - 執行身分：我 (Me)
 *    - 誰可以存取：所有人 (Anyone)  <--- 務必選擇 Anyone！
 * 6. 點擊「部署」，完成 Google 權限核准後，複製產生的「網頁應用程式網址」(/exec 結尾)。
 * 7. 回到網站右下角客服機器人，點擊「⚙️ 齒輪」貼上該網址並儲存即可！
 */

// 預設模型 (使用您指定的 anthropic/claude-haiku-5.5)
const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';

// 備用金鑰 (優先使用指令碼屬性 OPENROUTER_API_KEY)
const FALLBACK_KEY = '';

/**
 * 從 GAS「指令碼屬性」讀取 OpenRouter API Key
 */
function getApiKey() {
  const props = PropertiesService.getScriptProperties();
  // 檢查常見的命名大小寫
  const possibleKeys = ['OPENROUTER_API_KEY', 'openrouter_api_key', 'Key', 'KEY', 'API_KEY', 'api_key'];
  for (let i = 0; i < possibleKeys.length; i++) {
    const val = props.getProperty(possibleKeys[i]);
    if (val && val.trim().length > 0) {
      return val.trim();
    }
  }
  return FALLBACK_KEY;
}

/**
 * 處理 POST 請求 (避免 CORS preflight，由前端以 text/plain 傳入 JSON)
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({ error: '無效的請求資料' }, 400);
    }

    const requestData = JSON.parse(e.postData.contents);

    // 支援連線測試 (Ping)
    if (requestData.action === 'ping') {
      return createJsonResponse({
        status: 'ok',
        reply: '連線正常！Google Apps Script 與 OpenRouter 代理端運行中。'
      });
    }

    const userMessage = requestData.message || '';
    const history = requestData.history || [];
    const systemPrompt = requestData.systemPrompt || '你是一位友善專業的個人網站客服助理，請用繁體中文親切回答。';
    const model = requestData.model || DEFAULT_MODEL;

    if (!userMessage) {
      return createJsonResponse({ error: '訊息內容不可為空' }, 400);
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      return createJsonResponse({
        error: '尚未於 GAS「指令碼屬性」中設定 OPENROUTER_API_KEY！'
      }, 500);
    }

    // 建立對話列表，支援包含 reasoning_details 的多輪上下文
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // 加入過往歷史訊息，保留 reasoning_details (如果有的話)
    history.forEach(item => {
      if (item && item.role) {
        const msgObj = {
          role: item.role === 'assistant' ? 'assistant' : 'user',
          content: item.content || ''
        };
        // 嚴格保留 OpenRouter 的 reasoning_details 供模型連續推理
        if (item.reasoning_details) {
          msgObj.reasoning_details = item.reasoning_details;
        }
        messages.push(msgObj);
      }
    });

    // 準備發送給 OpenRouter 的 Request Body
    const requestBody = {
      model: model,
      messages: messages,
      reasoning: { enabled: true } // 開啟 OpenRouter reasoning 功能
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'HTTP-Referer': 'https://script.google.com',
        'X-Title': 'Alex Chen Portfolio Chatbot'
      },
      payload: JSON.stringify(requestBody),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', options);
    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (statusCode >= 200 && statusCode < 300) {
      const resultJson = JSON.parse(responseText);
      const choice = resultJson.choices?.[0];
      const message = choice?.message || {};
      
      return createJsonResponse({
        success: true,
        reply: message.content || '（無回傳內容）',
        reasoning_details: message.reasoning_details || null // 回傳保留 reasoning_details
      });
    } else {
      let errMsg = 'OpenRouter API 回傳錯誤 (' + statusCode + ')';
      try {
        const errJson = JSON.parse(responseText);
        if (errJson.error && errJson.error.message) {
          errMsg += ': ' + errJson.error.message;
        }
      } catch (e) {
        errMsg += ': ' + responseText;
      }
      return createJsonResponse({ error: errMsg }, statusCode);
    }

  } catch (err) {
    return createJsonResponse({
      error: 'GAS 內部處理異常: ' + err.toString()
    }, 500);
  }
}

/**
 * 處理 GET 請求，方便直接瀏覽器測試
 */
function doGet(e) {
  return createJsonResponse({
    status: 'online',
    model: DEFAULT_MODEL,
    message: 'GAS OpenRouter 客服後端已上線！'
  });
}

function createJsonResponse(data, code) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
