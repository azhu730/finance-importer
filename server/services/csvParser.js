const XLSX = require('xlsx');

function detectSource(headers, filename) {
  const h = headers.map(x => (x || '').toLowerCase().trim());
  const f = (filename || '').toLowerCase();
  if (f.includes('amex') || h.some(x => x.includes('card member'))) return 'AMEX';
  if (f.includes('venmo') || (h.includes('to') && h.includes('from') && h.includes('note'))) return 'Venmo';
  if (f.includes('discover') || h.some(x => x.includes('trans. date') || x.includes('trans date'))) return 'Discover';
  if (f.includes('wells') || f.includes('wf')) return 'Wells Fargo';
  if (h.includes('amount') && h.length <= 5) return 'Wells Fargo';
  return 'Unknown';
}

function normalizeRow(raw, source) {
  const keys = Object.keys(raw);
  let date = '', description = '', amount = 0, upstreamCategory = '';

  switch (source) {
    case 'AMEX':
      date             = raw['Date'] || raw['date'] || '';
      description      = raw['Description'] || raw['description'] || '';
      amount           = Math.abs(parseFloat((raw['Amount'] || '0').toString().replace(/[$,\s]/g, '')) || 0);
      upstreamCategory = raw['Category'] || raw['category'] || '';
      break;

    case 'Venmo': {
      const status = (raw['Status'] || '').toLowerCase();
      if (status && status !== 'complete') return null;
      date             = (raw['Datetime'] || '').split(' ')[0];
      description      = raw['Note'] || '';
      upstreamCategory = (raw['Type'] || '').toLowerCase();
      const rawAmt     = (raw['Amount (total)'] || raw['Amount'] || '0').toString().replace(/[$,+\s]/g, '');
      amount           = Math.abs(parseFloat(rawAmt) || 0);
      break;
    }

    case 'Discover':
      date             = raw['Trans. Date'] || raw['Trans Date'] || raw['Date'] || '';
      description      = raw['Description'] || raw['description'] || '';
      upstreamCategory = raw['Category'] || raw['category'] || '';
      amount           = Math.abs(parseFloat((raw['Amount'] || '0').toString().replace(/[$,]/g, '')) || 0);
      break;

    case 'Wells Fargo':
      date        = raw[keys[0]] || raw['Date'] || '';
      amount      = Math.abs(parseFloat((raw[keys[1]] || raw['Amount'] || '0').toString().replace(/[$,]/g, '')) || 0);
      description = raw[keys[4]] || raw[keys[2]] || raw['Description'] || '';
      break;

    default: {
      const dk = keys.find(k => /date/i.test(k))   || keys[0];
      const ak = keys.find(k => /amount|debit/i.test(k)) || keys[2];
      const tk = keys.find(k => /desc|name|note|memo/i.test(k)) || keys[1];
      const ck = keys.find(k => /categ/i.test(k));
      date             = raw[dk] || '';
      description      = raw[tk] || '';
      amount           = Math.abs(parseFloat((raw[ak] || '0').toString().replace(/[$,]/g, '')) || 0);
      upstreamCategory = ck ? (raw[ck] || '') : '';
    }
  }

  if (!date && !description) return null;

  return {
    id:               generateId(),
    date:             date.trim(),
    transaction:      description.trim(),
    amount,
    payment:          source,
    upstream_category: upstreamCategory.trim(),
    category:         '',
    sub_category:     '',
  };
}

function parseCSV(buffer, filename) {
  const text  = buffer.toString('utf8');
  const lines = text.split('\n');

  // Skip Venmo / bank preamble rows before actual headers
  let startLine = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const l = lines[i].toLowerCase();
    if (l.includes('date') || l.includes('amount') || l.includes('description') || l.includes('username')) {
      startLine = i;
      break;
    }
  }

  const trimmed = lines.slice(startLine).join('\n');
  const wb      = XLSX.read(trimmed, { type: 'string', raw: false });
  const ws      = wb.Sheets[wb.SheetNames[0]];
  const data    = XLSX.utils.sheet_to_json(ws, { defval: '' });

  if (!data.length) throw new Error('No data rows found in CSV');

  const headers = Object.keys(data[0]);
  const source  = detectSource(headers, filename);
  const rows    = data.map(r => normalizeRow(r, source)).filter(Boolean);

  return { rows, source };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = { parseCSV, detectSource };
