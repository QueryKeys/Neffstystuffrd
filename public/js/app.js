// ── Helpers ────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const fmt = (n, dec = 2) => n != null ? n.toFixed(dec) : '—';
const fmtPct = n => n != null ? `${n >= 0 ? '+' : ''}${(n * 100).toFixed(1)}%` : '—';
const fmtChg = n => n != null ? `${n >= 0 ? '+' : ''}${n.toFixed(2)}%` : '—';
const fmtPrice = n => n != null ? `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtCap = n => {
  if (!n) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`;
  return `$${(n / 1e6).toFixed(0)}M`;
};

function scoreColor(score) {
  if (score >= 80) return '#00d4aa';
  if (score >= 70) return '#4ade80';
  if (score >= 60) return '#f59e0b';
  return '#f97316';
}

function verdictText(score) {
  if (score >= 80) return { text: I18n.t('verdict.strong'), cls: 'strong' };
  if (score >= 70) return { text: I18n.t('verdict.good'),   cls: 'good'   };
  if (score >= 60) return { text: I18n.t('verdict.watch'),  cls: 'watch'  };
  return               { text: I18n.t('verdict.weak'),   cls: 'weak'   };
}

function typeLabel(type) {
  if (type === 'stock')   return I18n.t('type.stock');
  if (type === 'etf')     return I18n.t('type.etf');
  if (type === 'futures') return I18n.t('type.futures');
  return type.toUpperCase();
}

// ── State ──────────────────────────────────────────────────────────────────
let allResults = [];
let currentRange = '1y';
let pollTimer = null;

// ── Screener ───────────────────────────────────────────────────────────────
async function loadScreener(forceRefresh = false) {
  showLoading(true);
  $('results-grid').classList.add('hidden');
  $('empty-state').classList.add('hidden');
  $('screener-meta').textContent = I18n.t('screener.running');

  try {
    const data = await API.screener(forceRefresh);

    if (data.status === 'running') {
      startPolling();
      return;
    }

    stopPolling();
    allResults = data.results ?? [];
    showLoading(false);
    renderResults();
    if (data.lastRun) {
      const d = new Date(data.lastRun);
      $('screener-meta').textContent =
        `${I18n.t('screener.last_updated')}: ${d.toLocaleTimeString()} · ${allResults.length} ${I18n.t('screener.opportunities')}`;
    }
  } catch (err) {
    showLoading(false);
    $('screener-meta').textContent = I18n.t('screener.error');
    console.error(err);
  }
}

function startPolling() {
  if (pollTimer) return;
  $('screener-meta').textContent = I18n.t('screener.scanning');
  pollTimer = setInterval(async () => {
    try {
      const status = await API.screenerStatus();
      const pct = status.progress ?? 0;
      $('progress-fill').style.width = `${pct}%`;
      $('progress-pct').textContent = `${pct}%`;
      if (status.status === 'idle' || status.status === 'done') {
        stopPolling();
        loadScreener(false);
      }
    } catch (e) { /* ignore */ }
  }, 2000);
}

function stopPolling() {
  clearInterval(pollTimer);
  pollTimer = null;
}

function showLoading(show) {
  $('loading-state').style.display = show ? 'flex' : 'none';
}

// ── Render Results ─────────────────────────────────────────────────────────
function renderResults() {
  const typeFilter   = $('filter-type').value;
  const scoreFilter  = parseInt($('filter-score').value);
  const sectorFilter = $('filter-sector').value;

  const SECTOR_MAP = {
    AAPL:'tech',MSFT:'tech',GOOGL:'tech',AMZN:'tech',META:'tech',NVDA:'tech',AMD:'tech',TSLA:'tech',INTC:'tech',CRM:'tech',ADBE:'tech',ORCL:'tech',QCOM:'tech',AVGO:'tech',TXN:'tech',
    JPM:'finance',BAC:'finance',GS:'finance',MS:'finance',WFC:'finance',V:'finance',MA:'finance',AXP:'finance',BLK:'finance',SCHW:'finance',
    JNJ:'health',UNH:'health',PFE:'health',ABBV:'health',LLY:'health',MRK:'health',TMO:'health',ABT:'health',AMGN:'health',
    XOM:'energy',CVX:'energy',COP:'energy',SLB:'energy',EOG:'energy',PSX:'energy',VLO:'energy',
    WMT:'consumer',COST:'consumer',TGT:'consumer',HD:'consumer',MCD:'consumer',NKE:'consumer',PG:'consumer',KO:'consumer',PEP:'consumer',
    CAT:'industrial',BA:'industrial',GE:'industrial',HON:'industrial',UNP:'industrial',RTX:'industrial',DE:'industrial',LMT:'industrial',
  };

  const filtered = allResults.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    if (r.combinedScore < scoreFilter) return false;
    if (sectorFilter !== 'all' && SECTOR_MAP[r.symbol] !== sectorFilter) return false;
    return true;
  });

  const grid = $('results-grid');
  grid.innerHTML = '';

  if (filtered.length === 0) {
    $('empty-state').classList.remove('hidden');
    grid.classList.add('hidden');
    return;
  }

  $('empty-state').classList.add('hidden');
  grid.classList.remove('hidden');
  filtered.forEach(asset => grid.appendChild(buildCard(asset)));
}

function buildCard(asset) {
  const col  = scoreColor(asset.combinedScore);
  const isUp = asset.change >= 0;

  const card = document.createElement('div');
  card.className = 'asset-card';
  card.style.setProperty('--score-color', col);

  const bullSignals = asset.signals.filter(s => s.type === 'bull').slice(0, 2);
  const tagHtml = [
    `<span class="tag tag-type">${typeLabel(asset.type)}</span>`,
    ...bullSignals.map(s => `<span class="tag tag-bull">${s.text.split('—')[0].trim()}</span>`),
  ].join('');

  card.innerHTML = `
    <div class="card-top">
      <div>
        <div class="card-sym">${asset.symbol}</div>
        <div class="card-name">${asset.name || asset.symbol}</div>
      </div>
      <div class="score-badge" style="--score-color:${col}">
        <div class="score-num-big" style="color:${col}">${asset.combinedScore}</div>
        <div class="score-label-sm">${I18n.t('score.badge')}</div>
      </div>
    </div>
    <div class="card-price-row">
      <span class="card-price">${fmtPrice(asset.price)}</span>
      <span class="card-change ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(asset.change).toFixed(2)}%</span>
    </div>
    <div class="mini-bars">
      <div class="mini-bar-row">
        <span class="mini-bar-label">${I18n.t('bar.tech')}</span>
        <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${asset.techScore}%;background:#3b82f6"></div></div>
        <span class="mini-bar-val">${asset.techScore}</span>
      </div>
      ${asset.fundScore != null ? `
      <div class="mini-bar-row">
        <span class="mini-bar-label">${I18n.t('bar.fund')}</span>
        <div class="mini-bar-track"><div class="mini-bar-fill" style="width:${asset.fundScore}%;background:#a855f7"></div></div>
        <span class="mini-bar-val">${asset.fundScore}</span>
      </div>` : ''}
    </div>
    <div class="card-tags">${tagHtml}</div>
  `;

  card.addEventListener('click', () => openModal(asset));
  return card;
}

// ── Modal ──────────────────────────────────────────────────────────────────
function openModal(asset) {
  const overlay = $('modal-overlay');
  const content = $('modal-content');
  overlay.classList.remove('hidden');

  const col  = scoreColor(asset.combinedScore);
  const isUp = asset.change >= 0;
  const v    = verdictText(asset.combinedScore);

  const allSignals = asset.signals.map(s => `
    <div class="signal-item ${s.type}">
      <div class="signal-dot"></div>
      <span>${s.text}</span>
    </div>`).join('');

  content.innerHTML = `
    <div class="modal-header">
      <div class="modal-sym">${asset.symbol}</div>
      <div class="modal-name">${asset.name || asset.symbol}</div>
      <div class="modal-price-row">
        <span class="modal-price">${fmtPrice(asset.price)}</span>
        <span class="modal-change ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(asset.change).toFixed(2)}%</span>
      </div>
    </div>
    <div class="modal-scores">
      <div class="modal-score-item">
        <div class="modal-score-val" style="color:#3b82f6">${asset.techScore}</div>
        <div class="modal-score-lbl">${I18n.t('modal.technical')}</div>
      </div>
      ${asset.fundScore != null ? `
      <div class="modal-score-item">
        <div class="modal-score-val" style="color:#a855f7">${asset.fundScore}</div>
        <div class="modal-score-lbl">${I18n.t('modal.fundamental')}</div>
      </div>` : ''}
      <div class="modal-score-item">
        <div class="modal-score-val" style="color:${col}">${asset.combinedScore}</div>
        <div class="modal-score-lbl">${I18n.t('modal.combined')}</div>
      </div>
    </div>
    <div class="verdict ${v.cls}" style="margin-bottom:14px">${v.text}</div>
    <div class="modal-signals">
      <h4>${I18n.t('modal.signals')}</h4>
      <div class="modal-signal-list">${allSignals}</div>
    </div>
    <button class="btn-primary" style="width:100%;margin-top:8px" onclick="openChartFor('${asset.symbol}')">
      ${I18n.t('modal.view_chart')}
    </button>
  `;
}

function openChartFor(symbol) {
  closeModal();
  switchTab('chart');
  $('chart-search').value = symbol;
  loadChart(symbol);
}

function closeModal() {
  $('modal-overlay').classList.add('hidden');
}

// ── Chart Tab ──────────────────────────────────────────────────────────────
async function loadChart(symbol) {
  if (!symbol) return;

  $('chart-placeholder').classList.add('hidden');
  $('analysis-panel').classList.remove('hidden');
  $('charts-container').classList.remove('hidden');
  $('fundamentals-card').classList.add('hidden');

  $('score-symbol').textContent = symbol.toUpperCase();
  $('score-name').textContent   = I18n.t('score.loading');
  $('score-price').textContent  = '—';
  $('score-change').textContent = '—';
  $('num-tech').textContent     = '—';
  $('num-fund').textContent     = '—';
  $('num-combined').textContent = '—';
  $('bar-tech').style.width     = '0%';
  $('bar-fund').style.width     = '0%';
  $('bar-combined').style.width = '0%';
  $('verdict').textContent      = I18n.t('score.loading');
  $('indicator-grid').innerHTML = `<div style="color:var(--text3);font-size:0.75rem;grid-column:1/-1;padding:8px 0">${I18n.t('score.loading_ind')}</div>`;
  $('signals-list').innerHTML   = '';

  Charts.destroyAll();

  try {
    const data = await API.analysis(symbol.toUpperCase(), currentRange);
    renderAnalysis(data);
    Charts.renderAll(data);
  } catch (err) {
    $('score-name').textContent = 'Error: ' + (err.message || 'Could not load data');
    console.error(err);
  }
}

function renderAnalysis(data) {
  const isUp = data.change >= 0;
  const col  = scoreColor(data.combinedScore);
  const v    = verdictText(data.combinedScore);

  $('score-symbol').textContent = data.symbol;
  $('score-name').textContent   = data.name || data.symbol;
  $('score-price').textContent  = fmtPrice(data.price);
  $('score-change').textContent = fmtChg(data.change);
  $('score-change').className   = `score-change ${isUp ? 'up' : 'down'}`;

  $('num-tech').textContent  = data.techScore;
  $('bar-tech').style.width  = `${data.techScore}%`;

  if (data.fundScore != null) {
    $('num-fund').textContent = data.fundScore;
    $('bar-fund').style.width = `${data.fundScore}%`;
  } else {
    $('num-fund').textContent = 'N/A';
    $('bar-fund').style.width = '0%';
  }

  $('num-combined').textContent   = data.combinedScore;
  $('num-combined').style.color   = col;
  $('bar-combined').style.width   = `${data.combinedScore}%`;

  const vEl = $('verdict');
  vEl.textContent = v.text;
  vEl.className   = `verdict ${v.cls}`;

  // Indicators
  const ind = data.indicators ?? {};
  const indItems = [
    { label: I18n.t('ind.rsi'),   value: ind.rsi    != null ? ind.rsi.toFixed(1) : '—',  color: ind.rsi < 30 ? '#00d4aa' : ind.rsi > 70 ? '#ff4757' : '#e2e8f0' },
    { label: I18n.t('ind.sma50'), value: ind.sma50  != null ? `$${ind.sma50.toFixed(2)}` : '—' },
    { label: I18n.t('ind.sma200'),value: ind.sma200 != null ? `$${ind.sma200.toFixed(2)}` : '—' },
    { label: I18n.t('ind.macd'),  value: ind.macdHist != null ? ind.macdHist.toFixed(3) : '—', color: ind.macdHist > 0 ? '#00d4aa' : '#ff4757' },
    { label: I18n.t('ind.atr'),   value: ind.atrPct != null ? `${ind.atrPct.toFixed(1)}%` : '—' },
    { label: I18n.t('ind.price'), value: fmtPrice(data.price) },
  ];
  $('indicator-grid').innerHTML = indItems.map(i => `
    <div class="ind-item">
      <div class="ind-label">${i.label}</div>
      <div class="ind-value" style="color:${i.color || 'var(--text)'}">${i.value}</div>
    </div>`).join('');

  // Fundamentals
  if (data.fundamentals) {
    const f = data.fundamentals;
    $('fundamentals-card').classList.remove('hidden');
    const fundItems = [
      { label: I18n.t('f.pe'),     value: f.pe            != null ? f.pe.toFixed(1) : '—' },
      { label: I18n.t('f.fpe'),    value: f.forwardPE     != null ? f.forwardPE.toFixed(1) : '—' },
      { label: I18n.t('f.cap'),    value: fmtCap(f.marketCap) },
      { label: I18n.t('f.beta'),   value: f.beta          != null ? f.beta.toFixed(2) : '—' },
      { label: I18n.t('f.rev'),    value: f.revenueGrowth != null ? `${(f.revenueGrowth*100).toFixed(1)}%` : '—' },
      { label: I18n.t('f.margin'), value: f.profitMargin  != null ? `${(f.profitMargin*100).toFixed(1)}%` : '—' },
      { label: I18n.t('f.roe'),    value: f.roe           != null ? `${(f.roe*100).toFixed(1)}%` : '—' },
      { label: I18n.t('f.de'),     value: f.debtToEquity  != null ? (f.debtToEquity/100).toFixed(2) : '—' },
      { label: I18n.t('f.div'),    value: f.dividendYield != null ? `${(f.dividendYield*100).toFixed(2)}%` : '—' },
      { label: I18n.t('f.h52'),    value: f.fiftyTwoWeekHigh != null ? `$${f.fiftyTwoWeekHigh.toFixed(2)}` : '—' },
      { label: I18n.t('f.l52'),    value: f.fiftyTwoWeekLow  != null ? `$${f.fiftyTwoWeekLow.toFixed(2)}` : '—' },
      { label: I18n.t('f.fcf'),    value: f.freeCashflow  != null ? fmtCap(f.freeCashflow) : '—' },
    ];
    $('fund-grid').innerHTML = fundItems.map(i => `
      <div class="fund-item">
        <div class="fund-label">${i.label}</div>
        <div class="fund-value">${i.value}</div>
      </div>`).join('');
  }

  // Signals
  $('signals-list').innerHTML = data.signals.map(s => `
    <div class="signal-item ${s.type}">
      <div class="signal-dot"></div>
      <span>${s.text}</span>
    </div>`).join('');
}

// ── Criteria Page (JS-rendered, bilingual) ─────────────────────────────────
function renderCriteriaPage() {
  const t = key => I18n.t(key);

  function ciItem(nameKey, ptsKey, ...listKeys) {
    return `
      <div class="criteria-item">
        <div class="criteria-name">${t(nameKey)} <span class="pts">${t(ptsKey)}</span></div>
        <ul>${listKeys.map(k => `<li>${t(k)}</li>`).join('')}</ul>
      </div>`;
  }

  $('criteria-page').innerHTML = `
    <h1 class="page-title">${t('cr.title')}</h1>
    <p class="page-sub">${t('cr.subtitle')}</p>

    <div class="criteria-grid">

      <div class="criteria-section">
        <div class="criteria-header tech-header">
          <span class="criteria-icon">📈</span>
          <div>
            <h2>${t('cr.tech_title')} <span class="weight-badge">${t('cr.tech_weight')}</span></h2>
          </div>
        </div>
        <div class="criteria-items">
          ${ciItem('ci.trend','ci.trend.pts','ci.trend.1','ci.trend.2')}
          ${ciItem('ci.mom','ci.mom.pts','ci.mom.1','ci.mom.2','ci.mom.3')}
          ${ciItem('ci.vol','ci.vol.pts','ci.vol.1','ci.vol.2','ci.vol.3')}
          ${ciItem('ci.atr','ci.atr.pts','ci.atr.1','ci.atr.2','ci.atr.3')}
          ${ciItem('ci.bb','ci.bb.pts','ci.bb.1','ci.bb.2')}
        </div>
      </div>

      <div class="criteria-section">
        <div class="criteria-header fund-header">
          <span class="criteria-icon">📊</span>
          <div>
            <h2>${t('cr.fund_title')} <span class="weight-badge">${t('cr.fund_weight')}</span></h2>
          </div>
        </div>
        <div class="criteria-items">
          ${ciItem('ci.pe','ci.pe.pts','ci.pe.1','ci.pe.2','ci.pe.3','ci.pe.4')}
          ${ciItem('ci.rev','ci.rev.pts','ci.rev.1','ci.rev.2','ci.rev.3','ci.rev.4')}
          ${ciItem('ci.margin','ci.margin.pts','ci.margin.1','ci.margin.2','ci.margin.3','ci.margin.4')}
          ${ciItem('ci.de','ci.de.pts','ci.de.1','ci.de.2','ci.de.3','ci.de.4')}
          ${ciItem('ci.cap','ci.cap.pts','ci.cap.1','ci.cap.2','ci.cap.3','ci.cap.4')}
        </div>
      </div>

      <div class="criteria-section verdict-section">
        <h2>${t('cr.interpretation')}</h2>
        <div class="verdict-table">
          <div class="verdict-row">${t('vi.strong')}</div>
          <div class="verdict-row">${t('vi.good')}</div>
          <div class="verdict-row">${t('vi.watch')}</div>
          <div class="verdict-row">${t('vi.weak')}</div>
          <div class="verdict-row">${t('vi.none')}</div>
        </div>
        <div class="disclaimer">${t('disclaimer')}</div>
      </div>

    </div>
  `;
}

// ── Market Overview Strip ──────────────────────────────────────────────────
async function loadMarketOverview() {
  try {
    const items = await API.marketOverview();
    items.forEach(item => {
      const el = document.querySelector(`.strip-item[data-sym="${item.symbol}"]`);
      if (!el || item.error) return;
      el.classList.remove('loading');
      const isUp = item.change >= 0;
      el.querySelector('.val').textContent = `$${item.price.toFixed(2)}`;
      const chgEl = el.querySelector('.chg');
      chgEl.textContent = `${isUp ? '+' : ''}${item.change.toFixed(2)}%`;
      chgEl.className = `chg ${isUp ? 'up' : 'down'}`;
      el.addEventListener('click', () => openChartFor(item.symbol));
    });
  } catch (e) { /* silent */ }
}

// ── Clock ──────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const et = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'America/New_York', hour12: false
  }).format(now);
  const hour = parseInt(et.split(':')[0]);
  const isOpen = hour >= 9 && hour < 16;
  $('market-time').textContent = `${et} ET ${isOpen ? '🟢' : '🔴'}`;
}

// ── Tab Switching ──────────────────────────────────────────────────────────
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  document.querySelectorAll('.tab-content').forEach(t => {
    t.classList.toggle('hidden', t.id !== `tab-${name}`);
    t.classList.toggle('active', t.id === `tab-${name}`);
  });
  if (name === 'criteria') renderCriteriaPage();
}

// ── Language Toggle ────────────────────────────────────────────────────────
$('lang-toggle').addEventListener('click', () => {
  I18n.setLang(I18n.getLang() === 'en' ? 'he' : 'en');
});

document.addEventListener('langchange', () => {
  // Re-render dynamic content
  if (allResults.length) renderResults();
  // Re-render criteria if visible
  if (!$('tab-criteria').classList.contains('hidden')) renderCriteriaPage();
  // Update screener meta text if not in loading state
  if ($('loading-state').style.display === 'none' && allResults.length) {
    // keep existing last-updated text, already in correct lang since it was just set
  }
});

// ── Event Listeners ────────────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

$('modal-overlay').addEventListener('click', e => {
  if (e.target === $('modal-overlay')) closeModal();
});
$('modal-close').addEventListener('click', closeModal);

$('btn-refresh').addEventListener('click', async () => {
  $('btn-refresh').classList.add('spinning');
  await loadScreener(true);
  $('btn-refresh').classList.remove('spinning');
});

$('btn-load-chart').addEventListener('click', () => {
  const sym = $('chart-search').value.trim();
  if (sym) loadChart(sym);
});

$('chart-search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const sym = $('chart-search').value.trim();
    if (sym) loadChart(sym);
  }
});

document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRange = btn.dataset.range;
    const sym = $('chart-search').value.trim();
    if (sym) loadChart(sym);
  });
});

['filter-type','filter-score','filter-sector'].forEach(id => {
  $(id).addEventListener('change', renderResults);
});

// Expose for modal button
window.openChartFor = openChartFor;

// ── Init ───────────────────────────────────────────────────────────────────
(async function init() {
  updateClock();
  setInterval(updateClock, 1000);
  loadMarketOverview();
  setInterval(loadMarketOverview, 60000);
  await loadScreener(false);
})();
