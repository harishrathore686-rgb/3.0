/*
 * PRAHARI OS - search.js
 * Intelligent Ctrl+K overlay, indexing medical services, and fetching AI search grounding proxy.
 */

class GlobalSearch {
  constructor() {
    this.overlay = null;
    this.input = null;
    this.resultsContainer = null;
    this.recentSearches = JSON.parse(localStorage.getItem('prahari-recent-searches') || '[]');
    
    // Indexable content for quick offline matching
    this.localIndex = [
      { title: "Futuristic AI Command Center", category: "Dashboard", url: "dashboard.html", keywords: "stock medicine bed doctor metrics statistics graphs" },
      { title: "Citizen Engagement Platform", category: "Citizen Care", url: "citizen.html", keywords: "consultation records appointments digital card wallet sos generic medicines price" },
      { title: "System Governance Portal", category: "Administration", url: "admin.html", keywords: "audit resource log configuration registries registry state" },
      { title: "Profile Security", category: "User Settings", url: "profile.html", keywords: "google account credentials syncing details contact ICE" },
      { title: "Accessibility & Integrations", category: "Settings", url: "settings.html", keywords: "mode scale translation notifications privacy oauth workspace API" },
      { title: "Predictive Analytics Agent", category: "AI Agents", url: "dashboard.html?agent=prediction", keywords: "forecast outbreaks model modelized timeline neural" },
      { title: "Verification & Audit Agent", category: "AI Agents", url: "dashboard.html?agent=verification", keywords: "ocr medical audit prescription logs confirm double-check" },
      { title: "Resource Optimization Agent", category: "AI Agents", url: "dashboard.html?agent=optimization", keywords: "transfer beds stock drug routing network twins" },
      { title: "Emergency Dispatch Agent", category: "AI Agents", url: "dashboard.html?agent=emergency", keywords: "sos ambulance trauma red action sirens alert call SMS" },
      { title: "Generic Medicines Center", category: "Inventory", url: "citizen.html?tab=medicines", keywords: "drug stock prices generic brand substitution cost" }
    ];

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.createSearchUI();
    this.bindEvents();
  }

  createSearchUI() {
    // Check if search HTML already injected
    if (document.getElementById('search-overlay')) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'search-overlay';
    this.overlay.innerHTML = `
      <div class="search-modal" id="search-modal-box">
        <div class="search-header">
          <span style="color: var(--color-cyan); font-family: var(--font-mono);">⌨</span>
          <input type="text" id="global-search-input" placeholder="Search pages, features, agents or type 'ai: query' for real-time health search..." autocomplete="off">
          <span class="shortcut-badge" style="cursor: pointer;" id="close-search-btn">ESC</span>
        </div>
        <div class="search-results" id="global-search-results">
          <!-- Dynamically filled -->
        </div>
        <div style="padding: 12px 20px; font-size: 0.75rem; color: var(--text-muted); border-top: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between;">
          <span>↑↓ to navigate • Enter to select • ESC to close</span>
          <span style="color: var(--color-cyan);">Press AI: for Gemini Live Search Grounding</span>
        </div>
      </div>
    `;
    document.body.appendChild(this.overlay);

    this.input = document.getElementById('global-search-input');
    this.resultsContainer = document.getElementById('global-search-results');
    
    // Prevent closing when clicking modal container
    document.getElementById('search-modal-box').addEventListener('click', (e) => e.stopPropagation());
  }

  bindEvents() {
    // Close button
    document.getElementById('close-search-btn').addEventListener('click', () => this.close());

    // Close on overlay background click
    this.overlay.addEventListener('click', () => this.close());

    // Keyboard bindings
    window.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.open();
      }
      
      // Escape
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    this.input.addEventListener('input', (e) => this.handleQueryChange(e.target.value));
  }

  isOpen() {
    return this.overlay.style.display === 'flex';
  }

  open() {
    this.overlay.style.display = 'flex';
    this.input.focus();
    this.handleQueryChange(''); // Render recents/defaults
  }

  close() {
    this.overlay.style.display = 'none';
    this.input.value = '';
  }

  handleQueryChange(val) {
    val = val.trim();
    if (!val) {
      this.renderDefaults();
      return;
    }

    // Check if user is requesting a grounded AI search via "ai:" prefix
    if (val.toLowerCase().startsWith('ai:')) {
      const queryStr = val.substring(3).trim();
      this.renderAISearchPrompt(queryStr);
      return;
    }

    this.performLocalSearch(val);
  }

  renderDefaults() {
    let html = ``;
    
    // Recent section
    if (this.recentSearches.length > 0) {
      html += `<div style="padding: 6px 20px; font-size: 0.75rem; font-weight:700; color: var(--text-muted); text-transform: uppercase; letter-spacing:0.05em;">Recent Searches</div>`;
      this.recentSearches.forEach((item, index) => {
        html += `
          <div class="search-item" onclick="window.location.href='${item.url}'">
            <div class="search-item-info">
              <span style="color: var(--text-muted);">↺</span>
              <span class="search-item-title">${item.title}</span>
            </div>
            <span class="search-item-category">${item.category}</span>
          </div>
        `;
      });
    }

    // Default Quick Links
    html += `<div style="padding: 12px 20px 6px; font-size: 0.75rem; font-weight:700; color: var(--text-muted); text-transform: uppercase; letter-spacing:0.05em;">Quick Links</div>`;
    const quicks = this.localIndex.slice(0, 4);
    quicks.forEach(item => {
      html += `
        <div class="search-item" onclick="PrahariSearch.visit('${item.title}', '${item.url}', '${item.category}')">
          <div class="search-item-info">
            <span style="color: var(--color-cyan);">✦</span>
            <span class="search-item-title">${item.title}</span>
          </div>
          <span class="search-item-category">${item.category}</span>
        </div>
      `;
    });

    this.resultsContainer.innerHTML = html;
  }

  performLocalSearch(query) {
    const queryLower = query.toLowerCase();
    const matches = this.localIndex.filter(item => 
      item.title.toLowerCase().includes(queryLower) || 
      item.category.toLowerCase().includes(queryLower) || 
      item.keywords.toLowerCase().includes(queryLower)
    );

    let html = ``;
    if (matches.length > 0) {
      html += `<div style="padding: 6px 20px; font-size: 0.75rem; font-weight:700; color: var(--text-muted); text-transform: uppercase; letter-spacing:0.05em;">Matches (${matches.length})</div>`;
      matches.forEach(item => {
        html += `
          <div class="search-item" onclick="PrahariSearch.visit('${item.title}', '${item.url}', '${item.category}')">
            <div class="search-item-info">
              <span style="color: var(--color-cyan);">↳</span>
              <span class="search-item-title">${item.title}</span>
            </div>
            <span class="search-item-category">${item.category}</span>
          </div>
        `;
      });
    } else {
      html += `
        <div style="padding: 30px; text-align: center; color: var(--text-secondary);">
          <div>No core page elements match "<strong>${query}</strong>"</div>
          <button class="btn btn-primary" style="margin-top: 14px; font-size: 0.8rem; padding: 6px 14px;" onclick="PrahariSearch.triggerAISearch('${query}')">
            Query Gemini Live Search Grounding for "${query}"
          </button>
        </div>
      `;
    }

    this.resultsContainer.innerHTML = html;
  }

  renderAISearchPrompt(query) {
    this.resultsContainer.innerHTML = `
      <div style="padding: 24px; text-align: center;">
        <div style="font-size: 1.1rem; font-family: var(--font-display); color: var(--color-cyan); margin-bottom: 8px;" class="thinking">Grounded AI Search Engaged</div>
        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">Query: "${query || "..."}"</div>
        ${query ? `
          <button class="btn btn-primary" onclick="PrahariSearch.triggerAISearch('${query}')">
            Execute Google Grounded Search
          </button>
        ` : `
          <div style="font-size: 0.75rem; color: var(--text-muted);">Continue typing to ask Gemini...</div>
        `}
      </div>
    `;
  }

  async triggerAISearch(query) {
    this.resultsContainer.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div class="wave-bar"></div>
        <div style="margin-top: 16px; color: var(--color-cyan); font-family: var(--font-display);" class="thinking">Contacting Gemini Public Search Nodes</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">Grounding results with actual Google Search index data...</div>
      </div>
    `;

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      this.resultsContainer.innerHTML = `
        <div style="padding: 20px 24px;">
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:10px; margin-bottom:14px;">
            <span style="font-size: 0.85rem; font-weight: 600; color: var(--color-cyan); display:flex; align-items:center; gap:6px;">
              <span>🌐</span> Grounded Gemini Results
            </span>
            <button class="btn btn-secondary" style="font-size:0.75rem; padding: 4px 8px;" onclick="PrahariSearch.close()">Close</button>
          </div>
          <div style="font-size:0.9rem; line-height:1.6; color:var(--text-primary); max-height:280px; overflow-y:auto; padding-right:8px;" class="markdown-body">
            ${this.formatMarkdown(data.result)}
          </div>
          <div style="margin-top: 14px; text-align: right; font-size: 0.7rem; color: var(--text-muted);">
            Real-time verification powered by Gemini 3.5 Flash
          </div>
        </div>
      `;
    } catch (err) {
      this.resultsContainer.innerHTML = `
        <div style="padding: 30px; text-align: center; color: var(--color-danger);">
          <div>⚠ Grounded Search Node Fail</div>
          <div style="font-size:0.8rem; margin-top: 4px;">${err.message || "Unknown error occurred"}</div>
          <button class="btn btn-secondary" style="margin-top: 12px; font-size:0.75rem;" onclick="PrahariSearch.renderDefaults()">Back to defaults</button>
        </div>
      `;
    }
  }

  formatMarkdown(text) {
    if (!text) return "";
    // Basic formatting for preview presentation
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/### (.*?)\n/g, '<h4 style="color:var(--color-cyan); font-family:var(--font-display); margin:12px 0 6px;">$1</h4>')
      .replace(/## (.*?)\n/g, '<h3 style="color:var(--text-primary); font-family:var(--font-display); margin:16px 0 8px;">$1</h3>')
      .replace(/\n/g, '<br>');
  }

  visit(title, url, category) {
    // Add to recents
    this.recentSearches = this.recentSearches.filter(item => item.url !== url);
    this.recentSearches.unshift({ title, url, category });
    this.recentSearches = this.recentSearches.slice(0, 5); // Limit 5
    localStorage.setItem('prahari-recent-searches', JSON.stringify(this.recentSearches));
    window.location.href = url;
  }
}

window.PrahariSearch = new GlobalSearch();
