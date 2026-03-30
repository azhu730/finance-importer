const XLSX = require('xlsx');

// Column requirements per source
const SOURCE_CONFIGS = {
  AMEX: {
    requiredColumns: ['Date', 'Description', 'Amount', 'Category'],
    columnMap: { Date: 'date', Description: 'transaction', Amount: 'amount', Category: 'upstream_category' }
  },
  Venmo: {
    requiredColumns: ['Datetime', 'Note', 'Amount (total)', 'Type', 'Status'],
    columnMap: { Datetime: 'date', Note: 'transaction', 'Amount (total)': 'amount', Type: 'upstream_category', Status: 'status' }
  },
  Discover: {
    requiredColumns: ['Trans. Date', 'Description', 'Amount', 'Category'],
    columnMap: { 'Trans. Date': 'date', Description: 'transaction', Amount: 'amount', Category: 'upstream_category' }
  },
  'Wells Fargo': {
    requiredColumns: null, // Positional; validated differently
    positionalMap: { 0: 'date', 1: 'amount', 4: 'transaction' }
  }
};

function findColumnCaseInsensitive(headers, targetColumn) {
  return headers.find(h => (h || '').toLowerCase().trim() === targetColumn.toLowerCase().trim());
}

function parseAMEX(rows, headers) {
  const config = SOURCE_CONFIGS.AMEX;
  const colMap = {};
  
  // Validate required columns exist (case-insensitive)
  for (const reqCol of config.requiredColumns) {
    const found = findColumnCaseInsensitive(headers, reqCol);
    if (!found) throw new Error(`AMEX format requires column "${reqCol}" but it was not found. Found columns: ${headers.join(', ')}`);
    colMap[reqCol] = found;
  }

  return rows.map(row => {
    const date = (row[colMap.Date] || '').trim();
    const transaction = (row[colMap.Description] || '').trim();
    const amount = Math.abs(parseFloat((row[colMap.Amount] || '0').toString().replace(/[$,\s]/g, '')) || 0);
    const upstream_category = (row[colMap.Category] || '').trim();

    if (!date && !transaction) return null;
    return {
      id: generateId(),
      date,
      transaction,
      amount,
      payment: 'AMEX',
      upstream_category,
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function parseVenmo(rows, headers) {
  const config = SOURCE_CONFIGS.Venmo;
  const colMap = {};
  
  for (const reqCol of config.requiredColumns) {
    const found = findColumnCaseInsensitive(headers, reqCol);
    if (!found) throw new Error(`Venmo format requires column "${reqCol}" but it was not found. Found columns: ${headers.join(', ')}`);
    colMap[reqCol] = found;
  }

  return rows.map(row => {
    const status = (row[colMap.Status] || '').toLowerCase().trim();
    // Skip incomplete transactions
    if (status && status !== 'complete') return null;

    const datetime = row[colMap.Datetime] || '';
    const date = datetime.split(' ')[0];
    const transaction = (row[colMap.Note] || '').trim();
    const upstream_category = (row[colMap.Type] || '').toLowerCase().trim();
    const rawAmt = (row[colMap['Amount (total)']] || row[colMap.Amount] || '0').toString().replace(/[$,+\s]/g, '');
    const amount = Math.abs(parseFloat(rawAmt) || 0);

    if (!date && !transaction) return null;
    return {
      id: generateId(),
      date: date.trim(),
      transaction,
      amount,
      payment: 'Venmo',
      upstream_category,
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function parseDiscover(rows, headers) {
  const config = SOURCE_CONFIGS.Discover;
  const colMap = {};
  
  for (const reqCol of config.requiredColumns) {
    const found = findColumnCaseInsensitive(headers, reqCol);
    if (!found) throw new Error(`Discover format requires column "${reqCol}" but it was not found. Found columns: ${headers.join(', ')}`);
    colMap[reqCol] = found;
  }

  return rows.map(row => {
    const date = (row[colMap['Trans. Date']] || '').trim();
    const transaction = (row[colMap.Description] || '').trim();
    const upstream_category = (row[colMap.Category] || '').trim();
    const amount = Math.abs(parseFloat((row[colMap.Amount] || '0').toString().replace(/[$,]/g, '')) || 0);

    if (!date && !transaction) return null;
    return {
      id: generateId(),
      date,
      transaction,
      amount,
      payment: 'Discover',
      upstream_category,
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function parseWellsFargo(rows, headers) {
  // Wells Fargo is positional; expect at least 5 columns
  if (headers.length < 5) {
    throw new Error(`Wells Fargo format expects at least 5 columns (Date, Amount, Description, ..., Description), but got ${headers.length}: ${headers.join(', ')}`);
  }

  return rows.map(row => {
    const keys = headers;
    const date = (row[keys[0]] || row.Date || '').trim();
    const amount = Math.abs(parseFloat((row[keys[1]] || row.Amount || '0').toString().replace(/[$,]/g, '')) || 0);
    const transaction = (row[keys[4]] || row[keys[2]] || row.Description || '').trim();

    if (!date && !transaction) return null;
    return {
      id: generateId(),
      date,
      transaction,
      amount,
      payment: 'Wells Fargo',
      upstream_category: '',
      category: '',
      sub_category: '',
    };
  }).filter(Boolean);
}

function normalizeRow(raw, source) {
  // This function is deprecated; use source-specific parsers instead
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

function parseCSV(buffer, filename, userSource) {
  if (!userSource) throw new Error('Source is required (AMEX, Venmo, Discover, or Wells Fargo)');
  if (!SOURCE_CONFIGS[userSource]) {
    throw new Error(`Unknown source "${userSource}". Valid sources: AMEX, Venmo, Discover, Wells Fargo`);
  }

  const isExcel = filename.toLowerCase().endsWith('.xlsx') || filename.toLowerCase().endsWith('.xls');
  let data;

  if (isExcel) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  } else {
    const text  = buffer.toString('utf8');
    const lines = text.split('\n');

    // Skip preamble rows before actual headers
    let startLine = 0;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i].toLowerCase();
      if (l.includes('date') || l.includes('amount') || l.includes('description') || l.includes('username')) {
        startLine = i;
        break;
      }
    }

    const trimmed = lines.slice(startLine).join('\n');
    const wb      = XLSX.read(trimmed, { type: 'string', raw: false });
    const ws      = wb.Sheets[wb.SheetNames[0]];
    data = XLSX.utils.sheet_to_json(ws, { defval: '' });
  }

  if (!data.length) throw new Error('No data rows found in file');

  const headers = Object.keys(data[0]);
  let rows;

  try {
    switch (userSource) {
      case 'AMEX':
        rows = parseAMEX(data, headers);
        break;
      case 'Venmo':
        rows = parseVenmo(data, headers);
        break;
      case 'Discover':
        rows = parseDiscover(data, headers);
        break;
      case 'Wells Fargo':
        rows = parseWellsFargo(data, headers);
        break;
      default:
        throw new Error(`Unsupported source: ${userSource}`);
    }
  } catch (e) {
    throw new Error(`Failed to parse ${userSource} format: ${e.message}`);
  }

  if (!rows.length) throw new Error(`No valid transactions found for ${userSource} format`);

  return { rows, source: userSource };
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = { parseCSV };
