// LinguaLens - Side Panel Script
(function () {
  'use strict';

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
    save: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };

  const FEATURES = [
    { id: 'translate', label: 'AI Translate', icon: ICONS.translate },
    { id: 'phrase', label: 'Detect Phrase', icon: ICONS.phrase },
    { id: 'insight', label: 'Insight', icon: ICONS.insight },
    { id: 'rewrite', label: 'Rewrite', icon: ICONS.rewrite },
    { id: 'grammar', label: 'Grammar', icon: ICONS.grammar },
    { id: 'summary', label: 'Summaries', icon: ICONS.summary },
    { id: 'idea', label: 'Idea Template', icon: ICONS.idea },
    { id: 'sentence', label: 'Sentence Tpl', icon: ICONS.sentence },
    { id: 'save', label: 'Save Vocab', icon: ICONS.save }
  ];

  const LANGUAGES = [
    'English', 'Vietnamese', 'Chinese', 'Japanese', 'Korean', 'French',
    'German', 'Spanish', 'Italian', 'Portuguese', 'Russian', 'Arabic',
    'Hindi', 'Thai', 'Indonesian', 'Malay', 'Dutch', 'Swedish', 'Polish', 'Turkish'
  ];

  let currentTargetLang = 'English';
  let activeFeature = null;
  let panelData = { text: '', context: '', url: '', title: '' };

  function buildPopup() {
    const root = document.getElementById('root');
    const langOptions = LANGUAGES.map(l => 
      `<option value="${l}" ${l === currentTargetLang ? 'selected' : ''}>${l}</option>`
    ).join('');

    root.innerHTML = `
      <div class="ll-popup">
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
          </div>
        </div>
        <div class="ll-selected-text">
          <div class="ll-selected-label">Selected Text</div>
          <div class="ll-selected-content" id="ll-selected-content">${panelData.text}</div>
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
            <button class="ll-result-copy" id="ll-result-copy" title="Copy result">Copy</button>
          </div>
          <div class="ll-result-content" id="ll-result-content"></div>
        </div>
      </div>
    `;

    bindPopupEvents(root);
    triggerFastTranslate(root);
  }

  function bindPopupEvents(root) {
    // Settings button
    root.querySelector('#ll-btn-settings').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
    });

    // Language selector
    root.querySelector('#ll-lang-select').addEventListener('change', (e) => {
      currentTargetLang = e.target.value;
      chrome.storage.sync.set({ targetLang: currentTargetLang });
    });

    // Feature buttons
    const featureBtns = root.querySelectorAll('.ll-feature-btn');
    featureBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const feature = btn.dataset.feature;
        handleFeatureClick(feature, btn, featureBtns, root);
      });
    });

    // Copy button
    root.querySelector('#ll-result-copy').addEventListener('click', () => {
      const content = root.querySelector('#ll-result-content').textContent;
      navigator.clipboard.writeText(content).then(() => {
        const copyBtn = root.querySelector('#ll-result-copy');
        copyBtn.textContent = '✓ Copied';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      });
    });
  }

  function triggerFastTranslate(root) {
    const ftContainer = root.querySelector('#ll-fast-translate');
    const ftContent = root.querySelector('#ll-ft-content');
    if (!ftContainer || !ftContent || !panelData.text) return;

    ftContainer.classList.add('ll-visible');
    
    chrome.runtime.sendMessage({
      type: 'FAST_TRANSLATE',
      text: panelData.text,
      targetLang: currentTargetLang
    }, (res) => {
      if (chrome.runtime.lastError || !res || res.error) {
        ftContent.innerHTML = formatResult((res && res.error) || 'Translation unavailable');
      } else {
        ftContent.innerHTML = formatResult(res.result);
      }
    });
  }

  async function handleFeatureClick(feature, btn, allBtns, root) {
    allBtns.forEach(b => b.classList.remove('ll-active'));
    btn.classList.add('ll-active');
    activeFeature = feature;

    const resultPanel = root.querySelector('#ll-result');
    const resultTitle = root.querySelector('#ll-result-title');
    const resultContent = root.querySelector('#ll-result-content');
    const resultCopy = root.querySelector('#ll-result-copy');

    resultPanel.classList.add('ll-result-visible');

    if (feature === 'save') {
      resultTitle.textContent = 'Save to Vocabulary';
      resultCopy.style.display = 'none';
      resultContent.innerHTML = '<div class="ll-loading"><div class="ll-loading-dots"><span class="ll-loading-dot"></span><span class="ll-loading-dot"></span><span class="ll-loading-dot"></span></div><span class="ll-loading-text">Saving...</span></div>';

      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({
            type: 'SAVE_VOCABULARY',
            data: {
              word: panelData.text,
              context: panelData.context,
              url: panelData.url,
              title: panelData.title
            }
          }, (res) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(res);
          });
        });

        if (response.error) {
          showError(resultContent, response.error);
        } else {
          resultContent.innerHTML = '<div class="ll-save-confirm">' + ICONS.check + '<span>Saved "' + panelData.text + '" to your vocabulary! (' + response.count + ' words total' + (response.isUpdate ? ', updated' : '') + ')</span></div>';
        }
      } catch (err) {
        showError(resultContent, err.message);
      }
      return;
    }

    const featureLabel = FEATURES.find(f => f.id === feature)?.label || feature;
    resultTitle.textContent = featureLabel;
    resultCopy.style.display = '';

    resultContent.innerHTML = '<div class="ll-loading"><div class="ll-loading-dots"><span class="ll-loading-dot"></span><span class="ll-loading-dot"></span><span class="ll-loading-dot"></span></div><span class="ll-loading-text">Analyzing with AI...</span></div>';

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          type: 'FEATURE_REQUEST',
          feature,
          text: panelData.text,
          targetLang: currentTargetLang
        }, (res) => {
          if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
          else resolve(res);
        });
      });

      if (activeFeature !== feature) return;

      if (response.error) {
        showError(resultContent, response.error);
      } else {
        resultContent.innerHTML = formatResult(response.result);
      }
    } catch (err) {
      if (activeFeature !== feature) return;
      showError(resultContent, err.message);
    }
  }

  function formatResult(text) {
    if (!text) return '<em>No result</em>';
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^• /gm, '‣ ')
      .replace(/^- /gm, '‣ ')
      .replace(/\n/g, '<br>');
  }

  function showError(container, message) {
    const isApiKeyError = message.toLowerCase().includes('api key');
    container.innerHTML = '<div class="ll-error">' + ICONS.warning + '<span>' + message + (isApiKeyError ? ' <a id="ll-err-settings">Open Settings</a>' : '') + '</span></div>';
    if (isApiKeyError) {
      const link = container.querySelector('#ll-err-settings');
      if (link) {
        link.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'OPEN_SETTINGS' });
        });
      }
    }
  }

  // Initialization
  async function init() {
    // Get target lang
    chrome.storage.sync.get('targetLang', (settings) => {
      if (settings.targetLang) currentTargetLang = settings.targetLang;
      // Get initial data
      chrome.storage.session.get(null, (data) => {
        if (data.panelSelectedText) {
          panelData.text = data.panelSelectedText;
          panelData.context = data.panelContext || '';
          panelData.url = data.panelUrl || '';
          panelData.title = data.panelTitle || '';
          buildPopup();
        }
      });
    });
  }

  // Listen for updates from content script
  chrome.storage.session.onChanged.addListener((changes) => {
    if (changes.panelSelectedText) {
      panelData.text = changes.panelSelectedText.newValue || '';
    }
    if (changes.panelContext) panelData.context = changes.panelContext.newValue || '';
    if (changes.panelUrl) panelData.url = changes.panelUrl.newValue || '';
    if (changes.panelTitle) panelData.title = changes.panelTitle.newValue || '';
    
    if (changes.panelSelectedText && panelData.text) {
      buildPopup();
    }
  });

  init();

})();
