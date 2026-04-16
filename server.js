const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 1800 }); // 30 min cache
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// ─── Watchlist ───────────────────────────────────────────────────────────────
const WATCHLIST = {
  tech:     ['AAPL','MSFT','GOOGL','AMZN','META','NVDA','AMD','TSLA','INTC','CRM','ADBE','ORCL','QCOM','AVGO','TXN'],
  finance:  ['JPM','BAC','GS','MS','WFC','V','MA','AXP','BLK','SCHW'],
  health:   ['JNJ','UNH','PFE','ABBV','LLY','MRK','TMO','ABT','AMGN'],
  energy:   ['XOM','CVX','COP','SLB','EOG','PSX','VLO'],
  consumer: ['WMT','COST','TGT','HD','MCD','SBUCKS','NKE','PG','KO','PEP'],
  industrial:['CAT','BA','GE','HON','UNP','RTX','DE','LMT'],
  etf:      ['SPY','QQQ','IWM','DIA','GLD','SLV','USO','TLT','XLK','XLF','XLE','XLV','ARKK'],
  futures:  ['ES=F','NQ=F','YM=F','RTY=F','CL=F','GC=F','SI=F','ZB=F','ZN=F','NG=F','HG=F']
};

const ALL_SYMBOLS = Object.values(WATCHLIST).flat();
const STOCK_SYMBOLS = new Set([...WATCHLIST.tech,...WATCHLIST.finance,...WATCHLIST.health,...WATCHLIST.energy,...WATCHLIST.consumer,...WATCHLIST.industrial]);

// ─── Yahoo Finance Fetch ─────────────────────────────────────────────────────
const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchChart(symbol, range = '1y', interval = '1d') {
  const cacheKey = `chart_${symbol}_${range}_${interval}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`;
      const res = await axios.get(url, {
        headers: YF_HEADERS,
        params: { range, interval, includePrePost: false, events: 'div,splits' },
        timeout: 10000,
      });
      const data = res.data;
      cache.set(cacheKey, data);
      return data;
    } catch (err) {
      if (attempt === 2) throw err;
      await sleep(1000 * (attempt + 1));
    }
  }
}

async function fetchFundamentals(symbol) {
  const cacheKey = `fund_${symbol}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}`;
    const res = await axios.get(url, {
      headers: YF_HEADERS,
      params: { modules: 'defaultKeyStatistics,financialData,summaryDetail,price' },
      timeout: 10000,
    });
    const data = res.data?.quoteSummary?.result?.[0] ?? null;
    cache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ─── Technical Analysis ──────────────────────────────────────────────────────
function sma(arr, period) {
  if (arr.length < period) return [];
  const result = [];
  for (let i = period - 1; i < arr.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += arr[j];
    result.push(sum / period);
  }
  return result;
}

function ema(arr, period) {
  if (arr.length < period) return [];
  const k = 2 / (period + 1);
  const result = [arr.slice(0, period).reduce((a, b) => a + b, 0) / period];
  for (let i = period; i < arr.length; i++) {
    result.push(arr[i] * k + result[result.length - 1] * (1 - k));
  }
  return result;
}

function rsi(closes, period = 14) {
  if (closes.length < period + 1) return [];
  const changes = closes.slice(1).map((c, i) => c - closes[i]);
  let avgGain = changes.slice(0, period).filter(c => c > 0).reduce((a, b) => a + b, 0) / period;
  let avgLoss = Math.abs(changes.slice(0, period).filter(c => c < 0).reduce((a, b) => a + b, 0)) / period;
  const result = [];
  if (avgLoss === 0) result.push(100);
  else result.push(100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
  }
  return result;
}

function macd(closes, fast = 12, slow = 26, signal = 9) {
  const emaFast = ema(closes, fast);
  const emaSlow = ema(closes, slow);
  if (emaFast.length === 0 || emaSlow.length === 0) return null;
  const diff = slow - fast;
  const macdLine = emaFast.slice(diff).map((v, i) => v - emaSlow[i]);
  const signalLine = ema(macdLine, signal);
  if (signalLine.length === 0) return null;
  const offset = macdLine.length - signalLine.length;
  const histogram = signalLine.map((s, i) => macdLine[i + offset] - s);
  return { macdLine, signalLine, histogram };
}

function bollingerBands(closes, period = 20, mult = 2) {
  if (closes.length < period) return null;
  const middle = sma(closes, period);
  const upper = [], lower = [];
  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    upper.push(mean + mult * std);
    lower.push(mean - mult * std);
  }
  return { upper, middle, lower };
}

function atr(highs, lows, closes, period = 14) {
  const tr = [];
  for (let i = 1; i < closes.length; i++) {
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i-1]), Math.abs(lows[i] - closes[i-1])));
  }
  return sma(tr, period);
}

// ─── Scoring Engine ──────────────────────────────────────────────────────────
function scoreTechnical(closes, highs, lows, volumes) {
  let score = 0;
  const signals = [];

  const n = closes.length;
  if (n < 50) return { score: 0, signals: [{ type: 'warn', text: 'Insufficient data' }] };

  const last = closes[n - 1];

  // 1. Trend (25 pts)
  const sma50 = sma(closes, 50);
  const sma200 = sma(closes, 200);
  const s50 = sma50[sma50.length - 1];
  const s200 = sma200.length > 0 ? sma200[sma200.length - 1] : null;

  if (last > s50) {
    score += 10;
    signals.push({ type: 'bull', text: `Price above SMA50 ($${s50.toFixed(2)})` });
  } else {
    signals.push({ type: 'bear', text: `Price below SMA50 ($${s50.toFixed(2)})` });
  }

  if (s200 && s50 > s200) {
    score += 15;
    signals.push({ type: 'bull', text: 'Golden Cross: SMA50 > SMA200' });
  } else if (s200) {
    signals.push({ type: 'bear', text: 'Death Cross: SMA50 < SMA200' });
  }

  // 2. Momentum (25 pts)
  const rsiValues = rsi(closes);
  const lastRSI = rsiValues.length > 0 ? rsiValues[rsiValues.length - 1] : null;

  if (lastRSI !== null) {
    if (lastRSI >= 40 && lastRSI <= 65) {
      score += 15;
      signals.push({ type: 'bull', text: `RSI ${lastRSI.toFixed(1)} — healthy momentum` });
    } else if (lastRSI < 30) {
      score += 8;
      signals.push({ type: 'neutral', text: `RSI ${lastRSI.toFixed(1)} — oversold, watch for bounce` });
    } else if (lastRSI > 75) {
      signals.push({ type: 'bear', text: `RSI ${lastRSI.toFixed(1)} — overbought` });
    } else if (lastRSI > 65) {
      score += 5;
      signals.push({ type: 'neutral', text: `RSI ${lastRSI.toFixed(1)} — approaching overbought` });
    }
  }

  const macdData = macd(closes);
  if (macdData) {
    const hist = macdData.histogram;
    const lastH = hist[hist.length - 1];
    const prevH = hist[hist.length - 2];
    if (lastH > 0 && lastH >= prevH) {
      score += 10;
      signals.push({ type: 'bull', text: 'MACD histogram positive & growing' });
    } else if (lastH > 0) {
      score += 5;
      signals.push({ type: 'neutral', text: 'MACD above zero (fading)' });
    } else if (lastH < 0 && lastH > prevH) {
      score += 3;
      signals.push({ type: 'neutral', text: 'MACD negative but improving' });
    } else {
      signals.push({ type: 'bear', text: 'MACD bearish momentum' });
    }
  }

  // 3. Volume (20 pts)
  const volSMA = sma(volumes, 20);
  if (volSMA.length > 0) {
    const lastVol = volumes[n - 1];
    const avgVol = volSMA[volSMA.length - 1];
    const ratio = lastVol / avgVol;
    if (ratio >= 2) {
      score += 20;
      signals.push({ type: 'bull', text: `Volume ${ratio.toFixed(1)}x above avg — strong conviction` });
    } else if (ratio >= 1.5) {
      score += 15;
      signals.push({ type: 'bull', text: `Volume ${ratio.toFixed(1)}x above avg` });
    } else if (ratio >= 1.0) {
      score += 8;
      signals.push({ type: 'neutral', text: `Volume at avg (${ratio.toFixed(1)}x)` });
    } else {
      signals.push({ type: 'bear', text: `Low volume (${ratio.toFixed(1)}x avg)` });
    }
  }

  // 4. ATR Volatility (15 pts)
  const atrVals = atr(highs, lows, closes);
  if (atrVals.length > 0) {
    const lastATR = atrVals[atrVals.length - 1];
    const atrPct = (lastATR / last) * 100;
    if (atrPct >= 1.5 && atrPct <= 4) {
      score += 15;
      signals.push({ type: 'bull', text: `ATR ${atrPct.toFixed(1)}% — ideal trading range` });
    } else if (atrPct >= 1 && atrPct < 1.5) {
      score += 8;
      signals.push({ type: 'neutral', text: `ATR ${atrPct.toFixed(1)}% — low volatility` });
    } else if (atrPct > 4 && atrPct <= 7) {
      score += 7;
      signals.push({ type: 'neutral', text: `ATR ${atrPct.toFixed(1)}% — high volatility` });
    } else if (atrPct > 7) {
      score += 2;
      signals.push({ type: 'bear', text: `ATR ${atrPct.toFixed(1)}% — extreme volatility` });
    }
  }

  // 5. Bollinger Bands (15 pts)
  const bb = bollingerBands(closes);
  if (bb) {
    const bbMid = bb.middle[bb.middle.length - 1];
    const bbUpper = bb.upper[bb.upper.length - 1];
    const bbLower = bb.lower[bb.lower.length - 1];
    const bbPos = (last - bbLower) / (bbUpper - bbLower); // 0-1

    if (bbPos >= 0.5 && bbPos <= 0.85) {
      score += 15;
      signals.push({ type: 'bull', text: `Price in BB buy zone (${(bbPos * 100).toFixed(0)}%)` });
    } else if (bbPos < 0.3) {
      score += 8;
      signals.push({ type: 'neutral', text: `Price near BB lower band — potential bounce` });
    } else if (bbPos > 0.85) {
      score += 5;
      signals.push({ type: 'neutral', text: `Price near BB upper band` });
    }
  }

  return {
    score: Math.min(100, score),
    signals,
    indicators: {
      rsi: lastRSI,
      sma50: sma50[sma50.length - 1],
      sma200: sma200.length > 0 ? sma200[sma200.length - 1] : null,
      macdHist: macdData ? macdData.histogram[macdData.histogram.length - 1] : null,
      atrPct: atrVals.length > 0 ? ((atrVals[atrVals.length - 1] / last) * 100) : null,
    }
  };
}

function scoreFundamental(fund) {
  if (!fund) return { score: null, signals: [] };
  let score = 0;
  const signals = [];

  const detail = fund.summaryDetail ?? {};
  const fin = fund.financialData ?? {};

  // Valuation (20 pts)
  const pe = detail.trailingPE?.raw;
  if (pe > 0 && pe < 20) { score += 20; signals.push({ type: 'bull', text: `P/E ${pe.toFixed(1)} — undervalued` }); }
  else if (pe >= 20 && pe < 30) { score += 15; signals.push({ type: 'bull', text: `P/E ${pe.toFixed(1)} — fair value` }); }
  else if (pe >= 30 && pe < 50) { score += 8; signals.push({ type: 'neutral', text: `P/E ${pe.toFixed(1)} — premium` }); }
  else if (pe >= 50) { signals.push({ type: 'bear', text: `P/E ${pe.toFixed(1)} — very expensive` }); }
  else if (pe === undefined) { signals.push({ type: 'neutral', text: 'P/E not available' }); }

  // Revenue Growth (25 pts)
  const revGrowth = fin.revenueGrowth?.raw;
  if (revGrowth > 0.15) { score += 25; signals.push({ type: 'bull', text: `Revenue growth ${(revGrowth*100).toFixed(1)}% — strong` }); }
  else if (revGrowth >= 0.05) { score += 15; signals.push({ type: 'bull', text: `Revenue growth ${(revGrowth*100).toFixed(1)}%` }); }
  else if (revGrowth >= 0) { score += 7; signals.push({ type: 'neutral', text: `Revenue growth ${(revGrowth*100).toFixed(1)}%` }); }
  else if (revGrowth < 0) { signals.push({ type: 'bear', text: `Revenue declining ${(revGrowth*100).toFixed(1)}%` }); }

  // Profit Margin (25 pts)
  const margin = fin.profitMargins?.raw;
  if (margin > 0.20) { score += 25; signals.push({ type: 'bull', text: `Profit margin ${(margin*100).toFixed(1)}% — excellent` }); }
  else if (margin >= 0.10) { score += 18; signals.push({ type: 'bull', text: `Profit margin ${(margin*100).toFixed(1)}%` }); }
  else if (margin >= 0.03) { score += 8; signals.push({ type: 'neutral', text: `Profit margin ${(margin*100).toFixed(1)}%` }); }
  else if (margin !== undefined) { signals.push({ type: 'bear', text: `Negative/thin profit margin` }); }

  // Debt/Equity (15 pts)
  const de = fin.debtToEquity?.raw; // Yahoo returns as percentage (e.g. 45.2 means 0.452)
  if (de !== undefined) {
    if (de < 50) { score += 15; signals.push({ type: 'bull', text: `D/E ${(de/100).toFixed(2)} — low debt` }); }
    else if (de < 150) { score += 10; signals.push({ type: 'neutral', text: `D/E ${(de/100).toFixed(2)} — moderate debt` }); }
    else if (de < 300) { score += 4; signals.push({ type: 'neutral', text: `D/E ${(de/100).toFixed(2)} — high debt` }); }
    else { signals.push({ type: 'bear', text: `D/E ${(de/100).toFixed(2)} — very high debt` }); }
  }

  // Market Cap (15 pts)
  const mktCap = detail.marketCap?.raw;
  if (mktCap > 50e9) { score += 15; signals.push({ type: 'bull', text: `Market cap $${(mktCap/1e9).toFixed(0)}B — mega cap` }); }
  else if (mktCap > 10e9) { score += 12; signals.push({ type: 'bull', text: `Market cap $${(mktCap/1e9).toFixed(0)}B — large cap` }); }
  else if (mktCap > 2e9) { score += 8; signals.push({ type: 'neutral', text: `Market cap $${(mktCap/1e9).toFixed(1)}B — mid cap` }); }
  else if (mktCap) { score += 3; signals.push({ type: 'neutral', text: `Market cap $${(mktCap/1e6).toFixed(0)}M — small cap` }); }

  return { score: Math.min(100, score), signals };
}

function parseChartData(chartJson) {
  const result = chartJson?.chart?.result?.[0];
  if (!result) return null;
  const ts = result.timestamp ?? [];
  const q = result.indicators?.quote?.[0] ?? {};
  const opens = q.open ?? [];
  const highs = q.high ?? [];
  const lows = q.low ?? [];
  const closes = q.close ?? [];
  const volumes = q.volume ?? [];
  const meta = result.meta ?? {};

  // Filter null values
  const valid = ts.map((t, i) => ({
    t, o: opens[i], h: highs[i], l: lows[i], c: closes[i], v: volumes[i]
  })).filter(d => d.c !== null && d.c !== undefined && d.h !== null);

  return {
    timestamps: valid.map(d => d.t),
    opens: valid.map(d => d.o),
    highs: valid.map(d => d.h),
    lows: valid.map(d => d.l),
    closes: valid.map(d => d.c),
    volumes: valid.map(d => d.v ?? 0),
    meta,
  };
}

// ─── Screener ─────────────────────────────────────────────────────────────────
let screenerState = { running: false, results: [], lastRun: null };

async function runScreener(forceRefresh = false) {
  const cacheKey = 'screener_results';
  if (!forceRefresh) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  if (screenerState.running) {
    return { status: 'running', progress: screenerState.progress ?? 0 };
  }

  screenerState.running = true;
  screenerState.progress = 0;
  const results = [];

  const symbols = ALL_SYMBOLS;
  const BATCH = 5;

  for (let i = 0; i < symbols.length; i += BATCH) {
    const batch = symbols.slice(i, i + BATCH);
    await Promise.all(batch.map(async (symbol) => {
      try {
        const chartJson = await fetchChart(symbol, '1y', '1d');
        const data = parseChartData(chartJson);
        if (!data || data.closes.length < 50) return;

        const techResult = scoreTechnical(data.closes, data.highs, data.lows, data.volumes);

        let fundResult = { score: null, signals: [] };
        if (STOCK_SYMBOLS.has(symbol)) {
          const fund = await fetchFundamentals(symbol);
          fundResult = scoreFundamental(fund);
        }

        const isStock = STOCK_SYMBOLS.has(symbol);
        const combined = isStock && fundResult.score !== null
          ? techResult.score * 0.6 + fundResult.score * 0.4
          : techResult.score;

        if (combined >= 55) {
          const last = data.closes[data.closes.length - 1];
          const prev = data.closes[data.closes.length - 2];
          const change = ((last - prev) / prev) * 100;

          results.push({
            symbol,
            name: data.meta.longName ?? data.meta.shortName ?? symbol,
            price: last,
            change: change,
            techScore: Math.round(techResult.score),
            fundScore: fundResult.score !== null ? Math.round(fundResult.score) : null,
            combinedScore: Math.round(combined),
            signals: [...techResult.signals, ...fundResult.signals],
            indicators: techResult.indicators,
            type: isStock ? 'stock' : (WATCHLIST.futures.includes(symbol) ? 'futures' : 'etf'),
            currency: data.meta.currency ?? 'USD',
          });
        }
      } catch (err) {
        // Silently skip failed symbols
      }
    }));

    screenerState.progress = Math.round(((i + BATCH) / symbols.length) * 100);
    await sleep(300); // Rate limit pause
  }

  results.sort((a, b) => b.combinedScore - a.combinedScore);
  screenerState.running = false;
  screenerState.results = results;
  screenerState.lastRun = new Date().toISOString();

  const output = { status: 'done', results, lastRun: screenerState.lastRun };
  cache.set(cacheKey, output);
  return output;
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/screener', async (req, res) => {
  try {
    const force = req.query.refresh === '1';
    if (screenerState.running) {
      return res.json({ status: 'running', progress: screenerState.progress });
    }
    const result = await runScreener(force);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/screener/status', (req, res) => {
  if (screenerState.running) {
    return res.json({ status: 'running', progress: screenerState.progress });
  }
  res.json({ status: 'idle', lastRun: screenerState.lastRun });
});

app.get('/api/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '6mo', interval = '1d' } = req.query;
    const data = await fetchChart(symbol, range, interval);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/analysis/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1y' } = req.query;
    const [chartJson, fund] = await Promise.all([
      fetchChart(symbol, range, '1d'),
      STOCK_SYMBOLS.has(symbol) ? fetchFundamentals(symbol) : Promise.resolve(null),
    ]);
    const data = parseChartData(chartJson);
    if (!data) return res.status(404).json({ error: 'No data for symbol' });

    const techResult = scoreTechnical(data.closes, data.highs, data.lows, data.volumes);
    const fundResult = scoreFundamental(fund);
    const isStock = STOCK_SYMBOLS.has(symbol);
    const combined = isStock && fundResult.score !== null
      ? techResult.score * 0.6 + fundResult.score * 0.4
      : techResult.score;

    const last = data.closes[data.closes.length - 1];
    const prev = data.closes[data.closes.length - 2];

    // Build chart series
    const ohlcv = data.timestamps.map((t, i) => ({
      time: t,
      open: data.opens[i],
      high: data.highs[i],
      low: data.lows[i],
      close: data.closes[i],
      volume: data.volumes[i],
    }));

    // SMA series
    const buildSeries = (vals, period) => {
      const offset = data.closes.length - vals.length;
      return vals.map((v, i) => ({ time: data.timestamps[i + offset], value: v }));
    };
    const sma50vals = sma(data.closes, 50);
    const sma200vals = sma(data.closes, 200);
    const rsiVals = rsi(data.closes);
    const macdData = macd(data.closes);
    const bbData = bollingerBands(data.closes);

    res.json({
      symbol,
      name: data.meta.longName ?? data.meta.shortName ?? symbol,
      price: last,
      prevClose: prev,
      change: ((last - prev) / prev) * 100,
      currency: data.meta.currency ?? 'USD',
      techScore: Math.round(techResult.score),
      fundScore: fundResult.score !== null ? Math.round(fundResult.score) : null,
      combinedScore: Math.round(combined),
      signals: [...techResult.signals, ...fundResult.signals],
      indicators: techResult.indicators,
      ohlcv,
      sma50: buildSeries(sma50vals, 50),
      sma200: buildSeries(sma200vals, 200),
      rsiSeries: rsiVals.map((v, i) => ({ time: data.timestamps[i + data.closes.length - rsiVals.length], value: v })),
      macdLine: macdData?.macdLine.map((v, i) => ({
        time: data.timestamps[i + data.closes.length - macdData.macdLine.length], value: v
      })) ?? [],
      macdSignal: macdData?.signalLine.map((v, i) => ({
        time: data.timestamps[i + data.closes.length - macdData.signalLine.length], value: v
      })) ?? [],
      macdHist: macdData?.histogram.map((v, i) => ({
        time: data.timestamps[i + data.closes.length - macdData.histogram.length], value: v
      })) ?? [],
      bbUpper: bbData?.upper.map((v, i) => ({ time: data.timestamps[i + data.closes.length - bbData.upper.length], value: v })) ?? [],
      bbMiddle: bbData?.middle.map((v, i) => ({ time: data.timestamps[i + data.closes.length - bbData.middle.length], value: v })) ?? [],
      bbLower: bbData?.lower.map((v, i) => ({ time: data.timestamps[i + data.closes.length - bbData.lower.length], value: v })) ?? [],
      fundamentals: fund ? {
        pe: fund.summaryDetail?.trailingPE?.raw,
        forwardPE: fund.summaryDetail?.forwardPE?.raw,
        marketCap: fund.summaryDetail?.marketCap?.raw,
        beta: fund.summaryDetail?.beta?.raw,
        dividendYield: fund.summaryDetail?.dividendYield?.raw,
        revenueGrowth: fund.financialData?.revenueGrowth?.raw,
        profitMargin: fund.financialData?.profitMargins?.raw,
        roe: fund.financialData?.returnOnEquity?.raw,
        debtToEquity: fund.financialData?.debtToEquity?.raw,
        freeCashflow: fund.financialData?.freeCashflow?.raw,
        fiftyTwoWeekHigh: fund.summaryDetail?.fiftyTwoWeekHigh?.raw,
        fiftyTwoWeekLow: fund.summaryDetail?.fiftyTwoWeekLow?.raw,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/market-overview', async (req, res) => {
  const indices = ['SPY', 'QQQ', 'IWM', 'GLD', 'CL=F', 'ES=F'];
  try {
    const results = await Promise.all(indices.map(async sym => {
      try {
        const data = await fetchChart(sym, '5d', '1d');
        const parsed = parseChartData(data);
        if (!parsed || parsed.closes.length < 2) return { symbol: sym, error: true };
        const last = parsed.closes[parsed.closes.length - 1];
        const prev = parsed.closes[parsed.closes.length - 2];
        return {
          symbol: sym,
          name: parsed.meta.longName ?? parsed.meta.shortName ?? sym,
          price: last,
          change: ((last - prev) / prev) * 100,
          currency: parsed.meta.currency ?? 'USD',
        };
      } catch { return { symbol: sym, error: true }; }
    }));
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start screener in background on boot
app.listen(PORT, () => {
  console.log(`TradeAnalyzer Pro running on http://localhost:${PORT}`);
  console.log('Warming screener cache...');
  runScreener().then(() => console.log('Screener ready.')).catch(console.error);
});
