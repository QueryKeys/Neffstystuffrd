// API client — all calls go to our Express backend
const API = (() => {
  async function get(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  return {
    screener: (refresh = false) => get(`/api/screener${refresh ? '?refresh=1' : ''}`),
    screenerStatus: () => get('/api/screener/status'),
    analysis: (symbol, range = '1y') => get(`/api/analysis/${encodeURIComponent(symbol)}?range=${range}`),
    chart: (symbol, range = '6mo', interval = '1d') =>
      get(`/api/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`),
    marketOverview: () => get('/api/market-overview'),
  };
})();
