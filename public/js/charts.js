// Chart rendering using TradingView Lightweight Charts
const Charts = (() => {
  let mainChart = null, volChart = null, rsiChart = null, macdChart = null;

  const COLORS = {
    bg: '#111827',
    border: '#1e2d45',
    text: '#94a3b8',
    green: '#00d4aa',
    red: '#ff4757',
    blue: '#3b82f6',
    purple: '#a855f7',
    yellow: '#f59e0b',
    orange: '#f97316',
  };

  const baseOpts = (height) => ({
    width: 0, // will auto-size
    height,
    layout: {
      background: { color: COLORS.bg },
      textColor: COLORS.text,
    },
    grid: {
      vertLines: { color: '#1a2436' },
      horzLines: { color: '#1a2436' },
    },
    crosshair: { mode: 1 },
    rightPriceScale: {
      borderColor: COLORS.border,
      textColor: COLORS.text,
    },
    timeScale: {
      borderColor: COLORS.border,
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale: true,
  });

  function destroyAll() {
    [mainChart, volChart, rsiChart, macdChart].forEach(c => c && c.remove());
    mainChart = volChart = rsiChart = macdChart = null;
    ['chart-main','chart-volume','chart-rsi','chart-macd'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '';
    });
  }

  function autoResize(chart, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        chart.resize(entry.contentRect.width, chart.options().height);
      }
    });
    ro.observe(el);
    // Initial size
    chart.resize(el.clientWidth || el.offsetWidth, chart.options().height);
  }

  function renderAll(data) {
    destroyAll();

    // ── Main Chart (Candlestick + Overlays) ─────────────────────────────────
    const mainEl = document.getElementById('chart-main');
    mainChart = LightweightCharts.createChart(mainEl, { ...baseOpts(320) });

    const candleSeries = mainChart.addCandlestickSeries({
      upColor: COLORS.green,
      downColor: COLORS.red,
      borderUpColor: COLORS.green,
      borderDownColor: COLORS.red,
      wickUpColor: COLORS.green,
      wickDownColor: COLORS.red,
    });
    candleSeries.setData(data.ohlcv.map(d => ({
      time: d.time, open: d.open, high: d.high, low: d.low, close: d.close,
    })));

    // SMA 50
    if (data.sma50?.length) {
      const s50 = mainChart.addLineSeries({ color: COLORS.blue, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
      s50.setData(data.sma50);
    }

    // SMA 200
    if (data.sma200?.length) {
      const s200 = mainChart.addLineSeries({ color: COLORS.orange, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
      s200.setData(data.sma200);
    }

    // Bollinger Bands
    if (data.bbUpper?.length) {
      const bbUpper = mainChart.addLineSeries({ color: 'rgba(148,163,184,0.4)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      bbUpper.setData(data.bbUpper);
      const bbMid = mainChart.addLineSeries({ color: 'rgba(148,163,184,0.25)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      bbMid.setData(data.bbMiddle);
      const bbLower = mainChart.addLineSeries({ color: 'rgba(148,163,184,0.4)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      bbLower.setData(data.bbLower);
    }

    autoResize(mainChart, 'chart-main');

    // ── Volume Chart ────────────────────────────────────────────────────────
    const volEl = document.getElementById('chart-volume');
    volChart = LightweightCharts.createChart(volEl, {
      ...baseOpts(80),
      rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.1, bottom: 0 } },
      timeScale: { borderColor: COLORS.border, timeVisible: true },
    });

    const volSeries = volChart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'right',
    });
    volSeries.setData(data.ohlcv.map(d => ({
      time: d.time,
      value: d.volume,
      color: d.close >= d.open ? 'rgba(0,212,170,0.5)' : 'rgba(255,71,87,0.5)',
    })));
    autoResize(volChart, 'chart-volume');

    // ── RSI Chart ───────────────────────────────────────────────────────────
    if (data.rsiSeries?.length) {
      const rsiEl = document.getElementById('chart-rsi');
      rsiChart = LightweightCharts.createChart(rsiEl, {
        ...baseOpts(80),
        rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
      });
      const rsiLine = rsiChart.addLineSeries({ color: COLORS.purple, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: true });
      rsiLine.setData(data.rsiSeries);

      // OB/OS lines
      const ob = rsiChart.addLineSeries({ color: 'rgba(255,71,87,0.4)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      ob.setData(data.rsiSeries.map(d => ({ time: d.time, value: 70 })));
      const os = rsiChart.addLineSeries({ color: 'rgba(0,212,170,0.4)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      os.setData(data.rsiSeries.map(d => ({ time: d.time, value: 30 })));
      const mid = rsiChart.addLineSeries({ color: 'rgba(148,163,184,0.2)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, lineStyle: 2 });
      mid.setData(data.rsiSeries.map(d => ({ time: d.time, value: 50 })));
      autoResize(rsiChart, 'chart-rsi');
    }

    // ── MACD Chart ──────────────────────────────────────────────────────────
    if (data.macdLine?.length) {
      const macdEl = document.getElementById('chart-macd');
      macdChart = LightweightCharts.createChart(macdEl, {
        ...baseOpts(80),
        rightPriceScale: { borderColor: COLORS.border, scaleMargins: { top: 0.1, bottom: 0.1 } },
      });

      // Histogram
      const histSeries = macdChart.addHistogramSeries({ priceScaleId: 'right', lastValueVisible: false, priceLineVisible: false });
      histSeries.setData(data.macdHist.map(d => ({
        time: d.time, value: d.value,
        color: d.value >= 0 ? 'rgba(0,212,170,0.6)' : 'rgba(255,71,87,0.6)',
      })));

      const macdLine = macdChart.addLineSeries({ color: COLORS.blue, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
      macdLine.setData(data.macdLine);
      const signalLine = macdChart.addLineSeries({ color: COLORS.orange, lineWidth: 1.5, priceLineVisible: false, lastValueVisible: false });
      signalLine.setData(data.macdSignal);

      autoResize(macdChart, 'chart-macd');
    }

    // Sync all charts' time scale
    const allCharts = [mainChart, volChart, rsiChart, macdChart].filter(Boolean);
    allCharts.forEach(c => {
      c.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (!range) return;
        allCharts.forEach(other => {
          if (other !== c) other.timeScale().setVisibleLogicalRange(range);
        });
      });
    });

    // Fit content
    allCharts.forEach(c => c.timeScale().fitContent());
  }

  return { renderAll, destroyAll };
})();
