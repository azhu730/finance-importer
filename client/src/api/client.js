const BASE = '/api';

async function request(path, options = {}) {
  const init = { method: options.method || 'GET' };

  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
    init.headers = { 'Content-Type': 'application/json' };
  }

  if (options.body) {
    init.body = options.body; // FormData — no Content-Type header
  }

  const res = await fetch(BASE + path, init);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }

  return res.json();
}

// ── Stats ────────────────────────────────────────────────────────────────────
export const getStats = () => request('/stats');

// ── Transactions ─────────────────────────────────────────────────────────────
export const getTransactions = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== undefined))
  );
  return request(`/transactions?${qs}`);
};

export const uploadCSV = (file, source = 'AMEX') => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('source', source);
  return request('/transactions/upload', { method: 'POST', body: fd });
};

export const patchTransaction = (id, fields) =>
  request(`/transactions/${id}`, { method: 'PATCH', json: fields });

export const deleteTransaction = (id) =>
  request(`/transactions/${id}`, { method: 'DELETE' });

export const clearTransactions = () =>
  request('/transactions', { method: 'DELETE' });

export const categorizeBatch = (ids = []) =>
  request('/transactions/categorize', { method: 'POST', json: { ids } });

// ── Earnings ─────────────────────────────────────────────────────────────────
export const getEarnings = () => request('/earnings');

export const createEarning = (data) =>
  request('/earnings', { method: 'POST', json: data });

export const patchEarning = (id, fields) =>
  request(`/earnings/${id}`, { method: 'PATCH', json: fields });

export const deleteEarning = (id) =>
  request(`/earnings/${id}`, { method: 'DELETE' });

// ── Categories ────────────────────────────────────────────────────────────────
export const getCategories = () => request('/categories');

export const createCategory = (category, subCategory) =>
  request('/categories', { method: 'POST', json: { category, subCategory } });

export const deleteCategory = (category, subCategory) =>
  request('/categories', { method: 'DELETE', json: { category, subCategory } });

// ── Mappings ─────────────────────────────────────────────────────────────────
export const getMappings = () => request('/mappings');

export const saveMapping = (upstreamKey, category, subCategory) =>
  request('/mappings', { method: 'PUT', json: { upstreamKey, category, subCategory } });

export const deleteMapping = (key) =>
  request(`/mappings/${encodeURIComponent(key)}`, { method: 'DELETE' });

// ── Export ────────────────────────────────────────────────────────────────────
export const exportXlsx = () => {
  window.location.href = BASE + '/export';
};
