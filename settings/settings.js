/* ============================================================
   LinguaLens — Settings Page Logic
   Load/save settings, manage prompts, vocabulary CRUD, export
   ============================================================ */

(function () {
  'use strict';

  // ---- Prompt Metadata ----
  const PROMPT_META = [
    { id: 'translate', name: 'AI Translate', emoji: '🌐' },
    { id: 'phrase', name: 'Detect Phrase', emoji: '🔍' },
    { id: 'insight', name: 'Insight', emoji: '💡' },
    { id: 'rewrite', name: 'Rewrite', emoji: '✏️' },
    { id: 'grammar', name: 'Grammar', emoji: '📝' },
    { id: 'summary', name: 'Summaries', emoji: '📋' },
    { id: 'idea', name: 'Detect Idea Template', emoji: '💭' },
    { id: 'sentence', name: 'Detect Sentence Template', emoji: '🔤' }
  ];

  // ---- Default prompts (mirrored from service worker) ----
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
  };

  // ---- Provider Model Lists ----
  const PROVIDER_MODELS = {
    openai: [
      { value: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast & affordable' },
      { value: 'gpt-4o', label: 'GPT-4o', desc: 'Most capable' },
      { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', desc: 'Latest mini model' },
      { value: 'gpt-4.1', label: 'GPT-4.1', desc: 'Latest flagship' },
      { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano', desc: 'Ultra fast' },
      { value: 'o4-mini', label: 'o4-mini', desc: 'Reasoning model' }
    ],
    deepseek: [
      { value: 'deepseek-chat', label: 'DeepSeek Chat (V3)', desc: 'General purpose' },
      { value: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)', desc: 'Advanced reasoning' }
    ],
    gemini: [
      { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', desc: 'Fast & versatile' },
      { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview', desc: 'Latest preview' },
      { value: 'gemini-2.5-pro-preview-03-25', label: 'Gemini 2.5 Pro Preview', desc: 'Most capable' },
      { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', desc: 'Lightweight' },
      { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', desc: 'Stable' },
      { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', desc: 'Previous gen pro' }
    ],
    custom: []
  };

  const PROVIDER_ENDPOINTS = {
    openai: 'https://api.openai.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    gemini: '',
    custom: ''
  };

  // ---- State ----
  let currentSettings = {};
  let vocabulary = [];

  // ---- DOM References ----
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ---- Chrome API check ----
  const hasChromeStorage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync;

  // ---- Initialize ----
  async function init() {
    await loadSettings();
    bindNavigation();
    bindAPISection();
    renderPromptTemplates();
    await loadVocabulary();
    renderVocabulary();
    bindVocabularyActions();
  }

  // ---- Load Settings ----
  async function loadSettings() {
    let syncData = {};
    let localData = {};

    if (hasChromeStorage) {
      syncData = await chrome.storage.sync.get(null);
      localData = await chrome.storage.local.get(['vocabulary']);
    }

    currentSettings = {
      apiKey: syncData.apiKey || '',
      apiProvider: syncData.apiProvider || 'openai',
      apiEndpoint: syncData.apiEndpoint || 'https://api.openai.com/v1/chat/completions',
      apiModel: syncData.apiModel || 'gpt-4o-mini',
      targetLang: syncData.targetLang || 'English',
      activationMode: syncData.activationMode || 'immediate_popup',
      prompts: { ...DEFAULT_PROMPTS, ...(syncData.prompts || {}) }
    };

    vocabulary = localData.vocabulary || [];

    // Populate form
    $('#api-provider').value = currentSettings.apiProvider;
    $('#api-endpoint').value = currentSettings.apiEndpoint;
    $('#api-key').value = currentSettings.apiKey;
    $('#target-lang').value = currentSettings.targetLang;
    $('#activation-mode').value = currentSettings.activationMode || 'immediate_popup';

    // Populate model dropdown for current provider, then set value
    populateModelDropdown(currentSettings.apiProvider, currentSettings.apiModel);

    updateEndpointVisibility();
    updateAPIBadge();
  }

  // ---- Navigation ----
  function bindNavigation() {
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;

        // Update nav active state
        $$('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Show section
        $$('.section').forEach(s => s.classList.remove('active'));
        $(`#section-${section}`).classList.add('active');
      });
    });
  }

  // ---- API Section ----
  function bindAPISection() {
    // Provider change
    $('#api-provider').addEventListener('change', (e) => {
      currentSettings.apiProvider = e.target.value;
      updateEndpointVisibility();
      updateDefaultEndpoint();
    });

    // Toggle API key visibility
    $('#api-key-toggle').addEventListener('click', () => {
      const input = $('#api-key');
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Save button
    $('#btn-save-api').addEventListener('click', saveAPISettings);

    // Test button
    $('#btn-test-api').addEventListener('click', testAPIConnection);
  }

  function updateEndpointVisibility() {
    const provider = currentSettings.apiProvider;
    const endpointGroup = $('#api-endpoint-group');

    if (provider === 'gemini' || provider === 'deepseek') {
      endpointGroup.style.display = 'none';
    } else {
      endpointGroup.style.display = 'block';
    }
  }

  function updateDefaultEndpoint() {
    const provider = $('#api-provider').value;
    const endpointInput = $('#api-endpoint');

    // Set endpoint
    const endpoint = PROVIDER_ENDPOINTS[provider];
    if (endpoint !== undefined) {
      endpointInput.value = endpoint;
    }
    if (provider === 'custom') {
      endpointInput.placeholder = 'https://your-api-endpoint.com/v1/chat/completions';
    }

    // Populate model dropdown for the new provider
    populateModelDropdown(provider);
  }

  function populateModelDropdown(provider, selectedValue) {
    const modelSelect = $('#api-model');
    const hintEl = $('#model-hint');
    const models = PROVIDER_MODELS[provider] || [];

    modelSelect.innerHTML = '';

    if (provider === 'custom') {
      // For custom provider, add a text-editable option
      const opt = document.createElement('option');
      opt.value = selectedValue || '';
      opt.textContent = selectedValue || 'Enter model name...';
      modelSelect.appendChild(opt);
      hintEl.textContent = 'For custom providers, type the model name directly in the dropdown or edit the saved value';
      // Replace select with an input for custom
      modelSelect.style.display = 'none';
      let customInput = $('#api-model-custom');
      if (!customInput) {
        customInput = document.createElement('input');
        customInput.className = 'form-input';
        customInput.type = 'text';
        customInput.id = 'api-model-custom';
        customInput.placeholder = 'e.g., llama-3.1-8b, mixtral-8x7b';
        modelSelect.parentNode.insertBefore(customInput, modelSelect.nextSibling);
      }
      customInput.style.display = '';
      customInput.value = selectedValue || '';
      return;
    }

    // Hide custom input if it exists
    const customInput = $('#api-model-custom');
    if (customInput) customInput.style.display = 'none';
    modelSelect.style.display = '';

    models.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.value;
      opt.textContent = `${m.label}  —  ${m.desc}`;
      modelSelect.appendChild(opt);
    });

    // Set selected value
    if (selectedValue && models.some(m => m.value === selectedValue)) {
      modelSelect.value = selectedValue;
    } else if (models.length > 0) {
      modelSelect.value = models[0].value;
    }

    hintEl.textContent = `${models.length} models available for this provider`;
  }

  function updateAPIBadge() {
    const badge = $('#api-status-badge');
    if (currentSettings.apiKey) {
      badge.textContent = 'Configured';
      badge.classList.add('connected');
    } else {
      badge.textContent = 'Not Connected';
      badge.classList.remove('connected');
    }
  }

  async function saveAPISettings() {
    const msgEl = $('#api-message');

    currentSettings.apiProvider = $('#api-provider').value;
    currentSettings.apiEndpoint = $('#api-endpoint').value;
    currentSettings.apiKey = $('#api-key').value;
    currentSettings.targetLang = $('#target-lang').value;
    currentSettings.activationMode = $('#activation-mode').value;

    // Read model from custom input if visible, otherwise from select
    const customModelInput = $('#api-model-custom');
    if (customModelInput && customModelInput.style.display !== 'none') {
      currentSettings.apiModel = customModelInput.value;
    } else {
      currentSettings.apiModel = $('#api-model').value;
    }

    // Auto-resolve endpoint for known providers
    if (currentSettings.apiProvider !== 'custom') {
      currentSettings.apiEndpoint = PROVIDER_ENDPOINTS[currentSettings.apiProvider] || currentSettings.apiEndpoint;
    }

    try {
      if (hasChromeStorage) {
        await chrome.storage.sync.set({
          apiProvider: currentSettings.apiProvider,
          apiEndpoint: currentSettings.apiEndpoint,
          apiKey: currentSettings.apiKey,
          apiModel: currentSettings.apiModel,
          targetLang: currentSettings.targetLang,
          activationMode: currentSettings.activationMode
        });
      }

      updateAPIBadge();
      showMessage(msgEl, 'success', '✓ Settings saved successfully!');
    } catch (err) {
      showMessage(msgEl, 'error', `Failed to save: ${err.message}`);
    }
  }

  async function testAPIConnection() {
    const msgEl = $('#api-message');
    const btn = $('#btn-test-api');
    const originalText = btn.innerHTML;

    // Update button state
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> Testing...`;
    btn.disabled = true;

    // Save first
    await saveAPISettings();

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'FEATURE_REQUEST',
          feature: 'translate',
          text: 'Hello',
          targetLang: 'Vietnamese'
        }, (res) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(res);
          }
        });
      });

      if (response.error) {
        showMessage(msgEl, 'error', `Connection failed: ${response.error}`);
      } else {
        showMessage(msgEl, 'success', `✓ Connection successful! Test result: "${response.result}"`);
        const badge = $('#api-status-badge');
        badge.textContent = 'Connected';
        badge.classList.add('connected');
      }
    } catch (err) {
      showMessage(msgEl, 'error', `Connection failed: ${err.message}`);
    }

    btn.innerHTML = originalText;
    btn.disabled = false;
  }

  // ---- Prompt Templates ----
  function renderPromptTemplates() {
    const container = $('#prompts-container');
    container.innerHTML = '';

    PROMPT_META.forEach(meta => {
      const promptValue = currentSettings.prompts[meta.id] || DEFAULT_PROMPTS[meta.id] || '';
      const card = document.createElement('div');
      card.className = 'prompt-card';
      card.innerHTML = `
        <div class="prompt-card-header" data-prompt-id="${meta.id}">
          <div class="prompt-card-header-left">
            <span class="prompt-card-emoji">${meta.emoji}</span>
            <span class="prompt-card-name">${meta.name}</span>
          </div>
          <span class="prompt-card-toggle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </div>
        <div class="prompt-card-body">
          <div class="prompt-card-content">
            <textarea class="form-textarea" id="prompt-${meta.id}" rows="6">${escapeHtml(promptValue)}</textarea>
            <div class="prompt-card-actions">
              <button class="btn btn-secondary btn-sm" data-reset="${meta.id}">
                Reset to Default
              </button>
              <button class="btn btn-primary btn-sm" data-save-prompt="${meta.id}">
                Save Prompt
              </button>
            </div>
          </div>
        </div>
      `;

      container.appendChild(card);
    });

    // Bind toggle
    $$('.prompt-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.prompt-card');
        card.classList.toggle('expanded');
      });
    });

    // Bind reset
    $$('[data-reset]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.dataset.reset;
        const textarea = $(`#prompt-${id}`);
        textarea.value = DEFAULT_PROMPTS[id] || '';
        showToast('Prompt reset to default');
      });
    });

    // Bind save prompt
    $$('[data-save-prompt]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.dataset.savePrompt;
        const textarea = $(`#prompt-${id}`);
        currentSettings.prompts[id] = textarea.value;

        try {
          if (hasChromeStorage) {
            await chrome.storage.sync.set({ prompts: currentSettings.prompts });
          }
          showToast('✓ Prompt saved successfully!', 'success');
        } catch (err) {
          showToast(`Failed to save: ${err.message}`, 'error');
        }
      });
    });
  }

  // ---- Vocabulary ----
  async function loadVocabulary() {
    if (!hasChromeStorage) return;
    const data = await chrome.storage.local.get(['vocabulary']);
    vocabulary = data.vocabulary || [];
  }

  function renderVocabulary(filter = '') {
    const list = $('#vocab-list');
    const empty = $('#vocab-empty');
    const countEl = $('#vocab-count');

    let items = [...vocabulary].reverse(); // Newest first

    if (filter) {
      const query = filter.toLowerCase();
      items = items.filter(v =>
        v.word.toLowerCase().includes(query) ||
        (v.context && v.context.toLowerCase().includes(query))
      );
    }

    countEl.textContent = vocabulary.length;

    if (items.length === 0) {
      list.innerHTML = '';
      empty.classList.add('visible');
      return;
    }

    empty.classList.remove('visible');

    list.innerHTML = items.map(item => `
      <div class="vocab-item" data-vocab-id="${item.id}">
        <div class="vocab-item-content">
          <div class="vocab-word">${escapeHtml(item.word)}</div>
          ${item.context ? `<div class="vocab-context">${escapeHtml(item.context)}</div>` : ''}
          <div class="vocab-meta">
            ${item.title ? `<span class="vocab-meta-item">
              <a href="${escapeHtml(item.url || '#')}" target="_blank" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</a>
            </span>` : ''}
            <span class="vocab-meta-item">${formatDate(item.createdAt)}</span>
          </div>
        </div>
        <div class="vocab-item-actions">
          <button class="vocab-delete-btn" data-delete-vocab="${item.id}" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    `).join('');

    // Bind delete buttons
    $$('[data-delete-vocab]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.dataset.deleteVocab;
        vocabulary = vocabulary.filter(v => v.id !== id);
        await chrome.storage.local.set({ vocabulary });
        renderVocabulary($('#vocab-search').value);
        showToast('Word deleted from vocabulary');
      });
    });

    // Bind item click to open sidebar
    $$('.vocab-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        // Ignore clicks on delete button or links
        if (e.target.closest('.vocab-delete-btn') || e.target.closest('a')) return;
        
        const id = itemEl.dataset.vocabId;
        const item = vocabulary.find(v => v.id === id);
        if (!item) return;

        $('#vs-word').textContent = item.word;
        
        let metaHtml = '';
        if (item.url) metaHtml += `<div class="vs-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> <a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.title || item.url)}</a></div>`;
        metaHtml += `<div class="vs-meta-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${formatDate(item.createdAt)}</div>`;
        
        $('#vs-meta').innerHTML = metaHtml;
        
        let rawContext = (item.context || '').trim();
        const firstLineBreak = rawContext.indexOf('\n');
        
        if (firstLineBreak !== -1) {
          const firstLine = rawContext.substring(0, firstLineBreak).trim();
          const cleanWord = item.word.replace(/\s*\([^)]*\)$/, '').toLowerCase();
          
          // Remove first line if it's a numbered header or just repeats the word
          if (/^(?:\*\*?)?\d+\..*?$/.test(firstLine) || firstLine.toLowerCase().includes(cleanWord)) {
            rawContext = rawContext.substring(firstLineBreak).trim();
          }
        }

        // Simple markdown formatter
        let formattedContext = escapeHtml(rawContext)
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/^• /gm, '‣ ')
          .replace(/^- /gm, '‣ ')
          .replace(/\n/g, '<br>');
          
        $('#vs-context').innerHTML = formattedContext;
        
        $('#vocab-details-sidebar').classList.add('visible');
      });
    });

    // Bind sidebar close
    const vsClose = $('#vs-close');
    if (vsClose) {
      vsClose.addEventListener('click', () => {
        $('#vocab-details-sidebar').classList.remove('visible');
      });
    }
  }

  function bindVocabularyActions() {
    // Search
    $('#vocab-search').addEventListener('input', (e) => {
      renderVocabulary(e.target.value);
    });

    // Export JSON
    $('#btn-export-vocab').addEventListener('click', () => {
      if (vocabulary.length === 0) {
        showToast('No vocabulary to export', 'error');
        return;
      }
      const blob = new Blob([JSON.stringify(vocabulary, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `lingualens-vocabulary-${formatDateFile()}.json`);
      showToast(`Exported ${vocabulary.length} words as JSON`, 'success');
    });

    // Export CSV
    $('#btn-export-csv').addEventListener('click', () => {
      if (vocabulary.length === 0) {
        showToast('No vocabulary to export', 'error');
        return;
      }
      const headers = 'Word,Context,URL,Page Title,Date\n';
      const rows = vocabulary.map(v =>
        `"${csvEscape(v.word)}","${csvEscape(v.context || '')}","${csvEscape(v.url || '')}","${csvEscape(v.title || '')}","${v.createdAt || ''}"`
      ).join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      downloadBlob(blob, `lingualens-vocabulary-${formatDateFile()}.csv`);
      showToast(`Exported ${vocabulary.length} words as CSV`, 'success');
    });

    // Clear all
    $('#btn-clear-vocab').addEventListener('click', async () => {
      if (vocabulary.length === 0) {
        showToast('Vocabulary is already empty', 'error');
        return;
      }
      if (confirm(`Are you sure you want to delete all ${vocabulary.length} vocabulary items? This cannot be undone.`)) {
        vocabulary = [];
        await chrome.storage.local.set({ vocabulary: [] });
        renderVocabulary();
        showToast('All vocabulary cleared');
      }
    });
  }

  // ---- Utilities ----
  function showMessage(el, type, msg) {
    el.className = `form-message ${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
    }, 6000);
  }

  let toastTimeout = null;
  function showToast(msg, type = 'success') {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.className = `toast ${type}`;

    clearTimeout(toastTimeout);
    requestAnimationFrame(() => {
      toast.classList.add('visible');
    });

    toastTimeout = setTimeout(() => {
      toast.classList.remove('visible');
    }, 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function csvEscape(str) {
    if (!str) return '';
    return str.replace(/"/g, '""').replace(/\n/g, ' ');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  function formatDateFile() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ---- Boot ----
  document.addEventListener('DOMContentLoaded', init);

})();
