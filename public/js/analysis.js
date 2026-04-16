// Client-side technical analysis (mirrors server.js logic)
const TA = (() => {
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
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss));
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
    if (!emaFast.length || !emaSlow.length) return null;
    const diff = slow - fast;
    const macdLine = emaFast.slice(diff).map((v, i) => v - emaSlow[i]);
    const signalLine = ema(macdLine, signal);
    if (!signalLine.length) return null;
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

  return { sma, ema, rsi, macd, bollingerBands };
})();
