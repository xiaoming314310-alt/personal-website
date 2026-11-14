# Alex Chen - 個人網站與 AI 客服系統 (Personal Portfolio & AI Chatbot)

這是一個現代化、高質感的個人品牌作品集網站，具備全響應式設計、深淺色切換模式，以及右下角的 **AI 智慧客服機器人（支援 GAS 與 OpenRouter API）**。

---

## 🌟 網站功能亮點

1. **專業個人履歷與專案展示**：
   - 包含：關於我、專業技能（前端 / 後端 / AI / DevOps）、精選作品集、經歷軌跡與聯絡資訊。
   - 預設資訊：Alex Chen（資深全端工程師 & AI 解決方案架構師），可自由依個人需求修改 [index.html](file:///C:/Users/User/.gemini/antigravity/scratch/personal-website/index.html)。
2. **深淺色主題切換 (Dark / Light Mode)**：支援自動偵測系統配色與一鍵手動切換。
3. **右下角 AI 機器人小客服**：
   - 懸浮機器人按鈕，點擊流暢展開對話視窗。
   - 快速提問標籤（介紹技術專長、代表專案、如何聯繫等）。
   - **自訂設定齒輪（⚙️ 按鈕）**：
     - **Google Apps Script (GAS) 網址填入**：可直接貼上 Google Apps Script 產生的 Web App URL。
     - **OpenRouter 直連模式（備用）**：亦支援直接輸入 OpenRouter API Key 直連測試。
     - **AI 模型切換與人設 (System Prompt) 自訂**。
     - **一鍵連線測試**：即時測試 GAS 或 OpenRouter API 是否連線成功。
     - 所有設定均安全儲存在瀏覽器的 `localStorage` 中。

---

## 📁 檔案結構

```
personal-website/
├── index.html        # 網站主頁面與客服 UI 結構
├── styles.css        # 自訂動畫、滾動條與細節樣式
├── chatbot.js        # 客服機器人邏輯、設定儲存、GAS / OpenRouter 呼叫
├── gas-code.gs       # Google Apps Script (GAS) 後端代理完整範本程式碼
└── README.md         # 專案說明文件
```

---

## 🚀 如何快速設定 Google Apps Script (GAS) 串接 OpenRouter

使用 GAS 作為中繼代理的好處是：**您的 OpenRouter API Key 存放在 Google 雲端後端，前端訪客完全看不到您的金鑰，安全又免費！**

### 步驟 1：建立 Apps Script 專案
1. 開啟 [Google Apps Script](https://script.google.com/)。
2. 點擊左上角「**新增專案**」。
3. 清空專案內的預設代碼，將 [gas-code.gs](file:///C:/Users/User/.gemini/antigravity/scratch/personal-website/gas-code.gs) 的所有內容複製並貼上。

### 步驟 2：填入 OpenRouter API Key
- 在 `gas-code.gs` 最上方將 `HARDCODED_OPENROUTER_KEY` 改為您的 OpenRouter API Key（例如 `sk-or-v1-...`）。
- 或至左側「專案設定 ⚙️」->「指令碼屬性」新增名稱為 `OPENROUTER_API_KEY` 的屬性。

### 步驟 3：部署為網頁應用程式 (Web App)
1. 點擊右上角「**部署 (Deploy)**」->「**新增部署作業 (New deployment)**」。
2. 點擊「選取類型」的齒輪圖示，選擇「**網頁應用程式 (Web app)**」。
3. 填寫設定：
   - **說明**：AI 客服代理
   - **執行身分**：**我 (Me)**
   - **誰可以存取**：**所有人 (Anyone)** *(⚠️ 請務必選擇 Anyone，否則前端無法呼叫)*
4. 點擊「**部署**」，若跳出 Google 授權視窗請依序點擊「核准 / 進階 -> 前往專案」。
5. 複製產生的「**網頁應用程式網址**」（網址以 `/exec` 結尾）。

### 步驟 4：在個人網站填入網址
1. 在瀏覽器打開本網站 [index.html](file:///C:/Users/User/.gemini/antigravity/scratch/personal-website/index.html)。
2. 點擊右下角機器人圓形按鈕展開聊天室。
3. 點擊聊天室頂部的「**⚙️ 齒輪**」按鈕開啟設定面板。
4. 將剛才複製的 GAS 網址貼入「**Google Apps Script (GAS) 網址**」輸入框中。
5. 點擊「**測試連線**」確認成功後，點擊「**儲存設定**」即可開始聊天！

---

## 💻 本地預覽

您可以用任何靜態網頁伺服器（例如 VS Code Live Server、Python http.server 或 Node http-server）開啟此資料夾，或直接在瀏覽器雙擊打開 `index.html`。
