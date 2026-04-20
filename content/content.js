/* ============================================================
   LinguaLens — Content Script
   Detects text selection, renders floating popup in Shadow DOM,
   communicates with service worker for AI features
   ============================================================ */

(function () {
  'use strict';

  // Prevent double-injection
  if (window.__linguaLensInitialized) return;
  window.__linguaLensInitialized = true;

  // ---- SVG Icons ----
  const ICONS = {
    translate: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8l6 10"/><path d="M4 14h8"/><path d="M10 2v6"/><path d="M6 6h8"/><path d="M14 2l6 18"/><path d="M16 10h6"/></svg>',
    phrase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>',
    insight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    rewrite: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    grammar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
    summary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
    idea: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
    sentence: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h14"/><circle cx="20" cy="12" r="2"/></svg>',
    rootvocab: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 22l4-4"/><path d="M9 13l-3 3"/><path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-4 6-2-2-4-4-4-6a4 4 0 0 1 4-4z"/><circle cx="12" cy="6" r="1"/><path d="M12 12v4"/><path d="M12 16l4 4"/><path d="M12 16l-4 4"/></svg>',
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  // ---- Feature Definitions ----
  const FEATURES = [
    { id: 'translate', label: 'AI Translate', icon: ICONS.translate },
    { id: 'phrase', label: 'Detect Phrase', icon: ICONS.phrase },
    { id: 'insight', label: 'Insight', icon: ICONS.insight },
    { id: 'rewrite', label: 'Rewrite', icon: ICONS.rewrite },
    { id: 'grammar', label: 'Grammar', icon: ICONS.grammar },
    { id: 'summary', label: 'Summaries', icon: ICONS.summary },
    { id: 'idea', label: 'Idea Template', icon: ICONS.idea },
    { id: 'sentence', label: 'Sentence Tpl', icon: ICONS.sentence },
    { id: 'rootvocab', label: 'Root Vocab', icon: ICONS.rootvocab },
    { id: 'save', label: 'Save Vocab', icon: ICONS.save }
  ];

  const LANGUAGES = [
    'English', 'Vietnamese', 'Chinese', 'Japanese', 'Korean', 'French',
    'German', 'Spanish', 'Italian', 'Portuguese', 'Russian', 'Arabic',
    'Hindi', 'Thai', 'Indonesian', 'Malay', 'Dutch', 'Swedish', 'Polish', 'Turkish'
  ];

  // ---- State ----
  let selectedText = '';
  let popupEl = null;
  let iconEl = null;
  let shadowRoot = null;
  let hostEl = null;
  let isVisible = false;
  let activeFeature = null;
  let currentTargetLang = 'English';
  let currentSettings = null;
  let currentAiResult = '';

  // ---- Cache Settings ----
  function updateSettingsCache() {
    if (!chrome.runtime?.id) return;
    chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response) {
        currentSettings = response;
        currentTargetLang = response.targetLang || 'English';
      }
    });
  }
  updateSettingsCache();
  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(() => {
      if (chrome.runtime?.id) updateSettingsCache();
    });
  }

  // ---- Create Shadow DOM Host ----
  function createHost() {
    hostEl = document.createElement('div');
    hostEl.id = 'lingualens-host';
    hostEl.style.cssText = 'all: initial; position: fixed; z-index: 2147483647; top: 0; left: 0; width: 0; height: 0; pointer-events: none;';
    document.documentElement.appendChild(hostEl);
    shadowRoot = hostEl.attachShadow({ mode: 'closed' });

    // Load styles
    const styleEl = document.createElement('style');
    if (!chrome.runtime?.id) return;
    fetch(chrome.runtime.getURL('content/content.css'))
      .then(r => r.text())
      .then(css => {
        styleEl.textContent = css;
      });
    shadowRoot.appendChild(styleEl);
  }

  // ---- Build Popup HTML ----
  function buildPopup() {
    const popup = document.createElement('div');
    popup.className = 'll-popup';
    popup.style.pointerEvents = 'auto';

    // Language options HTML
    const langOptions = LANGUAGES.map(l => 
      `<option value="${l}" ${l === currentTargetLang ? 'selected' : ''}>${l}</option>`
    ).join('');

    popup.innerHTML = `
      <div class="ll-header">
        <div class="ll-header-left">
          <div class="ll-logo">L</div>
          <span class="ll-title">LinguaLens</span>
        </div>
        <div class="ll-header-actions">
          <select class="ll-lang-select" id="ll-lang-select" title="Target language">
            ${langOptions}
          </select>
          <button class="ll-btn-icon" id="ll-btn-settings" title="Open Settings">
            ${ICONS.settings}
          </button>
          <button class="ll-btn-icon" id="ll-btn-close" title="Close">
            ${ICONS.close}
          </button>
        </div>
      </div>
      <div class="ll-selected-text">
        <div class="ll-selected-label">Selected Text</div>
        <div class="ll-selected-content" id="ll-selected-content"></div>
      </div>
      <div class="ll-fast-translate" id="ll-fast-translate">
        <div class="ll-ft-label">Instant Translation</div>
        <div class="ll-ft-content" id="ll-ft-content">
          <div class="ll-loading" style="padding:0">
            <div class="ll-loading-dots">
              <span class="ll-loading-dot"></span><span class="ll-loading-dot"></span><span class="ll-loading-dot"></span>
            </div>
            <span class="ll-loading-text">Translating...</span>
          </div>
        </div>
      </div>
      <div class="ll-features" id="ll-features">
        ${FEATURES.map(f => `
          <button class="ll-feature-btn" data-feature="${f.id}" title="${f.label}">
            <span class="ll-feature-icon">${f.icon}</span>
            <span class="ll-feature-label">${f.label}</span>
          </button>
        `).join('')}
      </div>
      <div class="ll-result" id="ll-result">
        <div class="ll-result-header">
          <span class="ll-result-title" id="ll-result-title"></span>
          <div class="ll-result-header-actions">
            <button class="ll-result-btn" id="ll-result-save-analysis" title="Save this pattern/phrase to Vocabulary" style="display:none">${ICONS.save} Save</button>
            <button class="ll-result-btn" id="ll-result-copy" title="Copy result">Copy</button>
          </div>
        </div>
        <div class="ll-result-content" id="ll-result-content"></div>
      </div>
    `;

    return popup;
  }

  // ---- Show Popup ----
  function showPopup(rect, targetMode = 'popup') {
    if (!hostEl) createHost();

    // Remove existing popup
    if (popupEl) popupEl.remove();

    popupEl = buildPopup();
    shadowRoot.appendChild(popupEl);

    // Set selected text
    const contentEl = popupEl.querySelector('#ll-selected-content');
    contentEl.textContent = selectedText;

    if (targetMode === 'sidebar') {
      popupEl.classList.add('ll-sidebar');
    } else {
      // Position calculation
      const popupWidth = 380;
      const popupEstHeight = 320;
      const margin = 10;
      
      let x = rect.left + (rect.width / 2) - (popupWidth / 2);
      let y;
      let positionClass = 'll-below';

      // Check if popup fits below
      if (rect.bottom + margin + popupEstHeight < window.innerHeight) {
        y = rect.bottom + margin;
        positionClass = 'll-below';
      } else {
        y = rect.top - margin - popupEstHeight;
        positionClass = 'll-above';
      }

      // Horizontal bounds
      x = Math.max(margin, Math.min(x, window.innerWidth - popupWidth - margin));
      y = Math.max(margin, y);

      popupEl.style.left = x + 'px';
      popupEl.style.top = y + 'px';
      popupEl.classList.add(positionClass);
    }

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        popupEl.classList.add('ll-visible');
      });
    });

    isVisible = true;
    activeFeature = null;

    // Bind events
    bindPopupEvents();

    // Load saved target language
    const langSelect = popupEl.querySelector('#ll-lang-select');
    if (langSelect) langSelect.value = currentTargetLang;

    // Trigger Fast Translate
    triggerFastTranslate();
  }

  // ---- Trigger Fast Translate ----
  function triggerFastTranslate() {
    const ftContainer = popupEl.querySelector('#ll-fast-translate');
    const ftContent = popupEl.querySelector('#ll-ft-content');
    if (!ftContainer || !ftContent) return;

    ftContainer.classList.add('ll-visible');
    
    chrome.runtime.sendMessage({
      type: 'FAST_TRANSLATE',
      text: selectedText,
      targetLang: currentTargetLang
    }, (res) => {
      if (chrome.runtime.lastError || !res || res.error) {
        ftContent.innerHTML = formatResult((res && res.error) || 'Translation unavailable');
      } else {
        ftContent.innerHTML = formatResult(res.result);
      }
    });
  }

  // ---- Hide Popup ----
  function hidePopup() {
    if (!popupEl || !isVisible) return;
    
    popupEl.classList.remove('ll-visible');
    setTimeout(() => {
      if (popupEl) {
        popupEl.remove();
        popupEl = null;
      }
    }, 250);
    
    isVisible = false;
    activeFeature = null;
  }

  // ---- Bind Popup Events ----
  function bindPopupEvents() {
    if (!popupEl) return;

    // Close button
    popupEl.querySelector('#ll-btn-close').addEventListener('click', (e) => {
      e.stopPropagation();
      hidePopup();
    });

    // Settings button
    popupEl.querySelector('#ll-btn-settings').addEventListener('click', (e) => {
      e.stopPropagation();
      chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
    });

    // Language selector
    popupEl.querySelector('#ll-lang-select').addEventListener('change', (e) => {
      e.stopPropagation();
      currentTargetLang = e.target.value;
      // Save preference
      chrome.storage.sync.set({ targetLang: currentTargetLang });
    });

    // Feature buttons
    const featureBtns = popupEl.querySelectorAll('.ll-feature-btn');
    featureBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const feature = btn.dataset.feature;
        handleFeatureClick(feature, btn, featureBtns);
      });
    });

    // Copy button
    popupEl.querySelector('#ll-result-copy').addEventListener('click', (e) => {
      e.stopPropagation();
      const content = popupEl.querySelector('#ll-result-content').textContent;
      navigator.clipboard.writeText(content).then(() => {
        const copyBtn = popupEl.querySelector('#ll-result-copy');
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    });

    // Save Analysis button
    popupEl.querySelector('#ll-result-save-analysis').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = popupEl.querySelector('#ll-result-save-analysis');
      
      btn.innerHTML = ICONS.check + ' Saving...';
      
      if (!chrome.runtime?.id) {
        btn.innerHTML = ICONS.warning + ' Reload Page';
        return;
      }

      chrome.runtime.sendMessage({
        type: 'SAVE_VOCABULARY',
        data: {
          word: selectedText + ' (' + activeFeature + ')',
          context: currentAiResult,
          url: window.location.href,
          title: document.title
        }
      }, (res) => {
        if (chrome.runtime.lastError || (res && res.error)) {
          btn.innerHTML = ICONS.warning + ' Error';
          setTimeout(() => { btn.innerHTML = ICONS.save + ' Save'; }, 2000);
        } else {
          btn.innerHTML = ICONS.check + ' Saved!';
          setTimeout(() => { btn.innerHTML = ICONS.save + ' Save'; }, 3000);
        }
      });
    });

    // Delegate inline save buttons
    popupEl.addEventListener('click', (e) => {
      const inlineBtn = e.target.closest('.ll-inline-save-btn');
      if (inlineBtn) {
        e.stopPropagation();
        const originalText = inlineBtn.innerHTML;
        inlineBtn.innerHTML = ICONS.check + ' Saving...';
        
        let specificContext = currentAiResult;
        const blockSplit = currentAiResult.split(/(?=^(?:\*\*?)?\d+\.(?:\*\*?)?\s)/m);
        const word = inlineBtn.dataset.word;
        const targetBlock = blockSplit.find(b => b.includes(word));
        if (targetBlock) specificContext = targetBlock.trim();

        if (!chrome.runtime?.id) {
          inlineBtn.innerHTML = ICONS.warning + ' Reload';
          return;
        }

        chrome.runtime.sendMessage({
          type: 'SAVE_VOCABULARY',
          data: {
            word: word,
            context: specificContext,
            url: window.location.href,
            title: document.title
          }
        }, (res) => {
          if (chrome.runtime.lastError || (res && res.error)) {
             inlineBtn.innerHTML = ICONS.warning + ' Error';
          } else {
             inlineBtn.innerHTML = ICONS.check + ' Saved!';
             setTimeout(() => { inlineBtn.innerHTML = originalText; }, 2000);
          }
        });
      }
    });

    // Prevent clicks inside popup from propagating
    popupEl.addEventListener('mousedown', (e) => e.stopPropagation());
    popupEl.addEventListener('mouseup', (e) => e.stopPropagation());
    popupEl.addEventListener('click', (e) => e.stopPropagation());
  }

  // ---- Handle Feature Click ----
  async function handleFeatureClick(feature, btn, allBtns) {
    // Update active state
    allBtns.forEach(b => b.classList.remove('ll-active'));
    btn.classList.add('ll-active');
    activeFeature = feature;

    const resultPanel = popupEl.querySelector('#ll-result');
    const resultTitle = popupEl.querySelector('#ll-result-title');
    const resultContent = popupEl.querySelector('#ll-result-content');
    const resultCopy = popupEl.querySelector('#ll-result-copy');

    // Show result panel
    resultPanel.classList.add('ll-result-visible');

    // Handle Save to Vocabulary
    if (feature === 'save') {
      resultTitle.textContent = 'Save to Vocabulary';
      resultCopy.closest('.ll-result-header-actions').style.display = 'none';
      resultContent.innerHTML = `
        <div class="ll-loading">
          <div class="ll-loading-dots">
            <span class="ll-loading-dot"></span>
            <span class="ll-loading-dot"></span>
            <span class="ll-loading-dot"></span>
          </div>
          <span class="ll-loading-text">Saving...</span>
        </div>
      `;

      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'SAVE_VOCABULARY',
            data: {
              word: selectedText,
              context: getContextSentence(),
              url: window.location.href,
              title: document.title
            }
          }, (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(res);
            }
          });
        });

        if (response.error) {
          showError(resultContent, response.error);
        } else {
          resultContent.innerHTML = `
            <div class="ll-save-confirm">
              ${ICONS.check}
              <span>Saved "${selectedText}" to your vocabulary! (${response.count} words total${response.isUpdate ? ', updated' : ''})</span>
            </div>
          `;
        }
      } catch (err) {
        showError(resultContent, err.message);
      }
      return;
    }

    // AI Feature Request
    const featureLabel = FEATURES.find(f => f.id === feature)?.label || feature;
    resultTitle.textContent = featureLabel;
    
    // Show copy button
    resultCopy.closest('.ll-result-header-actions').style.display = 'flex';
    
    // Show save analysis button for specific features
    const saveAnalysisBtn = popupEl.querySelector('#ll-result-save-analysis');
    saveAnalysisBtn.style.display = 'none'; // Replaced by inline buttons

    // Show loading
    resultContent.innerHTML = `
      <div class="ll-loading">
        <div class="ll-loading-dots">
          <span class="ll-loading-dot"></span>
          <span class="ll-loading-dot"></span>
          <span class="ll-loading-dot"></span>
        </div>
        <span class="ll-loading-text">Analyzing with AI...</span>
      </div>
    `;
    currentTargetLang = currentSettings?.targetLang || 'English';
    
    if (!chrome.runtime?.id) {
      showError(resultContent, 'Extension context invalidated. Please refresh the page.');
      return;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'FEATURE_REQUEST',
          feature,
          text: selectedText,
          targetLang: currentTargetLang
        }, (res) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(res);
        });
      });

      // Check if the feature is still the active one
      if (activeFeature !== feature) return;

      if (response.error) {
        showError(resultContent, response.error);
      } else {
        currentAiResult = response.result;
        resultContent.innerHTML = formatResult(response.result, feature);
      }
    } catch (err) {
      if (activeFeature !== feature) return;
      showError(resultContent, err.message);
    }
  }

  function escapeHtml(unsafe) {
    return (unsafe || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // ---- Format AI Result ----
  function formatResult(text, feature) {
    if (!text) return '<em>No result</em>';
    
    let html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^• /gm, '‣ ')
      .replace(/^- /gm, '‣ ');

    if (['phrase', 'idea', 'sentence'].includes(feature)) {
      html = html.replace(/^(?:<strong>)?(\d+\.)\s*(?:<strong>)?(.+?)(?:<\/strong>)?$/gm, (match, number, phrase) => {
        const cleanPhrase = phrase.replace(/<[^>]+>/g, '').trim();
        return `<strong>${number} ${phrase}</strong><button class="ll-inline-save-btn" data-word="${escapeHtml(cleanPhrase)}" title="Save exactly this item to Vocabulary">${ICONS.save} Save</button>`;
      });
    }

    return html.replace(/\n/g, '<br>');
  }

  // ---- Show Error ----
  function showError(container, message) {
    const isApiKeyError = message.toLowerCase().includes('api key');
    container.innerHTML = `
      <div class="ll-error">
        ${ICONS.warning}
        <span>${message}${isApiKeyError ? ' <a id="ll-err-settings">Open Settings</a>' : ''}</span>
      </div>
    `;

    if (isApiKeyError) {
      const link = container.querySelector('#ll-err-settings');
      if (link) {
        link.addEventListener('click', (e) => {
          e.stopPropagation();
          if (!chrome.runtime?.id) return;
          chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
        });
      }
    }
  }

  // ---- Get Context Sentence ----
  function getContextSentence() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return '';
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentEl = container.nodeType === 3 ? container.parentElement : container;
    
    if (!parentEl) return '';
    
    // Get the paragraph or block element text
    const block = parentEl.closest('p, div, li, td, h1, h2, h3, h4, h5, h6, span, a, blockquote');
    const contextText = (block || parentEl).textContent || '';
    
    // Limit to reasonable length
    return contextText.substring(0, 500);
  }

  // ---- Trigger Icon Logic ----
  function showTriggerIcon(rect, targetMode) {
    if (!hostEl) createHost();
    hideTriggerIcon();

    iconEl = document.createElement('div');
    iconEl.className = 'll-trigger-icon';
    iconEl.innerHTML = 'L';
    
    // Position near the end of selection
    const margin = window.innerHeight > rect.bottom + 40 ? 10 : -40;
    iconEl.style.left = Math.min(window.innerWidth - 40, rect.right + 5) + 'px';
    iconEl.style.top = (rect.bottom + margin) + 'px';

    iconEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      hideTriggerIcon();
      if (targetMode === 'browser_sidebar') {
        if (!chrome.runtime?.id) {
          alert('LinguaLens has updated. Please refresh the page to continue using the sidebar.');
          return;
        }
        chrome.runtime.sendMessage({ 
          type: 'OPEN_BROWSER_SIDEBAR', 
          text: selectedText,
          context: getContextSentence(),
          url: window.location.href,
          title: document.title
        });
      } else {
        showPopup(rect, targetMode);
      }
    });

    shadowRoot.appendChild(iconEl);
    
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (iconEl) iconEl.classList.add('ll-visible');
    }));
  }

  function hideTriggerIcon() {
    if (iconEl) {
      iconEl.classList.remove('ll-visible');
      const el = iconEl;
      iconEl = null;
      setTimeout(() => el.remove(), 200);
    }
  }

  // ---- Context Invalidation Guard ----
  // When the extension reloads, the old content script keeps running.
  // We detect this and cleanly remove all listeners to prevent errors.
  let contextAlive = true;

  function isContextValid() {
    try {
      return !!(chrome.runtime?.id);
    } catch (e) {
      return false;
    }
  }

  function selfDestruct() {
    contextAlive = false;
    clearTimeout(selectionTimeout);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('scroll', onScroll);
    if (hostEl) hostEl.remove();
    hostEl = null;
  }

  // ---- Selection Detection ----
  let selectionTimeout = null;

  function onMouseUp(e) {
    if (!contextAlive || !isContextValid()) { selfDestruct(); return; }
    if (hostEl && hostEl.contains(e.target)) return;
    
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      if (!contextAlive || !isContextValid()) { selfDestruct(); return; }

      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (text && text.length > 0 && text.length < 5000) {
        selectedText = text;
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        if (rect.width > 0 || rect.height > 0) {
          const mode = currentSettings?.activationMode || 'immediate_popup';
          
          if (mode === 'icon_popup') {
            showTriggerIcon(rect, 'popup');
          } else if (mode === 'icon_sidebar') {
            showTriggerIcon(rect, 'sidebar');
          } else if (mode === 'icon_browser_sidebar') {
            showTriggerIcon(rect, 'browser_sidebar');
          } else if (mode === 'sidebar') {
            showPopup(rect, 'sidebar');
          } else {
            showPopup(rect, 'popup');
          }
        }
      } else {
        hideTriggerIcon();
      }
    }, 150);
  }

  // ---- Click Outside to Close ----
  function onMouseDown(e) {
    if (!contextAlive || !isContextValid()) { selfDestruct(); return; }
    if (!isVisible) return;
    if (hostEl && hostEl.contains(e.target)) return;
    const path = e.composedPath();
    if (path.some(el => el === hostEl)) return;
    hidePopup();
  }

  // ---- Escape to Close ----
  function onKeyDown(e) {
    if (!contextAlive || !isContextValid()) { selfDestruct(); return; }
    if (e.key === 'Escape') {
      if (isVisible) hidePopup();
      hideTriggerIcon();
    }
  }

  // ---- Scroll to Reposition (or hide) ----
  let scrollTimeout = null;
  function onScroll() {
    if (!contextAlive || !isContextValid()) { selfDestruct(); return; }
    hideTriggerIcon();
    if (!isVisible) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => hidePopup(), 100);
  }

  document.addEventListener('mouseup', onMouseUp);
  document.addEventListener('mousedown', onMouseDown);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('scroll', onScroll, { passive: true });

  // Poll periodically to detect invalidation proactively
  const contextCheckInterval = setInterval(() => {
    if (!isContextValid()) {
      clearInterval(contextCheckInterval);
      selfDestruct();
    }
  }, 2000);

})();
