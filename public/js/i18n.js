// i18n — Bilingual EN / HE support
const I18n = (() => {
  const T = {
    en: {
      // Nav
      'tab.screener': 'Screener',
      'tab.chart': 'Chart',
      'tab.criteria': 'Criteria',

      // Screener
      'screener.title': 'Market Screener',
      'screener.init': 'Scanning market for opportunities…',
      'screener.running': 'Analyzing market data…',
      'screener.scanning': 'Scanning market…',
      'screener.error': 'Error loading data. Please try again.',
      'screener.last_updated': 'Last updated',
      'screener.opportunities': 'opportunities found',
      'screener.no_assets': 'No assets meet the criteria with current filters.',

      // Filters
      'filter.all_types': 'All Types',
      'filter.stocks': 'Stocks',
      'filter.etfs': 'ETFs',
      'filter.futures': 'Futures',
      'filter.all_scores': 'All Scores',
      'filter.80': '80+ Strong',
      'filter.70': '70+ Good',
      'filter.60': '60+ Moderate',
      'filter.all_sectors': 'All Sectors',
      'filter.tech': 'Technology',
      'filter.finance': 'Finance',
      'filter.health': 'Healthcare',
      'filter.energy': 'Energy',
      'filter.consumer': 'Consumer',
      'filter.industrial': 'Industrial',

      // Loading spinner
      'loading.text': 'Analyzing market data…',

      // Chart tab
      'chart.placeholder': 'Enter a symbol above to view chart analysis',
      'chart.input_ph': 'Enter symbol (e.g. AAPL, ES=F)',
      'chart.analyze': 'Analyze',
      'chart.pane.price': 'Price · SMA50 · SMA200 · BB',
      'chart.pane.volume': 'Volume',
      'chart.pane.rsi': 'RSI (14)',
      'chart.pane.macd': 'MACD (12,26,9)',

      // Score panel
      'score.loading': 'Loading…',
      'score.loading_ind': 'Loading indicators…',
      'score.technical': 'Technical',
      'score.fundamental': 'Fundamental',
      'score.combined': 'Combined',
      'score.badge': 'SCORE',

      // Verdicts
      'verdict.strong': 'Strong Opportunity',
      'verdict.good': 'Good Setup',
      'verdict.watch': 'Moderate – Watch Closely',
      'verdict.weak': 'Borderline – Do Not Trade Yet',

      // Indicator labels
      'ind.rsi': 'RSI (14)',
      'ind.sma50': 'SMA 50',
      'ind.sma200': 'SMA 200',
      'ind.macd': 'MACD Hist',
      'ind.atr': 'ATR %',
      'ind.price': 'Price',

      // Cards
      'card.indicators': 'Key Indicators',
      'card.fundamentals': 'Fundamentals',
      'card.signals': 'Signals',

      // Fundamental labels
      'f.pe': 'P/E Ratio',
      'f.fpe': 'Fwd P/E',
      'f.cap': 'Market Cap',
      'f.beta': 'Beta',
      'f.rev': 'Rev Growth',
      'f.margin': 'Profit Margin',
      'f.roe': 'ROE',
      'f.de': 'D/E Ratio',
      'f.div': 'Div Yield',
      'f.h52': '52W High',
      'f.l52': '52W Low',
      'f.fcf': 'Free CF',

      // Modal
      'modal.signals': 'Analysis Signals',
      'modal.view_chart': 'View Full Chart Analysis →',
      'modal.technical': 'TECHNICAL',
      'modal.fundamental': 'FUNDAMENTAL',
      'modal.combined': 'COMBINED',

      // Mini bars
      'bar.tech': 'Technical',
      'bar.fund': 'Fundamental',

      // Asset types
      'type.stock': 'STOCK',
      'type.etf': 'ETF',
      'type.futures': 'FUTURES',

      // Criteria page
      'cr.title': 'Screening Criteria',
      'cr.subtitle': 'How TradeAnalyzer Pro scores and selects opportunities',
      'cr.tech_title': 'Technical Score',
      'cr.tech_weight': '60% weight (stocks) · 100% (ETF/Futures)',
      'cr.fund_title': 'Fundamental Score',
      'cr.fund_weight': '40% weight (stocks only)',
      'cr.interpretation': 'Score Interpretation',

      'ci.trend': 'Trend Strength',
      'ci.trend.pts': '25 pts',
      'ci.trend.1': '<b>+10</b> Price above SMA50 (short-term bullish)',
      'ci.trend.2': '<b>+15</b> Golden Cross: SMA50 &gt; SMA200 (long-term bullish)',

      'ci.mom': 'Momentum Quality',
      'ci.mom.pts': '25 pts',
      'ci.mom.1': '<b>+15</b> RSI 40–65 (building momentum, not overbought)',
      'ci.mom.2': '<b>+8</b> RSI &lt;30 (oversold, potential reversal)',
      'ci.mom.3': '<b>+10</b> MACD histogram positive and growing',

      'ci.vol': 'Volume Conviction',
      'ci.vol.pts': '20 pts',
      'ci.vol.1': '<b>+20</b> Volume ≥ 2× 20-day average (strong buying interest)',
      'ci.vol.2': '<b>+15</b> Volume ≥ 1.5× average',
      'ci.vol.3': '<b>+8</b> Volume at average',

      'ci.atr': 'ATR Volatility',
      'ci.atr.pts': '15 pts',
      'ci.atr.1': '<b>+15</b> ATR 1.5%–4% of price (ideal tradeable range)',
      'ci.atr.2': '<b>+8</b> ATR 1%–1.5% (low vol, steady)',
      'ci.atr.3': '<b>+7</b> ATR 4%–7% (high vol, elevated risk)',

      'ci.bb': 'Bollinger Band Position',
      'ci.bb.pts': '15 pts',
      'ci.bb.1': '<b>+15</b> Price 50%–85% of BB range (buy zone)',
      'ci.bb.2': '<b>+8</b> Price near BB lower band (potential bounce)',

      'ci.pe': 'Valuation (P/E)',
      'ci.pe.pts': '20 pts',
      'ci.pe.1': '<b>+20</b> P/E &lt; 20 (undervalued)',
      'ci.pe.2': '<b>+15</b> P/E 20–30 (fair value)',
      'ci.pe.3': '<b>+8</b> P/E 30–50 (growth premium)',
      'ci.pe.4': '<b>0</b> P/E &gt; 50 or negative',

      'ci.rev': 'Revenue Growth',
      'ci.rev.pts': '25 pts',
      'ci.rev.1': '<b>+25</b> Growth &gt; 15% YoY',
      'ci.rev.2': '<b>+15</b> Growth 5%–15%',
      'ci.rev.3': '<b>+7</b> Growth 0%–5%',
      'ci.rev.4': '<b>0</b> Declining revenue',

      'ci.margin': 'Profit Margin',
      'ci.margin.pts': '25 pts',
      'ci.margin.1': '<b>+25</b> Margin &gt; 20%',
      'ci.margin.2': '<b>+18</b> Margin 10%–20%',
      'ci.margin.3': '<b>+8</b> Margin 3%–10%',
      'ci.margin.4': '<b>0</b> Negative margins',

      'ci.de': 'Debt/Equity',
      'ci.de.pts': '15 pts',
      'ci.de.1': '<b>+15</b> D/E &lt; 0.5 (low debt)',
      'ci.de.2': '<b>+10</b> D/E 0.5–1.5',
      'ci.de.3': '<b>+4</b> D/E 1.5–3',
      'ci.de.4': '<b>0</b> D/E &gt; 3',

      'ci.cap': 'Market Cap / Liquidity',
      'ci.cap.pts': '15 pts',
      'ci.cap.1': '<b>+15</b> Mega cap &gt; $50B',
      'ci.cap.2': '<b>+12</b> Large cap $10B–$50B',
      'ci.cap.3': '<b>+8</b> Mid cap $2B–$10B',
      'ci.cap.4': '<b>+3</b> Small cap &lt; $2B',

      'vi.strong': '<span class="verdict-badge strong">80–100</span><span>Strong opportunity — high conviction setup</span>',
      'vi.good':   '<span class="verdict-badge good">70–79</span><span>Good setup — worth watching closely</span>',
      'vi.watch':  '<span class="verdict-badge watch">60–69</span><span>Moderate — potential if sector confirms</span>',
      'vi.weak':   '<span class="verdict-badge weak">55–59</span><span>Borderline — watch but do not trade yet</span>',
      'vi.none':   '<span class="verdict-badge none">&lt;55</span><span>Not shown — does not meet criteria</span>',

      'disclaimer': '<strong>Disclaimer:</strong> This tool is for educational and informational purposes only. Not financial advice. Always do your own research and consult a licensed financial advisor before trading.',
    },

    he: {
      // Nav
      'tab.screener': 'סקרינר',
      'tab.chart': 'גרף',
      'tab.criteria': 'קריטריונים',

      // Screener
      'screener.title': 'סקרינר שוק',
      'screener.init': 'מחפש הזדמנויות בשוק…',
      'screener.running': 'מנתח נתוני שוק…',
      'screener.scanning': 'סורק שוק…',
      'screener.error': 'שגיאה בטעינת נתונים. אנא נסה שוב.',
      'screener.last_updated': 'עודכן לאחרונה',
      'screener.opportunities': 'הזדמנויות נמצאו',
      'screener.no_assets': 'אין נכסים העומדים בקריטריונים עם הפילטרים הנוכחיים.',

      // Filters
      'filter.all_types': 'כל הסוגים',
      'filter.stocks': 'מניות',
      'filter.etfs': 'תעודות סל',
      'filter.futures': 'חוזים עתידיים',
      'filter.all_scores': 'כל הציונים',
      'filter.80': '80+ חזק',
      'filter.70': '70+ טוב',
      'filter.60': '60+ בינוני',
      'filter.all_sectors': 'כל המגזרים',
      'filter.tech': 'טכנולוגיה',
      'filter.finance': 'פיננסים',
      'filter.health': 'בריאות',
      'filter.energy': 'אנרגיה',
      'filter.consumer': 'צריכה',
      'filter.industrial': 'תעשייה',

      // Loading spinner
      'loading.text': 'מנתח נתוני שוק…',

      // Chart tab
      'chart.placeholder': 'הזן סמל למעלה לצפייה בניתוח גרף',
      'chart.input_ph': 'הזן סמל (למשל AAPL, ES=F)',
      'chart.analyze': 'נתח',
      'chart.pane.price': 'מחיר · SMA50 · SMA200 · BB',
      'chart.pane.volume': 'נפח מסחר',
      'chart.pane.rsi': 'RSI (14)',
      'chart.pane.macd': 'MACD (12,26,9)',

      // Score panel
      'score.loading': 'טוען…',
      'score.loading_ind': 'טוען מדדים…',
      'score.technical': 'טכני',
      'score.fundamental': 'פונדמנטלי',
      'score.combined': 'משולב',
      'score.badge': 'ציון',

      // Verdicts
      'verdict.strong': 'הזדמנות חזקה',
      'verdict.good': 'הגדרה טובה',
      'verdict.watch': 'בינוני – עקוב מקרוב',
      'verdict.weak': 'גבולי – לא לסחור עדיין',

      // Indicator labels
      'ind.rsi': 'RSI (14)',
      'ind.sma50': 'SMA 50',
      'ind.sma200': 'SMA 200',
      'ind.macd': 'MACD היסט׳',
      'ind.atr': 'ATR %',
      'ind.price': 'מחיר',

      // Cards
      'card.indicators': 'מדדים מרכזיים',
      'card.fundamentals': 'יסודות פיננסיים',
      'card.signals': 'אותות',

      // Fundamental labels
      'f.pe': 'יחס מ"ר',
      'f.fpe': 'מ"ר קדימה',
      'f.cap': 'שווי שוק',
      'f.beta': 'בטא',
      'f.rev': 'גידול הכנסות',
      'f.margin': 'שולי רווח',
      'f.roe': 'תשואה על הון',
      'f.de': 'חוב/הון',
      'f.div': 'תשואת דיבידנד',
      'f.h52': 'שיא 52 שבועות',
      'f.l52': 'שפל 52 שבועות',
      'f.fcf': 'תזרים חופשי',

      // Modal
      'modal.signals': 'אותות ניתוח',
      'modal.view_chart': 'צפה בניתוח גרף מלא ←',
      'modal.technical': 'טכני',
      'modal.fundamental': 'פונדמנטלי',
      'modal.combined': 'משולב',

      // Mini bars
      'bar.tech': 'טכני',
      'bar.fund': 'פונדמנטלי',

      // Asset types
      'type.stock': 'מנייה',
      'type.etf': 'תעודת סל',
      'type.futures': 'חוזה',

      // Criteria page
      'cr.title': 'קריטריוני סינון',
      'cr.subtitle': 'כיצד TradeAnalyzer Pro מדרג ומסנן הזדמנויות',
      'cr.tech_title': 'ציון טכני',
      'cr.tech_weight': 'משקל 60% (מניות) · 100% (תעודות סל/חוזים)',
      'cr.fund_title': 'ציון פונדמנטלי',
      'cr.fund_weight': 'משקל 40% (מניות בלבד)',
      'cr.interpretation': 'פרשנות הציון',

      'ci.trend': 'חוזק מגמה',
      'ci.trend.pts': '25 נק׳',
      'ci.trend.1': '<b>+10</b> מחיר מעל SMA50 (שורי לטווח קצר)',
      'ci.trend.2': '<b>+15</b> צלב זהב: SMA50 &gt; SMA200 (שורי לטווח ארוך)',

      'ci.mom': 'איכות מומנטום',
      'ci.mom.pts': '25 נק׳',
      'ci.mom.1': '<b>+15</b> RSI 40–65 (מומנטום בנייה, לא קנוי יתר)',
      'ci.mom.2': '<b>+8</b> RSI &lt;30 (מכור יתר, פוטנציאל היפוך)',
      'ci.mom.3': '<b>+10</b> היסטוגרמת MACD חיובית וגדלה',

      'ci.vol': 'משקל מסחר',
      'ci.vol.pts': '20 נק׳',
      'ci.vol.1': '<b>+20</b> נפח ≥ פי 2 מממוצע 20 יום (קנייה חזקה)',
      'ci.vol.2': '<b>+15</b> נפח ≥ פי 1.5 מהממוצע',
      'ci.vol.3': '<b>+8</b> נפח בממוצע',

      'ci.atr': 'תנודתיות ATR',
      'ci.atr.pts': '15 נק׳',
      'ci.atr.1': '<b>+15</b> ATR 1.5%–4% מהמחיר (טווח מסחר אידיאלי)',
      'ci.atr.2': '<b>+8</b> ATR 1%–1.5% (תנודתיות נמוכה)',
      'ci.atr.3': '<b>+7</b> ATR 4%–7% (תנודתיות גבוהה)',

      'ci.bb': 'מיקום פסי בולינגר',
      'ci.bb.pts': '15 נק׳',
      'ci.bb.1': '<b>+15</b> מחיר ב-50%–85% מטווח BB (אזור קנייה)',
      'ci.bb.2': '<b>+8</b> מחיר ליד הפס התחתון (פוטנציאל קפיצה)',

      'ci.pe': 'הערכת שווי (מ"ר)',
      'ci.pe.pts': '20 נק׳',
      'ci.pe.1': '<b>+20</b> מ"ר &lt; 20 (זול)',
      'ci.pe.2': '<b>+15</b> מ"ר 20–30 (שווי הוגן)',
      'ci.pe.3': '<b>+8</b> מ"ר 30–50 (פרמיית צמיחה)',
      'ci.pe.4': '<b>0</b> מ"ר &gt; 50 או שלילי',

      'ci.rev': 'גידול הכנסות',
      'ci.rev.pts': '25 נק׳',
      'ci.rev.1': '<b>+25</b> צמיחה &gt; 15% שנתי',
      'ci.rev.2': '<b>+15</b> צמיחה 5%–15%',
      'ci.rev.3': '<b>+7</b> צמיחה 0%–5%',
      'ci.rev.4': '<b>0</b> ירידה בהכנסות',

      'ci.margin': 'שולי רווח',
      'ci.margin.pts': '25 נק׳',
      'ci.margin.1': '<b>+25</b> שולי &gt; 20%',
      'ci.margin.2': '<b>+18</b> שולי 10%–20%',
      'ci.margin.3': '<b>+8</b> שולי 3%–10%',
      'ci.margin.4': '<b>0</b> שולי שליליים',

      'ci.de': 'חוב/הון',
      'ci.de.pts': '15 נק׳',
      'ci.de.1': '<b>+15</b> ח/ה &lt; 0.5 (חוב נמוך)',
      'ci.de.2': '<b>+10</b> ח/ה 0.5–1.5',
      'ci.de.3': '<b>+4</b> ח/ה 1.5–3',
      'ci.de.4': '<b>0</b> ח/ה &gt; 3',

      'ci.cap': 'שווי שוק / נזילות',
      'ci.cap.pts': '15 נק׳',
      'ci.cap.1': '<b>+15</b> ענקית &gt; $50B',
      'ci.cap.2': '<b>+12</b> גדולה $10B–$50B',
      'ci.cap.3': '<b>+8</b> בינונית $2B–$10B',
      'ci.cap.4': '<b>+3</b> קטנה &lt; $2B',

      'vi.strong': '<span class="verdict-badge strong">80–100</span><span>הזדמנות חזקה — ביטחון גבוה</span>',
      'vi.good':   '<span class="verdict-badge good">70–79</span><span>הגדרה טובה — שווה מעקב צמוד</span>',
      'vi.watch':  '<span class="verdict-badge watch">60–69</span><span>בינוני — פוטנציאל אם המגזר מאשר</span>',
      'vi.weak':   '<span class="verdict-badge weak">55–59</span><span>גבולי — עקוב אך לא לסחור עדיין</span>',
      'vi.none':   '<span class="verdict-badge none">&lt;55</span><span>לא מוצג — לא עומד בקריטריונים</span>',

      'disclaimer': '<strong>כתב ויתור:</strong> כלי זה מיועד למטרות חינוכיות ומידעיות בלבד. אינו ייעוץ פיננסי. תמיד ערוך מחקר עצמאי והתייעץ עם יועץ פיננסי מוסמך לפני כל מסחר.',
    },
  };

  let _lang = (() => {
    try { return localStorage.getItem('ta_lang') || 'en'; } catch { return 'en'; }
  })();

  function t(key) {
    return (T[_lang] && T[_lang][key] !== undefined) ? T[_lang][key]
         : (T.en[key] !== undefined ? T.en[key] : key);
  }

  function _updateSelectOptions() {
    const sets = [
      { id: 'filter-type', keys: ['filter.all_types','filter.stocks','filter.etfs','filter.futures'] },
      { id: 'filter-score', keys: ['filter.all_scores','filter.80','filter.70','filter.60'] },
      { id: 'filter-sector', keys: ['filter.all_sectors','filter.tech','filter.finance','filter.health','filter.energy','filter.consumer','filter.industrial'] },
    ];
    sets.forEach(({ id, keys }) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.querySelectorAll('option').forEach((opt, i) => {
        if (keys[i]) opt.textContent = t(keys[i]);
      });
    });
  }

  function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    _updateSelectOptions();
    document.documentElement.dir  = _lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = _lang;
    const btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = _lang === 'he' ? 'EN' : 'עב';
  }

  function setLang(lang) {
    _lang = lang;
    try { localStorage.setItem('ta_lang', lang); } catch {}
    applyTranslations();
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  function getLang() { return _lang; }

  // Auto-apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyTranslations);
  } else {
    applyTranslations();
  }

  return { t, setLang, getLang, applyTranslations };
})();
