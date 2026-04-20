/* ============================================================
   LinguaLens — Service Worker (Background Script)
   Handles AI API calls, vocabulary storage, and prompt management
   ============================================================ */

// ---- Default Prompt Templates ----
const DEFAULT_PROMPTS = {
  translate: `You are a professional translator. Translate the following text to {targetLang}. 
Provide ONLY the translation, nothing else. If the text is already in {targetLang}, translate it to the detected source language.

Text: "{text}"`,

  phrase: `Analyze the following text and determine if it is a phrase, idiom, phrasal verb, collocation, proverb, or slang expression.

Respond in this format:
**Type:** [phrase type]
**Meaning:** [explain the meaning]
**Example:** [provide an example sentence]
**Origin:** [brief origin if known, otherwise skip]

Text: "{text}"`,

  insight: `Provide a comprehensive linguistic insight for the following text. Include:

**Definition:** Clear definition(s)
**Etymology:** Word origin and history
**Usage:** Common contexts where this is used
**Register:** Formal, informal, slang, technical, etc.
**Connotation:** Positive, negative, or neutral tone
**Synonyms:** 3-5 alternatives
**Antonyms:** 2-3 opposites (if applicable)

Text: "{text}"`,

  rewrite: `Rewrite the following text in 3 different styles:

**Formal:** [professional/academic version]
**Casual:** [friendly/conversational version]  
**Concise:** [shortest clear version]

Original text: "{text}"`,

  grammar: `Analyze the grammar of the following text. 

If there are errors:
**Errors Found:** List each error with explanation
**Corrected:** Provide the corrected version
**Rule:** Explain the grammar rule

If the grammar is correct:
**Status:** ✅ No grammar issues found
**Analysis:** Brief structural breakdown of the sentence
**Suggestion:** Any stylistic improvements (optional)

Text: "{text}"`,

  summary: `Summarize the following text concisely. Capture the key points in 2-3 sentences maximum.

**Summary:** [concise summary]
**Key Points:**
• [point 1]
• [point 2]
• [point 3]

Text: "{text}"`,

  idea: `Analyze the rhetorical and idea structure template used in the following text. Identify the pattern such as:
- Problem → Solution
- Cause → Effect
- Compare → Contrast
- Claim → Evidence → Conclusion
- Situation → Complication → Resolution
- General → Specific
- Chronological Sequence
- Question → Answer
- Thesis → Antithesis → Synthesis
- Other patterns

**Template:** [identified pattern name]
**Structure Breakdown:**
[Break down how each part of the text maps to the template]
**Why this works:** [explain the effectiveness]
**Alternative template:** [suggest another way to structure the same idea]

Text: "{text}"`,

  sentence: `Analyze the sentence structure and grammatical template used in the following text. Identify patterns such as:
- "If...then..." (Conditional)
- "Not only...but also..." (Correlative)
- "Although...still..." (Concessive)
- "The more...the more..." (Comparative)
- "It is...that..." (Cleft sentence)
- Subject + Verb + Object (Simple)
- Compound, Complex, or Compound-Complex
- Parallel Structure
- Inversion
- Other patterns

**Sentence Template:** [identified pattern]
**Formula:** [abstract formula, e.g., "Although + clause, + main clause"]
**Breakdown:** [show how the text maps to the formula]
**Similar examples:**
1. [example using the same template]
2. [another example]

Text: "{text}"`
,

  rootvocab: `Analyze the word/phrase and break it down to its roots, prefixes, and suffixes. Respond in {targetLang}.

Format your response exactly like this:

**Level:** [estimate CEFR level: A1/A2/B1/B2/C1/C2] – Word: {text}

⸻

**Root Breakdown:** {text} = [prefix-] + [root] + [-suffix] (break it into meaningful morphemes)

**Explanation:**
• [prefix] = [meaning]
• [root] = [meaning]
• [suffix] = [meaning if applicable]
👉 [How the parts combine to form the final meaning]

**Meaning:** [clear definition in {targetLang}]

⸻

**Example:**
• [1 example sentence using the word naturally]

⸻

**✅ Common Collocations + Examples:**
• [collocation 1] → [example sentence]
• [collocation 2] → [example sentence]
• [collocation 3] → [example sentence]

Text: "{text}"`
};

// ---- Default Settings ----
const DEFAULT_SETTINGS = {
  apiKey: '',
  apiProvider: 'openai',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  apiModel: 'gpt-4o-mini',
  targetLang: 'English',
  activationMode: 'immediate_popup',
  prompts: { ...DEFAULT_PROMPTS },
  vocabulary: []
};

// ---- Initialize Extension ----
chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.sync.get(null);
  const settings = { ...DEFAULT_SETTINGS };

  // Preserve existing values if they exist
  if (existing.apiKey) settings.apiKey = existing.apiKey;
  if (existing.apiProvider) settings.apiProvider = existing.apiProvider;
  if (existing.apiEndpoint) settings.apiEndpoint = existing.apiEndpoint;
  if (existing.apiModel) settings.apiModel = existing.apiModel;
  if (existing.targetLang) settings.targetLang = existing.targetLang;
  if (existing.activationMode) settings.activationMode = existing.activationMode;
  if (existing.prompts) settings.prompts = { ...DEFAULT_PROMPTS, ...existing.prompts };
  if (existing.vocabulary) settings.vocabulary = existing.vocabulary;

  // chrome.storage.sync has quotas, so store vocabulary in local
  const vocab = settings.vocabulary;
  delete settings.vocabulary;
  await chrome.storage.sync.set(settings);
  await chrome.storage.local.set({ vocabulary: vocab });
});

// Open settings page when extension icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});

// ---- Message Handler ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FEATURE_REQUEST') {
    handleFeatureRequest(message).then(sendResponse).catch(err => {
      sendResponse({ error: err.message || 'Unknown error occurred' });
    });
    return true; // Keep channel open for async response
  }

  if (message.type === 'SAVE_VOCABULARY') {
    saveVocabulary(message.data).then(sendResponse).catch(err => {
      sendResponse({ error: err.message });
    });
    return true;
  }

  if (message.type === 'OPEN_BROWSER_SIDEBAR') {
    chrome.storage.session.set({ 
      panelSelectedText: message.text,
      panelContext: message.context,
      panelUrl: message.url,
      panelTitle: message.title
    }, () => {
      chrome.sidePanel.open({ windowId: sender.tab.windowId });
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'GET_SETTINGS') {
    getSettings().then(sendResponse);
    return true;
  }

  if (message.type === 'FAST_TRANSLATE') {
    fastTranslate(message.text, message.targetLang).then(sendResponse).catch(err => {
      sendResponse({ error: err.message || 'Translation failed' });
    });
    return true;
  }

  if (message.type === 'OPEN_SETTINGS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return false;
  }
});

// ---- Get Settings ----
async function getSettings() {
  const syncData = await chrome.storage.sync.get(null);
  const localData = await chrome.storage.local.get(['vocabulary']);
  return {
    ...DEFAULT_SETTINGS,
    ...syncData,
    vocabulary: localData.vocabulary || []
  };
}

// ---- Handle Feature Requests ----
async function handleFeatureRequest({ feature, text, targetLang }) {
  if (feature === 'save') {
    return { error: 'Use SAVE_VOCABULARY message type' };
  }

  const settings = await getSettings();
  
  if (!settings.apiKey) {
    return { 
      error: 'API key not configured. Click the ⚙ icon to open settings and add your API key.' 
    };
  }

  const promptTemplate = settings.prompts[feature] || DEFAULT_PROMPTS[feature];
  if (!promptTemplate) {
    return { error: `Unknown feature: ${feature}` };
  }

  const lang = targetLang || settings.targetLang || 'English';
  const prompt = promptTemplate
    .replace(/\{text\}/g, text)
    .replace(/\{targetLang\}/g, lang);

  try {
    const result = await callAI(settings, prompt);
    return { result };
  } catch (err) {
    return { error: err.message || 'AI request failed' };
  }
}

// ---- Call AI API ----
async function callAI(settings, prompt) {
  const { apiKey, apiProvider, apiEndpoint, apiModel } = settings;

  let url, headers, body;

  if (apiProvider === 'gemini') {
    // Google Gemini API
    url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`;
    headers = { 'Content-Type': 'application/json' };
    body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024
      }
    });
  } else {
    // OpenAI-compatible API (OpenAI, DeepSeek, Groq, Together, Ollama, etc.)
    if (apiProvider === 'deepseek') {
      url = 'https://api.deepseek.com/v1/chat/completions';
    } else {
      url = apiEndpoint || 'https://api.openai.com/v1/chat/completions';
    }
    headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };
    body = JSON.stringify({
      model: apiModel,
      messages: [
        { role: 'system', content: `You are a helpful linguistics and writing assistant. Respond clearly and concisely using markdown-like formatting with **bold** and *italic* for emphasis. IMPORTANT: You MUST provide your entire response in the following language: ${settings.targetLang || 'English'}` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1024
    });
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `API Error (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      errMsg = errJson.error?.message || errJson.error?.code || errMsg;
    } catch (e) { /* ignore parse error */ }
    throw new Error(errMsg);
  }

  const data = await response.json();

  if (apiProvider === 'gemini') {
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
  } else {
    return data.choices?.[0]?.message?.content || 'No response received.';
  }
}

// ---- Vocabulary Management ----
async function saveVocabulary(entry) {
  const { vocabulary = [] } = await chrome.storage.local.get(['vocabulary']);
  
  // Check for duplicates
  const exists = vocabulary.some(v => 
    v.word.toLowerCase() === entry.word.toLowerCase()
  );
  
  if (exists) {
    // Update existing entry
    const idx = vocabulary.findIndex(v => 
      v.word.toLowerCase() === entry.word.toLowerCase()
    );
    vocabulary[idx] = {
      ...vocabulary[idx],
      ...entry,
      updatedAt: new Date().toISOString()
    };
  } else {
    vocabulary.push({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      ...entry,
      createdAt: new Date().toISOString()
    });
  }

  await chrome.storage.local.set({ vocabulary });
  return { success: true, count: vocabulary.length, isUpdate: exists };
}
// ---- Fast Translation (Dictionary / Google Translate API) ----
async function fastTranslate(text, targetLang) {
  const langMap = {
    'English': 'en', 'Vietnamese': 'vi', 'Chinese': 'zh-CN', 'Japanese': 'ja', 'Korean': 'ko',
    'French': 'fr', 'German': 'de', 'Spanish': 'es', 'Italian': 'it', 'Portuguese': 'pt',
    'Russian': 'ru', 'Arabic': 'ar', 'Hindi': 'hi', 'Thai': 'th', 'Indonesian': 'id'
  };
  const tl = langMap[targetLang] || 'en';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Translation service unavailable');
  }
  const data = await response.json();
  const translatedText = data[0].map(item => item[0]).join('');
  return { result: translatedText };
}
